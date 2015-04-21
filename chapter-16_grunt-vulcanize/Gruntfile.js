
module.exports = function (grunt) {

    grunt.loadNpmTasks('grunt-vulcanize');
    grunt.loadNpmTasks('grunt-contrib-uglify');

    var config = {
        uglify: {
            csp: {
                files: {
                    'x-dialog-csp.js': ['x-dialog-csp.js']
                }
            }
        },
        vulcanize: {
            options: {
                inline: true,
                excludes : {
                    imports: [
                        "polymer"
                    ],
                    scripts: [
                        "jquery",
                        "jenga"
                    ]
                }
            },
            main: {
                src: "x-dialog-csp.html",
                dest: "x-dialog.html"
            },
            csp: {
                src: "components/src/x-dialog.html",
                dest: "x-dialog-csp.html",
                options: {
                    csp: true
                }
            }
        }
    };


    grunt.initConfig(config);

    grunt.registerTask('default', [ 'vulcanize:csp', 'uglify:csp', 'vulcanize:main' ]);

};
