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

.directive('tracksOverTime', function(trackBucketing, trackAggregation, $timeout, bindQP) {
    'use strict';

    return {
        templateUrl: 'static/app/charts/partials/over-time.html',
        scope: {
            tracks: '=',
            bucket: '='
        },
        controller: function($scope) {
            $scope.chartId = 'chart' + $scope.$id;
            $scope.intervals = ['day', 'week', 'month'];
            $scope.defaultBucket = 'week';

            bindQP($scope, 'bucket', 'bucket', null, true);
            bindQP($scope, 'showSingleTracks', 'verbose', null, true);
        },
        link: function($scope, $element, $attr) {

            function getDataBy(tracksByArtist, bucketInterval, minTrackCount) {
                if (!minTrackCount) minTrackCount = 0;

                var allTimes = [];
                var data = _.chain(Object.keys(tracksByArtist))
                    .map(function(artist) {
                        var tracksByDay = trackBucketing.by(tracksByArtist[artist], bucketInterval, 1),
                            artistTimes = [],
                            artistTracks = _.chain(tracksByDay)
                                .map(function(bucket) {
                                    // exclue low plays
                                    if (bucket.tracks.length <= minTrackCount) return null;

                                    artistTimes.push(bucket.timestamp * 1000);

                                    return [bucket.timestamp * 1000, bucket.tracks.length];
                                })
                                .compact()
                                .object()
                                .value();

                        if (Object.keys(artistTracks).length > 1) {
                            allTimes = allTimes.concat(artistTimes);
                            return {
                                key: artist,
                                tracks: artistTracks
                            };
                        } else {
                            return null;
                        }
                    })
                    .compact()
                    .value();

                allTimes = _.uniq(allTimes);

                _.each(data, function(series) {
                    series.values = _.sortBy(_.map(allTimes, function(time) {
                        return [time, series.tracks[time] || 0];
                    }), '0');
                });

                return data;
            }

            var chart,
                chartData;

            function setTracks(tracks) {
                nv.addGraph(function() {
                    chart = nv.models.stackedAreaChart()
                        .useInteractiveGuideline(true)
                        .x(function(d) { return d[0]; })
                        .y(function(d) { return d[1]; })
                        .style('stream-center')
                        .interpolate("monotone")
                        .controlLabels({stacked: "Stacked"})
                        .showLegend(false)
                        .margin({"left":40,"right":40});

                    chart.interactiveLayer.tooltip.contentGenerator(function(d) {
                        if (d === null) {
                            return '';
                        }

                        var table = d3.select(document.createElement("table"));

                        var theadEnter = table.selectAll("thead")
                            .data([d])
                            .enter().append("thead");

                        theadEnter.append("tr")
                            .append("td")
                            .attr("colspan", 3)
                            .append("strong")
                            .classed("x-value", true)
                            .html(d.value);

                        var tbodyEnter = table.selectAll("tbody")
                            .data([d])
                            .enter().append("tbody");

                        var trowEnter = tbodyEnter.selectAll("tr")
                                .data(function(p) { return p.series; })
                                .enter()
                                .append("tr")
                                .classed("highlight", function(p) { return p.highlight; })
                                .classed("hidden", function(p) { return p.value === 0; });

                        trowEnter.append("td")
                            .classed("legend-color-guide",true)
                            .append("div")
                            .style("background-color", function(p) { return p.color; });

                        trowEnter.append("td")
                            .classed("key",true)
                            .html(function(p, i) {return p.key; });

                        trowEnter.append("td")
                            .classed("value",true)
                            .html(function(p, i) { return p.value;  });


                        trowEnter.selectAll("td").each(function(p) {
                            if (p.highlight) {
                                var opacityScale = d3.scale.linear().domain([0,1]).range(["#fff",p.color]);
                                var opacity = 0.6;
                                d3.select(this)
                                    .style("border-bottom-color", opacityScale(opacity))
                                    .style("border-top-color", opacityScale(opacity))
                                ;
                            }
                        });

                        var html = table.node().outerHTML;
                        if (d.footer !== undefined)
                            html += "<div class='footer'>" + d.footer + "</div>";
                        return html;

                    });

                    var tracksByArtist = trackBucketing.byArtist(tracks),
                        data = getDataBy(tracksByArtist, $scope.bucket || $scope.defaultBucket, $scope.showSingleTracks?0:1);

                    $scope.data = data;

                    chart.xAxis.tickFormat(function(d) { return d3.time.format('%x')(new Date(d)); });

                    chartData = d3.select('#' + $scope.chartId).datum(data);
                    chartData.call(chart);

                    nv.utils.windowResize(_.debounce(chart.update, 500));

                    return chart;
                });
            }

            function redrawData() {
                if (chartData) {
                    var tracksByArtist = trackBucketing.byArtist($scope.tracks),
                        data = getDataBy(tracksByArtist, $scope.bucket || 'day', $scope.showSingleTracks?0:1);

                    $scope.data = data;
                    $scope.updating = false;

                    chartData.datum(data).call(chart);
                    nv.utils.windowResize(_.debounce(chart.update));
                }
            }

            /*$scope.$watch('bucket', function(newVal, oldVal) {
                if (newVal !== oldVal && newVal) {
                    $scope.updating = true;
                    $timeout(function() {
                        redrawData();
                    }, 100);
                }
            });*/

            $scope.$watch('tracks', function(tracks, oldData) {
                if (oldData !== tracks && tracks) {
                    setTracks(tracks);
                }
            });

            if ($scope.tracks) {
                setTracks($scope.tracks);
            }
        }
    };
});

