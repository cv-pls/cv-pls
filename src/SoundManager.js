/*jslint plusplus: true, white: true, browser: true */
/*global CvPlsHelper */

(function() {

  'use strict';

  function insertToggleLink(document, popup, status) {
    var hr, ul, li, a;

    hr = document.createElement('hr');
    ul = document.createElement('ul');
    ul.setAttribute('class', 'no-bullet');
    li = ul.appendChild(document.createElement('li'));
    a = li.appendChild(document.createElement('a'));
    a.setAttribute('href', '#');
    a.appendChild(document.createTextNode('cv-pls (' + status + ')'));
    a.addEventListener('click', function(event) {
      var value = this.pluginSettings.getSetting('soundNotification');
      event.preventDefault();
      this.pluginSettings.saveSetting('soundNotification', !value);
      this.firstChild.data = value ? 'cv-pls (disabled)' : 'cv-pls (enabled)';
    });

    popup.appendChild(hr);
    popup.appendChild(ul);
  }

  function watchPopup() {
    var self = this,
        popup = this.document.getElementById('chat-body').querySelector('div.popup'),
        status = 'disabled';

    if (popup === null) {
      setTimeout(function() {
        watchPopup.call(self);
      }, 0);
    }

    if (this.pluginSettings.getSetting("soundNotification")) {
      status = 'enabled';
    }
    insertToggleLink.call(this, this.document, popup, status);
  }

  CvPlsHelper.SoundManager = function(document, pluginSettings) {
    this.document = document;
    this.pluginSettings = pluginSettings;
  };

  CvPlsHelper.SoundManager.prototype.init = function() {
    var self = this;
    if (this.document.getElementById('sound')) {
      this.document.getElementById('sound').addEventListener('click', function() {
        watchPopup.call(self);
      });
    } else {
      setTimeout(function() {
        self.init();
      }, 0);
    }
  };

}());