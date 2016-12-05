
import '../polyfills/SVGClassList';

export const NAMESPACE_SVG = 'http://www.w3.org/2000/svg';
export const NAMESPACE_XLINK = 'http://www.w3.org/1999/xlink';

export function createSvgUse(iconId, attributes = {}) {
  const svg = document.createElementNS(NAMESPACE_SVG, 'svg');
  for (let attr in attributes) {
    svg.setAttribute(attr, attributes[attr]);
  }
  const use = document.createElementNS(NAMESPACE_SVG, 'use');
  use.setAttributeNS(NAMESPACE_XLINK, 'xlink:href', '#' + iconId);
  svg.appendChild(use);
  return svg;
}

export function changeSvgIcon(svg, newIconId) {
  svg.firstChild.setAttributeNS(NAMESPACE_XLINK, 'xlink:href', '#' + newIconId);
}

export function getSvgIcon(svg) {
  return svg.firstChild.getAttributeNS(NAMESPACE_XLINK, 'href').slice(1);
}
