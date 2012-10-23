/*jslint plusplus: true, white: true, browser: true */
/*global $ */

function ClosePopup(pluginSettings) {
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
    if (!pluginSettings.dupesEnabled()) {
      return;
    }

    $('#pane1').css('position', 'relative');

    var html = '';
    html += '<div class="cvhelper-dupeselector" style="border: 1px solid black; height: 22px; width: 22px; position: absolute; top: 35px; right: 0; cursor: pointer;">';
    html += '  <img src="'+chrome.extension.getURL('ui/bullet_arrow_down.png')+'" alt="" title="" style="top: 3px; left: 4px; position: relative;">';
    html += '</div>';

    $('#pane1').append(html);
  };
}

function DupeSelector(pluginSettings) {
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
}

function simulateKeyPress(character) {
  $.event.trigger({ type: 'keypress', which: character.charCodeAt(0) });
}