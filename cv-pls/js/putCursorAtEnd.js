// jQuery plugin: PutCursorAtEnd 1.0
// http://plugins.jquery.com/project/PutCursorAtEnd
// by teedyay
//
// Puts the cursor at the end of a textbox/ textarea

// codesnippet: 691e18b1-f4f9-41b4-8fe8-bc8ee51b48d4
(function($) {
  jQuery.fn.putCursorAtEnd = function() {
    return this.each(function() {
      $(this).focus()

      if (this.setSelectionRange) {
        var len = $(this).val().length * 2;
        this.setSelectionRange(len, len);
      } else {
        $(this).val($(this).val());
      }

      this.scrollTop = 999999;
    });
  };
})(jQuery);