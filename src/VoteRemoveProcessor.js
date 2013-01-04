/*jslint plusplus: true, white: true, browser: true */
/*global CvPlsHelper */

(function() {

  'use strict';

  CvPlsHelper.VoteRemoveProcessor = function(pluginSettings, avatarNotification) {
    this.pluginSettings = pluginSettings;
    this.avatarNotification = avatarNotification;
  };

  CvPlsHelper.VoteRemoveProcessor.prototype.reconcilePending = false;

  CvPlsHelper.VoteRemoveProcessor.prototype.reconcileQueue = function() {
    var self = this;
    if (!this.reconcilePending) {
      this.reconcilePending = true;
      setTimeout(function() {
        self.avatarNotification.reconcileQueue.call(self.avatarNotification);
        self.reconcilePending = false;
      }, 0);
    }
  };

  CvPlsHelper.VoteRemoveProcessor.prototype.remove = function(post) {
    this.avatarNotification.dequeue(post);
    this.reconcileQueue();
  };

  CvPlsHelper.VoteRemoveProcessor.prototype.removeLost = function(post) {
    if (this.pluginSettings.getSetting('removeLostNotifications')) {
      this.remove(post);
    }
  };

}());