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

from google.appengine.ext import db


class PlayedTrack(db.Model):
    artist_id = db.StringProperty(required=False)
    artist_name = db.StringProperty(required=False)
    album_id = db.StringProperty(required=False)
    album_name = db.StringProperty(required=False)
    track_id = db.StringProperty(required=False)
    track_name = db.StringProperty(required=True, indexed=False)
    timestamp = db.IntegerProperty(required=True)

    def to_dict(self, include_ids=False):
        track = {
            'ar_nm': self.artist_name,
            'al_nm': self.album_name,
            'tr_nm': self.track_name,
            'ts': self.timestamp
        }
        if include_ids:
            track['ar_id'] = self.artist_id
            track['al_id'] = self.album_id
            track['tr_id'] = self.track_id

        return track


class User(db.Model):
    username = db.StringProperty(required=True)
    total_tracks = db.IntegerProperty(required=True)
    total_pages = db.IntegerProperty(required=True)
    downloaded_tracks = db.IntegerProperty(required=True)
    downloaded_pages = db.IntegerProperty(required=True)
    download_finished = db.BooleanProperty(required=True)
    details = db.TextProperty(required=False)

    def to_dict(self):
        details = json.loads(self.details)
        return {
            'username': self.username,
            'total_tracks': self.total_tracks,
            'total_pages': self.total_pages,
            'downloaded_tracks': self.downloaded_tracks,
            'downloaded_pages': self.downloaded_pages,
            'download_finished': self.download_finished,
            'details': details
        }

class UserTracks(db.Model):
    username = db.StringProperty(required=True)
    all_tracks = db.TextProperty(required=True)