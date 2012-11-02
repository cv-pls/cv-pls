CvPlsHelper.DesktopNotification = function(pluginSettings, desktopNotificationDispatcher) {

  "use strict";

  this.show = function(title, message) {
    if (!pluginSettings.getSetting("desktopNotification")) {
      return null;
    }

    desktopNotificationDispatcher.dispatch(title, message);
  };

};