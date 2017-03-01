module.exports = function (grunt) {

    grunt.loadNpmTasks('hbjs');

    var options = {config: {src: ["config/*.js"]}};
    var configs = require('load-grunt-configs')(grunt, options);
    grunt.initConfig(configs);

    grunt.registerTask('default', ['auth-api', 'sample-api']);

    grunt.registerTask('auth-api', [
        'compile:auth-api'
    ]);

    grunt.registerTask('sample-api', [
        'compile:sample-api'
    ]);
};
