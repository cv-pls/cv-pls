/*jslint plusplus: true, white: true, browser: true */
/*global chrome, webkitNotifications */

CvPlsHelper.chrome.DesktopNotificationManager = function() {

  "user strict";

  var self = this,
      notification = null;

  this.build = function(title, message) {
    notification = webkitNotifications.createNotification(chrome.extension.getURL('img/icon48.png'), title, message);
    notification.onclose = function() {
      notification = null;
    };
  };

  this.show = function() {
    if (notification !== null) {
      self.notification.show();
    }
  };

};