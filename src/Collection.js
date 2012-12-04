/*jslint plusplus: true, white: true, browser: true, eqeq: true */
/*global CvPlsHelper */

// Represents a collection of Items
(function() {

  'use strict';

  CvPlsHelper.Collection = function() {
    this.items = [];
  };

  CvPlsHelper.Collection.prototype.push = function(item) {
    this.items.push(item);
    return item;
  };

  CvPlsHelper.Collection.prototype.unshift = function(item) {
    this.items.unshift(item);
    return item;
  };

  CvPlsHelper.Collection.prototype.pop = function() {
    return this.items.length ? this.items.pop() : null;
  };

  CvPlsHelper.Collection.prototype.shift = function() {
    return this.items.length ? this.items.shift() : null;
  };

  CvPlsHelper.Collection.prototype.remove = function(item) {
    var i, l;
    for (i = 0, l = this.items.length; i < l; i++) {
      if (this.items[i] === item) {
        this.items.splice(i, 1);
        break;
      }
    }
    return item;
  };

  CvPlsHelper.Collection.prototype.length = function() {
    return this.items.length;
  };

  CvPlsHelper.Collection.prototype.forEach = function(callBack, thisArg) {
    var i, l;
    thisArg = thisArg || this;
    for (i = 0, l = this.items.length; i < l; i++) {
      if (callBack.call(thisArg, this.items[i], i) === false) {
        break;
      }
    }
  };

  CvPlsHelper.Collection.prototype.contains = function(item) {
    return this.items.indexOf(item) > -1;
  };

  CvPlsHelper.Collection.prototype.match = function(property, search) {
    var i, l, result = null, isRegexp = search instanceof RegExp;
    for (i = 0, l = this.items.length; i < l; i++) {
      // Dear Douglas Crockford: I apologise. For once, it makes sense to do it though.
      if ((!isRegexp && this.items[i][property] == search) || (isRegexp && search.test(this.items[i][property]))) {
        result = this.items[i];
        break;
      }
    }
    return result;
  };

  CvPlsHelper.Collection.prototype.matchAll = function(property, search) {
    var i, l, result = [], isRegexp = search instanceof RegExp;
    for (i = 0, l = this.items.length; i < l; i++) {
      if ((!isRegexp && this.items[i][property] == search) || (isRegexp && search.test(this.items[i][property]))) {
        result.push(this.items[i]);
      }
    }
    return result;
  };

  CvPlsHelper.Collection.prototype.query = function(callback) {
    var i, l, result = [];
    for (i = 0, l = this.items.length; i < l; i++) {
      if (callback(this.items[i])) {
        result.push(this.items[i]);
      }
    }
    return result;
  };

}());