module.exports = function(grunt) {

    // Project configuration.
    grunt.initConfig({
      pkg: grunt.file.readJSON('package.json'),
      copy: {
        css: {
            src: ['**/*.css'],
            dest: 'lib',
            cwd: 'src/lib',
            expand: true,
        }
      }
    });
  
    // Load the plugin that provides the "uglify" task.
    grunt.loadNpmTasks('grunt-contrib-copy');
  
    // Default task(s).
    grunt.registerTask('default', ['copy']);
  
  };