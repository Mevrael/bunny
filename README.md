# Bunny JS v 0.2
Lightweight native JavaScript and ECMAScript 6 library (package of small stand-alone components like routing, templating, ajax and datatables) and next generation front-end framework.

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

&copy; Mev-Rael

GPL 3.0
