
export const RouteConfig = {
  prefix: '',
  hasTrailingSlash: false,
};

export const Route = {

  Config: RouteConfig,

  _routes: {}, // object of arrays, key = URI, value = array of callbacks
  _groupData: null,

  modifyURI(uri) {
    if (uri.lastIndexOf('/') === uri.length - 1 && !this.Config.hasTrailingSlash) {
      uri = uri.substr(0, uri.length - 1);
    }
    if (uri === '' && this.Config.prefix === '') {
      return '/';
    }
    return this.Config.prefix + uri;
  },

  getCurrentURI() {
    const pref = this.Config.prefix;
    let path = window.location.pathname;
    if (path.indexOf(pref) === 0) {
      path = path.substr(pref.length);
    }
    return path;
  },

  /**
   * Check if current URL is attached to route (1st param)
   * or if second optional param passed - checks against haystack_url not current URL
   * @param uri
   * @param haystack_url
   * @returns {boolean}
   */
  is(uri, haystack_url = window.location.pathname) {
    uri = this.modifyURI(uri);
    const original_segments = haystack_url.split('/');
    const route_segments = uri.split('/');
    const original_length = original_segments.length;
    const route_length = route_segments.length;
    if (original_length !== route_length) {
      return false;
    }
    for (let i = 1; i < original_length; i++) {
      if (route_segments[i].indexOf('{') === -1 && route_segments[i] !== original_segments[i]) {
        return false;
      }
    }
    return true;
  },

  /**
   * Get route named params, for example if URL is /page/{id}, then will return { id: id from url }
   * @param uri
   * @returns {Object}
   */
  getNamedParams(uri) {
    const original_segments = window.location.pathname.split('/');
    const route_segments = uri.split('/');
    const route_length = route_segments.length;
    const params = {};
    for (let i = 1; i < route_length; i++) {
      if (route_segments[i].indexOf('{') !== -1) {
        let name = route_segments[i].substr(1, route_segments[i].length-2);
        params[name] = original_segments[i];
      }
    }
    return params;
  },

  /**
   * Match URI with route, return defined route or false if coulnd't match URI with route
   * Example:
   *   Defined route: users/{id}
   *   URI: users/42
   *   Will return users/{id}
   * @param uri
   * @returns {*|boolean}
   */
  matchURIWithRoute(uri) {
    for (let route in this._routes) {
      if (this.is(route, uri)) {
        return route;
      }
    }
    return false;
  },

  isDefined(uri) {
    uri = this.modifyURI(uri);
    return this._routes[uri] !== undefined;
  },

  /**
   * Define new route
   *
   * @param {string} uri
   * @param {callback|Function} callback
   */
  on(uri, callback) {
    if (this._groupData !== null) {
      if (this._groupData.prefix !== undefined) {
        uri = this._groupData.prefix + uri;
      }
    }
    uri = this.modifyURI(uri);

    if (this._routes[uri] === undefined) {
      this._routes[uri] = [];
    }
    this._routes[uri].push(callback);
  },

  /**
   * Can be used to add prefix to all routes defined in the callback
   *
   * Route.group('/users', () => {
   *   Route.on('/edit/{id}', UsersEditPage);
   *   Route.on('/delete/{id}', UsersDeletePage);
   * });
   *
   * @param prefix
   * @param callback
   */
  group(prefix, callback) {
    this._groupData = {prefix};
    callback();
    this._groupData = null;
  },

  getAllRouteNames() {
    return Object.keys(this._routes);
  },

  getRouteCallbacks(uri) {
    if (this._routes[uri] !== undefined) {
      return this._routes[uri];
    }
    return false;
  },

  /**
   * Call closure/controller attached to route
   * @param uri
   * @returns {boolean}
   */
  run(uri) {
    uri = this.modifyURI(uri);
    //console.log('trying to call route', uri);
    const callbacks = this.getRouteCallbacks(uri);
    if (callbacks === false) {
      console.error('Route "' + uri + '" is not defined.');
      return false;
    }

    const namedParams = this.getNamedParams(uri);

    callbacks.forEach(cb => {
      cb(namedParams)
    });

    return true;
  },

  /**
   * Changes the browser URL without a refresh to a new URL and calls callbacks if that route is defined
   * @param uri
   * @returns {boolean}
   */
  to(uri) {
    uri = this.modifyURI(uri);
    history.pushState(null, null, uri);
    const route = Route.matchURIWithRoute(uri);
    const event = new CustomEvent('onRouteChange', {detail: uri});
    event.route = route;
    document.dispatchEvent(event);

    if (route) {
      const callbacks = this.getRouteCallbacks(route);
      if (callbacks !== false) {
        const namedParams = this.getNamedParams(uri);
        callbacks.forEach(cb => {
          cb(namedParams)
        });
      }
    }
  }

};

document.addEventListener('DOMContentLoaded', function() {
  const curURI = Route.getCurrentURI();
  const route = Route.matchURIWithRoute(curURI);
  if (route) {
    Route.run(route);
  }
}, false);
