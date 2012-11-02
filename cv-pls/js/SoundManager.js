CvPlsHelper.SoundManager = function(document, pluginSettings) {

  "use strict";

  var self = this;

  // Sound settings popup listener
  this.watchPopup = function() {
    var xpathQuery, xpathResult, popup, status = 'disabled';

    xpathQuery = "./div[contains(concat(' ', @class, ' '),' popup ')]";
    xpathResult = document.evaluate(xpathQuery, document.getElementById('chat-body'), null, XPathResult.ORDERED_NODE_ITERATOR_TYPE, null);
    popup = xpathResult.iterateNext();
    if (popup === null) {
      setTimeout(self.watchPopup, 0);
    }

    if (pluginSettings.getSetting("soundNotification")) {
      status = 'enabled';
    }
    self.insertToggleLink(popup, status);
  };

  // Constructs and inserts toggle link
  this.insertToggleLink = function(popup, status) {
    var hr, ul, li, a;

    hr = document.createElement('hr');
    ul = document.createElement('ul');
    ul.setAttribute('class', 'no-bullet');
    li = ul.appendChild(document.createElement('li'));
    a = li.appendChild(document.createElement('a'));
    a.setAttribute('href', '#');
    a.innerText = 'cv-pls (' + status + ')';
    a.addEventListener('click', self.toggleSound);

    popup.appendChild(hr);
    popup.appendChild(ul);
  };

  // Toggle sound setting
  this.toggleSound = function(event) {
    event.preventDefault();
    if (pluginSettings.getSetting("soundNotification")) {
      pluginSettings.saveSetting('soundNotification', false);
      this.innerText = 'cv-pls (disabled)';
    } else {
      pluginSettings.saveSetting('soundNotification', true);
      this.innerText = 'cv-pls (enabled)';
    }
  };
};