/*jslint plusplus: true, white: true, browser: true, eqeq: true */
/*global CvPlsHelper, localStorage */

/**
 * Wraps localStorage to store typed data
 */
(function() {

  'use strict';

  /**
   * Constructor
   *
   * @param string keyPrefix Prefix to use for keys to avoid collisions
   */
  CvPlsHelper.PersistentDataStore = function(localStorage, keyPrefix) {
    this.localStorage = localStorage;
    if (keyPrefix) {
      this.keyPrefix = String(keyPrefix);
    }
  };

  /**
   * @var Storage Reference to the localStorage instance to use
   */
  CvPlsHelper.PersistentDataStore.prototype.localStorage = null;

  /**
   * @var string Prefix to use for keys to avoid collisions
   */
  CvPlsHelper.PersistentDataStore.prototype.keyPrefix = '';

  /**
   * Get an item from persistent storage
   *
   * @param string name The name of the key to retrieve
   *
   * @return mixed The value associated with the key
   */
  CvPlsHelper.PersistentDataStore.prototype.getItem = function(name) {
    var raw, result;

    try {
      name = this.keyPrefix + String(name);
      raw = this.localStorage.getItem(name);

      result = JSON.parse(raw).value;
    } catch (e) {}

    return result;
  };

  /**
   * Store an item in persistent storage
   *
   * @param string name  The name of the key to store
   * @param mixed  value The value associated with the key
   */
  CvPlsHelper.PersistentDataStore.prototype.setItem = function(name, value) {
    var raw;

    name = this.keyPrefix + String(name);
    raw = JSON.stringify({value: value});

    this.localStorage.setItem(name, raw);
  };

  /**
   * Remove an item from persistent storage
   *
   * @param string name The name of the key to store
   */
  CvPlsHelper.PersistentDataStore.prototype.removeItem = function(name) {
    name = this.keyPrefix + String(name);

    this.localStorage.removeItem(name);
  };

}());