(function(exports, global) {
    global["sample"] = exports;
    //! node_modules/hbjs/src/utils/validators/isWindow.js
    define("isWindow", function() {
        var isWindow = function(obj) {
            return obj && obj.document && obj.location && obj.alert && obj.setInterval;
        };
        return isWindow;
    });
    //! src/sample-api.js
    define("sampleApi", [ "rest.crudify", "http" ], function(crudify, http) {
        var rest = {};
        var options = {
            baseUrl: "https://mycompany.com/v1",
            withCredentials: false,
            useGETPOSTonly: false
        };
        http.defaults.headers["Content-Type"] = "text/plain;charset=UTF-8";
        var resources = [ {
            name: "accounts"
        }, {
            name: "admins"
        }, {
            name: "comments"
        }, {
            name: "organizations"
        }, {
            name: "projects"
        }, {
            name: "userActivities"
        }, {
            name: "users"
        }, {
            name: "providers"
        }, {
            name: "locks"
        }, {
            name: "player",
            uri: "orgs/:orgId/players"
        } ];
        for (var i = 0; i < resources.length; i += 1) {
            crudify(rest, resources[i], options);
        }
        exports.services = rest;
        return rest;
    });
    //! node_modules/hbjs/src/utils/ajax/resource.js
    define("rest.resource", [ "isArray" ], function(isArray) {
        function clone(hash) {
            return JSON.parse(JSON.stringify(hash));
        }
        function parseUrl(url, hash) {
            for (var e in hash) {
                if (hash.hasOwnProperty(e)) {
                    var regExp = new RegExp(":(" + e + ")\\b", "g");
                    if (regExp.test(url)) {
                        url = url.replace(regExp, hash[e]);
                        delete hash[e];
                    }
                }
            }
            return url;
        }
        function hashToSearch(hash) {
            var search = "";
            for (var k in hash) {
                if (isArray(hash[k])) {
                    for (var i = 0; i < hash[k].length; i++) {
                        search += !search ? "?" : "&";
                        search += encodeURIComponent(k) + "=" + encodeURIComponent(hash[k][i]);
                    }
                } else {
                    search += !search ? "?" : "&";
                    search += encodeURIComponent(k) + "=" + encodeURIComponent(hash[k]);
                }
            }
            return search;
        }
        function Resource(name, id) {
            this.$$id = id;
            if (typeof name === "string") {
                this.$$name = name.replace(/^\/?(.*?)\/?$/, "$1");
                if (this.$$name[0] === "/") {
                    this.$$name = "/" + this.$$name;
                }
            }
            this.$$parent = null;
            this.$$params = null;
        }
        Resource.prototype.id = function(id) {
            if (id === undefined) {
                return this.$$id;
            }
            this.$$id = id;
            return this;
        };
        Resource.prototype.name = function(name) {
            if (name === undefined) {
                return this.$$name;
            }
            this.$$name = name;
            return this;
        };
        Resource.prototype.params = function(params) {
            this.$$params = this.$$params || {};
            if (arguments.length === 2) {
                if (typeof arguments[1] === "undefined") {
                    delete this.$$params[arguments[0]];
                } else {
                    this.$$params[arguments[0]] = arguments[1];
                }
            } else if (typeof params === "object") {
                for (var e in params) {
                    if (params.hasOwnProperty(e)) {
                        if (typeof params[e] === "undefined") {
                            delete this.$$params[e];
                        } else {
                            this.$$params = this.$$params || {};
                            this.$$params[e] = params[e];
                        }
                    }
                }
            }
            return this;
        };
        Resource.prototype.resource = function(name, id) {
            var resource = new Resource(name, id);
            resource.$$parent = this;
            return resource;
        };
        Resource.prototype.$$toUrl = function() {
            var url = "";
            if (this.$$parent) {
                url += this.$$parent.$$toUrl();
            }
            if (typeof this.$$baseUrl === "string") {
                url = this.$$baseUrl;
            } else {
                if (this.$$name) {
                    if (this.$$name.match(/^(http(s?)|\/\/)/i)) {
                        url = this.$$name;
                    } else {
                        url += "/" + this.$$name;
                    }
                }
                if (this.$$id !== undefined) {
                    url += "/" + this.$$id;
                }
            }
            return url;
        };
        Resource.prototype.toUrl = function() {
            var url = this.$$toUrl();
            if (this.$$params) {
                var params = clone(this.$$params);
                url = parseUrl(url, params);
                url += hashToSearch(params);
            }
            return url;
        };
        return function(name, id) {
            var resource;
            if (typeof name === "object") {
                resource = new Resource(name.name, name.id);
                resource.$$baseUrl = name.baseUrl;
            } else {
                resource = new Resource(name, id);
            }
            return resource;
        };
    });
    //! node_modules/hbjs/src/utils/validators/isArray.js
    define("isArray", function() {
        Array.prototype.__isArray = true;
        Object.defineProperty(Array.prototype, "__isArray", {
            enumerable: false,
            writable: true
        });
        var isArray = function(val) {
            return val ? !!val.__isArray : false;
        };
        return isArray;
    });
    //! node_modules/hbjs/src/utils/async/defer.js
    define("defer", [ "hb.debug" ], function(debug) {
        var defer = function(undef) {
            var nextTick, isFunc = function(f) {
                return typeof f === "function";
            }, isArray = function(a) {
                return Array.isArray ? Array.isArray(a) : a instanceof Array;
            }, isObjOrFunc = function(o) {
                return !!(o && (typeof o).match(/function|object/));
            }, isNotVal = function(v) {
                return v === false || v === undef || v === null;
            }, slice = function(a, offset) {
                return [].slice.call(a, offset);
            }, undefStr = "undefined", tErr = typeof TypeError === undefStr ? Error : TypeError;
            if (typeof process !== undefStr && process.nextTick) {
                nextTick = process.nextTick;
            } else if (typeof MessageChannel !== undefStr) {
                var ntickChannel = new MessageChannel(), queue = [];
                ntickChannel.port1.onmessage = function() {
                    queue.length && queue.shift()();
                };
                nextTick = function(cb) {
                    queue.push(cb);
                    ntickChannel.port2.postMessage(0);
                };
            } else {
                nextTick = function(cb) {
                    setTimeout(cb, 0);
                };
            }
            function rethrow(e) {
                nextTick(function() {
                    throw e;
                });
            }
            function promise_success(fulfilled) {
                return this.then(fulfilled, undef);
            }
            function promise_error(failed) {
                return this.then(undef, failed);
            }
            function promise_apply(fulfilled, failed) {
                return this.then(function(a) {
                    return isFunc(fulfilled) ? fulfilled.apply(null, isArray(a) ? a : [ a ]) : defer.onlyFuncs ? a : fulfilled;
                }, failed || undef);
            }
            function promise_ensure(cb) {
                function _cb() {
                    cb();
                }
                this.then(_cb, _cb);
                return this;
            }
            function promise_nodify(cb) {
                return this.then(function(a) {
                    return isFunc(cb) ? cb.apply(null, isArray(a) ? a.splice(0, 0, undefined) && a : [ undefined, a ]) : defer.onlyFuncs ? a : cb;
                }, function(e) {
                    return cb(e);
                });
            }
            function promise_rethrow(failed) {
                return this.then(undef, failed ? function(e) {
                    failed(e);
                    throw e;
                } : rethrow);
            }
            var defer = function(alwaysAsync) {
                var alwaysAsyncFn = (undef !== alwaysAsync ? alwaysAsync : defer.alwaysAsync) ? nextTick : function(fn) {
                    fn();
                }, status = 0, pendings = [], value, _promise = {
                    then: function(fulfilled, failed) {
                        var d = defer();
                        pendings.push([ function(value) {
                            try {
                                if (isNotVal(fulfilled)) {
                                    d.resolve(value);
                                } else {
                                    var returnVal = isFunc(fulfilled) ? fulfilled(value) : defer.onlyFuncs ? value : fulfilled;
                                    if (returnVal === undefined) {
                                        returnVal = value;
                                    }
                                    d.resolve(returnVal);
                                }
                            } catch (e) {
                                d.reject(e);
                                debug.warn(e.stack || e.backtrace || e.stacktrace);
                            }
                        }, function(err) {
                            if (isNotVal(failed) || !isFunc(failed) && defer.onlyFuncs) {
                                d.reject(err);
                            }
                            if (failed) {
                                try {
                                    d.resolve(isFunc(failed) ? failed(err) : failed);
                                } catch (e) {
                                    d.reject(e);
                                }
                            }
                        } ]);
                        status !== 0 && alwaysAsyncFn(execCallbacks);
                        return d.promise;
                    },
                    success: promise_success,
                    error: promise_error,
                    otherwise: promise_error,
                    apply: promise_apply,
                    spread: promise_apply,
                    ensure: promise_ensure,
                    nodify: promise_nodify,
                    rethrow: promise_rethrow,
                    isPending: function() {
                        return !!(status === 0);
                    },
                    getStatus: function() {
                        return status;
                    }
                };
                _promise.toSource = _promise.toString = _promise.valueOf = function() {
                    return value === undef ? this : value;
                };
                function execCallbacks() {
                    if (status === 0) {
                        return;
                    }
                    var cbs = pendings, i = 0, l = cbs.length, cbIndex = ~status ? 0 : 1, cb;
                    pendings = [];
                    for (;i < l; i++) {
                        (cb = cbs[i][cbIndex]) && cb(value);
                    }
                }
                function _resolve(val) {
                    var done = false;
                    function once(f) {
                        return function(x) {
                            if (done) {
                                return undefined;
                            } else {
                                done = true;
                                return f(x);
                            }
                        };
                    }
                    if (status) {
                        return this;
                    }
                    try {
                        var then = isObjOrFunc(val) && val.then;
                        if (isFunc(then)) {
                            if (val === _promise) {
                                throw new tErr("Promise can't resolve itself");
                            }
                            then.call(val, once(_resolve), once(_reject));
                            return this;
                        }
                    } catch (e) {
                        once(_reject)(e);
                        return this;
                    }
                    alwaysAsyncFn(function() {
                        value = val;
                        status = 1;
                        execCallbacks();
                    });
                    return this;
                }
                function _reject(Err) {
                    status || alwaysAsyncFn(function() {
                        try {
                            throw Err;
                        } catch (e) {
                            value = e;
                        }
                        status = -1;
                        execCallbacks();
                    });
                    return this;
                }
                return {
                    promise: _promise,
                    resolve: _resolve,
                    fulfill: _resolve,
                    reject: _reject
                };
            };
            defer.deferred = defer.defer = defer;
            defer.nextTick = nextTick;
            defer.alwaysAsync = true;
            defer.onlyFuncs = true;
            defer.resolved = defer.fulfilled = function(value) {
                return defer(true).resolve(value).promise;
            };
            defer.rejected = function(reason) {
                return defer(true).reject(reason).promise;
            };
            defer.wait = function(time) {
                var d = defer();
                setTimeout(d.resolve, time || 0);
                return d.promise;
            };
            defer.delay = function(fn, delay) {
                var d = defer();
                setTimeout(function() {
                    try {
                        d.resolve(fn.apply(null));
                    } catch (e) {
                        d.reject(e);
                    }
                }, delay || 0);
                return d.promise;
            };
            defer.promisify = function(promise) {
                if (promise && isFunc(promise.then)) {
                    return promise;
                }
                return defer.resolved(promise);
            };
            function multiPromiseResolver(callerArguments, returnPromises) {
                var promises = slice(callerArguments);
                if (promises.length === 1 && isArray(promises[0])) {
                    if (!promises[0].length) {
                        return defer.fulfilled([]);
                    }
                    promises = promises[0];
                }
                var args = [], d = defer(), c = promises.length;
                if (!c) {
                    d.resolve(args);
                } else {
                    var resolver = function(i) {
                        promises[i] = defer.promisify(promises[i]);
                        promises[i].then(function(v) {
                            if (!(i in args)) {
                                args[i] = returnPromises ? promises[i] : v;
                                --c || d.resolve(args);
                            }
                        }, function(e) {
                            if (!(i in args)) {
                                if (!returnPromises) {
                                    d.reject(e);
                                } else {
                                    args[i] = promises[i];
                                    --c || d.resolve(args);
                                }
                            }
                        });
                    };
                    for (var i = 0, l = c; i < l; i++) {
                        resolver(i);
                    }
                }
                return d.promise;
            }
            defer.all = function() {
                return multiPromiseResolver(arguments, false);
            };
            defer.resolveAll = function() {
                return multiPromiseResolver(arguments, true);
            };
            defer.nodeCapsule = function(subject, fn) {
                if (!fn) {
                    fn = subject;
                    subject = void 0;
                }
                return function() {
                    var d = defer(), args = slice(arguments);
                    args.push(function(err, res) {
                        err ? d.reject(err) : d.resolve(arguments.length > 2 ? slice(arguments, 1) : res);
                    });
                    try {
                        fn.apply(subject, args);
                    } catch (e) {
                        d.reject(e);
                    }
                    return d.promise;
                };
            };
            return defer;
        }();
        return defer;
    });
    //! node_modules/hbjs/src/hb/debug/debug.js
    define("hb.debug", function() {
        var errors = {
            E0: "",
            E1: "",
            E2: "",
            E3: "",
            E4: "",
            E5: "",
            E6a: "",
            E6b: "",
            E7: "",
            E8: "",
            E9: "",
            E10: "",
            E11: "",
            E12: ""
        };
        var fn = function() {};
        var statItem = {
            clear: fn,
            next: fn,
            inc: fn,
            dec: fn
        };
        var db = {
            log: fn,
            info: fn,
            warn: fn,
            error: fn,
            stat: function() {
                return statItem;
            },
            getStats: fn,
            flushStats: fn
        };
        for (var i in errors) {
            errors[i] = i;
        }
        return {
            ignoreErrors: true,
            log: fn,
            info: fn,
            warn: fn,
            register: function() {
                return db;
            },
            liveStats: fn,
            getStats: fn,
            logStats: fn,
            stats: fn,
            errors: errors
        };
    });
    //! node_modules/hbjs/src/utils/ajax/http.js
    define("http", [ "extend" ], function(extend) {
        var serialize = function(obj) {
            var str = [];
            for (var p in obj) if (obj.hasOwnProperty(p)) {
                str.push(encodeURIComponent(p) + "=" + encodeURIComponent(obj[p]));
            }
            return str.join("&");
        };
        var win = window, CORSxhr = function() {
            var xhr;
            if (win.XMLHttpRequest && "withCredentials" in new win.XMLHttpRequest()) {
                xhr = win.XMLHttpRequest;
            } else if (win.XDomainRequest) {
                xhr = win.XDomainRequest;
            }
            return xhr;
        }(), methods = [ "head", "get", "post", "put", "delete" ], i, methodsLength = methods.length, result = {};
        function Request(options) {
            this.init(options);
        }
        function getRequestResult(that) {
            var headers = parseResponseHeaders(this.getAllResponseHeaders());
            var response = this.responseText.trim();
            var start;
            var end;
            if (response) {
                start = response[0];
                end = response[response.length - 1];
            }
            if (response && (start === "{" && end === "}") || start === "[" && end === "]") {
                response = response ? JSON.parse(response.replace(/\/\*.*?\*\//g, "")) : response;
            }
            return {
                data: response,
                request: {
                    method: that.method,
                    url: that.url,
                    data: that.data,
                    headers: that.headers
                },
                headers: headers,
                status: this.status
            };
        }
        Request.prototype.init = function(options) {
            var that = this;
            that.xhr = new CORSxhr();
            that.method = options.method;
            that.url = options.url;
            that.success = options.success;
            that.error = options.error;
            that.data = options.data;
            that.headers = options.headers;
            that.timeout = options.timeout;
            that.ontimeout = options.ontimeout;
            that.async = options.async === undefined ? true : options.async;
            if (options.credentials === true) {
                that.xhr.withCredentials = true;
            }
            that.send();
            return that;
        };
        Request.prototype.send = function() {
            var that = this;
            if (that.method === "GET" && that.data) {
                var concat = that.url.indexOf("?") > -1 ? "&" : "?";
                that.url += concat + serialize(that.data);
            } else {
                that.data = JSON.stringify(that.data);
            }
            if (that.success !== undefined) {
                that.xhr.onload = function() {
                    var result = getRequestResult.call(this, that), self = this;
                    function onLoad() {
                        if (self.status >= 200 && self.status < 400) {
                            that.success.call(self, result);
                        } else if (that.error !== undefined) {
                            that.error.call(self, result);
                        }
                    }
                    if (this.onloadInterceptor) {
                        this.onloadInterceptor(onLoad, result);
                    } else {
                        onLoad();
                    }
                };
            }
            if (that.timeout) {
                that.xhr.timeout = that.timeout;
                that.xhr.ontimeout = function() {
                    var result = getRequestResult.call(this, that);
                    if (that.ontimeout) {
                        that.ontimeout.call(this, result);
                    } else if (that.error) {
                        that.error.call(this, result);
                    }
                };
            }
            if (that.error !== undefined) {
                that.xhr.error = function() {
                    var result = getRequestResult.call(this, that);
                    that.error.call(this, result);
                };
            }
            that.xhr.open(that.method, that.url, that.async);
            if (that.headers !== undefined) {
                that.setHeaders();
            }
            that.xhr.send(that.data);
            return that;
        };
        Request.prototype.setHeaders = function() {
            var that = this, headers = that.headers, key;
            for (key in headers) {
                if (headers.hasOwnProperty(key)) {
                    that.xhr.setRequestHeader(key, headers[key]);
                }
            }
            return that;
        };
        function parseResponseHeaders(str) {
            var list = str.split("\n");
            var headers = {};
            var parts;
            var i = 0, len = list.length;
            while (i < len) {
                parts = list[i].split(": ");
                if (parts[0] && parts[1]) {
                    parts[0] = parts[0].split("-").join("").split("");
                    parts[0][0] = parts[0][0].toLowerCase();
                    headers[parts[0].join("")] = parts[1];
                }
                i += 1;
            }
            return headers;
        }
        function addDefaults(options, defaults) {
            return extend(options, defaults);
        }
        function handleInterceptor(options) {
            return !!(result.intercept && result.intercept(options, Request));
        }
        for (i = 0; i < methodsLength; i += 1) {
            (function() {
                var method = methods[i];
                result[method] = function(url, success, error) {
                    var options = {};
                    if (url === undefined) {
                        throw new Error("CORS: url must be defined");
                    }
                    if (typeof url === "object") {
                        options = url;
                    } else {
                        if (typeof success === "function") {
                            options.success = success;
                        }
                        if (typeof error === "function") {
                            options.error = error;
                        }
                        options.url = url;
                    }
                    options.method = method.toUpperCase();
                    addDefaults(options, result.defaults);
                    if (handleInterceptor(options)) {
                        return;
                    }
                    return new Request(options).xhr;
                };
            })();
        }
        result.intercept = null;
        result.defaults = {
            headers: {}
        };
        return result;
    });
    //! node_modules/hbjs/src/utils/data/extend.js
    define("extend", [ "isWindow", "apply", "toArray", "isArray", "isDate", "isRegExp" ], function(isWindow, apply, toArray, isArray, isDate, isRegExp) {
        var extend = function(target, source) {
            if (isWindow(source)) {
                throw Error("Can't extend! Making copies of Window instances is not supported.");
            }
            if (source === target) {
                return target;
            }
            var args = toArray(arguments), i = 1, len = args.length, item, j;
            var options = this || {}, copy;
            if (!target && source && typeof source === "object") {
                target = {};
            }
            while (i < len) {
                item = args[i];
                for (j in item) {
                    if (item.hasOwnProperty(j)) {
                        if (isDate(item[j])) {
                            target[j] = new Date(item[j].getTime());
                        } else if (isRegExp(item[j])) {
                            target[j] = new RegExp(item[j]);
                        } else if (j === "length" && target instanceof Array) {} else if (target[j] && typeof target[j] === "object" && !item[j] instanceof Array) {
                            target[j] = apply(extend, options, [ target[j], item[j] ]);
                        } else if (isArray(item[j])) {
                            copy = options && options.concat ? (target[j] || []).concat(item[j]) : item[j];
                            if (options && options.arrayAsObject) {
                                if (!target[j]) {
                                    target[j] = {
                                        length: copy.length
                                    };
                                }
                                if (target[j] instanceof Array) {
                                    target[j] = apply(extend, options, [ {}, target[j] ]);
                                }
                            } else {
                                target[j] = target[j] || [];
                            }
                            if (copy.length) {
                                target[j] = apply(extend, options, [ target[j], copy ]);
                            }
                        } else if (item[j] && typeof item[j] === "object") {
                            if (options.objectAsArray && typeof item[j].length === "number") {
                                if (!(target[j] instanceof Array)) {
                                    target[j] = apply(extend, options, [ [], target[j] ]);
                                }
                            }
                            target[j] = apply(extend, options, [ target[j] || {}, item[j] ]);
                        } else if (options.override !== false || target[j] === undefined) {
                            target[j] = item[j];
                        }
                    }
                }
                i += 1;
            }
            return target;
        };
        return extend;
    });
    //! node_modules/hbjs/src/utils/ajax/crudify.js
    define("rest.crudify", [ "rest.resource", "defer", "http", "inflection", "extend" ], function(resource, defer, http, inflection, extend) {
        var $methods = {};
        var onSuccess, onError;
        var capitalize = function(str) {
            return str.charAt(0).toUpperCase() + str.slice(1);
        };
        var trimSlashes = function(str) {
            return str.replace(/^\/?(.*?)\/?$/, "$1");
        };
        var singularizeCapitalize = function(str) {
            str = inflection.singularize(str) || str;
            str = capitalize(str);
            return str;
        };
        var requireParam = function(key, value) {
            if (typeof value === "undefined") {
                throw new Error("Expected param " + key + " to be defined: " + JSON.stringify(value));
            }
        };
        var requireId = function(value) {
            requireParam("id", value);
            var type = typeof value;
            if (!(type === "number" || type === "string")) {
                throw new Error('Expected param "id" to be "number" or "string": ' + JSON.stringify(value));
            }
        };
        var requireData = function(value) {
            requireParam("data", value);
            var type = typeof value;
            if (type !== "object") {
                throw new Error('Expected param "data" to be "object": ' + JSON.stringify(value));
            }
        };
        $methods.all = function(name, options) {
            return function(params) {
                params = extend({}, params, http.defaults.params);
                var deferred = defer();
                var payload = {};
                payload.credentials = !!options.withCredentials;
                payload.url = resource({
                    baseUrl: options.baseUrl
                }).resource(name).params(params).toUrl();
                payload.success = deferred.resolve;
                payload.error = deferred.reject;
                http.get(payload);
                var promise = deferred.promise;
                promise.success(onSuccess);
                promise.error(onError);
                return promise;
            };
        };
        $methods.create = function(name, options) {
            return function(data, params) {
                requireData(data);
                params = extend({}, params, http.defaults.params);
                var deferred = defer();
                var payload = {};
                payload.credentials = !!options.withCredentials;
                payload.url = resource({
                    baseUrl: options.baseUrl
                }).resource(name).params(params).toUrl();
                payload.data = data;
                payload.success = deferred.resolve;
                payload.error = deferred.reject;
                http.post(payload);
                var promise = deferred.promise;
                promise.success(onSuccess);
                promise.error(onError);
                return promise;
            };
        };
        $methods.get = function(name, options) {
            return function(id, params) {
                requireId(id);
                params = extend({}, params, http.defaults.params);
                var deferred = defer();
                var payload = {};
                payload.credentials = !!options.withCredentials;
                payload.url = resource({
                    baseUrl: options.baseUrl
                }).resource(options.uri || name, id).params(params).toUrl();
                payload.success = deferred.resolve;
                payload.error = deferred.reject;
                http.get(payload);
                var promise = deferred.promise;
                promise.success(onSuccess);
                promise.error(onError);
                return promise;
            };
        };
        $methods.update = function(name, options) {
            var path = "";
            if (options.useGETPOSTonly === false) {
                path = "update";
            }
            return function(id, data, params) {
                requireId(id);
                requireData(data);
                params = extend({}, params, http.defaults.params);
                var deferred = defer();
                var payload = {};
                payload.credentials = !!options.withCredentials;
                payload.url = resource({
                    baseUrl: options.baseUrl
                }).resource(name, id).resource(path).params(params).toUrl();
                payload.data = data;
                payload.success = deferred.resolve;
                payload.error = deferred.reject;
                if (options.useGETPOSTonly === false) {
                    http.post(payload);
                } else {
                    http.put(payload);
                }
                var promise = deferred.promise;
                promise.success(onSuccess);
                promise.error(onError);
                return promise;
            };
        };
        $methods.delete = function(name, options) {
            var path = "";
            if (options.useGETPOSTonly === false) {
                path = "delete";
            }
            return function(id, params) {
                requireId(id);
                params = extend({}, params, http.defaults.params);
                var deferred = defer();
                var payload = {};
                payload.credentials = !!options.withCredentials;
                payload.url = resource({
                    baseUrl: options.baseUrl
                }).resource(name, id).resource(path).params(params).toUrl();
                payload.success = deferred.resolve;
                payload.error = deferred.reject;
                if (options.useGETPOSTonly === false) {
                    http.post(payload);
                } else {
                    http.delete(payload);
                }
                var promise = deferred.promise;
                promise.success(onSuccess);
                promise.error(onError);
                return promise;
            };
        };
        $methods.count = function(name, options) {
            return function(params) {
                params = extend({}, params, http.defaults.params);
                var deferred = defer();
                var payload = {};
                payload.credentials = !!options.withCredentials;
                payload.url = resource({
                    baseUrl: options.baseUrl
                }).resource(name).resource("count").params(params).toUrl();
                payload.success = deferred.resolve;
                payload.error = deferred.reject;
                http.get(payload);
                var promise = deferred.promise;
                promise.success(onSuccess);
                promise.error(onError);
                return promise;
            };
        };
        $methods.exists = function(name, options) {
            return function(params) {
                params = extend({}, params, http.defaults.params);
                var deferred = defer();
                var payload = {};
                payload.credentials = !!options.withCredentials;
                payload.url = resource({
                    baseUrl: options.baseUrl
                }).resource(name).resource("exists").params(params).toUrl();
                payload.success = deferred.resolve;
                payload.error = deferred.reject;
                http.get(payload);
                var promise = deferred.promise;
                promise.success(onSuccess);
                promise.error(onError);
                return promise;
            };
        };
        return function(target, resource, options) {
            options = extend({}, resource, options);
            onSuccess = function(response) {
                target.fire("success", response);
            };
            onError = function(response) {
                target.fire("error", response);
            };
            var methods = resource.methods;
            if (!methods) {
                methods = "all create get update delete exists count";
            }
            if (typeof methods === "string") {
                methods = methods.split(" ");
            }
            var name = resource.name;
            var i;
            var methodName;
            if (name) {
                name = trimSlashes(name);
                var baseUrl = trimSlashes(resource.baseUrl || "");
                var resourceName = trimSlashes(resource.url || "") || name;
                var url = baseUrl + "/" + resourceName;
                for (i = 0; i < methods.length; i++) {
                    methodName = methods[i];
                    if ($methods.hasOwnProperty(methodName)) {
                        if (resource.syntax === "camel") {
                            switch (methodName) {
                              case "all":
                                if (resource.methods && resource.methods.hasOwnProperty(methodName)) {
                                    target[resource.methods[methodName].name] = $methods[methodName](url, options);
                                } else {
                                    target["get" + capitalize(name)] = $methods[methodName](url, options);
                                }
                                break;

                              case "create":
                              case "update":
                              case "get":
                              case "delete":
                                if (resource.methods && resource.methods.hasOwnProperty(methodName)) {
                                    target[resource.methods[methodName].name] = $methods[methodName](url, options);
                                } else {
                                    target[methodName + singularizeCapitalize(name)] = $methods[methodName](url, options);
                                }
                                break;

                              case "count":
                                if (resource.methods && resource.methods.hasOwnProperty(methodName)) {
                                    target[resource.methods[methodName].name] = $methods[methodName](name);
                                } else {
                                    target["get" + singularizeCapitalize(name) + "Count"] = $methods.get(url, options);
                                }
                                break;

                              case "exists":
                                if (resource.methods && resource.methods.hasOwnProperty(methodName)) {
                                    target[resource.methods[methodName].name] = $methods[methodName](name);
                                } else {
                                    target["get" + singularizeCapitalize(name) + "Exists"] = $methods.get(url, options);
                                }
                                break;

                              default:
                                target[methodName + capitalize(name)] = $methods[methodName](url, options);
                            }
                        } else {
                            target[name] = target[name] || {};
                            target[name][methodName] = $methods[methodName](url, options);
                        }
                    }
                }
            } else {
                var methodOptions, path;
                methods = resource.methods;
                for (methodName in methods) {
                    if (methods.hasOwnProperty(methodName)) {
                        methodOptions = methods[methodName];
                        path = methodOptions.url || methodName;
                        switch (methodOptions.type.toUpperCase()) {
                          case "POST":
                            target[methodName] = $methods.create(path, options);
                            break;

                          case "GET":
                            target[methodName] = $methods.all(path, options);
                            break;

                          case "PUT":
                            target[methodName] = $methods.update(path, options);
                            break;

                          case "DELETE":
                            target[methodName] = $methods.delete(path, options);
                            break;
                        }
                    }
                }
            }
        };
    });
    //! node_modules/hbjs/src/utils/data/apply.js
    define("apply", [ "isFunction" ], function(isFunction) {
        return function(func, scope, args) {
            if (!isFunction(func)) {
                return;
            }
            args = args || [];
            switch (args.length) {
              case 0:
                return func.call(scope);

              case 1:
                return func.call(scope, args[0]);

              case 2:
                return func.call(scope, args[0], args[1]);

              case 3:
                return func.call(scope, args[0], args[1], args[2]);

              case 4:
                return func.call(scope, args[0], args[1], args[2], args[3]);

              case 5:
                return func.call(scope, args[0], args[1], args[2], args[3], args[4]);

              case 6:
                return func.call(scope, args[0], args[1], args[2], args[3], args[4], args[5]);
            }
            return func.apply(scope, args);
        };
    });
    //! node_modules/hbjs/src/utils/validators/isFunction.js
    define("isFunction", function() {
        var isFunction = function(val) {
            return typeof val === "function";
        };
        return isFunction;
    });
    //! node_modules/hbjs/src/utils/formatters/toArray.js
    define("toArray", [ "isArguments", "isArray", "isUndefined" ], function(isArguments, isArray, isUndefined) {
        var toArray = function(value) {
            if (isArguments(value)) {
                return Array.prototype.slice.call(value, 0) || [];
            }
            try {
                if (isArray(value)) {
                    return value;
                }
                if (!isUndefined(value)) {
                    return [].concat(value);
                }
            } catch (e) {}
            return [];
        };
        return toArray;
    });
    //! node_modules/hbjs/src/utils/validators/isArguments.js
    define("isArguments", function() {
        var toString = function() {
            var value = [];
            for (var e in this) {
                if (this.hasOwnProperty(e)) {
                    value.push("" + e);
                }
            }
            return "[" + value.join(", ") + "]";
        };
        var isArguments = function(value) {
            var str = String(value);
            var isArguments = str === "[object Arguments]";
            if (!isArguments) {
                isArguments = str !== "[object Array]" && value !== null && typeof value === "object" && typeof value.length === "number" && value.length >= 0 && (!value.callee || toString.call(value.callee) === "[object Function]");
            }
            return isArguments;
        };
        return isArguments;
    });
    //! node_modules/hbjs/src/utils/validators/isUndefined.js
    define("isUndefined", function() {
        var isUndefined = function(val) {
            return typeof val === "undefined";
        };
        return isUndefined;
    });
    //! node_modules/hbjs/src/utils/validators/isDate.js
    define("isDate", function() {
        var isDate = function(val) {
            return val instanceof Date;
        };
        return isDate;
    });
    //! node_modules/hbjs/src/utils/validators/isRegExp.js
    define("isRegExp", function() {
        var isRegExp = function(value) {
            return Object.prototype.toString.call(value) === "[object RegExp]";
        };
        return isRegExp;
    });
    //! node_modules/hbjs/src/utils/formatters/inflection.js
    define("inflection", function() {
        var inflections = {
            plurals: [],
            singulars: [],
            uncountables: [],
            humans: []
        };
        var PLURALS = inflections.plurals, SINGULARS = inflections.singulars, UNCOUNTABLES = inflections.uncountables, HUMANS = inflections.humans;
        var plural = function(rule, replacement) {
            inflections.plurals.unshift([ rule, replacement ]);
        };
        var singular = function(rule, replacement) {
            inflections.singulars.unshift([ rule, replacement ]);
        };
        var uncountable = function(word) {
            inflections.uncountables.unshift(word);
        };
        var irregular = function(s, p) {
            if (s.substr(0, 1).toUpperCase() === p.substr(0, 1).toUpperCase()) {
                plural(new RegExp("(" + s.substr(0, 1) + ")" + s.substr(1) + "$", "i"), "$1" + p.substr(1));
                plural(new RegExp("(" + p.substr(0, 1) + ")" + p.substr(1) + "$", "i"), "$1" + p.substr(1));
                singular(new RegExp("(" + p.substr(0, 1) + ")" + p.substr(1) + "$", "i"), "$1" + s.substr(1));
            } else {
                plural(new RegExp(s.substr(0, 1).toUpperCase() + s.substr(1) + "$"), p.substr(0, 1).toUpperCase() + p.substr(1));
                plural(new RegExp(s.substr(0, 1).toLowerCase() + s.substr(1) + "$"), p.substr(0, 1).toLowerCase() + p.substr(1));
                plural(new RegExp(p.substr(0, 1).toUpperCase() + p.substr(1) + "$"), p.substr(0, 1).toUpperCase() + p.substr(1));
                plural(new RegExp(p.substr(0, 1).toLowerCase() + p.substr(1) + "$"), p.substr(0, 1).toLowerCase() + p.substr(1));
                singular(new RegExp(p.substr(0, 1).toUpperCase() + p.substr(1) + "$"), s.substr(0, 1).toUpperCase() + s.substr(1));
                singular(new RegExp(p.substr(0, 1).toLowerCase() + p.substr(1) + "$"), s.substr(0, 1).toLowerCase() + s.substr(1));
            }
        };
        var human = function(rule, replacement) {
            inflections.humans.push([ rule, replacement ]);
        };
        plural(/$/, "s");
        plural(/s$/i, "s");
        plural(/(ax|test)is$/i, "$1es");
        plural(/(octop|vir)us$/i, "$1i");
        plural(/(alias|status)$/i, "$1es");
        plural(/(bu)s$/i, "$1ses");
        plural(/(buffal|tomat)o$/i, "$1oes");
        plural(/([ti])um$/i, "$1a");
        plural(/sis$/i, "ses");
        plural(/(?:([^f])fe|([lr])f)$/i, "$1$2ves");
        plural(/(hive)$/i, "$1s");
        plural(/([^aeiouy]|qu)y$/i, "$1ies");
        plural(/(x|ch|ss|sh)$/i, "$1es");
        plural(/(matr|vert|ind)(?:ix|ex)$/i, "$1ices");
        plural(/([m|l])ouse$/i, "$1ice");
        plural(/^(ox)$/i, "$1en");
        plural(/(quiz)$/i, "$1zes");
        plural(/([l]oa)f$/i, "$1ves");
        singular(/s$/i, "");
        singular(/(n)ews$/i, "$1ews");
        singular(/([ti])a$/i, "$1um");
        singular(/((a)naly|(b)a|(d)iagno|(p)arenthe|(p)rogno|(s)ynop|(t)he)ses$/i, "$1$2sis");
        singular(/(^analy)ses$/i, "$1sis");
        singular(/([^f])ves$/i, "$1fe");
        singular(/(hive)s$/i, "$1");
        singular(/(tive)s$/i, "$1");
        singular(/([lr])ves$/i, "$1f");
        singular(/([^aeiouy]|qu)ies$/i, "$1y");
        singular(/(s)eries$/i, "$1eries");
        singular(/(m)ovies$/i, "$1ovie");
        singular(/(x|ch|ss|sh)es$/i, "$1");
        singular(/([m|l])ice$/i, "$1ouse");
        singular(/(bus)es$/i, "$1");
        singular(/(o)es$/i, "$1");
        singular(/(shoe)s$/i, "$1");
        singular(/(cris|ax|test)es$/i, "$1is");
        singular(/(octop|vir)i$/i, "$1us");
        singular(/(alias|status)es$/i, "$1");
        singular(/^(ox)en/i, "$1");
        singular(/(vert|ind)ices$/i, "$1ex");
        singular(/(matr)ices$/i, "$1ix");
        singular(/(quiz)zes$/i, "$1");
        singular(/(database)s$/i, "$1");
        irregular("person", "people");
        irregular("man", "men");
        irregular("child", "children");
        irregular("sex", "sexes");
        irregular("move", "moves");
        irregular("cow", "kine");
        uncountable("equipment");
        uncountable("information");
        uncountable("rice");
        uncountable("money");
        uncountable("species");
        uncountable("series");
        uncountable("fish");
        uncountable("sheep");
        uncountable("jeans");
        var pluralize = function(word) {
            var wlc = word.toLowerCase();
            var i;
            for (i = 0; i < UNCOUNTABLES.length; i++) {
                var uncountable = UNCOUNTABLES[i];
                if (wlc === uncountable) {
                    return word;
                }
            }
            for (i = 0; i < PLURALS.length; i++) {
                var rule = PLURALS[i][0], replacement = PLURALS[i][1];
                if (rule.test(word)) {
                    return word.replace(rule, replacement);
                }
            }
        };
        var singularize = function(word) {
            var wlc = word.toLowerCase();
            var i;
            for (i = 0; i < UNCOUNTABLES.length; i++) {
                var uncountable = UNCOUNTABLES[i];
                if (wlc === uncountable) {
                    return word;
                }
            }
            for (i = 0; i < SINGULARS.length; i++) {
                var rule = SINGULARS[i][0], replacement = SINGULARS[i][1];
                if (rule.test(word)) {
                    return word.replace(rule, replacement);
                }
            }
        };
        var humanize = function(word) {
            for (var i = 0; i < HUMANS.length; i++) {
                var rule = HUMANS[i][0], replacement = HUMANS[i][1];
                if (rule.test(word)) {
                    word = word.replace(rule, replacement);
                }
            }
            return camelToTerms(word, " ").toLowerCase();
        };
        var camelToTerms = function(word, delim) {
            delim = delim || " ";
            var replacement = "$1" + delim + "$2";
            return word.replace(/([A-Z]+)([A-Z][a-z])/g, replacement).replace(/([a-z\d])([A-Z])/g, replacement);
        };
        var underscore = function(word) {
            return camelToTerms(word, "_").toLowerCase();
        };
        var dasherize = function(word) {
            return camelToTerms(word, "-").toLowerCase();
        };
        return {
            pluralize: pluralize,
            singularize: singularize,
            humanize: humanize,
            camelToTerms: camelToTerms,
            underscore: underscore,
            dasherize: dasherize
        };
    });
})(this["sample"] || {}, function() {
    return this;
}());