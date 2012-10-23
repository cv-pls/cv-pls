/*jslint plusplus: true, white: true, browser: true */
/*global $, PluginSettings, SettingsDataStore, ChromeBackgroundSettingsDataAccessor */

window.addEventListener('DOMContentLoaded', function() {

  "use strict";

  var settingsDataStore, settingsDataAccessor, pluginSettings, settingsManager;

  settingsDataStore = new SettingsDataStore();
  settingsDataAccessor = new ChromeBackgroundSettingsDataAccessor(settingsDataStore);
  pluginSettings = new PluginSettings(settingsDataAccessor);
  settingsManager = new SettingsManager(pluginSettings);

  settingsManager.init();

});