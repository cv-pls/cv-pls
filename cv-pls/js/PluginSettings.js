function PluginSettings(settings) {
  var self = this;

  this.settings = settings;

  this.showIcon = function() {
    return settings.normalizeDefaultTrue(settings.getSetting('showIcon'));
  };

  this.oneBox = function() {
    return settings.normalizeDefaultTrue(settings.getSetting('oneBox'));
  };

  this.oneBoxHeight = function() {
    return settings.getSetting('oneBoxHeight');
  };

  this.soundNotification = function() {
    return settings.normalizeDefaultFalse(settings.getSetting('soundNotification'));
  };

  this.avatarNotification = function() {
    return settings.normalizeDefaultFalse(settings.getSetting('avatarNotification'));
  };

  this.showCloseStatus = function() {
    return settings.normalizeDefaultTrue(settings.getSetting('showCloseStatus'));
  };

  this.pollCloseStatus = function() {
    return settings.normalizeDefaultFalse(settings.getSetting('pollCloseStatus'));
  };

  this.pollInterval = function() {
    return settings.normalizeDefaultNumeric(settings.getSetting('pollInterval'), 5);
  };

  this.cvPlsButton = function() {
    return settings.normalizeDefaultTrue(settings.getSetting('cvPlsButton'));
  };

  this.delvPlsButton = function() {
    return settings.normalizeDefaultFalse(settings.getSetting('delvPlsButton'));
  };

  this.getAllSettings = function() {
    return {
      showIcon: self.showIcon(),
      oneBox: self.oneBox(),
      oneBoxHeight: self.oneBoxHeight(),
      soundNotification: self.soundNotification(),
      avatarNotification: self.avatarNotification(),
      showCloseStatus: self.showCloseStatus(),
      pollCloseStatus: self.pollCloseStatus(),
      pollInterval: self.pollInterval(),
      cvPlsButton: self.cvPlsButton(),
      delvPlsButton: self.delvPlsButton()
    };
  };

  this.saveAllSettings = function(settingsJsonString) {
    settings.saveSetting('showIcon', settingsJsonString.showIcon);
    settings.saveSetting('oneBox', settingsJsonString.oneBox);
    settings.saveSetting('oneBoxHeight', settingsJsonString.oneBoxHeight);
    settings.saveSetting('soundNotification', settingsJsonString.soundNotification);
    settings.saveSetting('avatarNotification', settingsJsonString.avatarNotification);
    settings.saveSetting('showCloseStatus', settingsJsonString.showCloseStatus);
    settings.saveSetting('pollCloseStatus', settingsJsonString.pollCloseStatus);
    settings.saveSetting('pollInterval', settingsJsonString.pollInterval);
    settings.saveSetting('cvPlsButton', settingsJsonString.cvPlsButton);
    settings.saveSetting('delvPlsButton', settingsJsonString.delvPlsButton);
  };
}