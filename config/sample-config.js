/* global module */
module.exports = function (grunt, options) {
    return {
        tasks: {
            compile: {
                "sample-api": {
                    wrap: 'sample', // this is your global namespace
                    filename: 'sample-api',
                    build: 'build/js',
                    scripts: {
                        embedRequire: false,
                        ignorePatterns: false,
                        src: [
                            'src/sample-api.js'
                        ],
                        import: [
                            'sampleApi'
                        ]
                    }
                }
            }
        }
    };
};