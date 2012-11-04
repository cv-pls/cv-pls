/*jslint plusplus: true, white: true, browser: true */
/*global $ */

CvPlsHelper.StackApi = function() {

  "use strict";

  var self = this;

  this.baseUrl = 'http://api.stackexchange.com/2.0/';
  this.requestMethods = {
    questions: {
      urlPath: 'questions/'
    }
  };

  this.makeRequest = function(type, buffer, site, filter, responseProcessor) {
    var url, requestData, requestSettings;

    url = self.baseUrl + self.requestMethods[type].urlPath + self.parseIds(buffer.questionIds);
    requestData = {
      site: site,
      filter: filter,
      pagesize: buffer.items,
      key: 'ILSB6JuDQcCfYhS7KP2lqQ(('
    };
    requestSettings = {
      url: url,
      data: requestData,
      error: function() {
        // request error, this should be taken care of :)
        // e.g. request quota reached
      },
      success: function(data) {
        if (data.items !== undefined && data.items.length) {
          responseProcessor.process(buffer, data.items);
        }
      }
    };

    $.ajax(requestSettings);
  };

  this.parseIds = function(ids) {
    return ids.join(';');
  };

};