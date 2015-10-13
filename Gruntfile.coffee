#global module:false
module.exports = (grunt) ->
    grunt.initConfig
        meta:
            version: '1.0.0',
        clean:
            build:   ['app']
        copy:
            build:
                options:
                    punctuation: ''
                files: [
                    {
                      cwd: 'dev/lib/',
                      src: ['**/*.*'],
                      dest: 'app/lib/',
                      expand: true
                    }
                    {
                      cwd: 'dev/js/'
                      src: ['**/*.*']
                      dest: 'app/js/' 
                      expand: true
                    }
                ]
        jade:
            build:
                options:
                    pretty: true
                files: grunt.file.expandMapping(["dev/views/**/*.jade"], "app",
                    rename: (destBase, destPath) ->
                        destBase + destPath.replace(/dev\/views/, '').replace(/\.jade$/, ".html")
                )
        stylus:
            build:
                options:
                    compress: false
                files:[
                    expand: true,
                    cwd: 'dev/styl/',
                    src: ['**/[^_]*.styl'],
                    dest: 'app/css/',
                    ext: '.css'
                ]
        watch:
            styl:
                files: ['dev/styl/**/*.styl']
                tasks: 'stylus:build'
            jade:
                files: ['dev/views/**/*.jade']
                tasks: 'jade:build'
            js:
                files: ['dev/js/**/*.js']
                tasks: 'copy:build'
            lib:
                files: ['dev/lib/**/*.*']
                tasks: 'copy:build'


    # Load NPM modules
    grunt.loadNpmTasks 'grunt-contrib-jade'
    grunt.loadNpmTasks 'grunt-contrib-stylus'
    grunt.loadNpmTasks 'grunt-contrib-watch'
    grunt.loadNpmTasks 'grunt-copy'
    grunt.loadNpmTasks 'grunt-contrib-clean'
    
    # Default task.
    grunt.registerTask 'default', ['clean:build','copy:build', 'jade:build', 'stylus:build']
    grunt.registerTask 'build', 'default'
    grunt.registerTask 'compile', ['default', 'watch']

    
    
    
    