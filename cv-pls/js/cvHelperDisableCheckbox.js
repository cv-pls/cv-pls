// jQuery plugin because I am lazy
// TODO: implement this in vanilla JS, generally make less crap

(function($) {
  jQuery.fn.cvHelperToggleInput = function(enable) {
    return this.each(function() {
      $(this).prop('disabled', !enable);
      if (enable) {
        $(this).siblings('span').removeClass('disabled');
      } else {
        $(this).siblings('span').addClass('disabled');
      }
    });
  };
}(jQuery));
