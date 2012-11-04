/*jslint plusplus: true, white: true, browser: true */
/*global chrome */

CvPlsHelper.PluginSettings = function(settingsDataAccessor, defaultSettings) {

  "use strict";

  var self = this;

  this.getSetting = function(setting) {
    return settingsDataAccessor.getSetting(setting, value);
  };

  this.saveSetting = function(setting, value) {
    settingsDataAccessor.saveSetting(setting, value);
  };

  this.getAllSettings = function() {
    return settingsDataAccessor.getAllSettings();
  };

  this.init = function(callback) {
    settingsDataAccessor.init(callback);
  };
};