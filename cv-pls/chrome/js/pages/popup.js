/*jslint plusplus: true, white: true, browser: true */
/*global CvPlsHelper */

window.addEventListener('DOMContentLoaded', function() {

  "use strict";

  var settingsDataStore, settingsDataAccessor, pluginSettings, settingsManager, popUpMenu;

  settingsDataStore = new CvPlsHelper.chrome.SettingsDataStore();
  settingsDataAccessor = new CvPlsHelper.chrome.BackgroundSettingsDataAccessor(settingsDataStore);
  pluginSettings = new CvPlsHelper.PluginSettings(settingsDataAccessor, CvPlsHelper.chrome.DefaultSettings);

  settingsManager = new CvPlsHelper.chrome.SettingsManager(pluginSettings);

  popUpMenu = new CvPlsHelper.chrome.PopUpMenu();

});