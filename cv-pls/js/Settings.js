/*jslint plusplus: true, white: true, browser: true */
/*global localStorage */

function Settings() {

  "use strict";

  this.getSettingNormalized = function(key, defaultValue) {
    var value = localStorage.getItem(key), result;

    switch (typeof defaultValue) {

      case 'boolean':
        if (defaultValue) {
          if (value === null || value) {
            result = true;
          } else {
            result = false;
          }
        } else {
          if (value === "false" || !value) {
            result = false;
          } else {
            result = true;
          }
        }
        break;

      case 'number':
        if (value === null || isNaN(value)) {
          result = defaultValue;
        } else {
          result = value;
        }
        break;

      case 'object':
        if (value === null  || !value.length) {
          result = defaultValue;
        } else {
          result = value;
        }
        break;

    }

    return result;
  };

  this.getSetting = function(key) {
    return localStorage.getItem(key);
  };

  this.saveSetting = function(key, value) {
    localStorage.setItem(key, value);
  };

  this.deleteSetting = function(key) {
    localStorage.remove(key);
  };

  this.truncate = function() {
    localStorage.clear();
  };
}