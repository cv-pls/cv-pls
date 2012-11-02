CvPlsHelper.VoteRemoveProcessor = function(pluginSettings, avatarNotification) {
  // This whole class is kind of pointless
  // It's only really here as an LoD buffer
  // I still can't decide if it's actually necessary

  "use strict";

  var self = this;

  this.pluginSettings = pluginSettings;
  this.avatarNotification = avatarNotification;

  this.removeLost = function(post) {
    if (pluginSettings.getSetting("removeLostNotifications")) {
      self.avatarNotification.dequeue(post.id);
      self.avatarNotification.reconcileQueue();
    }
  };
};