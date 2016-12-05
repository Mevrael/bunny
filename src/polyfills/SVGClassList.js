
// Polyfill for IE 9-11 classList on <svg> elements
if (Object.getOwnPropertyDescriptor(Element.prototype, 'classList') === undefined) {
  Object.defineProperty(Element.prototype, 'classList', Object.getOwnPropertyDescriptor(HTMLElement.prototype, 'classList'));
}
