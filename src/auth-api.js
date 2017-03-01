define("authApi", ["rest.crudify", "http"], function (crudify, http) {
    var rest = {};
    var options = {
        baseUrl: 'https://mycompany.com/v1',
        withCredentials: false,
        useGETPOSTonly: false
    };

    // http.defaults.headers["Content-Type"] = "application/json;charset=UTF-8";
    http.defaults.headers["Content-Type"] = "text/plain;charset=UTF-8";

    var resources = [
        {methods: {
            login: {
                type: "POST",
                url: "/login"
            },
            logout: {
                type: "POST",
                url: "/logout"
            },
            getUser: {
                type: "GET",
                url: "/user"
            },
            getIP: {
                type: "GET",
                url: "//api.ipify.org?format=jsonp"
            }
        }}
    ];
    for (var i = 0; i < resources.length; i += 1) {
        crudify(rest, resources[i], options);
    }

    exports.services = rest;

    return rest;
});