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

import requests
from google.appengine.ext import db

from settings import DEFAULT_API_KEY,LAST_FM_API_URL
from models import User, PlayedTrack

logger = logging.getLogger()


def create_user(username, user_details):
    username = username.lower()
    user = User(
        key_name=username,
        username=username,
        total_tracks=0,
        total_pages=0,
        downloaded_tracks=0,
        downloaded_pages=0,
        download_finished=False,
        details=json.dumps(user_details)
    )
    user.put()
    logger.info('Created User %s' % username)
    return user


def clear_users_played_tracks(username):
    username = username.lower()
    user = User.get_by_key_name(username)
    users_played_tracks = PlayedTrack.all().ancestor(user)
    tracks_count = users_played_tracks.count()
    db.delete(users_played_tracks)
    reset_user_download_stats(user, 0, 0)

    logger.info('Deleted %s Tracks for %s' % (tracks_count, username))
    return "OK"


def fetch_last_fm_user(username):
    query_params = {'method': 'user.getInfo', 'format': 'json', 'api_key': DEFAULT_API_KEY, 'user': username}
    r = requests.get(LAST_FM_API_URL, params=query_params)
    if r.status_code == 200:
        user_response = r.json()
        if "error" not in user_response:
            return user_response['user']

        if user_response.get("message") == "No user with that name was found":
            return None

    raise RuntimeError("Failed to fetch user from Last.fm API %s" % r.json())

def get_user(username):
    username = username.lower()
    user = User.get_by_key_name(username)
    return json.dumps(user.to_dict())

def get_users():
    q = User.all()
    users = []
    for u in q:
        users.append(u.to_dict())

    return json.dumps(users)


def reset_user_download_stats(user, total_pages, total_tracks, finished=False):
    # update the user record to indicate the stats of the download
    user.total_tracks = total_tracks
    user.total_pages = total_pages
    user.downloaded_tracks = 0
    user.downloaded_pages = 0
    user.download_finished = finished
    user.put()
