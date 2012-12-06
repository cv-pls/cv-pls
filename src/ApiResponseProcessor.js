/*jslint plusplus: true, white: true */
/*global CvPlsHelper */

(function() {

  'use strict';

  CvPlsHelper.ApiResponseProcessor = function(pluginSettings, audioPlayer) {
    this.pluginSettings = pluginSettings;
    this.audioPlayer = audioPlayer;
  };

  CvPlsHelper.ApiResponseProcessor.prototype.processResponse = function(buffer, response) {
    var notify = false;

    buffer.forEach(function(post) {
      post.setQuestionData(response.match('question_id', post.questionId));
      if (post.hasPendingNotification) {
        post.hasPendingNotification = false;
        notify = true;
      }
    });

    if (this.audioPlayer.enabled) {
      if (notify && this.pluginSettings.getSetting('soundNotification')) {
        this.audioPlayer.playNotification();
      }
    } else if (this.pluginSettings.getSetting('soundNotification')) {
      // enable audioplayer after initial load
      this.audioPlayer.enable();
    }
  };

}());