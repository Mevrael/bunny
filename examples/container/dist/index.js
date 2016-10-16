'use strict';

var Container = {

    _bindings: {},

    bind: function bind(service_name, service_provider) {
        var allow_override = arguments.length > 2 && arguments[2] !== undefined ? arguments[2] : false;

        if (this.isBound(service_name)) {
            if (allow_override) {
                this._bindings[service_name] = service_provider;
            } else {
                console.error('Container error: Service "' + service_name + '" is already bound and override is not allowed. ' + 'Pass true as second argument to Container.bind() to allow override.');
                return false;
            }
        } else {
            this._bindings[service_name] = service_provider;
        }
    },

    get: function get(service_name) {
        if (this._bindings[service_name] !== undefined) {
            return this._bindings[service_name];
        } else {
            console.error('Container error: Service "' + service_name + '" is not bound. Use Container.bind() first.');
            return false;
        }
    },

    isBound: function isBound(service_name) {
        return this._bindings[service_name] !== undefined;
    },


    getRegisteredBindings: function getRegisteredBindings() {
        var a = [];
        for (var key in this._bindings) {
            a.push(key);
        }
        return a;
    }

};

var ColorProvider = {
    color: '#FBB'
};

Container.bind('color', ColorProvider);

var ComponentWithDependencies = {

    getColor: function getColor() {
        return Container.get('color').color;
    }

};

var BlueColorProvider = {
    color: '#BBF'
};

document.body.style.backgroundColor = ComponentWithDependencies.getColor();

setTimeout(function () {
    Container.bind('color', BlueColorProvider, true);
    document.body.style.backgroundColor = ComponentWithDependencies.getColor();
}, 2000);

// or we can define our dependencies in our custom application within config

// somewhere some service providers are defined
var LocaleServiceProvider = {};
var AppServiceProvider = {};
var RouteServiceProvider = {};

// somewhere we are defining and bootstrapping our custom app
var App = {};
App.Config = {};

// and finally somewhere we having our config for injecting our dependencies
App.Config.serviceProviders = {
    'app': AppServiceProvider,
    'app.locale': LocaleServiceProvider,
    'app.route': RouteServiceProvider
};

// so there is only final step for our custom app to do automatically
for (var service in App.Config.serviceProviders) {
    Container.bind(service, App.Config.serviceProviders[service]);
}

// let's check that we have all app bindings in container
console.log(Container.getRegisteredBindings());
