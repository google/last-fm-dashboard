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

.service('trackMetadata', function() {
    'use strict';

    return function(tracks) {
        var start = Number.MAX_VALUE,
            end = Number.MIN_VALUE;

        _.each(tracks, function(track) {
            if (track.ts > end) end = track.ts;
            if (track.ts < start) start = track.ts;
        });

        return {
            start: start * 1000,
            end: end * 1000,
            count: tracks.length
        };
    };
});
