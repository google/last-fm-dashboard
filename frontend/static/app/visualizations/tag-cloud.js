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

.directive('tagCloud', function(trackAggregation) {
    'use strict';

    return {
        templateUrl: 'static/app/visualizations/partials/tag-cloud.html',
        scope: {
            tracks: '=',
            minCount: '='
        },
        controller: function($scope, $filter) {
            var minSize = 6,
                maxSize = 36;

            $scope.genFontSize = function(playcount, maxCount) {
                return (playcount / maxCount * (maxSize - minSize)) + minSize;
            };

            function setTracks(tracks) {
                var tracksByName = _.groupBy(tracks, function(track) {
                        return $filter('extractName')(track);
                    }),
                    maxCount = 0;

                $scope.innerTracks = _.map(Object.keys(tracksByName), function(name) {
                    var track = tracksByName[name][0];
                    track.playcount = tracksByName[name].length;
                    maxCount = Math.max(maxCount, track.playcount);
                    return track;
                });

                $scope.maxCount = maxCount;
            }

            $scope.$watch('tracks', function(tracks, oldData) {
                if (tracks) {
                    setTracks(tracks);
                }
            });

            if ($scope.tracks) {
                setTracks($scope.tracks);
            }
        }
    };
});

