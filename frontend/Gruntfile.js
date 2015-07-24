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

module.exports = function(grunt) {
    'use strict';

    grunt.loadNpmTasks('grunt-ng-annotate');
    grunt.loadNpmTasks('grunt-contrib-jshint');
    grunt.loadNpmTasks('grunt-contrib-watch');
    grunt.loadNpmTasks('grunt-notify');

    var appSrc = ['static/app/**/*.js'],
        appTemplates = ['static/**/*.html'],
        styleTemplates = ['static/css/*.less'];

    grunt.initConfig({
        pkg: grunt.file.readJSON('package.json'),

        jshint: {
            all: ['Gruntfile.js'].concat(appSrc)
        },

        ngAnnotate: {
            options: {
                singleQuotes: true,
            },
            app: {
                files: {
                    'static/bundle.js': appSrc,
                }
            }
        },

        watch: {
            scripts: {
                files: appSrc.concat(appTemplates, styleTemplates),
                tasks: ['default'],
                options: {
                    spawn: false,
                    livereload: true,
                },
            },
        }
    });

    grunt.registerTask('default', ['jshint', 'ngAnnotate']);
    grunt.task.run('notify_hooks');
};
