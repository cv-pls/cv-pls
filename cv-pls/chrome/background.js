/*jslint plusplus: true, white: true, browser: true */
/*global chrome, SettingsDataStore, ChromeBackgroundSettingsDataAccessor, PluginSettings, ChromeDesktopNotification */

(function() {
  var settingsDataStore, settingsDataAccessor, pluginSettings, desktopNotification;

  settingsDataStore = new SettingsDataStore();
  settingsDataAccessor = new ChromeBackgroundSettingsDataAccessor(settingsDataStore);
  pluginSettings = new PluginSettings(settingsDataAccessor);

  desktopNotification = new ChromeDesktopNotification(pluginSettings);

  chrome.extension.onMessage.addListener(function(request, sender, sendResponse) {
    var response = {};

    switch(request.method) {
      case 'showIcon':
        if (pluginSettings.getSetting('showIcon')) {
          chrome.pageAction.show(sender.tab.id);
        }
        break;

      case 'checkUpdate':
        if (settings.getSetting('currentSavedVersion') === null || chrome.app.getDetails().version !== settings.getSetting('currentSavedVersion')) {
          chrome.tabs.create({ url: chrome.extension.getURL('update.html') });
          settings.saveSetting('currentSavedVersion', chrome.app.getDetails().version);
        }
        response.current = settings.getSetting('currentSavedVersion');
        break;

      case 'getAllSettings':
        response = pluginSettings.getAllSettings();
        break;

      case 'saveSetting':
        pluginSettings.saveSetting(request.key, request.value);
        break;

      case 'showNotification':
        desktopNotification.buildNotification(request.title, request.message);
        desktopNotification.show();
        break;
    }

    if (typeof callBack === 'function') {
      sendResponse(response);
    }
  });
}());
