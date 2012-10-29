/*jslint plusplus: true, white: true, browser: true */
/*global chrome */

function ChromePopUpMenu() {

  "use strict";

  var self = this;

  this.version = null;

  this.getOptionsUrl = function() {
    return chrome.extension.getURL('chrome/settings.html');
  };

  this.getVersionNumber = function() {
    if (self.version === null) {
      self.version = chrome.app.getDetails().version;
    }
    return self.version;
  };

  this.openSettingsPage = function() {
    var url = self.getOptionsUrl();
    chrome.tabs.query({url: url}, function(result) {
      if (result.length) {
        chrome.tabs.update(result[0].id, {active: true});
      } else {
        chrome.tabs.create({url: url});
      }
    });
  };

  this.closePopup = function() {
    window.close();
    return true;
  };

  this.init = function() {
    document.getElementById('moreSettings').addEventListener('click', self.openSettingsPage);
    document.getElementById('closeButton').addEventListener('click', self.closePopup);
    document.getElementById('versionNumber').innerText = self.getVersionNumber();
  };
}