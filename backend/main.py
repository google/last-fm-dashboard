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

import json
import logging

from flask import request

from google.appengine.ext import db

from users import clear_users_played_tracks
from models import PlayedTrack, UserTracks
from models import User
from settings import DEFAULT_API_KEY
from tracks import PlayedTracksFetcher

logger = logging.getLogger()


def clear_all():
    tracks = PlayedTrack.all()
    users = User.all()

    tracks_count = tracks.count()
    users_count = users.count()

    # delete data in bulk
    db.delete(tracks)
    db.delete(users)

    logger.info('Deleted %s Users and %s Tracks' % (tracks_count, users_count))
    return "OK"


def download_played_tracks():
    username = request.form['username'].lower()
    page_limit = int(request.form.get('page_limit', 5))
    api_key = request.form.get('api_key', DEFAULT_API_KEY)
    #clear_users_played_tracks(username)
    user = User.get_by_key_name(username)
    fetcher = PlayedTracksFetcher(user, api_key, page_limit=page_limit)
    success = fetcher.download_all_played_tracks()

    if success:
        logger.info("Finished downloading all tracks for %s" % username)
        return "OK"
    else:
        return "Failed to download tracks", 500


def get_played_tracks(username):
    username = username.lower()
    page_limit = int(request.args.get('page_limit', 5))
    include_ids = bool(request.args.get('include_ids', False))
    user = User.get_by_key_name(username)

    if not user:
        warning = "User %s doesn't exist" % username
        return warning, 404

    cache_key = "%s:%s:%s" % (username, user.downloaded_tracks, page_limit)
    cached_tracks = UserTracks.get_by_key_name(cache_key)
    if cached_tracks:
        logger.info("Found all tracks for %s" % username)
        return cached_tracks.all_tracks
    else:
        all_tracks_query = PlayedTrack.all()
        all_tracks_query.order('-timestamp')
        all_tracks_query.ancestor(user)
        all_tracks = []
        for track in all_tracks_query.run(limit=page_limit * 200):
            all_tracks.append(track.to_dict(include_ids=include_ids))

        response_data = json.dumps(all_tracks)

        if user.download_finished:
            logger.info("Finished downloading all tracks for %s. Caching" % username)
            cached_tracks = UserTracks(
                key_name=cache_key,
                username=username,
                all_tracks=response_data
            )
            try:
                cached_tracks.put()
            except:
                logger.exception("request was probably too large")
            
        return response_data
