function PluginSettings(settings) {
  var self = this;

  this.settings = settings;

  this.getVersion = function() {
    var details = chrome.app.getDetails();
    return details.version;
  }

  this.showIcon = function() {
    return settings.normalizeDefaultTrue(settings.getSetting('showIcon'));
  };

  this.oneBox = function() {
    return settings.normalizeDefaultTrue(settings.getSetting('oneBox'));
  };

  this.oneBoxHeight = function() {
    return settings.normalizeDefaultNumeric(settings.getSetting('oneBoxHeight'), 30);
  };

  this.soundNotification = function() {
    return settings.normalizeDefaultFalse(settings.getSetting('soundNotification'));
  };

  this.avatarNotification = function() {
    return settings.normalizeDefaultFalse(settings.getSetting('avatarNotification'));
  };

  this.desktopNotification = function() {
    return settings.normalizeDefaultFalse(settings.getSetting('desktopNotification'));
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

  this.backlogEnabled = function() {
    return settings.normalizeDefaultFalse(settings.getSetting('backlogEnabled'));
  };

  this.backlogAmount = function() {
    return settings.normalizeDefaultNumeric(settings.getSetting('backlogAmount'), 5);
  };

  this.backlogRefresh = function() {
    return settings.normalizeDefaultTrue(settings.getSetting('backlogRefresh'));
  };

  this.backlogRefreshInterval = function() {
    return settings.normalizeDefaultNumeric(settings.getSetting('backlogRefreshInterval'), 60);
  };

  this.dupesEnabled = function() {
    return settings.normalizeDefaultFalse(settings.getSetting('dupesEnabled'));
  };

  this.dupesList = function() {
    return settings.normalizeDefaultArray(settings.getSetting('dupesList'));
  };

  this.getAllSettings = function() {
    return {
      version: self.getVersion(),
      showIcon: self.showIcon(),
      oneBox: self.oneBox(),
      oneBoxHeight: self.oneBoxHeight(),
      soundNotification: self.soundNotification(),
      avatarNotification: self.avatarNotification(),
      desktopNotification: self.desktopNotification(),
      showCloseStatus: self.showCloseStatus(),
      pollCloseStatus: self.pollCloseStatus(),
      pollInterval: self.pollInterval(),
      cvPlsButton: self.cvPlsButton(),
      delvPlsButton: self.delvPlsButton(),
      backlogEnabled: self.backlogEnabled(),
      backlogAmount: self.backlogAmount(),
      backlogRefresh: self.backlogRefresh(),
      backlogRefreshInterval: self.backlogRefreshInterval(),
      dupesEnabled: self.dupesEnabled(),
      dupesList: self.dupesList()
    };
  };

  this.saveAllSettings = function(settingsJsonString) {
    settings.saveSetting('showIcon', settingsJsonString.showIcon);
    settings.saveSetting('oneBox', settingsJsonString.oneBox);
    settings.saveSetting('oneBoxHeight', settingsJsonString.oneBoxHeight);
    settings.saveSetting('soundNotification', settingsJsonString.soundNotification);
    settings.saveSetting('avatarNotification', settingsJsonString.avatarNotification);
    settings.saveSetting('desktopNotification', settingsJsonString.desktopNotification);
    settings.saveSetting('showCloseStatus', settingsJsonString.showCloseStatus);
    settings.saveSetting('pollCloseStatus', settingsJsonString.pollCloseStatus);
    settings.saveSetting('pollInterval', settingsJsonString.pollInterval);
    settings.saveSetting('cvPlsButton', settingsJsonString.cvPlsButton);
    settings.saveSetting('delvPlsButton', settingsJsonString.delvPlsButton);
    settings.saveSetting('backlogEnabled', settingsJsonString.backlogEnabled);
    settings.saveSetting('backlogAmount', settingsJsonString.backlogAmount);
    settings.saveSetting('backlogRefresh', settingsJsonString.backlogRefresh);
    settings.saveSetting('backlogRefreshInterval', settingsJsonString.backlogRefreshInterval);
    settings.saveSetting('dupesEnabled', settingsJsonString.dupesEnabled);
    settings.saveSetting('dupesList', JSON.stringify(settingsJsonString.dupesList));
  };
}