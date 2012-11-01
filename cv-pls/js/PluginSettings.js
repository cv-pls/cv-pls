/*jslint plusplus: true, white: true, browser: true */
/*global chrome */

function PluginSettings(settingsDataAccessor) {

  "use strict";

  var self, availableSettings;

  self = this;
  availableSettings = { // name: defaultValue
    showIcon: true,
    oneBox: true,
    oneBoxHeight: 30,
    removeCompletedOneboxes: false,
    soundNotification: false,
    avatarNotification: false,
    removeLostNotifications: false,
    removeCompletedNotifications: false,
    desktopNotification: false,
    showCloseStatus: true,
    pollCloseStatus: false,
    pollInterval: 5,
    strikethroughCompleted: false,
    cvPlsButton: true,
    delvPlsButton: false,
    backlogEnabled: false,
    backlogAmount: 5,
    backlogRefresh: true,
    backlogRefreshInterval: 60,
    dupesEnabled: false,
    dupesList: []
  };

  this.normalizeSetting = function(value, defaultValue) {
    var result;

    switch (typeof defaultValue) {
      case 'boolean':
        if (defaultValue) {
          if (value !== "false") {
            result = true;
          } else {
            result = false;
          }
        } else {
          if (value === "false" || !value) {
            result = false;
          } else {
            result = true;
          }
        }
        break;

      case 'number':
        if (value === null || isNaN(value)) {
          result = defaultValue;
        } else {
          result = value;
        }
        break;

      case 'object':
        if (value === null  || !value.length) {
          result = defaultValue;
        } else {
          result = JSON.parse(value);
        }
        break;

    }

    return result;
  };

/*
  this.getVersion = function() {
    var details = chrome.app.getDetails();
    return details.version;
  };
*/

  this.getSetting = function(setting) {
    if (availableSettings[setting] !== undefined) {
      return self.normalizeSetting(settingsDataAccessor.getSetting(setting), availableSettings[setting]);
    }
    return null;
  };

  this.saveSetting = function(setting, value) {
    settingsDataAccessor.saveSetting(setting, value);
  };

  this.getAllSettings = function() {
    var setting, result = {};
    for (setting in availableSettings) {
      if (typeof availableSettings[setting] !== "function") {
        result[setting] = self.getSetting(setting);
      }
    }
    return result;
  };

  this.init = function(callback) {
    settingsDataAccessor.init(callback);
  };
}