
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
        /*var reg = new RegExp( '[?&]' + get_param + '=([^&#]*)', 'i' );
         var string = reg.exec(url);
         return string ? string[1] : null;*/
        return this.getParams(url)[get_param];
    },

    getQueryString(url = window.location.href) {
        return decodeURI(url.slice(window.location.href.indexOf('?') + 1));
    },

    getParams(url = window.location.href) {
        const params = {};
        var hashes = this.getQueryString(url).split('&');
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
    }

};
