/*jslint plusplus: true, white: true, browser: true */
/*global CvPlsHelper */

(function() {

  'use strict';

  function buildCvLink(cvRequest) {
    var div, a, requestType;

    requestType = (cvRequest.closed_date !== undefined) ? 'delv' : 'cv';

    div = this.document.createElement('div');
    div.appendChild(this.document.createTextNode('[' + requestType + '-pls] '));

    a = div.appendChild(this.document.createElement('a'));
    a.setAttribute('href', cvRequest.link);
    a.setAttribute('target', '_blank');
    a.innerHTML = cvRequest.title;

    return div;
  }

  function processBacklogResponse(data) {
    var i, l;

    while (this.descriptionElement.hasChildNodes()) {
      this.descriptionElement.removeChild(this.descriptionElement.lastChild);
    }

    for (i = 0, l = data.length; i < l && i < this.pluginSettings.getSetting('backlogAmount'); i++) {
      this.descriptionElement.appendChild(buildCvLink.call(this, data[i]));
    }
  }

  CvPlsHelper.CvBacklog = function(document, pluginSettings, backlogUrl) {
    this.document = document;
    this.pluginSettings = pluginSettings;
    this.backlogUrl = backlogUrl;
    this.descriptionElement = document.getElementById('roomdesc');
  };

  CvPlsHelper.CvBacklog.prototype.originalDescription = null;
  CvPlsHelper.CvBacklog.prototype.timeout = null;
  CvPlsHelper.CvBacklog.prototype.visible = false;

  CvPlsHelper.CvBacklog.prototype.refresh = function() {
    var xhr,
        self = this,
        interval = this.pluginSettings.getSetting('backlogRefreshInterval') * 60 * 1000;

    this.timeout = null;

    if (!this.pluginSettings.getSetting('backlogEnabled')) {
      this.hide();
      return;
    }
    this.show();

    xhr = new XMLHttpRequest();
    xhr.open("GET", this.backlogUrl, true);
    xhr.setRequestHeader('Accept', 'application/json; charset=utf-8');
    xhr.onreadystatechange = function() {
      if (xhr.readyState === 4 && xhr.status === 200) {
        try {
          processBacklogResponse.call(self, JSON.parse(xhr.responseText));
        } catch(e) { /* probably a JSON parse error occured, ignore it */ }
      }
    };
    xhr.send(null);

    if (this.pluginSettings.getSetting('backlogRefresh')) {
      this.timeout = setTimeout(function() {
        self.refresh();
      }, interval);
    }
  };

  CvPlsHelper.CvBacklog.prototype.show = function() {
    if (!this.visible) {
      this.visible = true;
      this.originalDescription = this.descriptionElement.innerHTML;
    }
  };

  CvPlsHelper.CvBacklog.prototype.hide = function() {
    if (this.visible) {
      this.visible = false;
      this.descriptionElement.innerHTML = this.originalDescription;
      if (this.timeout !== null) {
        clearTimeout(this.timeout);
      }
    }
  };

}());