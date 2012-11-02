/*jslint plusplus: true, white: true, browser: true */
/*global chrome */

CvPlsHelper.chrome.DesktopNotificationDispatcher = function(pluginSettings) {

  "use strict";

  this.dispatch = function(title, message) {
    if (pluginSettings.getSetting('desktopNotification')) {
      chrome.extension.sendMessage({
        method: 'showNotification',
        title: title,
        message: message
      });
    }
  };

};