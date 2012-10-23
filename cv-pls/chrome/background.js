/*jslint plusplus: true, white: true, browser: true */
/*global chrome, SettingsDataStore, ChromeBackgroundSettingsDataAccessor, PluginSettings, ChromeDesktopNotification */

(function() {
  var settingsDataStore, settingsDataAccessor, pluginSettings, desktopNotification;

  settingsDataStore = new SettingsDataStore();
  settingsDataAccessor = new ChromeBackgroundSettingsDataAccessor(settingsDataStore);
  pluginSettings = new PluginSettings(settingsDataAccessor);

  desktopNotification = new ChromeDesktopNotification(pluginSettings);

  chrome.extension.onRequest.addListener(function(request, sender, sendResponse) {
    switch(request.method) {
      case 'showIcon':
        if (pluginSettings.getSetting("showIcon")) {
          chrome.pageAction.show(sender.tab.id);
        }
        sendResponse({});
        break;

      case 'checkUpdate':
        if (settings.getSetting('currentSavedVersion') == null || pluginSettings.getVersion() != settings.getSetting('currentSavedVersion')) {
          chrome.tabs.create({
            url: chrome.extension.getURL('update.html')
          });
        }
        settings.saveSetting('currentSavedVersion', pluginSettings.getVersion());
        sendResponse({
          current: settings.getSetting('currentSavedVersion')
        });
        break;

      case 'getAllSettings':
        sendResponse(pluginSettings.getAllSettings());
        break;

      case 'saveSetting':
        pluginSettings.saveSetting(request.key, request.value);
        sendResponse({});
        break;

      case 'showNotification':
        desktopNotification.buildNotification(request.title, request.message);
        desktopNotification.show();
        sendResponse({});
        break;

      default:
        sendResponse({});
        break;
    }
  });
}());
