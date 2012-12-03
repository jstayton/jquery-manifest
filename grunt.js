/*global module:false*/
module.exports = function (grunt) {
  'use strict';

  var bannerRegex = /\/\*[\s\S]*?\*\//;

  grunt.initConfig({
    pkg: '<json:package.json>',
    meta: {
      banner: {
        widget: grunt.file.read('lib/jquery.ui.widget.js').match(bannerRegex)[0],
        marcopolo: grunt.file.read('lib/jquery.marcopolo.js').match(bannerRegex)[0],
        source: grunt.file.read('src/jquery.manifest.js').match(bannerRegex)[0]
      }
    },
    lint: {
      files: ['grunt.js', 'src/*.js']
    },
    min: {
      widget: {
        src: ['<banner:meta.banner.widget>', 'lib/jquery.ui.widget.js'],
        dest: 'build/parts/jquery.ui.widget.min.js'
      },
      marcopolo: {
        src: ['<banner:meta.banner.marcopolo>', 'lib/jquery.marcopolo.js'],
        dest: 'build/parts/jquery.marcopolo.min.js'
      },
      source: {
        src: ['<banner:meta.banner.source>', 'src/jquery.manifest.js'],
        dest: 'build/parts/jquery.manifest.min.js'
      }
    },
    concat: {
      widget: {
        src: 'lib/jquery.ui.widget.js',
        dest: 'build/parts/jquery.ui.widget.js'
      },
      marcopolo: {
        src: 'lib/jquery.marcopolo.js',
        dest: 'build/parts/jquery.marcopolo.js'
      },
      source: {
        src: ['<banner:meta.banner.source>', '<file_strip_banner:src/jquery.manifest.js:block>'],
        dest: 'build/parts/jquery.manifest.js',
        separator: ''
      },
      unmin: {
        src: ['<config:concat.widget.dest>', '<config:concat.marcopolo.dest>', '<config:concat.source.dest>'],
        dest: 'build/jquery.manifest.js'
      },
      min: {
        src: ['<config:min.widget.dest>', '<config:min.marcopolo.dest>', '<config:min.source.dest>'],
        dest: 'build/jquery.manifest.min.js',
        separator: '\n\n'
      }
    },
    watch: {
      files: '<config:lint.files>',
      tasks: 'lint'
    },
    component: {
      main: './build/jquery.manifest.min.js',
      dependencies: {
        'jquery': '>=1.5',
        'jquery-marcopolo': '~1.7.3'
      }
    },
    jasmine: {
      all: 'test/runner.html'
    },
    jshint: {
      options: {
        // Enforcing
        bitwise: true,
        camelcase: true,
        curly: true,
        eqeqeq: true,
        forin: true,
        immed: true,
        latedef: true,
        newcap: true,
        noarg: true,
        noempty: true,
        nonew: true,
        quotmark: 'single',
        regexp: true,
        undef: true,
        unused: true,
        strict: true,
        trailing: true,
        maxlen: 120,
        // Relaxing
        boss: true,
        eqnull: true,
        sub: true,
        // Environment
        browser: true,
        jquery: true
      },
      globals: {
        define: true
      }
    },
    uglify: {}
  });

  grunt.registerTask('test', 'lint jasmine');
  grunt.registerTask('default', 'test min concat component');

  grunt.loadNpmTasks('grunt-bump');
  grunt.loadNpmTasks('grunt-jasmine-task');
  grunt.loadNpmTasks('grunt-pkg-to-component');
};
