
export * from './DOM/ready';
export * from './DOM/events';

export function htmlToNode(html) {
  const e = document.createElement('div');
  e.innerHTML = html;
  return e.firstElementChild;
}

export function appendHtml(parent, html) {
  parent.appendChild(htmlToNode(html));
}

/**
 * Parses <template> contents by ID and replaces all {{ var }} inside
 * Second param should be an object of var keys => var values
 * If second params is an Array of Objects, returns DocumentFragment
 * Else - Node
 *
 * @param {String} id
 * @param {Object|Array} data
 * @returns {Node|DocumentFragment} node
 */
export function parseTemplate(id, data) {
  let node = null;
  let template = document.getElementById(id);
  let tpl = template.content.firstElementChild.outerHTML;

  const getDataByPath = (obj, path) => {
    const parts = path.split('.');
    let cur = obj;
    for (let k = 0; k < parts.length; k++) {
      let part = parts[k];
      if (cur[part] === undefined) {
        return null;
      } else if (cur[part] === null || cur[part].length === 0) {
        return '';
      } else {
        cur = cur[part];
      }
    }
    return cur;
  };

  const parseRow = (originalTpl, rowData) => {
    let newTpl = originalTpl;
    newTpl = newTpl.replace(/{{ ([a-zA-Z0-9\-._]*) }}/g, (match, capture) => {
      const res = getDataByPath(rowData, capture);
      return res === null ? match : res;
    });

    let node = htmlToNode(newTpl);
    if (node.tagName === 'TABLE') {
      node = node.rows[0];
    }

    if (template._handlers !== undefined) {
      for (let handlerName in template._handlers) {
        const el = node.querySelector('[handler="' + handlerName + '"]');
        template._handlers[handlerName](el);
      }
    }

    return node;
  };

  if (Array.isArray(data)) {
    node = document.createDocumentFragment();
    data.forEach(row => {
      node.appendChild(parseRow(tpl, row));
    });
  } else {
    node = parseRow(tpl, data);
  }

  return node;
}

export function registerTemplateHandlers(id, handlers) {
  const tpl = document.getElementById(id);
  if (tpl._handlers === undefined) {
    tpl._handlers = {};
  }
  Object.assign(tpl._handlers, handlers);
}

export function makeAccessible(element, tabIndex = 0, role = 'button') {
  element.setAttribute('tabindex', tabIndex);
  element.setAttribute('role', role);
  element.addEventListener('keydown', e => {
    if (e.keyCode === KEY_ENTER || e.keyCode === KEY_SPACE) {
      element.click();
    }
  });
}

export function isElementInside(parentElement, childElement) {
  let x = childElement;
  while (x = x.parentElement) {
    if (x === parentElement) return true;
  }
  return false;
}
