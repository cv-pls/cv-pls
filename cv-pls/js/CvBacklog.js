CvPlsHelper.CvBacklog = function(document, pluginSettings, backlogUrl) {

  "use strict";

  var self,
      descriptionElement, originalDescription,
      timeout;

  self = this;
  timeout = null;

  function buildCvLink(cvRequest) {
    var div, a, requestType;

    requestType = (cvRequest.closed_date !== undefined) ? 'delv' : 'cv';

    div = document.createElement('div');
    div.appendChild(document.createTextNode('[' + requestType + '-pls] '));

    a = div.appendChild(document.createElement('a'));
    a.setAttribute('href', cvRequest.link);
    a.setAttribute('target', '_blank');
    a.innerHTML = cvRequest.title;

    return div;
  }

  function processBacklogResponse(data) {
    var backlogAmount, i, length;

    while (descriptionElement.hasChildNodes()) {
      descriptionElement.removeChild(descriptionElement.lastChild);
    }

    backlogAmount = parseInt(pluginSettings.getSetting('backlogAmount'), 10);
    length = data.length;
    for (i = 0; i < length && i < backlogAmount; i++) {
      descriptionElement.appendChild(buildCvLink(data[i]));
    }
  }

  this.refresh = function() {
    var xhr;

    timeout = null;

    if (!pluginSettings.getSetting('backlogEnabled')) {
      return null;
    }

    xhr = new XMLHttpRequest();
    xhr.open("GET", backlogUrl, true);
    xhr.setRequestHeader('Accept', 'application/json; charset=utf-8');

    xhr.onreadystatechange = function() {
      if (xhr.readyState === 4 && xhr.status === 200) {

        try {
          processBacklogResponse(JSON.parse(xhr.responseText));
        } catch(e) { /* probably a JSON parse error occured, ignore it */ }

        if (pluginSettings.getSetting('backlogRefresh')) {
          timeout = setTimeout(self.refresh, (pluginSettings.getSetting('backlogRefreshInterval') * 60 * 1000));
        }

      }
    };

    xhr.send(null);
  };

  this.show = function() {
    descriptionElement = document.getElementById('roomdesc');
    originalDescription = descriptionElement.innerHTML;
    self.refresh();
  };

  this.hide = function() {
    if (timeout !== null) {
      clearTimeout();
    }
    if (originalDescription !== undefined) {
      descriptionElement.innerHTML = originalDescription;
    }
  };


};