'use strict'

export var Container = {

    _bindings: {},

    bind: function(service_name, service_provider, allow_override = false) {
        if (this.isBound(service_name)) {
            if (allow_override) {
                this._bindings[service_name] = service_provider;
            } else {
                console.error('Container error: Service "' + service_name + '" is already bound and override is not allowed. ' +
                    'Pass true as second argument to Container.bind() to allow override.');
                return false;
            }
        } else {
            this._bindings[service_name] = service_provider;
        }
    },

    get: function(service_name) {
        if (this._bindings[service_name] !== undefined) {
            return this._bindings[service_name];
        } else {
            console.error('Container error: Service "' + service_name + '" is not bound. Use Container.bind() first.');
            return false;
        }
    },

    isBound(service_name) {
        return this._bindings[service_name] !== undefined;
    },

    getRegisteredBindings: function() {
        var a = [];
        for (var key in this._bindings) {
            a.push(key);
        }
        return a;
    }

};
