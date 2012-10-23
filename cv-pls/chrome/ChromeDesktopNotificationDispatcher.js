/*jslint plusplus: true, white: true, browser: true */
/*global chrome */

function ChromeDesktopNotificationDispatcher() {

  "use strict";

  this.dispatch = function(title, message) {
    chrome.extension.sendRequest({method: 'showNotification', title: title, message: message}, function(){});
  };

}