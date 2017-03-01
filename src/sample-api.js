define("sampleApi", ["rest.crudify",  "http"], function (crudify, http) {
    var rest = {};
    var options = {
        baseUrl: 'https://mycompany.com/v1',
        withCredentials: false,
        useGETPOSTonly: false,
    };

    // http.defaults.headers["Content-Type"] = "application/json;charset=UTF-8";
    http.defaults.headers["Content-Type"] = "text/plain;charset=UTF-8";

    var resources = [
        {name: "accounts"},
        {name: "admins"},
        {name: "comments"},
        {name: "organizations"},
        {name: "projects"},
        {name: "userActivities"},
        {name: "users"},
        {name: "providers"},
        {name: "locks"},
        {name: 'player', 'uri': "orgs/:orgId/players"}
    ];
    for (var i = 0; i < resources.length; i += 1) {
        crudify(rest, resources[i], options);
    }

    exports.services = rest;

    return rest;
});