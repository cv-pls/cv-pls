function SettingsManager(pluginSettings) {
  this.init = function() {
    if (pluginSettings.showIcon()) {
      $('input[name="icon"]').prop('checked', 'checked');
    }

    if (pluginSettings.oneBox()) {
      $('input[name="oneboxcv"]').prop('checked', 'checked');
    } else {
      $('input[name="oneboxheight"]').attr('disabled', true);
    }

    if (pluginSettings.oneBoxHeight() !== null) {
      $('input[name="oneboxheight"]').val(pluginSettings.oneBoxHeight());
    }
  }
}

(function($) {
  var settings = new Settings();
  var pluginSettings = new PluginSettings(settings);
  var settingsManager = new SettingsManager(pluginSettings);
  settingsManager.init();

  $('input[name="icon"]').change(function() {
    settings.saveSetting('showIcon', $(this).prop('checked'));
  });

  $('input[name="oneboxcv"]').change(function() {
    var checked = $(this).prop('checked');
    settings.saveSetting('oneBox', checked);

    if (checked) {
        $(':input[name="oneboxheight"]').removeAttr('disabled');
    } else {
        $(':input[name="oneboxheight"]').attr('disabled', true);
    }
  });

  $('input[name="oneboxheight"]').keyup(function() {
    settings.saveSetting('oneBoxHeight', $(this).val());
  });
})(jQuery);