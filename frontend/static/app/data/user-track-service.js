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

.service('userTrackService', function($http, $q, cacheService, PAGE_SIZE) {
    'use strict';

    function parseDataFn(pageLimit) {
        return function(data) {
            data = _.sortBy(data, 'ts').slice(-pageLimit * PAGE_SIZE);

            return {
                tracks: data,
                metadata: {
                    mostplayed: _.reduce(data, function(memo, track) {
                            return Math.max(memo, track.playcount);
                        }, 0)
                }
            };
        };
    }

    return {
        downloadData: function(username, pageLimit) {
            pageLimit = pageLimit || 2;
            var deferred = $q.defer();

            $http.post('/api/download-played-tracks/'+username+'?page_limit='+pageLimit)
                .success(function(data, status, headers, config) {
                    deferred.resolve(data);
                })
                .error(function(data, status, headers, config) {
                    deferred.reject({
                        data: data,
                        status: status
                    });
                });


            return deferred.promise;
        },
        recentLookup: function(username, pageLimit) {
            pageLimit = pageLimit || 2;
            var deferred = $q.defer();

            $http.get('/api/played-tracks/'+username+'?page_limit='+pageLimit)
                .success(function(data, status, headers, config) {
                    deferred.resolve(data);
                })
                .error(function(data, status, headers, config) {
                    deferred.reject({
                        data: data,
                        status: status
                    });
                });


            return deferred.promise.then(parseDataFn(pageLimit));
        },
        userLookup: function(username, apiKey) {
            var deferred = $q.defer();

            var count = 100,
                url = '//ws.audioscrobbler.com/2.0/' +
                    '?method=library.gettracks&api_key=' + apiKey +
                    '&user=' + username + '&limit='+count+'&format=json';

            var cached = cacheService.get(url);

            if (cached) {
                deferred.resolve(cached);
            } else {

                $http.get(url)
                    .success(function(data, status, headers, config) {
                        cacheService.set(url, data);
                        deferred.resolve(data);
                    })
                    .error(function(data, status, headers, config) {
                        deferred.reject(data);
                    });
            }

            return deferred.promise.then(function(data) {
                return {
                    tracks: data.tracks.track,
                    metadata: {
                        mostplayed: _.reduce(data.tracks.track, function(memo, track) {
                                return Math.max(memo, track.playcount);
                            }, 0)
                    }
                };
            });
        },
        fetchAllUsers: function() {
            var deferred = $q.defer();

            $http.get('/api/users').success(function(data) {
                    deferred.resolve(data);
                })
                .error(function(data) {
                    deferred.reject(data);
                });

            return deferred.promise;
        },
        fetchUser: function(username) {
            var deferred = $q.defer();

            $http.get('/api/user/' + username).success(function(data) {
                    deferred.resolve(data);
                })
                .error(function(data) {
                    deferred.reject(data);
                });

            return deferred.promise;
        },
        clearTrackData: function(username) {
            var deferred = $q.defer(),
              url = '/api/played-tracks/' + username;

            $http.delete(url).success(function(data) {
                    deferred.resolve(data);
                })
                .error(function(data) {
                    deferred.reject(data);
                });

            return deferred.promise;
        },
        downloadTrackData: function(username) {
            var deferred = $q.defer(),
              url = '/api/download-played-tracks/' + username;

            $http.post(url, {}).success(function(data) {
                    deferred.resolve(data);
                })
                .error(function(data) {
                    deferred.reject(data);
                });

            return deferred.promise;
        }
    };
});
