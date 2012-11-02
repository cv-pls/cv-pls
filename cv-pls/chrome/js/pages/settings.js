/*jslint plusplus: true, white: true, browser: true */
/*global CvPlsHelper */

window.addEventListener('DOMContentLoaded', function() {

  "use strict";

  var settingsDataStore, settingsDataAccessor, pluginSettings, dupeSettingsManager, settingsManager;

  settingsDataStore = new CvPlsHelper.chrome.SettingsDataStore();
  settingsDataAccessor = new CvPlsHelper.chrome.BackgroundSettingsDataAccessor(settingsDataStore);
  pluginSettings = new CvPlsHelper.PluginSettings(settingsDataAccessor, CvPlsHelper.chrome.DefaultSettings);

  dupeSettingsManager = new CvPlsHelper.chrome.DupeSettingsManager(pluginSettings);
  settingsManager = new CvPlsHelper.chrome.SettingsManager(pluginSettings, dupeSettingsManager);

});