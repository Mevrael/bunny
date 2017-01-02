
// import '../../src/polyfills/ObjectAssign';
// import '../../src/polyfills/template';
//
// import {Component} from "../../src/Component";
// import {htmlToNode, parseTemplate} from "../../src/utils/DOM";



const MyButton = Object.assign({}, Component, {

  tagName: 'btn',

  role: 'button',
  tabIndex: 0,

  attributes: {
    counter: 0
  },

  addEvents(btn) {
    btn.addEventListener('click', () => {
      btn.counter++;
    });
  },

  __counter(btn, newVal) {
    btn.textContent = newVal;
  }

});

MyButton.register();




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



const ToDoItemTemplate = data => htmlToNode(
  `<item><b>${data.id}</b> ${data.value}</item>`
);

const ToDo = Object.assign({}, Component, {

  tagName: 'todo',

  init(c) {
    Component.init.call(this, c);
    c.__id = 0;
  },

  addEvents(c) {
    const btn = this.getButton(c);
    btn.addEventListener('click', () => {
      const input = this.getInput(c);
      if (input.value.length > 0) {
        c.__id++;

        const item = this.createItem(c.__id, input.value);
        this.addItem(c, item);
        this.addItemEvent(c, item);
        input.value = '';
      }
    })
  },

  createItem(id, value) {
    //return parseTemplate('todo_item', {id, value})
    return ToDoItemTemplate({id, value})
  },

  addItem(c, item) {
    this.getItemsContainer(c).appendChild(item);
  },

  addItemEvent(c, item) {
    item.addEventListener('click', () => {
      this.removeItem(c, item);
    })
  },

  removeItem(c, item) {
    item.parentNode.removeChild(item);
  },

  getItemsContainer(c) {
    return c.getElementsByTagName('items')[0];
  },

  getButton(c) {
    return c.querySelector('[pid="add_btn"]');
  },

  getInput(c) {
    return c.querySelector('[pid="add_input"]');
  },

  create() {
    return parseTemplate('todo');
  }

});

ToDo.register();
