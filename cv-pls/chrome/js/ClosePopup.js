CvPlsHelper.chrome.ClosePopup = function(pluginSettings) {
  var self = this;

  this.init = function() {
    if (!self.isLoaded()) {
      setTimeout(self.init, 100);
    } else {
      self.enhancePopup();
    }
  };

  this.isLoaded = function() {
    if ($('#duplicate-question').length) {
      return true;
    }

    return false;
  };

  this.enhancePopup = function() {
    if (!pluginSettings.getSetting('dupesEnabled')) {
      return;
    }

    $('#pane1').css('position', 'relative');

    var html = '';
    html += '<div class="cvhelper-dupeselector" style="border: 1px solid black; height: 22px; width: 22px; position: absolute; top: 35px; right: 0; cursor: pointer;">';
    html += '  <img src="'+chrome.extension.getURL('ui/bullet_arrow_down.png')+'" alt="" title="" style="top: 3px; left: 4px; position: relative;">';
    html += '</div>';

    $('#pane1').append(html);
  };

};