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

  .controller('UsersCtrl', function ($scope, $timeout, userTrackService, USER_REFRESH_INTERVAL_MS, $location) {
    'use strict';
    var userTimeout;

    function loadUsers() {
      userTrackService.fetchAllUsers().then(function (users) {
        $scope.users = users;
      });
      // ensure we don't trigger multiple timeouts when clearing or downloading track data
      if (userTimeout) {
        $timeout.cancel(userTimeout);
      }
      userTimeout = $timeout(loadUsers, USER_REFRESH_INTERVAL_MS);
    }

    $scope.clearTrackData = function(user) {
      userTrackService.clearTrackData(user.username);
      loadUsers();
    };

    $scope.downloadTrackData = function(user) {
      var pages = $location.search().pages || 10;
      userTrackService.downloadData(user.username, pages);
      loadUsers();
    };

    $scope.$on("$destroy", function() {
        if (userTimeout) {
            $timeout.cancel(userTimeout);
        }
    });

    $scope.userImage = function(user, imageSize) {
      var images = user.details.image;
      var image = _.find(images, function(i){
        return i.size == imageSize;
      });
      return image['#text'];
    };

    loadUsers();
  });

