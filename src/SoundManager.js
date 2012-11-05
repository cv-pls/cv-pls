CvPlsHelper.SoundManager = function(document, pluginSettings) {

  "use strict";

  var self = this;

  // Toggle sound setting
  function toggleSound(event) {
    var value = pluginSettings.getSetting('soundNotification');
    event.preventDefault();
    pluginSettings.saveSetting('soundNotification', !value);
    this.firstChild.data = value ? 'cv-pls (disabled)' : 'cv-pls (enabled)';
  }

  // Constructs and inserts toggle link
  function insertToggleLink(popup, status) {
    var hr, ul, li, a;

    hr = document.createElement('hr');
    ul = document.createElement('ul');
    ul.setAttribute('class', 'no-bullet');
    li = ul.appendChild(document.createElement('li'));
    a = li.appendChild(document.createElement('a'));
    a.setAttribute('href', '#');
    a.appendChild(document.createTextNode('cv-pls (' + status + ')'));
    a.addEventListener('click', toggleSound);

    popup.appendChild(hr);
    popup.appendChild(ul);
  }

  // Sound settings popup listener
  function watchPopup() {
    var xpathQuery, xpathResult, popup, status = 'disabled';

    xpathQuery = "./div[contains(concat(' ', @class, ' '),' popup ')]";
    xpathResult = document.evaluate(xpathQuery, document.getElementById('chat-body'), null, XPathResult.ORDERED_NODE_ITERATOR_TYPE, null);
    popup = xpathResult.iterateNext();
    if (popup === null) {
      setTimeout(watchPopup, 0);
    }

    if (pluginSettings.getSetting("soundNotification")) {
      status = 'enabled';
    }
    insertToggleLink(popup, status);
  }

  this.init = function() {
    if (document.getElementById('sound')) {
      document.getElementById('sound').addEventListener('click', watchPopup);
    } else {
      setTimeout(self.init, 0);
    }
  };

};