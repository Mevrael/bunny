# BunnyJS v 0.6.5
Lightweight native JavaScript and ECMAScript 6 library and next generation front-end framework. BunnyJS is package of small stand-alone components without dependencies:

1. Native lightweight javascript [Inversion of control](http://www.wikiwand.com/en/Inversion_of_control)
2. Native lightweight javascript Routing
3. Native lightweight javascript HTML5 validation
4. Native lightweight javascript Template engine
5. Native lightweight javascript Ajax
6. Native lightweight javascript DataTable
7. Native lightweight javascript Calendar
8. Native lightweight javascript DatePicker
9. Native lightweight javascript Autocomplete

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

[Autocomplete example](htmlpreview.github.io/?https://github.com/Mevrael/bunny/blob/master/examples/autocomplete/index.html)


Valdiator is only 150 lines and adds JS validation above native HTML5 valdiation attributes. For example,
```html
<input type="file" accept="image/*" ... required>
``` 
will be required and only images will be accepted. Error message is displayed after input.


DatePicker by default used as a fallback for browsers not supporting `<input type="date">` and initiated using `DatePicker.create(input_id)` .

DatePicker as any BunnyJS component is easily **extendable**. Basicly DatePicker is a calendar builder/framework. You can build your own calendar and datepicker very fast.

Default theme of DatePicker:

![bunnyjs-calendar-default](https://cloud.githubusercontent.com/assets/7879528/13051623/ef4e1a62-d402-11e5-8d9c-aae0fd5494c3.png)

&copy; Mev-Rael

GPL 3.0
