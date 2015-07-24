/*
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
*/

angular.module('lastfmVisApp')


.service('trackBucketing', function($filter) {
    function by(tracks, startOf) {
        var byBucket = _.groupBy(tracks, function(track) {
                var date = moment.unix(track.ts);

                return date.startOf(startOf).unix();
            });

        var trackBuckets = _.chain(Object.keys(byBucket))
            .map(function(bucket) {
                var bucketedTracks = byBucket[bucket];

                if (bucketedTracks.length > 0) {
                    return {
                        timestamp: bucket,
                        tracks: bucketedTracks,
                    };
                } else {
                    return null;
                }
            })
            .compact()
            .sortBy('timestamp')
            .value();

        return trackBuckets;
    }
    return {
        byArtist: function(tracks) {
            return _.groupBy(tracks, function(track) {
                return track.ar_nm ? track.ar_nm : 'No Artist';
            });
        },
        by: function(tracks, bucket) {
            return by(tracks, bucket);
        },
        byDay: function(tracks) {
            return by(tracks, 'day');
        },
        byWeek: function(tracks) {
            return by(tracks, 'week');
        },
        byMonth: function(tracks) {
            return by(tracks, 'month');
        }
    };
});
