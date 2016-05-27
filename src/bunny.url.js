
export const Url = {

    /**
     * Get the value of a URI query HTTP GET param (?param=val) from current URL or string
     *
     * Taken from http://gomakethings.com/how-to-get-the-value-of-a-querystring-with-native-javascript/
     *
     * @param  {String} get_param The field to get the value of
     * @param  {String} url   The URL to get the value from (optional)
     * @return {String|null}       The GET param value or null if not set or has no value
     */
    getQueryParam(get_param, url = window.location.href) {
        var reg = new RegExp( '[?&]' + get_param + '=([^&#]*)', 'i' );
        var string = reg.exec(url);
        return string ? string[1] : null;
    }

};
