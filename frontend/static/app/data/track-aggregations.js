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

.filter('extractName', function() {
    return function extractName(item) {
        return item.name || item['#text'] || item.tr_nm;
    };
})

.service('trackAggregation', function(OTHER_WEIGHT_MULTIPLIER) {
    'use strict';

    function sortBy(tracks, key, emptyString, maxBuckets) {
        var counts = _.countBy(tracks, function(track) {
                return track[key] ? track[key] : emptyString;
            }),
            counted = Object.keys(counts).map(function(name) {
                return {
                    name: name,
                    count: counts[name],
                    weightedCount: counts[name]
                };
            }),
            sorted = _.sortBy(counted, function(item) { return -item.count; });

        if (maxBuckets !== undefined && sorted.length > maxBuckets) {
            var other = sorted.splice(maxBuckets, Number.MAX_VALUE),
                otherCount = _.reduce(other, function(memo, item) {
                    return memo + item.count;
                }, 0);

            sorted.unshift({
                name: 'Other',
                count: otherCount,
                weightedCount: Math.ceil(otherCount * OTHER_WEIGHT_MULTIPLIER),
                dimmed: true
            });
        }

        return sorted;
    }

    return {
        byArtist: function(tracks, maxBuckets) {
            return sortBy(tracks, 'ar_nm', 'No Artist', maxBuckets);
        },
        byAlbum: function(tracks, maxBuckets) {
            return sortBy(tracks, 'al_nm', 'No Album', maxBuckets);
        }
    };
});
