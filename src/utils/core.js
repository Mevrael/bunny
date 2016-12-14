
export function getActionObject(element) {
    const action = element.getAttribute('action');
    const parts = action.split('.');
    const Model = parts[0];
    let actionObject = null;
    if (parts[1] === undefined) {
        actionObject = window[Model];
    } else {
        const searchAction = parts[1];
        try {
            actionObject = window[Model][searchAction].bind(window[Model]);
        } catch (e) {}
    }

    if (actionObject === undefined) {
        throw new Error(`Bunny Error: Model search action specified in action="${action}" attribute not found`);
    }
    return actionObject;
}

export function initObjectExtensions(obj, arg) {
  const keys = Object.keys(obj);
  keys.forEach(key => {
    if (key.indexOf('init') === 0) {
      obj[key](arg);
    }
  });
}

export function pushToElementProperty(element, property, value) {
    if (element[property] === undefined) {
        element[property] = [];
    }
    element[property].push(value);
}

export function pushCallbackToElement(element, namespace, callback) {
    pushToElementProperty(element, `__bunny_${namespace}_callbacks`, callback)
}

export function callElementCallbacks(element, namespace, cb) {
    const callbacks = element[`__bunny_${namespace}_callbacks`];
    if (callbacks !== undefined) {

      // process each promise in direct order
      // if promise returns false, do not execute further promises
      const checkPromise = index => {
        const res = cb(callbacks[index]); // actually calling callback
        if (res instanceof Promise) {
          res.then(cbRes => {
            if (cbRes !== false) {
              // keep going
              if (index > 0) {
                checkPromise(index-1);
              }
            }
          })
        } else {
          if (res !== false) {
            // keep going
            if (index > 0) {
              checkPromise(index-1);
            }
          }
        }
      };

      checkPromise(callbacks.length - 1);
    }
}
