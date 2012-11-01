/*jslint plusplus: true, white: true, browser: true */
/*global jQuery, SettingsDataStore, ChromeContentSettingsDataAccessor, PluginSettings, ClosePopup, DupeSelector, chrome */

(function($) {
  var settingsDataStore, settingsDataAccessor, pluginSettings,
      closePopup, dupeSelector;

  settingsDataStore = new SettingsDataStore();
  settingsDataAccessor = new ChromeContentSettingsDataAccessor(settingsDataStore);
  pluginSettings = new PluginSettings(settingsDataAccessor);

  closePopup = new ClosePopup(pluginSettings);
  dupeSelector = new DupeSelector(pluginSettings);

  pluginSettings.init(function() {
    chrome.extension.sendMessage({method: 'showIcon'});
    chrome.extension.sendMessage({method: 'checkUpdate'});

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
    // Either way I need to find a way to force the SO JS to retrieve the question data
    $(document).on('click', '.cvhelper-dupelist li', function() {
      var url, $dupeQuestion, e;

      url = $('a', this).attr('href');

      dupeSelector.toggle();

      $dupeQuestion = $('#duplicate-question');
      $dupeQuestion.val(url);

      e = $.Event('keydown', { keyCode: 13 });
      $dupeQuestion.trigger(e);

      $dupeQuestion.putCursorAtEnd();

      $dupeQuestion.focus();

      return false;
    });
  });
}(jQuery));