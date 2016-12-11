
/**
 * @url       https://bunnyjs.com
 * @package   BunnyJS
 * @component BunnyURL
 * @author    Mev-Rael (mevrael@gmail.com)
 */
export const BunnyURL = {

    /**
     * Get the value of a URI query HTTP GET param (?param=val) from current URL or string
     * If param has [] in name, returns Array
     * If param not set returns undefined
     * If param exists but has no value returns empty string ''
     *
     * @param  {String}                  get_param  The field to get the value of
     * @param  {String?}                 url        The URL to get the value from, default current URL
     * @return {String|Array|undefined}             The GET param value or undefined
     */
    getParam(get_param, url = window.location.href) {
        const params = this.getParams(url);
        if (params === undefined) {
            return undefined;
        }
        return params[get_param];
    },



    /**
     * Get URL query string (after ?) or false if there are no query string
     * @param {String?} url
     * @returns {String|undefined}
     */
    getQueryString(url = window.location.href) {
        const pos = url.indexOf('?');
        let hashPos = url.indexOf('#');
        if (hashPos > -1) {
            return pos > -1 ? decodeURI(url.slice(pos + 1, hashPos)) : undefined;
        }
        return pos > -1 ? decodeURI(url.slice(pos + 1)) : undefined;
    },



    getHash(url = window.location.href) {
        const pos = url.indexOf('#');
        return pos > -1 ? decodeURI(url.slice(pos + 1)) : undefined;
    },



    getURLWithoutQueryString(url = window.location.href) {
        const pos = url.indexOf('?');
        return pos > -1 ? decodeURI(url.slice(0, pos)) : url;
    },



    /**
     * Get URL params as object (name => value) or undefined if there are no query string
     * @param {String?} url
     * @returns {Object|undefined}
     */
    getParams(url = window.location.href) {
        const query = this.getQueryString(url);
        if (query === undefined) {
            return undefined;
        }
        const params = {};
        const hashes = query.split('&');
        for(let i = 0; i < hashes.length; i++) {
            let hash = hashes[i].split('=');
            if (hash[0].indexOf('[]') !== -1) {
                // is array
                if (params[hash[0]] === undefined) {
                    params[hash[0]] = [];
                }
                params[hash[0]].push(hash[1]);
            } else {
                params[hash[0]] = hash[1];
            }
        }
        return params;
    },


    /**
     * Check if GET param is in URL even if it has no value
     *
     * @param {String} param
     * @param {String?} url
     * @returns {Boolean}
     */
    hasParam(param, url = window.location.href) {
        return this.getParam(param, url) !== undefined;
    },

    setParam(param, value, url = window.location.href) {
        let params = this.getParams(url);
        if (params === undefined) {
          params = {};
        }
        params[param] = value;
        return this.replaceParams(params, url);
    },

    generateQueryString(params) {
        let i = 0;
        let queryStr = '';
        for(let k in params) {
            queryStr += i === 0 ? '?' : '&';
            queryStr += k + '=' + params[k];
            i++;
        }
        return queryStr;
    },

    replaceParams(params, url = window.location.href) {
        let newUrl = this.getURLWithoutQueryString(url) + this.generateQueryString(params);
        const hash = this.getHash(url);
        if (hash !== undefined) {
            newUrl += '#' + hash;
        }
        return newUrl;
    },

    setParams(params, url = window.location.href) {
        const urlParams = this.getParams(url);
        for (let k in params) {
            urlParams[k] = params[k];
        }
        return this.replaceParams(urlParams, url);
    },

    removeParam(param, url = window.location.href) {
        const params = this.getParams(url);
        if (params[param] !== undefined) {
            delete params[param];
        }
        return this.replaceParams(params, url);
    }

};
