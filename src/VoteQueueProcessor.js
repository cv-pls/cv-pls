/*jslint plusplus: true, white: true, browser: true */
/*global CvPlsHelper */

(function() {

  'use strict';

  function makeRequest(voteRequestBuffer) {
    this.stackApi.makeRequest('questions', voteRequestBuffer, 'stackoverflow.com', '!6LE4b5o5yvdNA', this.voteRequestProcessor.processResponse);
  }

  CvPlsHelper.VoteQueueProcessor = function(stackApi, voteRequestProcessor) {
    this.stackApi = stackApi;
    this.voteRequestProcessor = voteRequestProcessor;
  };

  CvPlsHelper.VoteQueueProcessor.prototype.processQueue = function(voteRequestBuffer) {
    if (voteRequestBuffer.length() > 0) {
      makeRequest.call(this, voteRequestBuffer);
    }
  };

}());