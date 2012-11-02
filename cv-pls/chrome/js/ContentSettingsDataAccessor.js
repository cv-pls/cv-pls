/*jslint plusplus: true, white: true, browser: true */
/*global chrome */

CvPlsHelper.chrome.ContentSettingsDataAccessor = function(settingsDataStore) {

  "use strict";

  var self = this;

  this.saveSetting = function(key, value) {
    settingsDataStore.saveSetting(key, value);
    chrome.extension.sendMessage({method: 'saveSetting', key: key, value: value});
  };

  this.getSetting = function(key) {
    return settingsDataStore.getSetting(key);
  };

  this.init = function(callBack) {
    chrome.extension.sendMessage({method: 'getAllSettings'}, function(settingsObject) {
      self.storeSettings(settingsObject);
      callBack();
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

};