/*jslint plusplus: true, white: true, browser: true */
/*global CvPlsHelper */

(function() {

  "use strict";

  // Constructor
  CvPlsHelper.PostFactory = function(document, pluginSettings, chatRoom, oneBoxFactory, avatarNotificationManager, animatorFactory) {
    this.document = document;
    this.pluginSettings = pluginSettings;
    this.chatRoom = chatRoom;
    this.oneBoxFactory = oneBoxFactory;
    this.avatarNotificationManager = avatarNotificationManager;
    this.animatorFactory = animatorFactory;
  };

  // Factory method
  CvPlsHelper.PostFactory.prototype.create = function(element) {
    return new CvPlsHelper.Post(this.document, this.pluginSettings, this.chatRoom, this.oneBoxFactory, this.avatarNotificationManager, this.animatorFactory, element);
  };

}());