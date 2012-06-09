function ClosePopup() {
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
    //$('#duplicate-question').wrap('<div class="cvhelper-dupe-url" style="position: relative;"></div>');
    //$('#duplicate-question').before('<div class="cvhelper-dupe-url" style="position: relative;">').after('</div>');
    $('#pane1').css('position', 'relative');

    var html = '';
    html += '<div style="border: 1px solid black; height: 22px; width: 22px; position: absolute; top: 35px; right: 0; cursor: pointer;">';
    html += '  <img src="'+chrome.extension.getURL('ui/bullet_arrow_down.png')+'" alt="" title="" style="top: 3px; left: 4px; position: relative;">';
    html += '</div>';

    $('#pane1').append(html);
  };
}

(function($) {
  var settings = new Settings();
  var pluginSettings = new PluginSettings(settings);

  var closePopup = new ClosePopup();

  chrome.extension.sendRequest({method: 'getSettings'}, function(settingsJsonString) {
    pluginSettings.saveAllSettings(settingsJsonString);

    chrome.extension.sendRequest({method: 'showIcon'}, function(response) { });
    chrome.extension.sendRequest({method: 'checkUpdate'}, function(response) { });

    $(document).on('click', '#close-question-form li:first input[type="radio"]', function() {
      closePopup.init();
    });
  });
})(jQuery);