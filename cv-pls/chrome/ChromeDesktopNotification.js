/*jslint plusplus: true, white: true, browser: true */
/*global chrome, webkitNotifications */

function ChromeDesktopNotification(pluginSettings) {

  this.buildNotification = function(title, message) {
    this.notification = webkitNotifications.createNotification(
      chrome.extension.getURL('img/icon48.png'),
      title,
      message
    );

    this.notification = webkitNotifications.createHTMLNotification(
      'notification.html'
    );
  };

  this.show = function() {
    if (!pluginSettings.getSetting("desktopNotification")) {
      return null;
    }

    this.notification.show();
  }.bind(this);
}