/*jslint plusplus: true, white: true, browser: true */
/*global CvPlsHelper */

// This whole object is kind of pointless
// It's only really here as an LoD buffer
// I still can't decide if it's actually necessary
(function() {

  'use strict';

  CvPlsHelper.VoteRemoveProcessor = function(pluginSettings, avatarNotification) {
    this.pluginSettings = pluginSettings;
    this.avatarNotification = avatarNotification;
  };

  CvPlsHelper.VoteRemoveProcessor.prototype.removeLost = function(post) {
    if (this.pluginSettings.getSetting("removeLostNotifications")) {
      this.avatarNotification.dequeue(post.id);
      this.avatarNotification.reconcileQueue();
    }
  };

}());