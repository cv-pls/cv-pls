function SettingsManager(settings) {
  var self = this;

  this.settings = settings;

  this.init = function() {
    this.initSoundSettings();
  }

  this.initSoundSettings = function() {
    if (settings.isSoundEnabled()) {
      $('input[name="beep"]').prop('checked', 'checked');
    }

    if (settings.isCvOneboxEnabled()) {
      $('input[name="oneboxcv"]').prop('checked', 'checked');
    }

    if (settings.isDelvOneboxEnabled()) {
      $('input[name="oneboxdelv"]').prop('checked', 'checked');
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
}

(function($) {
  var settings = new Settings;
  var settingsManager = new SettingsManager(settings);
  settingsManager.init();

  $('input[name="beep"]').change(function() {
    settingsManager.saveSetting('sound-notification', $(this).prop('checked'));
  });

  $('input[name="oneboxcv"]').change(function() {
    settingsManager.saveSetting('cv-onebox', $(this).prop('checked'));
  });

  $('input[name="oneboxdelv"]').change(function() {
    settingsManager.saveSetting('delv-onebox', $(this).prop('checked'));
  });
})(jQuery);