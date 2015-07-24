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

var lastfmVisApp = angular.module('lastfmVisApp', [
  'ngRoute',
  'ngMaterial',
  'ngMdIcons'
]);

lastfmVisApp.constant('OTHER_WEIGHT_MULTIPLIER', 0.1);
lastfmVisApp.constant('CHART_MAX_BUCKETS', 20);
lastfmVisApp.constant('DEFAULT_PAGE_COUNT', 5);
lastfmVisApp.constant('PAGE_SIZE', 200);
lastfmVisApp.constant('USER_REFRESH_INTERVAL_MS', 5000);
lastfmVisApp.constant('BASE_TITLE', 'Last.fm Visual Dashboard');

lastfmVisApp.config(function($locationProvider, $routeProvider) {
    $locationProvider.html5Mode(true);

    $routeProvider.
        when('/', {
            templateUrl: 'static/partials/index.html',
            controller: 'IndexCtrl'
        }).
        when('/d/:user', {
            templateUrl: 'static/partials/home.html',
            controller: 'HomeCtrl'
        }).
        otherwise({
            templateUrl: 'static/partials/404.html',
            controller: 'ErrorCtrl'
        });
});

lastfmVisApp

.service('bindQP', function($location) {
    return function($scope, scopeKey, qpKey, transform, replace) {
        transform = transform || function(val) { return val; };

        $scope[scopeKey] = transform($location.search()[qpKey]);

        return $scope.$watch(scopeKey, function (newVal, oldVal) {
            if (newVal !== oldVal) {
                if (replace) $location.replace();

                if (newVal === false) newVal = null;
                $location.search(qpKey, newVal);
            }
        });
    };
})

.service('bindLS', function() {
    return function($scope, scopeKey, lsKey, transform) {
        transform = transform || function(val) { return val; };

        $scope[scopeKey] = transform(localStorage.getItem(lsKey));

        return $scope.$watch(scopeKey, function (newVal, oldVal) {
            if (newVal !== oldVal) {
                localStorage.setItem(lsKey, newVal);
            }
        });
    };
})

.service('pageTitleService', function(BASE_TITLE) {
    return function(title) {
        var custom = '';
        if (title) {
            custom = title + ' - ';
        }

        document.title = custom + BASE_TITLE;
    };
});


