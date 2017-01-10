
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

export function parseTemplate(id, data) {
  let tpl = document.getElementById(id).innerHTML;
  for (let key in data) {
    tpl = tpl.replace('{{ ' + key + ' }}', data[key]);
  }
  return htmlToNode(tpl);
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
