(function() {
  chrome.extension.sendRequest({method: "getLocalStorage", key: "tags"}, function(response) {
    var tags_string = response.data;
    var tags_array = tags_string.split(' ');

    if ($('#questions').length) {
      chrome.extension.sendRequest({method: "showIcon"}, function(response) {});

      $('.question-summary').each(function() {
        if ($('.tags', this).is('.' + tags_array.join(', .'))) {
          var question = $(this);
          var url = $('h3 a', question).attr('href');

          question.html('<a href="/questions/tagged/cv-pls" class="post-tag">cv-pls</a> ' + 'http://stackoverflow.com' + url);
        }
      });
    }
  });
})(jQuery);