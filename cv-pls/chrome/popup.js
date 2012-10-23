/*jslint plusplus: true, white: true, browser: true */
/*global chrome */

window.addEventListener('DOMContentLoaded', function() {

  "use strict";

  var popUpMenu, settingsDataStore, settingsDataAccessor, pluginSettings, settingsManager;

  popUpMenu = new ChromePopUpMenu();

  settingsDataStore = new SettingsDataStore();
  settingsDataAccessor = new ChromeBackgroundSettingsDataAccessor(settingsDataStore);
  pluginSettings = new PluginSettings(settingsDataAccessor);
  settingsManager = new SettingsManager(pluginSettings);

  settingsManager.init();
  popUpMenu.init();
});