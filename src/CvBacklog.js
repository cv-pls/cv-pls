/*jslint plusplus: true, white: true, browser: true */
/*global CvPlsHelper, $ */

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
    var backlogAmount, i, l;

    while (this.descriptionElement.hasChildNodes()) {
      this.descriptionElement.removeChild(this.descriptionElement.lastChild);
    }

    backlogAmount = parseInt(this.pluginSettings.getSetting('backlogAmount'), 10);
    for (i = 0, l = data.length; i < l && i < backlogAmount; i++) {
      this.descriptionElement.appendChild(buildCvLink.call(this, data[i]));
    }
  }

  CvPlsHelper.CvBacklog = function(document, pluginSettings, backlogUrl) {
    this.document = document;
    this.pluginSettings = pluginSettings;
    this.backlogUrl = backlogUrl;
  };

  CvPlsHelper.CvBacklog.prototype.descriptionElement = null;
  CvPlsHelper.CvBacklog.prototype.originalDescription = null;
  CvPlsHelper.CvBacklog.prototype.timeout = null;

  CvPlsHelper.CvBacklog.prototype.refresh = function() {
    var xhr, self = this;

    this.timeout = null;

    if (!this.pluginSettings.getSetting('backlogEnabled')) {
      return null;
    }

    xhr = new XMLHttpRequest();
    xhr.open("GET", this.backlogUrl, true);
    xhr.setRequestHeader('Accept', 'application/json; charset=utf-8');

    xhr.onreadystatechange = function() {
      if (xhr.readyState === 4 && xhr.status === 200) {
        try {
          processBacklogResponse.call(self, JSON.parse(xhr.responseText));
        } catch(e) { /* probably a JSON parse error occured, ignore it */ }

        if (self.pluginSettings.getSetting('backlogRefresh')) {
          self.timeout = setTimeout(self.refresh, (self.pluginSettings.getSetting('backlogRefreshInterval') * 60 * 1000));
        }
      }
    };

    xhr.send(null);
  };

  CvPlsHelper.CvBacklog.prototype.show = function() {
    this.descriptionElement = this.document.getElementById('roomdesc');
    this.originalDescription = this.descriptionElement.innerHTML;
    this.refresh();
  };

  CvPlsHelper.CvBacklog.prototype.hide = function() {
    if (this.timeout !== null) {
      clearTimeout(this.timeout);
    }
    if (this.originalDescription !== null) {
      this.descriptionElement.innerHTML = this.originalDescription;
    }
  };

}());