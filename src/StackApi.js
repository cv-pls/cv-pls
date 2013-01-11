/*jslint plusplus: true, white: true, browser: true, devel: true */
/*global CvPlsHelper */

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
  function buildQueryString(map, prefix) {
    var key, result = [];
    prefix = prefix || false;
    function getPrefix() {
      return prefix ? prefix+'['+key+']' : key;
    }

    for (key in map) {
      if (map.hasOwnProperty(key)) {
        if (typeof map[key] === 'object') {
          result.push(buildQueryString(map[key], getPrefix()));
        } else {
          result.push(encodeURIComponent(getPrefix()) + '=' + encodeURIComponent(map[key]));
        }
      }
    }

    return result.join('&');
  }

  CvPlsHelper.StackApi = function(collectionFactory) {
    this.collectionFactory = collectionFactory;
  };

  CvPlsHelper.StackApi.prototype.makeRequest = function(type, buffer, site, filter, apiResponseProcessor) {
    var questionIds, query, url, xhr, self = this;

    questionIds = getQuestionIdsFromBuffer(buffer);
    if (!questionIds.length) {
      return;
    }

    query = {
      site: site,
      filter: filter,
      pagesize: questionIds.length,
      key: apiKey
    };
    url = baseUrl + requestMethods[type].urlPath + questionIds.join(';') + '?' + buildQueryString(query);

    xhr = new XMLHttpRequest();
    xhr.open('GET', url, true);
    xhr.onreadystatechange = function() {
      var response;
      if (xhr.readyState === 4) {
        try {
          response = self.collectionFactory.create();
          response.items = JSON.parse(xhr.responseText).items;
        } catch(e) {
          // If we get here, something is probably wrong at Stack Exchange and chances are chat won't be working either.
          return;
        }
        apiResponseProcessor.processResponse(buffer, response);
      }
    };
    xhr.send(null);
  };

}());