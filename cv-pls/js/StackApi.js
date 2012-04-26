function StackApi() {
  var self = this;

  this.baseUrl = 'https://api.stackexchange.com/2.0/';
  this.requestMethods = {
    questions: {
      urlPath: 'questions/'
    }
  };

  this.makeRequest = function(type, buffer, site, filter, responseProcessor) {
    var url = self.baseUrl + self.requestMethods[type].urlPath + self.parseIds(buffer.questionIds);
    var requestData = {
      site: site,
      filter: filter,
      pagesize: buffer.items,
      key: 'ILSB6JuDQcCfYhS7KP2lqQ(('
    };
    var requestSettings = {
        url: url,
        data: requestData,
        error: function(jqHr, status, error) {
          // request error, this should be taken care of :)
          // e.g. request quota reached
        },
        success: function(data, status, jqHr) {
            if (data.items == undefined || data.items.length == 0) {
                // questions deleted?
                return;
            }
            responseProcessor.process(buffer, data.items);
        }
    }
    $.ajax(requestSettings);
  };

  this.parseIds = function(ids) {
    return ids.join(';');
  };
}