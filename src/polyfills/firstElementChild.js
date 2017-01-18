
(function() {
  if (Node.prototype.firstElementChild === undefined) {
    Object.defineProperty(Node.prototype, 'firstElementChild', {
      get: function () {
        var childNodes = this.childNodes;
        var length = childNodes.length;
        for (var k = 0; k < length; k++) {
          var node = childNodes[k];
          if (node.nodeType === Node.ELEMENT_NODE) {
            return node;
          }
        }
        return null;
      }
    });
  }
})();
