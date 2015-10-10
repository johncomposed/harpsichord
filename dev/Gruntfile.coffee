#global module:false
module.exports = (grunt) ->
    grunt.initConfig
        meta:
            version: '0.1.0',
        clean:
            build:   ['build']
            release: ['../app']
        copy:
            build:
                options:
                    punctuation: ''
                files: [
                    {
                      cwd: 'src/lib/',
                      src: ['**/*.*'],
                      dest: 'build/lib/',
                      expand: true
                    }
                    {
                      cwd: 'src/js/'
                      src: ['**/*.*']
                      dest: 'build/js/' 
                      expand: true
                    }
                ]
            release:
                options:
                    punctuation: ''
                files: [
                    cwd: 'build/'
                    src: ['**/*.*', '*.*', '**/**/*.*']
                    dest: '../app/' 
                    expand: true
                ]
        jade:
            build:
                options:
                    pretty: true
                files: grunt.file.expandMapping(["src/views/**/*.jade"], "build",
                    rename: (destBase, destPath) ->
                        destBase + destPath.replace(/src\/views/, '').replace(/\.jade$/, ".html")
                )
        coffee:
            build:
                options:
                    compress: false
                files:[
                    expand: true,
                    cwd: 'src/coffee/',
                    src: ['**/*.coffee'],
                    dest: 'build/js/',
                    ext: '.js'
                ]
        stylus:
            build:
                options:
                    compress: false
                files:[
                    expand: true,
                    cwd: 'src/styl/',
                    src: ['**/[^_]*.styl'],
                    dest: 'build/css/',
                    ext: '.css'
                ]
        watch:
            styl:
                files: ['src/styl/**/*.styl']
                tasks: 'stylus:build'
            jade:
                files: ['src/views/**/*.jade']
                tasks: 'jade:build'
            coffee:
                files: ['src/coffee/**/*.coffee']
                tasks: 'coffee:build'
            lib:
                files: ['src/lib/**/*.*']
                tasks: 'copy:build'
            app:
                files: ['build/**/*.*']
                tasks: 'copy:release'


    # Load NPM modules
    grunt.loadNpmTasks 'grunt-contrib-jade'
    grunt.loadNpmTasks 'grunt-contrib-stylus'
    grunt.loadNpmTasks 'grunt-contrib-coffee'
    grunt.loadNpmTasks 'grunt-contrib-watch'
    grunt.loadNpmTasks 'grunt-copy'
    grunt.loadNpmTasks 'grunt-contrib-clean'
    
    # Default task.
    grunt.registerTask 'default', ['clean:build','copy:build', 'jade:build', 'stylus:build', 'coffee:build']
    grunt.registerTask 'build', 'default'
    grunt.registerTask 'release', ['build', 'copy:release']
    grunt.registerTask 'serve', ['default', 'watch']
    grunt.registerTask 'watchapp', ['release', 'watch']

    
    
    
    