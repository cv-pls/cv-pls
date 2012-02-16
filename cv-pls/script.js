(function() {
  if ($('#questions').length) {
    $('.question-summary').each(function() {
      if ($('.tags', this).hasClass('t-php')) {
        var question = $(this);
        var url = $('h3 a', question).attr('href');

        question.html('<a href="#" class="post-tag">cv-pls</a> ' + 'http://stackoverflow.com' + url);
      }
    });
  }
})(jQuery);