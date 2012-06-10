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
    $('#pane1').css('position', 'relative');

    var html = '';
    html += '<div class="cvhelper-dupeselector" style="border: 1px solid black; height: 22px; width: 22px; position: absolute; top: 35px; right: 0; cursor: pointer;">';
    html += '  <img src="'+chrome.extension.getURL('ui/bullet_arrow_down.png')+'" alt="" title="" style="top: 3px; left: 4px; position: relative;">';
    html += '</div>';

    $('#pane1').append(html);
  };
}

function DupeSelector(pluginSettings)
{
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
    html+= '   <li style="padding: 3px;"><a href="http://stackoverflow.com/questions/8028957/headers-already-sent-by-php">headers already sent by php</a></li>';
    html+= '   <li style="padding: 3px;"><a href="http://stackoverflow.com/questions/8028957/headers-already-sent-by-php">headers already sent by php</a></li>';
    html+= '   <li style="padding: 3px;"><a href="http://stackoverflow.com/questions/8028957/headers-already-sent-by-php">headers already sent by php</a></li>';
    html+= '   <li style="padding: 3px;"><a href="http://stackoverflow.com/questions/8028957/headers-already-sent-by-php">headers already sent by php</a></li>';
    html+= '   <li style="padding: 3px;"><a href="http://stackoverflow.com/questions/8028957/headers-already-sent-by-php">headers already sent by php</a></li>';
    html+= '   <li style="padding: 3px;"><a href="http://stackoverflow.com/questions/8028957/headers-already-sent-by-php">headers already sent by php</a></li>';
    html+= '   <li style="padding: 3px;"><a href="http://stackoverflow.com/questions/8028957/headers-already-sent-by-php">headers already sent by php</a></li>';
    html+= '   <li style="padding: 3px;"><a href="http://stackoverflow.com/questions/8028957/headers-already-sent-by-php">headers already sent by php</a></li>';
    html+= '   <li style="padding: 3px;"><a href="http://stackoverflow.com/questions/8028957/headers-already-sent-by-php">headers already sent by php</a></li>';
    html+= '   <li style="padding: 3px;"><a href="http://stackoverflow.com/questions/8028957/headers-already-sent-by-php">headers already sent by php</a></li>';
    html+= '   <li style="padding: 3px;"><a href="http://stackoverflow.com/questions/8028957/headers-already-sent-by-php">headers already sent by php</a></li>';
    html+= '  </ul>';
    html+= '</div>';

    $('#pane1').append(html);
  };

  this.hide = function($dupelist) {
    $dupelist.remove();
  };
}

(function($) {
  var settings = new Settings();
  var pluginSettings = new PluginSettings(settings);

  var closePopup = new ClosePopup();
  var dupeSelector = new DupeSelector(pluginSettings);

  chrome.extension.sendRequest({method: 'getSettings'}, function(settingsJsonString) {
    pluginSettings.saveAllSettings(settingsJsonString);

    chrome.extension.sendRequest({method: 'showIcon'}, function(response) { });
    chrome.extension.sendRequest({method: 'checkUpdate'}, function(response) { });

    $(document).on('click', '#close-question-form li:first input[type="radio"]', function() {
      closePopup.init();
    });

    $(document).on('click', '.cvhelper-dupeselector', function() {
      dupeSelector.toggle();
    });

    $(document).on('mouseover', '.cvhelper-dupelist li', function() {
      $(this).css('background', '#f0f8ff').css('cursor', 'pointer');
    });
    $(document).on('mouseout', '.cvhelper-dupelist li', function() {
      $(this).css('background', 'transparent').css('cursor', 'default');
    });

    // Either I'm a total idiot or I'm missing something stupid here. But this doesn't seem to work
    $(document).on('click', '.cvhelper-dupelist li', function() {
      var url = $('a', this).attr('href');

      var $dupeQuestion = $('#duplicate-question');
      $dupeQuestion.val('http://stackoverflow.com/questions/8028957/headers-already-sent-by-php');

      var e = $.Event('keydown', { keyCode: 64 });
      $dupeQuestion.trigger(e);

      return false;
    });
  });
})(jQuery);