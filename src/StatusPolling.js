CvPlsHelper.StatusPolling = function(document, pluginSettings, postFactory, voteRequestBufferFactory, pollMessageQueue, pollQueueProcessor) {

  "use strict";

  var self, timeout;

  self = this;
  timeout = null;

  function pollStatus() {
    if (!pluginSettings.getSetting('pollCloseStatus')) {
      return false;
    }
    
    $('.cvhelper-vote-request', document).each(function() {
      pollMessageQueue.enqueue(postFactory.create($(this)));
    });

    pollQueueProcessor.processQueue(voteRequestBufferFactory.create(pollMessageQueue));

    if (timeout !== null) {
      timeout = setTimeout(pollStatus, pluginSettings.getSetting('pollInterval') * 60000);
    }
  }

  this.start = function() {
     // Wait 1 minute before polling to prevent getting kicked from stack api
     timeout = setTimeout(pollStatus, 60000);
  };

  this.stop = function() {
    if (timeout !== null) {
      clearTimeout(timeout);
      timeout = null;
    }
  };

};