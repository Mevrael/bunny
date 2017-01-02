// import '../../src/polyfills/ObjectAssign';
// import '../../src/polyfills/template';
//
// import {Component} from "../../src/Component";
// import {htmlToNode, parseTemplate} from "../../src/utils/DOM";


var MyButton = Object.assign({}, Component, {

  tagName: 'btn',

  role: 'button',
  tabIndex: 0,

  attributes: {
    counter: 0
  },

  addEvents: function addEvents(btn) {
    btn.addEventListener('click', function () {
      btn.counter++;
    });
  },
  __counter: function __counter(btn, newVal) {
    btn.textContent = newVal;
  }
});

MyButton.register();

var MyClock = Object.assign({}, Component, {

  tagName: 'clock',

  attributes: {
    date: new Date()
  },

  addEvents: function addEvents(clock) {
    clock._timer = setInterval(function () {
      clock.date = new Date();
    }, 1000);
  },
  uninit: function uninit(clock) {
    clearInterval(clock._timer);
  },
  __date: function __date(clock, newVal) {
    clock.textContent = newVal.toLocaleTimeString();
  }
});

MyClock.register();

var ToDoItemTemplate = function ToDoItemTemplate(data) {
  return htmlToNode('<item><b>' + data.id + '</b> ' + data.value + '</item>');
};

var ToDo = Object.assign({}, Component, {

  tagName: 'todo',

  init: function init(c) {
    Component.init.call(this, c);
    c.__id = 0;
  },
  addEvents: function addEvents(c) {
    var _this = this;

    var btn = this.getButton(c);
    btn.addEventListener('click', function () {
      var input = _this.getInput(c);
      if (input.value.length > 0) {
        c.__id++;

        var item = _this.createItem(c.__id, input.value);
        _this.addItem(c, item);
        _this.addItemEvent(c, item);
        input.value = '';
      }
    });
  },
  createItem: function createItem(id, value) {
    //return parseTemplate('todo_item', {id, value})
    return ToDoItemTemplate({ id: id, value: value });
  },
  addItem: function addItem(c, item) {
    this.getItemsContainer(c).appendChild(item);
  },
  addItemEvent: function addItemEvent(c, item) {
    var _this2 = this;

    item.addEventListener('click', function () {
      _this2.removeItem(c, item);
    });
  },
  removeItem: function removeItem(c, item) {
    item.parentNode.removeChild(item);
  },
  getItemsContainer: function getItemsContainer(c) {
    return c.getElementsByTagName('items')[0];
  },
  getButton: function getButton(c) {
    return c.querySelector('[pid="add_btn"]');
  },
  getInput: function getInput(c) {
    return c.querySelector('[pid="add_input"]');
  },
  create: function create() {
    return parseTemplate('todo');
  }
});

ToDo.register();
