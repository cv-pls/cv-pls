/*jslint plusplus: true, white: true, browser: true */
/*global CvPlsHelper */

(function() {

  'use strict';

  CvPlsHelper.AvatarNotificationDisplayFactory = function(document) {
    this.document = document;
  };

  CvPlsHelper.AvatarNotificationDisplayFactory.prototype.create = function(notificationManager) {
    return new CvPlsHelper.AvatarNotificationDisplay(this.document, notificationManager);
  };

}());