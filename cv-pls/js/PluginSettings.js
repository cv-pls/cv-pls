/*jslint plusplus: true, white: true, browser: true */
/*global chrome */

function PluginSettings(settings) {

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

  this.getVersion = function() {
    var details = chrome.app.getDetails();
    return details.version;
  };

  this.getSetting = function(setting) {
    return settings.getSettingNormalized(setting, availableSettings[setting]);
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

  this.saveAllSettings = function(settingsJsonString) {
    var setting;
    for (setting in availableSettings) {
      if (typeof availableSettings[setting] !== "function") {
        if (typeof availableSettings[setting] === "object") {
          settings.saveSetting(setting, JSON.stringify(settingsJsonString[setting]));
        } else {
          settings.saveSetting(setting, settingsJsonString[setting]);
        }
      }
    }
  };
}