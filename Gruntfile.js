var utils = require('./build-utils');

module.exports = function (grunt) {

    var pkg = grunt.file.readJSON('package.json'),
        srcDir = './src',
        buildDir = './build',
        distDir = './dist',
        buildTime = new Date(),
        buildTimeString = buildTime.toISOString();

    var version = utils.version.parse(pkg.version),
        versionString = utils.version.getCacheKey(version);

    //noinspection JSValidateTypes
    grunt.util.linefeed = '\n';

    require('load-grunt-tasks')(grunt);

    //noinspection JSUnresolvedFunction
    grunt.initConfig({
        pkg: pkg,

        version : {
            version : version.version,
            versionString : versionString,
            buildTime: buildTime,
            buildTimeString: buildTimeString
        },

        srcDir: srcDir,
        buildDir: buildDir,
        distDir: distDir,

        clean: {
            build: [buildDir],
            dist: [distDir]
        },

        copy: {
            build: {
                files: [
                    {expand: true, cwd: '<%= srcDir %>/', src: ['**'], dest: '<%= buildDir %>/'}
                ]
            }
        },

        replace: {
            build: {
                src: [
                    '<%= buildDir %>/*.js'
                ],
                overwrite: true,
                replacements: [
                    {
                        from: "$PROJECT_NAME$",
                        to: "<%= pkg.name %>"
                    },
                    {
                        from: "$PROJECT_HOMEPAGE$",
                        to: "<%= pkg.homepage %>"
                    },{
                        from: "$PROJECT_VERSION$",
                        to: "<%= version.versionString %>"
                    },{
                        from: "$PROJECT_BUILD_TIME$",
                        to: "<%= version.buildTimeString %>"
                    },{
                        from: "$PROJECT_LICENSE$",
                        to: "<%= pkg.license %>"
                    }
                ]
            }
        },

        uglify: {
            min: {
                options: {
                    report: 'gzip',
                    sourceMap: true,
                    mangle: true,
                    compress: {
                        drop_console: true
                    },
                    preserveComments: 'some'
                },
                files : {
                    '<%= buildDir %>/dv-viewport.min.js' : ['<%= buildDir %>/dv-viewport.js']
                }
            }
        },

        compress: {
            dist: {
                options: {
                    archive: '<%= distDir %>/<%= pkg.name %>-<%= version.versionString %>.zip'
                },
                files: [
                    {expand: true, cwd: '<%= buildDir %>/', src: ['**']}
                ]
            }
        }

    });

    grunt.registerTask('build', [
        'clean:build',
        'copy:build',
        'replace:build',
        'uglify:min'
    ]);

    grunt.registerTask('dist', [
        'build',
        'clean:dist',
        'compress:dist'
    ]);

    grunt.registerTask('default', ['build']);

};
