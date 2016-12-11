
import '../polyfills/SVGClassList';

export const NAMESPACE_SVG = 'http://www.w3.org/2000/svg';
export const NAMESPACE_XLINK = 'http://www.w3.org/1999/xlink';

/**
 * Document root <svg> with defs and icons
 */

export function getRootSvg() {
  const childNodes = document.body.childNodes;
  const length = childNodes.length;
  for (let k = 0; k < length ; k++) {
    const node = childNodes[k];
    if (node.tagName === 'svg' || node.tagName === 'SVG') {
      return node;
    }
  }
  return false;
}

export function createRootSvg() {
  const svg = document.createElementNS(NAMESPACE_SVG, 'svg');
  svg.setAttribute('height', '0');
  document.body.appendChild(svg);
  return svg;
}


/**
 * SVG <use>, spites and icons
 */

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

/**
 * SVG color matrix filter
 */

export function rgbaToColorMatrix(red, green, blue, alpha = 0) {
  const decToFloat = (value) => {
    return Math.round(value / 255 * 10) / 10;
  };
  const redFloat = decToFloat(red);
  const greenFloat = decToFloat(green);
  const blueFloat = decToFloat(blue);
  const alphaFloat = decToFloat(alpha);
  return `0 0 0 0 ${redFloat} 0 0 0 0 ${greenFloat} 0 0 0 0 ${blueFloat} 0 0 0 1 ${alphaFloat}`
}

export function getIdForSvgColorFilter(red, green, blue, alpha = 0) {
  return `__bunny_filter_${red}_${green}_${blue}_${alpha}`;
}

export function createOrGetSvgColorFilter(red, green, blue, alpha = 0) {
  const id = getIdForSvgColorFilter(red, green, blue, alpha);
  let rootSvg = getRootSvg();
  if (rootSvg === false) {
    rootSvg = createRootSvg();
  }
  if (!document.getElementById(id)) {
    const filter = document.createElementNS('http://www.w3.org/2000/svg', 'filter');
    filter.setAttribute('id', id);
    filter.innerHTML = `<feColorMatrix type="matrix" values="${rgbaToColorMatrix(red, green, blue, alpha)}" />`;
    rootSvg.appendChild(filter);
  }
  return id;
}

export function applySvgColorFilterToElement(element, red, green, blue, alpha = 0) {
  const id = createOrGetSvgColorFilter(red, green, blue, alpha);
  element.style.filter = `url(#${id})`;
}
