/*jslint plusplus: true, white: true, browser: true */
/*global CvPlsHelper */

(function() {

  'use strict';

  CvPlsHelper.AvatarNotificationManager = function(document, notificationStack, notificationDisplayFactory, pluginSettings) {
    this.document = document;
    this.notificationStack = notificationStack;
    this.notificationDisplay = notificationDisplayFactory.create(this);
    this.pluginSettings = pluginSettings;
  };

  // Adds a post to the queue
  CvPlsHelper.AvatarNotificationManager.prototype.enqueue = function(post) {
    var existingPost, self = this;
    if (this.pluginSettings.getSetting('avatarNotification') && !post.isOwnPost) {
      existingPost = this.notificationStack.match('postId', post.postId);
      if (this.notificationStack.contains(post)) {
        this.notificationStack.remove(post); // move notification to head of queue
        this.notificationStack.push(post);
      } else if (existingPost) {
        this.notificationStack.replace(existingPost, post);
      } else {
        this.notificationStack.push(post);
        this.updateNotificationDisplay();
      }
    }
  };

  // Removes a post from the queue by post ID
  CvPlsHelper.AvatarNotificationManager.prototype.dequeue = function(post) {
    this.notificationStack.remove(post);
    this.updateNotificationDisplay();
  };

  // Checks that all posts in the queue are still on the DOM
  CvPlsHelper.AvatarNotificationManager.prototype.reconcileQueue = function() {
    var document = this.document;
    this.notificationStack.forEach(function(post) {
      if (document.getElementById('message-'+post.postId) === null) {
        this.remove(post);
      }
    });

    this.updateNotificationDisplay();
  };

  CvPlsHelper.AvatarNotificationManager.prototype.updateNotificationDisplay = function() {
    this.notificationDisplay.update(this.notificationStack.length());
  };

  // Moves the screen to the last cv request on the stack (click handler for notification box)
  CvPlsHelper.AvatarNotificationManager.prototype.navigateToLastRequest = function() {
    var post = this.notificationStack.pop();
    if (post) {
      post.scrollTo();
      this.updateNotificationDisplay();
    }
  };

}());