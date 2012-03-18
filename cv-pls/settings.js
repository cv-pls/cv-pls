function SettingsManager(settings) {
  var self = this;

  this.settings = settings;

  this.init = function() {
    if (settings.isSoundEnabled()) {
      $('input[name="beep"]').prop('checked', 'checked');
    }

    if (settings.isAvatarEnabled()) {
      $('input[name="avatar"]').prop('checked', 'checked');
    }

    if (settings.isIconEnabled()) {
      $('input[name="icon"]').prop('checked', 'checked');
    }

    if (settings.isCvOneboxEnabled()) {
      $('input[name="oneboxcv"]').prop('checked', 'checked');
    }

    if (settings.isDelvOneboxEnabled()) {
      $('input[name="oneboxdelv"]').prop('checked', 'checked');
    }

    $('input[name="oneboxheight"]').val(settings.getOneboxHeight());

    $('select[name="oneboxheightunits"]').val(settings.getOneboxHeightUnit());

    if (settings.isCvStatusEnabled()) {
      $('input[name="status"]').prop('checked', 'checked');
    }

    if (settings.isCvReasonEnabled()) {
      $('input[name="reason"]').prop('checked', 'checked');
    }
  }

  this.saveSetting = function(key, value) {
    settings.saveSetting(key, value);
  }
}

// database class to get and save settings
function Settings() {
  var self = this;

  this.saveSetting = function(key, value) {
    localStorage.setItem(key, value);
  }

  this.getSetting = function(key) {
    return localStorage.getItem(key);
  }

  this.deleteSetting = function(key) {
    localStorage.remove(key);
  }

  this.truncate = function() {
    localStorage.clear();
  }

  this.isSoundEnabled = function() {
    if (self.getSetting('sound-notification') == 'true') {
      return true;
    }

    return false;
  }

  this.isAvatarEnabled = function() {
    if (self.getSetting('avatar-notification') == 'true') {
      return true;
    }

    return false;
  }

  this.isIconEnabled = function() {
    var value = self.getSetting('icon-enabled');
    if (value == 'true' || value === null) {
      return true;
    }

    return false;
  }

  this.isCvOneboxEnabled = function() {
    var value = self.getSetting('cv-onebox');
    if (value == 'true' || value === null) {
      return true;
    }

    return false;
  }

  this.isDelvOneboxEnabled = function() {
    var value = self.getSetting('delv-onebox');
    if (value == 'true' || value === null) {
      return true;
    }

    return false;
  }

  this.getOneboxHeight = function() {
    var value = self.getSetting('onebox-height');

    return value;
  }

  this.getOneboxHeightUnit = function() {
    var value = self.getSetting('onebox-heightunit');

    return value;
  }

  this.isCvStatusEnabled = function() {
    var value = self.getSetting('cv-status');
    if (value == 'true' || value === null) {
      return true;
    }

    return false;
  }

  this.isCvReasonEnabled = function() {
    var value = self.getSetting('cv-reason');
    if (value == 'true') {
      return true;
    }

    return false;
  }
}

(function($) {
  var settings = new Settings;
  var settingsManager = new SettingsManager(settings);
  settingsManager.init();

  $('input[name="beep"]').change(function() {
    settingsManager.saveSetting('sound-notification', $(this).prop('checked'));
  });

  $('input[name="avatar"]').change(function() {
    settingsManager.saveSetting('avatar-notification', $(this).prop('checked'));
  });

  $('input[name="icon"]').change(function() {
    settingsManager.saveSetting('icon-enabled', $(this).prop('checked'));
  });

  $('input[name="oneboxcv"]').change(function() {
    var checked = $(this).prop('checked');
    settingsManager.saveSetting('cv-onebox', checked);
    if (checked) {
        $(':input[name^="oneboxheight"]').removeAttr('disabled');
    } else {
        $(':input[name^="oneboxheight"]').attr('disabled', true);
    }
  });
    $('input[name="oneboxcv"]').change();

  $('input[name="oneboxdelv"]').change(function() {
    settingsManager.saveSetting('delv-onebox', $(this).prop('checked'));
  });

  $('input[name="oneboxheight"]').keyup(function() {
    settingsManager.saveSetting('onebox-height', $(this).val());
  });

  $('select[name="oneboxheightunits"]').change(function() {
    settingsManager.saveSetting('onebox-heightunit', $(this).val());
  });

  $('input[name="status"]').change(function() {
    settingsManager.saveSetting('cv-status', $(this).prop('checked'));
  });

  $('input[name="reason"]').change(function() {
    settingsManager.saveSetting('cv-reason', $(this).prop('checked'));
  });
})(jQuery);