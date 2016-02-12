# Bunny JS v 0.4.2
Lightweight native JavaScript and ECMAScript 6 library (package of small stand-alone components like [IoC](http://www.wikiwand.com/en/Inversion_of_control), routing, HTML5 validation, templating, ajax and datatables) and next generation front-end framework.

Designed in mind for best compatability with Laravel 5 and Bootstrap 4, however can be used anywhere.

Syntax is very simple and some API is identical with Laravel API.

Rollup.js with babel and npm plugins is recommended for transpiling and bundling.

Install via `npm install bunnyjs --save`

Example usage:

```javascript
import { Route } from 'bunnyjs/src/bunny.route';

Route.get('/', function() {
    console.log('You are on main page!');
});

// or create your own functions/closures/controllers, import them and pass to route
import { UsersController } from './Controllers/UsersController';
Route.get('/users', UsersController.index);
Route.get('/users/{id}', UsersController.showUser);
```

For documentation go to Wiki.

Currently only [Template documentation](https://github.com/Mevrael/bunny/wiki/Template) available.

There is also [example](https://github.com/Mevrael/bunny/blob/master/examples/container/index.js) for IOC Container.

Valdiator is only 150 lines and adds JS validation above native HTML5 valdiation attributes. For example,
```html
<input type="file" accept="image/*" ... required>
``` 
will be required and only images will be accepted. Error message is displayed after input.

&copy; Mev-Rael

GPL 3.0
