/* global module */
module.exports = function (grunt, options) {
    return {
        tasks: {
            compile: {
                "auth-api": {
                    wrap: 'auth', // this is your global namespace
                    filename: 'auth-api',
                    build: 'build/js',
                    scripts: {
                        embedRequire: false,
                        ignorePatterns: false,
                        src: [
                            'src/auth-api.js'
                        ],
                        import: [
                            'authApi'
                        ]
                    }
                }
            }
        }
    };
};