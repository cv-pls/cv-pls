CvPlsHelper.StatusPolling = function(document, pluginSettings, postFactory, voteRequestBufferFactory, pollMessageQueue, pollQueueProcessor) {

  "use strict";

  var self = this;
  this.postFactory = postFactory;
  this.voteRequestBufferFactory = voteRequestBufferFactory;

  this.pollStatus = function() {
    if (!pluginSettings.getSetting("pollCloseStatus")) {
      return false;
    }
    
    $('.cvhelper-vote-request', document).each(function() {
      pollMessageQueue.enqueue(self.postFactory.create($(this)));
    });

    pollQueueProcessor.processQueue(self.voteRequestBufferFactory.create(pollMessageQueue));

    setTimeout(self.pollStatus, pluginSettings.getSetting("pollInterval") * 60000);
  };
};