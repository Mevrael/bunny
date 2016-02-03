
export var Route = {

    _routes: [],
    _routeSegments: {},

    /**
     * Check if current URL is attached to route (1st param)
     * or if second optional param passed - checks against haystack_url not current URL
     * @param uri
     * @param haystack_url
     * @returns {boolean}
     */
    is: function(uri, haystack_url = window.location.pathname) {
        var original_segments = haystack_url.split('/');
        var route_segments = uri.split('/');
        var original_length = original_segments.length;
        var route_length = route_segments.length;
        if (original_length !== route_length) {
            return false;
        }
        for (var i = 1; i < original_length; i++) {
            if (route_segments[i].indexOf('{') === -1 && route_segments[i] !== original_segments[i]) {
                return false;
            }
        }
        return true;
    },

    /**
     * Get route params
     * @param uri
     * @returns {{}}
     */
    params: function(uri) {
        var original_segments = window.location.pathname.split('/');
        var route_segments = uri.split('/');
        var route_length = route_segments.length;
        var params = {};
        for (var i = 1; i < route_length; i++) {
            if (route_segments[i].indexOf('{') !== -1) {
                params[route_segments[i]] = original_segments[i];
            }
        }
        return params;
    },

    /**
     * Define new route
     * @param uri
     * @param callback
     * @returns {boolean}
     */
    get: function(uri, callback) {

        var route = this.defined(uri);
        if (route === false) {
            this._routes[uri] = callback;
        } else {
            console.error('Route "' + uri + '" already defined.');
            return false;
        }

    },

    /**
     * Check if route is defined. Returns route if found or false
     * @param uri
     * @returns {*}
     */
    defined: function(uri) {

        if (this._routes[uri] !== undefined) {
            return uri;
        }

        for (var route in this._routes) {
            if (this.is(route, uri)) {
                return route;
            }
        }

        return false;
    },

    /**
     * Call closure/controller attached to route
     * @param uri
     * @returns {boolean}
     */
    call: function(uri) {
        var route = this.defined(uri);
        if (route !== false) {
            this._routes[route](this.params(route))
        } else {
            console.error('Route "' + uri + '" is not defined.');
            return false;
        }
    },

    /**
     * Redirect to new route
     * @param uri
     * @returns {boolean}
     */
    to: function(uri) {
        if (this.defined(uri)) {
            history.pushState(null, null, uri);
            var event = new Event('onRouteChange');
            event.route = uri;
            document.dispatchEvent(event, uri);
        } else {
            console.error('Route "' + uri + '" is not defined.');
            return false;
        }
    }

};

document.addEventListener('DOMContentLoaded', function() {
    if (Route.defined(window.location.pathname)) {
        Route.call(window.location.pathname);
    }
}, false);

document.addEventListener('onRouteChange', function(e) {
    if (Route.defined(e.route)) {
        Route.call(e.route);
    }
}, false);
