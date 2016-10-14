
import { Container } from './../../src/bunny.container';

import { ComponentWithDependencies } from './component_with_dependencies';

var BlueColorProvider = {
    color: '#BBF'
};

document.body.style.backgroundColor = ComponentWithDependencies.getColor();

setTimeout(function() {
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
