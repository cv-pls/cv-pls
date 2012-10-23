/*jslint plusplus: true, white: true, browser: true */
/*global chrome */

function ChromeContentSettingsDataAccessor(settingsDataStore) {

  "use strict";

  var self = this;

  this.saveSetting = function(key, value) {
    settingsDataStore.saveSetting(key, value);
    chrome.extension.sendRequest({method: 'saveSetting', key: key, value: value}, function(){});
  };

  this.getSetting = function(key) {
    return settingsDataStore.getSetting(key);
  };

  this.init = function(callback) {
    chrome.extension.sendRequest({method: 'getAllSettings'}, function(settingsObject) {
      self.storeSettings(settingsObject);
      callback();
    });
  };

  this.storeSettings = function(settingsObject) {
    var key;
    for (key in settingsObject) {
      if (typeof settingsObject[key] !== "function") {
        if (typeof settingsObject[key] === "object") {
          settingsDataStore.saveSetting(key, JSON.stringify(settingsObject[key]));
        } else {
          settingsDataStore.saveSetting(key, settingsObject[key]);
        }
      }
    }
  };
}