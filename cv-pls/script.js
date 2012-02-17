(function() {
  chrome.extension.sendRequest({method: "getLocalStorage", key: "tags"}, function(response) {
    var tags_string = response.data;
    var tags_array = tags_string.split(' ');

    // page with questions overview
    if ($('body.questions-page').length) {
      chrome.extension.sendRequest({method: "showIcon"}, function(response) {});

      $('.question-summary').each(function() {
        if ($('.tags', this).is('.' + tags_array.join(', .'))) {
          var question = $(this);
          var url = $('h3 a', question).attr('href');

          question.html('<a href="/questions/tagged/cv-pls" class="post-tag">cv-pls</a> ' + 'http://stackoverflow.com' + url);
        }
      });
    }

    // page of question
    if ($('body.question-page').length) {
      chrome.extension.sendRequest({method: "showIcon"}, function(response) {});

      var question = $('#question');
      $('.post-taglist .post-tag', question).each(function() {
        var normalized_tag = 't-' + $(this).html();
        var length = tags_array.length;

        for(var i = 0; i < length; i++) {
          if (normalized_tag == tags_array[i]) {
            $('.post-menu', question).append('<span class="lsep">|</span><a href="#">cv-pls in chat</a>');
          }
        }
      });
    }
  });
})(jQuery);