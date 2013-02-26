/*jslint plusplus: true, white: true, browser: true */
/*global CvPlsHelper */

/**
 * Intermediary for calling the Stack API when polling for question data
 */
(function() {

  'use strict';

  /**
   * Convert a buffer of posts to an array of question IDs
   *
   * @param CvPlsHelper.Collection voteRequestBuffer Buffer of posts
   *
   * @return Array List of question IDs
   */
  function getQuestionIdsFromBuffer(buffer) {
    var result = [];

    buffer.forEach(function(post) {
      if (post.questionId > 0 && result.indexOf(post.questionId) < 0) {
        result.push(post.questionId);
      }
    });

    return result;
  }

  /**
   * Constructor
   *
   * @param CvPlsHelper.StackAPI             stackApi             Stack API consumer object
   * @param CvPlsHelper.ApiResponseProcessor apiResponseProcessor Object for handling the API response
   */
  CvPlsHelper.VoteQueueProcessor = function(stackApi, apiResponseProcessor) {
    this.stackApi = stackApi;
    this.apiResponseProcessor = apiResponseProcessor;
  };

  /**
   * Process a queue of posts
   *
   * @param CvPlsHelper.Collection voteRequestBuffer Buffer of posts to poll for data
   */
  CvPlsHelper.VoteQueueProcessor.prototype.processQueue = function(voteRequestBuffer) {
    var questionIds, self = this;

    if (voteRequestBuffer.length()) {
      questionIds = getQuestionIdsFromBuffer(voteRequestBuffer);
      
      this.stackApi.makeRequest({
        type: 'questions',
        ids: questionIds,
        query: { site: 'stackoverflow' },
        success: function(response) {
          self.apiResponseProcessor.processResponse(voteRequestBuffer, response);
        },
        error: function(e, xhr) {
          console.log(e);
          console.log(xhr);
        }
      });
    }
  };

}());