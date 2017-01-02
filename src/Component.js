
import { DOMObserver } from "./DOMObserver";

export const Component = {

  tagName: 'component',

  attributes: {},

  /**
   * @returns {Boolean}
   */
  init(component) {
    const prop = '__component_' + this.tagName;
    if (component[prop] !== undefined) {
      return false;
    }
    component[prop] = true;

    if (this.role !== undefined) {
      component.setAttribute('role', this.role);
    }

    if (this.tabIndex !== undefined) {
      component.setAttribute('tabIndex', this.tabIndex);
    }

    for (let attrName in this.attributes) {
      const attrDefVal = this.attributes[attrName];
      DOMObserver.registerAttribute(component, attrName, attrDefVal, newVal => {
        this['__' + attrName](component, newVal);
      });
    }

    if (this.addElements !== undefined) {
      this.addElements(component);
    }

    this.addEvents(component);
    return true;
  },

  addEvents(component) {

  },

  initAll(container = document.body) {
    [].forEach.call(this.getAll(container), btn => {
      this.init(btn);
    });
  },

  getAll(container = document.body) {
    return container.getElementsByTagName(this.tagName);
  },

  register() {
    document.addEventListener('DOMContentLoaded', () => {
      DOMObserver.init();
      this.initAll();
      DOMObserver.onInsert(this.tagName, component => {
        this.init(component);
      });
      if (this.uninit !== undefined) {
        DOMObserver.onRemove(this.tagName, component => {
          this.uninit(component);
        });
      }
    });
  }

};
