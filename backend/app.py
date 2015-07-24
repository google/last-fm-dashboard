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

from flask import Flask, request
from google.appengine.api import memcache, taskqueue
from google.appengine.ext.db import stats

from models import User
from users import clear_users_played_tracks, get_users, get_user, fetch_last_fm_user, create_user
from main import clear_all, download_played_tracks, get_played_tracks

app = Flask("last-fm-dashboard-api")
task_queue = taskqueue.Queue('download-played-tracks')
logging.basicConfig(level=logging.DEBUG)
logger = logging.getLogger()


def index():
    return 'last-fm-dashboard API'


def healthcheck():
    memcache_stats = memcache.get_stats()
    datastore_stats = stats.GlobalStat.all().get()

    return json.dumps({
        "memcache_stats": memcache_stats,
        "datastore_stats": datastore_stats
    })


def create_user_and_download_tracks_push():
    logger.info("create_user_and_download_tracks_push")
    print request.form['username']
    return "OK"


def create_user_and_download_tracks(username):
    username = username.lower()
    page_limit = int(request.args.get('page_limit', 5))
    user_details = fetch_last_fm_user(username)

    if not user_details:
        return "No user found", 404

    user = User.get_by_key_name(username)

    if not user:
        logger.info("Creating user %s" % username)
        user = create_user(username, user_details)

    logger.info("Scheduling track download for %s" % username)
    task_args = {"username": username, "page_limit": page_limit}
    task_path = '/api/download-played-tracks-worker'
    taskqueue.add(queue_name="download-played-tracks-push", url=task_path,  params=task_args)
    return json.dumps(user.to_dict())


@app.errorhandler(404)
def page_not_found(e):
    return 'Backend API - Nothing at this URL.', 404


@app.errorhandler(500)
def application_error(e):
    return 'Backend API - Unexpected error: {}'.format(e), 500


app.add_url_rule("/api/",
                 view_func=index)

app.add_url_rule("/api/healthcheck",
                 view_func=healthcheck)

app.add_url_rule('/api/clear-all',
                 view_func=clear_all,
                 methods=['DELETE'])

app.add_url_rule('/api/download-played-tracks/<username>',
                 view_func=create_user_and_download_tracks,
                 methods=['POST'])

app.add_url_rule('/api/download-played-tracks-worker',
                 view_func=download_played_tracks,
                 methods=['POST'])

app.add_url_rule('/api/played-tracks/<username>',
                 view_func=get_played_tracks)

app.add_url_rule('/api/played-tracks/<username>',
                 view_func=clear_users_played_tracks,
                 methods=['DELETE'])

app.add_url_rule('/api/user/<username>',
                 view_func=get_user)

app.add_url_rule('/api/users',
                 view_func=get_users)