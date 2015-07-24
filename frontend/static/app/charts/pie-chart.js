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

.directive('pieChart', function(trackAggregation) {
    'use strict';

    return {
        scope: {
            tracks: '='
        },
        link: function($scope, $element, $attr) {
            var diameter = 350,
                vPadding = 20,
                hPadding = 160,
                radius = diameter / 2,
                labelRadius = radius + 5,
                outerWidth = diameter + hPadding * 2,
                outerHeight = diameter + vPadding * 2,
                angleOffset = Math.PI/2;

            var color = d3.scale.ordinal()
                .range(["#98abc5", "#8a89a6", "#7b6888", "#6b486b", "#a05d56", "#d0743c", "#ff8c00"]);

            var arc = d3.svg.arc()
                .outerRadius(radius - 5)
                .innerRadius(0)
                .startAngle(function(d) { return d.startAngle + angleOffset; })
                .endAngle(function(d) { return d.endAngle + angleOffset; });

            var pie = d3.layout.pie()
                .value(function(d) { return d.weightedCount; })
                .sort(null);

            var svg = d3.select($element[0]).append("svg")
                .attr("width", outerWidth)
                .attr("height", outerHeight)
              .append("g")
                .attr("transform", "translate(" + outerWidth / 2 + "," + outerHeight / 2 + ")");

            function setTracks(data) {
                svg.selectAll('*').remove();

                var g = svg.selectAll(".arc")
                        .data(pie(data))
                    .enter().append("g")
                        .attr("class", function(d) {
                            return "arc" + (d.data.dimmed ? " dimmed" : "");
                        });

                g.append("path")
                  .attr("d", arc)
                  .style("fill", function(d) { return color(d.data.name); });

                // http://stackoverflow.com/questions/8053424/label-outside-arc-pie-chart-d3-js
                g.append("text")
                    .attr("transform", function(d) {
                        var c = arc.centroid(d),
                            x = c[0],
                            y = c[1],
                            h = Math.sqrt(x*x + y*y);

                        return "translate(" + (x/h * labelRadius) +  ',' +
                           (y/h * labelRadius) +  ")";
                    })
                    .attr("dy", ".35em")
                    .style("text-anchor", function(d) {
                        var midAngle = (d.endAngle + d.startAngle) / 2;
                        // are we past the center?
                        return ((midAngle > 2 * Math.PI - angleOffset) || midAngle < angleOffset) ?
                            "start" : "end";
                    })
                    .text(function(d) {
                        return d.data.name + " (" + d.data.count + ")";
                    });
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

