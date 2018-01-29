
<p align="center">
    <img src="https://bunnyjs.com/img/bunnyjs-logo.png" alt="BunnyJS Logo">
</p>

# BunnyJS v 0.14.41 (Beta)

[Website](https://bunnyjs.com) * [![NPM downloads/month](https://img.shields.io/npm/dm/bunnyjs.svg?style=flat-square)](https://www.npmjs.org/package/bunnyjs) [![NPM version](https://img.shields.io/npm/v/bunnyjs.svg?style=flat-square)](https://www.npmjs.org/package/bunnyjs) * [Gitter chat](https://gitter.im/bunny-js/Lobby) * [Contribute to Docs](https://github.com/bunnyjs/docs) * [Assets Builder](https://github.com/Mevrael/assets-builder)

## ES6 browser framework

### "Powerful like React, simple like jQuery"




**BunnyJS** is a modern **Vanilla JS** and ES6 library and next-generation front-end framework, package of small stand-alone components without dependencies.

* No dependencies - can be used in any project anywhere anytime
* 0 learning curve - you can start right now, just plain JavaScript with simple architecture easy to maintain and extend
* Designed in mind to build modern, complicated, real world business apps
* Faster, simpler, enjoyable than any frontend framework
* Large set of ready components, custom UI elements and utils
* LTS

For help & ideas - [DM me on Twitter](https://twitter.com/Mevrael)

## Browser support

IE9+, last 2 versions of Chrome, Firefox, Safari, Android 4.4+, iOS 9+

## Installation

1. Install via `npm install bunnyjs --save`
2. [Rollup.js](http://rollupjs.org) with babel and npm plugins is recommended for transpiling and bundling.
3. Or you can just use [Assets Builder](https://github.com/Mevrael/assets-builder) which will automatically build your future JS and CSS with 1 command.
4. Or just include into HTML already transpiled and minified JS from `dists` folder or any [CDN](https://unpkg.com/bunnyjs/dist).
5. Probably some polyfills for IE might be required depending on Component.

```html
<script src="https://unpkg.com/bunnyjs/dist/..."></script>
```

## Extending BunnyJS and Vanilla JS objects

Recommended way to use any of BunnyJS component is - *"do not change the code you do not own"*. That means do not modify native prototypes or any 3rd party code.

1. Create some `base` or `core` folder in your app,
2. Extend BunnyJS objects with `Object.assign()` or `Object.create`
3. Now everywhere in your project import custom file and not directly BunnyJS's file.

```javascript

import { Component as BunnyComponent } from 'bunnyjs/src/...';

export const Component = Object.assign({}, BunnyComponent, {

    init(arg) {
        // do whatever you want
        console.log(arg);
        
        // call default (parent)
        return BunnyComponent.init(arg);
    }
    
});

```

## Components

1. Form processing with native API, AJAX submit, file upload, image preview, data binding and more
1. Native HTML5 form validation ([View example](https://bunnyjs.com/examples/form-validation/))
1. Facebook-like Messenger
1. Custom selects, spinners,
1. DOM utils, ready(), events
1. Libraries for Date, URL, File, Image
1. Ajax, APIs
1. Routing
1. Template engine
1. DataTable and Pagination ([View example](https://bunnyjs.com/examples/datatable/))
1. Calendar and DatePicker
1. Autocomplete, Dropdown
1. Element, positions, coordinates, smooth scrolling
1. Dependency Injection, Inversion of control

## Architecture

1. Separation of concerns, loose coupling, modularity
1. Functional programming
1. ES6 import/exports, Promises
1. Native Browser API, polyfills were needed
1. Object literal notation, no prototypes, "classes" , "new"
1. Object composition over inheritance
1. Dependency injection


## Contributors wanted

* Become a contributor of a fast growing open source project
* Share your ideas to the world
* Help yourself and millions of developers around the world solving JavaScript fatigue and modern overendineered problem
* Help building a tool which will provide a best user experience, performance, security, durability and load time for billions of the Internet users with smart usage of Computer's and Mobile device's resources

## Local development, examples and dists generation

* Make sure to install npm dev dependencies first with `npm install`
* Examples in `examples` folder. `index.html` can be opened in browser to view examples. Examples are generated with `npm build`
* To generate dists - `npm build dist -p`

## Experimental components based on DOMObserver (Mutation Observer)

Learn how to build [Vanilla JavaScript components on Medium.](https://medium.com/bunnyllc/vanilla-js-components-8d20c58b69f4#.qpwcm9mbn)

`src/DOMObserver` may be used to listen for DOM events like when new tag (component) was inserted into DOM or removed. It is based on latest Mutation Observer API (IE11+) and allows to automatically init components inserted into DOM later.

BunnyJS provides an experimental base abstract `src/Component` which may be used to create custom components:

```html
<script src="https://unpkg.com/bunnyjs/dist/component.min.js"></script>
```

Below is [Clock](https://jsfiddle.net/o01mvsyn/) example from [Inferno](https://infernojs.org/). As you can see you can do everything in Vanilla JS with less code, size and it works natively.

```javascript

const MyClock = Object.assign({}, Component, {

  tagName: 'clock',

  attributes: {
    date: new Date,
  },

  addEvents(clock) {
    clock._timer = setInterval(() => {
      clock.date = new Date;
    }, 1000);
  },

  uninit(clock) {
    clearInterval(clock._timer);
  },

  __date(clock, newVal) {
    clock.textContent = newVal.toLocaleTimeString();
  }

});

MyClock.register();
```

Now just `document.body.appendChild(document.createElement('clock'))` and it works.

To update the whole "state" of the component you may just use Vanilla JS `Object.assign(component, {stateObject})`.

For example, you have a simple <btn> clicker. By clicking on it btn.counter is increased. You can update counter with `btn.counter = 1` or `Object.assign(document.getElementsByTagName('btn')[0], {counter: 1})`;

You may also set default counter value with `<btn counter="6">`

For more examples look in `examples/component` folder.

--- 

&copy; [Mev-Rael](https://twitter.com/Mevrael)

[MIT License](https://github.com/mevrael/bunny/blob/master/LICENSE)
