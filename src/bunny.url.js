
export var Url = {

    /**
     * Get the value of a URI query param (?param=val) from current URL or string
     * @param  {String} field The field to get the value of
     * @param  {String} url   The URL to get the value from (optional)
     * @return {String}       The field value
     * Taken from http://gomakethings.com/how-to-get-the-value-of-a-querystring-with-native-javascript/
     */
    getQueryParam: function(field, url) {
        var href = url ? url : window.location.href;
        var reg = new RegExp( '[?&]' + field + '=([^&#]*)', 'i' );
        var string = reg.exec(href);
        return string ? string[1] : null;
    }

};
