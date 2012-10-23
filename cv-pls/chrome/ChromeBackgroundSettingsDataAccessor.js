/*jslint plusplus: true, white: true, browser: true */

function ChromeBackgroundSettingsDataAccessor(settingsDataStore) {

  "use strict";

  this.saveSetting = function(key, value) {
    settingsDataStore.saveSetting(key, value);
  };

  this.getSetting = function(key) {
    return settingsDataStore.getSetting(key);
  };

  this.init = function(callback) {
    callback();
  };
}