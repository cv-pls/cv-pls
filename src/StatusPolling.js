/*jslint plusplus: true, white: true, browser: true */
/*global CvPlsHelper */

(function() {

  'use strict';

  function pollStatus() {
    var self = this;

    if (this.pluginSettings.getSetting('pollCloseStatus') && this.pluginSettings.getSetting('pollInterval') > 0) {
      this.postsOnScreen.forEach(function(post) {
        this.pollMessageQueue.enqueue(post);
      }, this);

      this.pollQueueProcessor.processQueue(this.voteRequestBufferFactory.create(this.pollMessageQueue));

      if (this.timeout !== null) {
        this.timeout = setTimeout(function() {
          pollStatus.call(self);
        }, this.pluginSettings.getSetting('pollInterval') * 60000);
      }
    }
  }

  CvPlsHelper.StatusPolling = function(pluginSettings, postsOnScreen, voteRequestBufferFactory, pollMessageQueue, pollQueueProcessor) {
    this.pluginSettings = pluginSettings;
    this.postsOnScreen = postsOnScreen;
    this.voteRequestBufferFactory = voteRequestBufferFactory;
    this.pollMessageQueue = pollMessageQueue;
    this.pollQueueProcessor = pollQueueProcessor;
  };

  CvPlsHelper.StatusPolling.prototype.timeout = null;

  CvPlsHelper.StatusPolling.prototype.start = function() {
    var self = this;
    // Wait 1 minute before polling to prevent getting kicked from stack api
    this.timeout = setTimeout(function() {
      pollStatus.call(self);
    }, 60000);
  };

  CvPlsHelper.StatusPolling.prototype.stop = function() {
    if (this.timeout !== null) {
      clearTimeout(this.timeout);
      this.timeout = null;
    }
  };

}());