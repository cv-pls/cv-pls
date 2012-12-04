/*jslint plusplus: true, white: true, browser: true */
/*global CvPlsHelper, $ */

(function() {

  'use strict';

  CvPlsHelper.StatusRequestProcessor = function(pluginSettings, voteRequestFormatter, avatarNotificationManager) {
    this.pluginSettings = pluginSettings;
    this.voteRequestFormatter = voteRequestFormatter;
    this.avatarNotificationManager = avatarNotificationManager;
  };


  CvPlsHelper.StatusRequestProcessor.prototype.processResponse = function(buffer, response) {
    buffer.forEach(function(post) {
      var $title;

      post.questionData = response.match(post.questionId);

      if (post.questionData) {
        if (post.questionData.closed_date !== undefined) { // question is closed

          if (post.voteType === post.voteTypes.CV) {
            if (this.pluginSettings.getSetting('removeCompletedNotifications')) {
              this.avatarNotificationManager.dequeue(post);
            }
            if (this.pluginSettings.getSetting('removeCompletedOneboxes')) {
              post.removeOneBox();
            }
            if (this.pluginSettings.getSetting('strikethroughCompleted')) {
              post.strikethrough();
            }
          }

          if (this.pluginSettings.getSetting('showCloseStatus') && !post.$post.hasClass('cvhelper-closed')) {
            $title = $('.onebox .cvhelper-question-link', post.$post);
            $title.html($title.html() + ' [closed]');
            post.$post.addClass('cvhelper-closed');
          }
        }

      } else { // question is deleted

        if (this.pluginSettings.getSetting('removeCompletedNotifications')) {
          this.avatarNotificationManager.dequeue(post);
        }
        if (this.pluginSettings.getSetting('removeCompletedOneboxes')) {
          post.removeOneBox();
        }
        if (this.pluginSettings.getSetting('strikethroughCompleted')) {
          post.strikethrough();
        }

      }
    }, this);
  };

}());