
(function() {
  if ('content' in document.createElement('template')) {
    return false;
  }

  var templates = document.getElementsByTagName('template');
  var plateLen = templates.length;

  for (var x = 0; x < plateLen; ++x) {
    var template = templates[x];
    var content = template.childNodes;
    var fragment = document.createDocumentFragment();

    while (content[0]) {
      if (content[0].nodeType === Node.ELEMENT_NODE) {
        fragment.appendChild(content[0]);
      } else {
        content[0].parentNode.removeChild(content[0]);
      }
    }

    template.content = fragment;
  }
})();
