/*jslint plusplus: true, white: true, browser: true, devel: true */
/*global CvPlsHelper, $ */

(function() {

  "use strict";

  var baseUrl = 'http://api.stackexchange.com/2.0/',
      apiKey = 'ILSB6JuDQcCfYhS7KP2lqQ((',
      requestMethods = {
        questions: {
          urlPath: 'questions/'
        }
      };

  function getQuestionIdsFromBuffer(buffer) {
    var result = [];
    buffer.forEach(function(post) {
      if (post.questionId > 0 && result.indexOf(post.questionId) < 0) {
        result.push(post.questionId);
      }
    });
    return result;
  }

  CvPlsHelper.StackApi = function(collectionFactory) {
    this.collectionFactory = collectionFactory;
  };

  CvPlsHelper.StackApi.prototype.makeRequest = function(type, buffer, site, filter, callBack) {
    var questionIds, query, url, xhr, response;
    
    questionIds = getQuestionIdsFromBuffer(buffer);
    if (!questionIds.length) {
      return;
    }

    query = "?site=" + site
          + "&filter=" + filter
          + "&pagesize=" + questionIds.length
          + "&key=" + apiKey;
    url = baseUrl + requestMethods[type].urlPath + questionIds.join(';') + query;

    xhr = new XMLHttpRequest();
    xhr.open('GET', url, true);
    xhr.onreadystatechange = function() {
      if (xhr.readyState === 4) {
        try {
          response = this.collectionFactory.create();
          response.items = JSON.parse(xhr.responseText).items;
          callBack(buffer, response);
        } catch(e) {
          // If we get here, something is probably wrong Stack Exchange and chances are chat won't be working either.
          console.log('Something went *badly* wrong. Shit happens.');
        }
      }
    };
    xhr.send(null);
  };

}());