"""
Copyright 2015 Google Inc. All rights reserved.

Licensed under the Apache License, Version 2.0 (the "License");
you may not use this file except in compliance with the License.
You may obtain a copy of the License at

    http://www.apache.org/licenses/LICENSE-2.0

Unless required by applicable law or agreed to in writing, software
distributed under the License is distributed on an "AS IS" BASIS,
WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
See the License for the specific language governing permissions and
limitations under the License.
"""

import time
import datetime
import hashlib
import logging

import requests

from google.appengine.ext import db
from google.appengine.api import memcache

from settings import LAST_FM_API_URL
from users import reset_user_download_stats
from models import PlayedTrack

logger = logging.getLogger()


def _get_start_of_day_epoch():
    today = datetime.date.today()
    start_of_day = datetime.datetime.combine(today, datetime.time.min)
    return int(time.mktime(start_of_day.timetuple()))


class PlayedTracksFetcher(object):
    PAGE_SIZE = 200

    def __init__(self, user, api_key, page_limit=5):
        self.user = user
        self.username = user.username
        self.api_key = api_key
        self.page_limit = page_limit

        # anchoring the request to the start of day prevents pagination errors with new scrobbles
        start_of_day = _get_start_of_day_epoch()
        self._end_epoch = start_of_day

    def download_all_played_tracks(self):
        logger.info("Fetching tracks for %s from before %s" % (self.username, self._end_epoch))
        page = 1  # page index starts at 1 not 0
        total_pages, total_tracks = self._fetch_track_stats()
        reset_user_download_stats(self.user, total_pages, total_tracks)
        pages_to_fetch = total_pages

        if self.page_limit:
            # fetch the smaller of the two between page limit and total pages
            pages_to_fetch = min(self.page_limit, total_pages)

        while page <= pages_to_fetch:
            raw_track_data = self._fetch_played_tracks_page(page)
            played_tracks = self._parse_track_data(raw_track_data)
            # bulk insert the played tracks
            log_msg = "Inserting %s played tracks for %s [page=%s]"
            logger.info(log_msg % (len(played_tracks), self.username, page))
            db.put(played_tracks)

            self.user.downloaded_pages = page
            self.user.downloaded_tracks = page * self.PAGE_SIZE
            self.user.put()
            page += 1

        # indicate we finished downloading everything
        self.user.download_finished = True
        self.user.downloaded_tracks = page * self.PAGE_SIZE
        self.user.put()
        return True

    def _cache_played_tracks_page(self, page, end_epoch, played_tracks):
        cache_key = self._build_cache_key(page, end_epoch)
        logger.info("Caching %s-page-%s" % (self.username, page))
        memcache.add(cache_key, played_tracks)

    def _fetch_played_tracks_page(self, page=0):
        track_cache_key = self._build_cache_key(page, self._end_epoch)
        played_tracks = memcache.get(track_cache_key)
        if played_tracks is None:
            logger.info("Cache MISS: %s" % track_cache_key)
            params = self._build_request_params(self._end_epoch, page)
            logger.debug("Fetching: user: %s, page: %s, end: %s" % (self.username, page, self._end_epoch))
            r = requests.get(LAST_FM_API_URL, params=params)
            if r.status_code == 200:
                played_tracks = r.json()
                if "error" in played_tracks:
                    raise RuntimeError("msg: %s, body:%s" % (played_tracks['message'], played_tracks))

                self._cache_played_tracks_page(page, self._end_epoch, played_tracks)
                return played_tracks
            else:
                raise RuntimeError("Failed to fetch tracks")
        else:
            logger.info("Cache HIT: %s" % track_cache_key)
            return played_tracks

    def _fetch_track_stats(self):
        # request this first page of tracks, this will be cached and reused later
        played_tracks = self._fetch_played_tracks_page(0)
        total_pages = int(played_tracks['recenttracks']['@attr']['totalPages'])
        total_tracks = int(played_tracks['recenttracks']['@attr']['total'])
        logger.info("Total pages for %s - %s" % (self.username, total_pages))
        return total_pages, total_tracks

    def _build_cache_key(self, page, end_epoch):
        lower_username = self.username.lower()
        key = "%s:%s:%s" % (lower_username, page, end_epoch)
        return hashlib.md5(key).hexdigest()

    def _build_request_params(self, end_epoch, page=0):
        return {
            'method': 'user.getrecenttracks',
            'format': 'json',
            'page': page,
            'limit': self.PAGE_SIZE,
            'api_key': self.api_key,
            'user': self.username,
            'to': end_epoch
        }

    def _parse_track_data(self, track_request):
        all_tracks = []
        if isinstance(track_request, unicode):
            return []
        
        recent_tracks = track_request.get('recenttracks', {}).get('track', [])
        for track in recent_tracks:
            try:
                formatted_track = self._generate_played_track(track)
                all_tracks.append(formatted_track)
            except KeyError:
                logger.exception("Failed to format %s. Skipping" % track)
                continue

        return all_tracks

    def _generate_played_track(self, raw_track):
        track_id = raw_track['mbid']
        track_name = raw_track['name']
        timestamp = int(raw_track['date']['uts'])

        # generate a unique play id for this track play
        play_id = self._get_play_id(track_id, track_name, timestamp)

        return PlayedTrack(
            key_name=play_id,
            parent=self.user,
            artist_id=raw_track['artist'].get('mbid'),
            artist_name=raw_track['artist']['#text'],
            album_id=raw_track['album'].get('mbid'),
            album_name=raw_track['album']['#text'],
            track_id=track_id,
            track_name=track_name,
            timestamp=timestamp
        )

    def _get_play_id(self, track_id, track_name, timestamp):
        # some tracks don't have an id in the system
        track_key = track_id or track_name

        # this assumes that it is an error to play the same track twice on the same second
        try:
            key = str("%s:%s:%s" % (self.username, track_key, timestamp))
        except UnicodeEncodeError:
            # md5 doesn't like unicode which some track names contain. Assume the TS is unique enough
            logger.debug("UnicodeEncodeError - Failed to hash track %s. Falling back to TS" % track_key)
            key = "%s:None:%s" % (self.username, timestamp)
        return hashlib.md5(key).hexdigest()
