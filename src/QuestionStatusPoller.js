/*jslint plusplus: true, white: true, browser: true */
/*global CvPlsHelper */

(function() {

  'use strict';

  CvPlsHelper.QuestionStatusPoller = function(pluginSettings, postsOnScreen, bufferFactory, pollQueueProcessor) {
    this.pluginSettings = pluginSettings;
    this.postsOnScreen = postsOnScreen;
    this.bufferFactory = bufferFactory;
    this.pollQueueProcessor = pollQueueProcessor;
  };

  CvPlsHelper.QuestionStatusPoller.prototype.timeout = null;

  CvPlsHelper.QuestionStatusPoller.prototype.poll = function() {
    var outstandingRequests;
    outstandingRequests = this.postsOnScreen.matchAll('isOutstandingRequest', true);
    if (outstandingRequests.length > 0) {
      this.clearSchedule();
      while (outstandingRequests.length > 0) {
        this.pollQueueProcessor.processQueue(this.bufferFactory.create(outstandingRequests));
      }
      this.schedulePoll();
    }
  };

  CvPlsHelper.QuestionStatusPoller.prototype.schedulePoll = function() {
    var self = this;
    if (this.pluginSettings.getSetting('pollCloseStatus') && this.pluginSettings.getSetting('pollInterval') > 0) {
      this.timeout = setTimeout(function() {
        self.poll.call(self);
      }, this.pluginSettings.getSetting('pollInterval') * 60000);
    }
  };

  CvPlsHelper.QuestionStatusPoller.prototype.clearSchedule = function() {
    if (this.timeout !== null) {
      clearTimeout(this.timeout);
      this.timeout = null;
    }
  };

}());