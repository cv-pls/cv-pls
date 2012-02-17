function does_match(needle, haystack) {
  var end_pos = needle.lastIndexOf('/')

  var pattern = needle.substr(1, end_pos-1);

  if (end_pos == needle.length-1) {
    var regex = new RegExp(pattern);
  } else {
    var modifiers = needle.substr(end_pos+1);
    var regex = new RegExp(pattern, modifiers);
  }

  if (regex.test(haystack)) {
      return true;
  }

  return false;
}

(function() {
  chrome.extension.sendRequest({method: "getLocalStorage", key: "tags"}, function(response) {
    var tags_string = response.data;

    chrome.extension.sendRequest({method: "getLocalStorage", key: "filters"}, function(response) {
      var tags_array = tags_string.split(' ');

      var filters_string = response.data;
      var filters_array = filters_string.split('\n');

      // page with questions overview
      if ($('body.questions-page, body.home-page, body.search-page').length) {
        chrome.extension.sendRequest({method: "showIcon"}, function(response) {});

        $('.question-summary').each(function() {
          if ($('.tags', this).is('.' + tags_array.join(', .'))) {
            var question = $(this);
            var url = $('h3 a', question).attr('href');
            var question_summary = question.children('.summary');

            var title = $('h3 a', question_summary).text();

            var length = filters_array.length;
            for(var i = 0; i < length; i++) {
              if (does_match(filters_array[i], title)) {
                $('h3 a', question_summary).html($('h3 a', question_summary).html() + ' {CV SUSPECT}');
                break;
              }
            }
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
  });
})(jQuery);