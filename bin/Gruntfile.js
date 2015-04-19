module.exports = function(grunt) {

	// Load All Grunt Tasks
	require('load-grunt-tasks')(grunt);


	grunt.initConfig({

		sass: {
			dist:{
				options:{
					style: 'expanded'
				},
				files:{
					'public/css/style.css': 'public/sass/style.scss'
				}
			}
		},
		watch: {
			scripts: {
				files: ['public/js/*.js'],
				tasks: [],
				options: {
					spawn: false,
				},
			},
			styles: {
				files: ['public/sass/**/*.scss'],
				tasks: ['sass']
			}
		},
		browserSync: {
            dev: {
                bsFiles: {
                    src : [
                        'public/css/*.css',
                        'public/js/*.js',
                        '*.html'
                    ]
                },
                options: {
                    watchTask: true,
                    server: './',
                    //proxy: "http://localhost:8080"
                }
            }
        }

	});

	grunt.registerTask('default', ['sass', 'browserSync', 'watch']);
};