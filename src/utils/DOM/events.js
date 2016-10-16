
import './../../constants/keycodes';

/**
 * Adds event listener to element and stores a function in this element's custom property
 * and returns unique ID which can be used to remove event listener later
 * even anonymous functions, component methods, functions with arguments
 *
 * Simple example:
 *
 * const Component = {
 *      docBodyClickEventId: null,
 *      anonymousEventId: null,
 *
 *      init(param1, param2) {
 *          this.docBodyClickEventId = addEvent(document.body, 'click', this.bodyClicked.bind(this, param1, param2));
 *
 *          this.anonymousEventId = addEvent(document.body, 'click', e => {
 *              console.log(e)
 *          });
 *      },
 *
 *      destroy() {
 *          this.docBodyClickEventId = removeEvent(document.body, 'click', this.docBodyClickEventId);
 *
 *          this.anonymousEventId = removeEvent(document.body, 'click', this.anonymousEventId)'
 *      },
 *
 *      bodyClicked(param1, param2) {
 *          console.log(this.internalAction(param1, param2));
 *      },
 *
 *      internalAction(param1, param2) {
 *          return param1 + param2;
 *      }
 * }
 *
 * @param {HTMLElement} element
 * @param {String} eventName
 * @param {Function} eventListener
 *
 * @returns {Number}
 */
export function addEvent(element, eventName, eventListener) {
    if (element.__bunny_event_handlers === undefined) {
        element.__bunny_event_handlers = {
            handlers: {},
            counter: 0
        }
    }
    element.__bunny_event_handlers.handlers[element.__bunny_event_handlers.counter] = eventListener;
    element.addEventListener(
        eventName,
        element.__bunny_event_handlers.handlers[element.__bunny_event_handlers.counter]
    );
    element.__bunny_event_handlers.counter++;
    return element.__bunny_event_handlers.counter - 1;
}

/**
 * Remove event listener
 *
 * @param {HTMLElement} element
 * @param {String} eventName
 * @param {Number} eventIndex
 *
 * @returns {null}
 */
export function removeEvent(element, eventName, eventIndex) {
    if (element.__bunny_event_handlers !== undefined &&
        element.__bunny_event_handlers.handlers[eventIndex] !== undefined
    ) {
        element.removeEventListener(eventName, element.__bunny_event_handlers.handlers[eventIndex]);
        delete element.__bunny_event_handlers.handlers[eventIndex];
        // do not decrement counter, each new event handler should have next unique index
    }
    return null;
}

/**
 * Call event listener only once after "delay" ms
 * Useful for scroll, keydown and other events
 * when the actions must be done only once
 * when user stopped typing or scrolling for example
 *
 * @param {HTMLElement} element
 * @param {String} eventName
 * @param {Function} eventListener
 * @param {Number} delay
 * @returns {Number}
 */
export function addEventOnce(element, eventName, eventListener, delay = 500) {
    let timeout = 0;
    return addEvent(element, eventName, (e) => {
        clearTimeout(timeout);
        timeout = setTimeout(() => {
            eventListener(e);
        }, delay)
    });
}

export function isEventCursorInside(e, element) {
    const bounds = element.getBoundingClientRect();
    return (e.clientX > bounds.left && e.clientX < bounds.right
        && e.clientY > bounds.top && e.clientY < bounds.bottom
    );
}

export function onClickOutside(element, callback) {

    if (document.__bunny_core_outside_callbacks === undefined) {
        document.__bunny_core_outside_callbacks = [];
    }

    const handler = (event) => {
        if (!(event.target === element || element.contains(event.target))) {
            callback(event);
        }
    };

    if (element.__bunny_core_outside_callbacks === undefined) {
        element.__bunny_core_outside_callbacks = [];
    }

    element.__bunny_core_outside_callbacks.push(handler);


    document.__bunny_core_outside_callbacks.push(handler);

    if (document.__bunny_core_outside_handler === undefined) {
        document.__bunny_core_outside_handler = (event) => {
            document.__bunny_core_outside_callbacks.forEach(callback => {
                callback(event);
            })
        };
        document.addEventListener('click', document.__bunny_core_outside_handler);
        document.addEventListener('touchstart', document.__bunny_core_outside_handler);
    }

    return handler;
}

export function removeClickOutside(element, callback) {
    if (document.__bunny_core_outside_callbacks !== undefined) {
        const index = document.__bunny_core_outside_callbacks.indexOf(callback);
        if (index !== -1) {
            document.__bunny_core_outside_callbacks.splice(index, 1);
            if (document.__bunny_core_outside_callbacks.length === 0) {
                document.removeEventListener('click', document.__bunny_core_outside_handler);
                document.removeEventListener('touchstart', document.__bunny_core_outside_handler);
                delete document.__bunny_core_outside_handler;
            }
        }
    }

    if (element.__bunny_core_outside_callbacks !== undefined) {
        const index = element.__bunny_core_outside_callbacks.indexOf(callback);
        if (index !== -1) {
            element.__bunny_core_outside_callbacks.splice(index, 1);
        }
    }
}

export function addEventKeyNavigation(element, items, itemSelectCallback, activeClass = 'active') {

  let currentItemIndex = null;

  const _itemAdd = () => {
    items[currentItemIndex].classList.add(activeClass);
    items[currentItemIndex].setAttribute('aria-selected', 'true');
    items[currentItemIndex].scrollIntoView(false);
  };

  const _itemRemove = () => {
    items[currentItemIndex].classList.remove(activeClass);
    items[currentItemIndex].removeAttribute('aria-selected');
  };

  const handler = (e) => {
    const c = e.keyCode;

    const maxItemIndex = items.length - 1;

    if (c === KEY_ENTER) {
      e.preventDefault();
      if (currentItemIndex !== null) {
        itemSelectCallback(items[currentItemIndex]);
      } else {
        // pick first item from list
        itemSelectCallback(items[0]);
      }

    } else if (c === KEY_ESCAPE) {
      e.preventDefault();
      itemSelectCallback(false);

    } else if (c === KEY_ARROW_UP) {
      e.preventDefault();
      if (currentItemIndex !== null && currentItemIndex > 0) {
        _itemRemove();
        currentItemIndex -= 1;
        _itemAdd();
      }

    } else if (c === KEY_ARROW_DOWN) {
      e.preventDefault();
      if (currentItemIndex === null) {
        currentItemIndex = 0;
        _itemAdd();
      } else if (currentItemIndex < maxItemIndex) {
        _itemRemove();
        currentItemIndex += 1;
        _itemAdd();
      }
    }
  };

  element.addEventListener('keydown', handler);

  return handler;
}

export function removeEventKeyNavigation(element, handler) {
  element.removeEventListener('keydown', handler);
}
