'use strict'

/**
 * Base object Ajax
 */
export var Ajax = {

    create: function(method, urn, data, success, error, do_send) {

        if (do_send === undefined) {
            do_send = false;
        }

        var t = Object.create(this);
        t.method = method;
        t.urn = urn;
        t.data = data;
        t.request = new XMLHttpRequest();
        t.onSuccess = success;
        t.onError = error;
        t.request.onreadystatechange = function() {
            if (t.request.readyState === XMLHttpRequest.DONE) {
                if (t.request.status === 200) {
                    t.onSuccess(t.request.responseText);
                } else {
                    t.onError(t.request.responseText);
                }
            }
        };

        if (do_send) {
            t.open();
            t.send();
        }

        return t;
    },

    send: function() {
        var str_data = '';
        for(var name in this.data) {
            str_data = str_data + name + '=' + encodeURIComponent(this.data[name]) + '&';
        }
        this.request.send(str_data);
    },

    open: function() {
        this.request.open(this.method, this.urn);
    },

    sendForm: function(form, success, error) {
        var data = {};
        form.querySelectorAll('[name]').forEach(function(input){
            data[input.getAttribute('name')] = input.value;
        });
        var t = this.create('POST', form.getAttribute('action'), data, success, error);
        t.open();
        t.request.setRequestHeader('Content-Type', 'application/x-www-form-urlencoded');
        t.send();
    },

    get: function(urn, success, error) {
        var t = this.create('GET', urn, [], success, error);
        t.open();
        t.request.setRequestHeader('X-Requested-With', 'XMLHttpRequest');
        t.send();
    }

};
