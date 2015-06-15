(function(exports) {
  var Cache = {
    data: []
  };

  var xhr = new XMLHttpRequest();
  xhr.open('GET', '/model.json');
  xhr.onload = function() {
    if (xhr.status < 400 && xhr.responseText) {
      exports.Cache = JSON.parse(xhr.responseText);
    }
  };
  xhr.send();

  exports.Cache = Cache;
})(this);
