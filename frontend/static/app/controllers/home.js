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

.controller('HomeCtrl', function(
            $scope, $location, $routeParams, $mdSidenav,
            userTrackService, bindQP, DEFAULT_PAGE_COUNT,
            $timeout, PAGE_SIZE, pageTitleService) {

    'use strict';
    $scope.username = $routeParams.user;
    pageTitleService($scope.username);

    $scope.pagesList = [1, 5, 10, 20, 50, 100, 150, 500];

    $scope.userDownload = false;

    $scope.hideDownloadBar = function() {
        $scope.userDownload = false;
    };

    userTrackService.fetchUser($scope.username).then(function(user) {
        //$scope.userDownload = !user.download_finished;
    });

    $scope.toggleSidenav = function() {
        $mdSidenav('left').toggle();
    };

    bindQP($scope, 'pageLimit', 'pages', function(val) {
        var num = parseInt(val, 10);
        if (isNaN(num)) {
            return DEFAULT_PAGE_COUNT;
        } else {
            return num;
        }
    }, true);

    var tries = [];

    function lookupTracks(username) {
        if (!username) {
            $scope.error = 'No Username!!';
            return;
        }

        var pageLimit = $scope.pageLimit;
        $scope.loading = true;

        userTrackService.recentLookup(username, pageLimit)
            .then(function(result) {
                return result;
            }, function(err) {
                if (err.status === 404) {
                    $scope.downloading = true;
                    return userTrackService.downloadData(username, pageLimit).then(function(){
                        return userTrackService.recentLookup(username, pageLimit);
                    });
                } else {
                    throw err;
                }
            })
            .then(function(result) {
                tries.unshift(result.tracks.length);

                // wait for the desired number of results or for the same number to return 3 times
                if (result.tracks.length >= 0.9 * pageLimit * PAGE_SIZE ||
                        (tries[0] > 0 && tries[0] === tries[1] && tries[1] === tries[2]) ||
                        result.tracks.length >= 900) {
                    $scope.loading = false;
                    $scope.downloading = false;

                    $scope.tracks = result.tracks;
                    $scope.tracks.metadata = result.metadata;
                } else {
                    // try again in 500ms
                    $timeout(function() {
                        lookupTracks(username);
                    }, 2000);
                }
            }, function(err) {
                $scope.loading = false;
                $scope.downloading = false;
                $scope.error = err.data;
            });
    }

    $scope.changeUsername = function(username) {
        $scope.username = username;
    };

    if ($scope.username) {
        lookupTracks($scope.username, $scope.pageLimit);
    }
});
