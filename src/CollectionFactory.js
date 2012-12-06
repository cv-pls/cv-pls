/*jslint plusplus: true, white: true, browser: true */
/*global CvPlsHelper */

(function() {

  'use strict';

  CvPlsHelper.CollectionFactory = function() {};

  CvPlsHelper.CollectionFactory.prototype.create = function() {
    return new CvPlsHelper.Collection();
  };

}());