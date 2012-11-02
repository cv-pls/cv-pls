/*jslint plusplus: true, white: true, browser: true */
/*global chrome */

CvPlsHelper.PluginSettings = function(settingsDataAccessor, defaultSettings) {

  "use strict";

  var self = this;

  this.normalizeSetting = function(value, defaultValue) {
    var result;

    if (value == undefined || value === null) {
      return defaultValue;
    }

    switch (typeof defaultValue) {
      case 'string':
        result = String(value);
        break;

      case 'boolean':
        result = Boolean(value && value !== "false");
        break;

      case 'number':
        result = Number(value);
        if (isNaN(result)) {
          result = defaultValue;
        }
        break;

      case 'object':
        if (typeof value === 'object') {
          result = value;
        } else if (typeof value === 'string') {
          try {
            result = JSON.parse(value);
          } catch (e) {
            result = defaultValue;
          }
        } else {
          result = defaultValue;
        }
        break;

    }

    return result;
  };

  this.getSetting = function(setting) {
    if (defaultSettings[setting] !== undefined) {
      return self.normalizeSetting(settingsDataAccessor.getSetting(setting), defaultSettings[setting]);
    }
    return null;
  };

  this.saveSetting = function(setting, value) {
    settingsDataAccessor.saveSetting(setting, value);
  };

  this.getAllSettings = function() {
    var setting, result = {};
    for (setting in defaultSettings) {
      if (typeof defaultSettings[setting] !== "function") {
        result[setting] = self.getSetting(setting);
      }
    }
    return result;
  };

  this.init = function(callback) {
    settingsDataAccessor.init(callback);
  };
};