CvPlsHelper.StatusPolling = function(pluginSettings, postFactory, voteRequestBufferFactory, pollMessageQueue, pollQueueProcessor) {

  "use strict";

  var self = this;
  this.postFactory = postFactory;
  this.voteRequestBufferFactory = voteRequestBufferFactory;

  this.pollStatus = function() {
    if (!pluginSettings.getSetting("pollCloseStatus")) {
      return false;
    }
    
    // sorry for the tight coupling
    $('.cvhelper-vote-request').each(function() {
      var post = self.postFactory.create($(this));

      pollMessageQueue.enqueue(post);
    });

    pollQueueProcessor.processQueue(self.voteRequestBufferFactory.create(pollMessageQueue));

    setTimeout(self.pollStatus, pluginSettings.getSetting("pollInterval")*60000);
  };
};