
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
