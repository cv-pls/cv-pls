CvPlsHelper.chrome.DupeSelector = function(pluginSettings) {
  this.toggle = function() {
    var $dupelist = $('.cvhelper-dupelist');

    if ($dupelist.length) {
      this.hide($dupelist);
    } else {
      this.show();
    }
  }.bind(this);

  this.show = function() {
    html = '';
    html+= '<div class="cvhelper-dupelist" style="position: absolute; top: 60px; left: 0; border: 1px solid gray; width: 660px; background: white;">';
    html+= '  <ul style="margin: 0; padding: 0; list-style: none;">';

    var dupes = pluginSettings.dupesList();
    var max = dupes.length;

    for (i = 0; i < max; i++) {
      html+= '   <li style="padding: 3px;"><a href="' + dupes[i].url + '">' + dupes[i].title + '</a></li>';
    }
    html+= '  </ul>';
    html+= '</div>';

    $('#pane1').append(html);
  };

  this.hide = function($dupelist) {
    $dupelist.remove();
  };

};