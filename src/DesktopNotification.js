/*jslint plusplus: true, white: true, browser: true */
/*global CvPlsHelper */

(function() {

  'use strict';

  CvPlsHelper.DesktopNotification = function(pluginSettings, desktopNotificationDispatcher) {
    this.pluginSettings = pluginSettings;
    this.desktopNotificationDispatcher = desktopNotificationDispatcher;
  };

  CvPlsHelper.DesktopNotification.prototype.show = function(title, message) {
    if (!this.pluginSettings.getSetting("desktopNotification")) {
      return null;
    }

    this.desktopNotificationDispatcher.dispatch(title, message);
  };

}());