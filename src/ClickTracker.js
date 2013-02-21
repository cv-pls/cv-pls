/*jslint plusplus: true, white: true, browser: true, eqeq: true */
/*global CvPlsHelper */

/**
 * Tracks items that have been previously clicked
 */
(function() {

  'use strict';

  /**
   * Truncate an array to the specified max length
   *
   * @param Array clickedList The array
   * @param int   maxLength   The max length
   */
  function manageListLength(list, maxLength) {
    var i, l = list.length - maxLength;

    for (i = 0; i < l; i++) {
      list.shift();
    }
  }

  /**
   * Constructor
   *
   * @param object                          pluginSettings XBuilder settings module
   * @param CvPlsHelper.PersistentDataStore dataStore      Data store accessor
   */
  CvPlsHelper.ClickTracker = function(pluginSettings, dataStore) {
    if (pluginSettings.getSetting('trackHistory') && dataStore.getItem('clickedList') === undefined) {
      dataStore.setItem('clickedList', []);
    }

    this.pluginSettings = pluginSettings;
    this.dataStore = dataStore;
  };

  /**
   * @var object XBuilder settings module
   */
  CvPlsHelper.ClickTracker.prototype.pluginSettings = null;

  /**
   * @var CvPlsHelper.PersistentDataStore Data store accessor
   */
  CvPlsHelper.ClickTracker.prototype.dataStore = null;

  /**
   * Check whether a vote request has been previously inspected
   *
   * @param int postId ID of the post to check
   *
   * @return bool True if the post has been previously visited
   */
  CvPlsHelper.ClickTracker.prototype.isVisited = function(postId) {
    if (this.pluginSettings.getSetting('trackHistory')) {
      return this.dataStore.getItem('clickedList').indexOf(postId) > -1;
    }

    return false;
  };

  /**
   * Mark a vote request as inspected
   *
   * @param int postId ID of the post to mark
   */
  CvPlsHelper.ClickTracker.prototype.markVisited = function(postId) {
    var clickedList;

    if (this.pluginSettings.getSetting('trackHistory')) {
      clickedList = this.dataStore.getItem('clickedList');

      if (clickedList.indexOf(postId) < 0) {
        clickedList.push(postId);
        manageListLength(clickedList, this.pluginSettings.getSetting('clickedListLength'));
        this.dataStore.setItem('clickedList', clickedList);
      }
    }
  };

}());