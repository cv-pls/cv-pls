/*jslint plusplus: true, white: true, browser: true */
/*global chrome */

CvPlsHelper.chrome.PopUpMenu = function() {

  "use strict";

  var version, self = this;

  function getOptionsUrl() {
    return chrome.extension.getURL('chrome/html/settings.html');
  };

  function getVersion() {
    if (version === undefined) {
      version = chrome.app.getDetails().version;
    }
    return version;
  };

  function openSettingsPage() {
    chrome.tabs.query({url: getOptionsUrl()}, function(result) {
      if (result.length) {
        chrome.tabs.update(result[0].id, {active: true});
      } else {
        chrome.tabs.create({url: getOptionsUrl()});
      }
    });
  };

  function closePopup() {
    window.close();
    return true;
  };

  (function() {
    document.getElementById('moreSettings').addEventListener('click', openSettingsPage);
    document.getElementById('closeButton').addEventListener('click', closePopup);
    document.getElementById('versionNumber').innerText = self.getVersionNumber();
  }());

};