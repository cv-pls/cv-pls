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

    if (pluginSettings.showCloseStatus()) {
      $('input[name="status"]').prop('checked', 'checked');
    } else {
      $('input[name="poll"]').attr('disabled', true);
      $('input[name="pollinterval"]').attr('disabled', true);
    }

    if (pluginSettings.pollCloseStatus()) {
      $('input[name="poll"]').prop('checked', 'checked');
    } else {
      $('input[name="pollinterval"]').attr('disabled', true);
    }

    $('input[name="pollinterval"]').val(pluginSettings.pollInterval());
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

  $('input[name="status"]').change(function() {
    var checked = $(this).prop('checked');
    settings.saveSetting('showCloseStatus', checked);

    if (checked) {
      var $poll = $('input[name="poll"]');
      $poll.removeAttr('disabled');
      if ($($poll).prop('checked')) {
        $(':input[name="pollinterval"]').removeAttr('disabled');
      } else {
        $(':input[name="pollinterval"]').attr('disabled', true);
      }
    } else {
      $(':input[name="poll"]').attr('disabled', true);
      $(':input[name="pollinterval"]').attr('disabled', true);
    }
  });

  $('input[name="poll"]').change(function() {
    var checked = $(this).prop('checked');
    settings.saveSetting('pollCloseStatus', checked);

    if (checked) {
      $('input[name="pollinterval"]').removeAttr('disabled');
    } else {
      $('input[name="pollinterval"]').attr('disabled', true);
    }
  });

  $('input[name="pollinterval"]').keyup(function() {
    settings.saveSetting('pollInterval', $(this).val());
  });
})(jQuery);