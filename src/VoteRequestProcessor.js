/*jslint plusplus: true, white: true */
/*global CvPlsHelper */

(function() {

  'use strict';

  CvPlsHelper.VoteRequestProcessor = function(pluginSettings, voteRequestFormatter, audioPlayer, avatarNotificationManager) {
    this.pluginSettings = pluginSettings;
    this.voteRequestFormatter = voteRequestFormatter;
    this.audioPlayer = audioPlayer;
    this.avatarNotificationManager = avatarNotificationManager;
  };

  CvPlsHelper.VoteRequestProcessor.prototype.processResponse = function(buffer, response) {
    var newQuestions = false;

    buffer.forEach(function(post) {
      post.questionData = response.match(post.questionId);

      if (!post.questionData) { // Question is deleted

        if (!this.pluginSettings.getSetting('removeCompletedNotifications')) {
          this.avatarNotificationManager.enqueue(post);
        }
        if (this.pluginSettings.getSetting('strikethroughCompleted')) {
          post.strikethrough();
        }

      } else if (post.questionData.closed_date !== undefined) { // Question is closed

        newQuestions = true;

        if (post.voteType === post.voteTypes.DELV) {
          this.avatarNotificationManager.enqueue(post);

          if (this.pluginSettings.getSetting('oneBox')) {
            post.addOnebox();
          }
        } else {
          if (!this.pluginSettings.getSetting('removeCompletedNotifications')) {
            this.avatarNotificationManager.enqueue(post);
          }

          if (this.pluginSettings.getSetting('oneBox') && !this.pluginSettings.getSetting('removeCompletedOneboxes')) {
            post.addOnebox();
          }

          if (this.pluginSettings.getSetting('strikethroughCompleted')) {
            post.strikethrough();
          }
        }

      } else { // Question is open
        newQuestions = true;
        this.avatarNotificationManager.enqueue(post);

        if (this.pluginSettings.getSetting('oneBox')) {
          post.addOnebox();
        }
      }

    }, this);

    if (newQuestions && this.pluginSettings.getSetting('soundNotification')) {
      this.audioPlayer.playNotification();
    }
    // enable audioplayer after initial load
    this.audioPlayer.enable();
  };

}());