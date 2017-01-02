
export const DOMObserver = {

  iterateCallback(callbacksConteiner, node) {
    if (node.nodeType === Node.ELEMENT_NODE) {
      callbacksConteiner.forEach(cb => {
        if (node.tagName.toLowerCase() === cb[0]) {
          cb[1](node);
        } else {
          const childNodes = node.getElementsByTagName(cb[0]);
          [].forEach.call(childNodes, childNode => {
            cb[1](childNode);
          });
        }
      });
    }
  },

  create() {
    return new MutationObserver(mutations => {
      mutations.forEach(mutation => {
        if (mutation.addedNodes.length > 0 && document.body.__observer_insert !== undefined) {
          [].forEach.call(mutation.addedNodes, addedNode => {
            this.iterateCallback(document.body.__observer_insert, addedNode);
          });
        }

        if (mutation.removedNodes.length > 0 && document.body.__observer_remove !== undefined) {
          [].forEach.call(mutation.removedNodes, removedNode => {
            this.iterateCallback(document.body.__observer_remove, removedNode);
          });
        }
      });
    });
  },

  createForAttr(component) {
    return new MutationObserver(mutations => {
      mutations.forEach(mutation => {
        if (mutation.attributeName !== null && component.__observer_attr !== undefined) {
          component.__observer_attr.forEach(cb => {
            if (mutation.attributeName === cb[0]) {
              cb[1]();
            }
          })
        }
      });
    });
  },

  init() {
    if (document.body.__observer === undefined) {
      document.body.__observer = this.create();
      this.observe();
    }
  },

  onInsert(tagName, callback) {
    if (document.body.__observer_insert === undefined) {
      document.body.__observer_insert = [];
    }
    document.body.__observer_insert.push([tagName, callback]);
  },

  onRemove(tagName, callback) {
    if (document.body.__observer_remove === undefined) {
      document.body.__observer_remove = [];
    }
    document.body.__observer_remove.push([tagName, callback]);
  },

  onAttributeChange(component, attrName, callback) {
    if (component.__observer_attr === undefined) {
      component.__observer_attr = [];
    }
    component.__observer_attr.push([attrName, callback]);
  },

  observe() {
    document.body.__observer.observe(document.body, { childList: true, subtree: true });
  },

  observeAttr(component) {
    component.__observer.observe(component, { attributes: true });
  },

  registerAttribute(component, name, defaultValue, onChange) {
    const attrVal = component.getAttribute(name);
    component['_' + name] = attrVal ? attrVal : defaultValue;
    onChange(component['_' + name]);
    Object.defineProperty(component, name, {
      get() {
        return component['_' + name]
      },
      set(val) {
        component['_' + name] = val;
        onChange(val);
      }
    });

    this.onAttributeChange(component, name, () => {
      const val = component.getAttribute(name);
      component['_' + name] = val;
      onChange(val);
    });

    if (component.__observer === undefined) {
      component.__observer = this.createForAttr(component);
      this.observeAttr(component);
    }
  }
};
