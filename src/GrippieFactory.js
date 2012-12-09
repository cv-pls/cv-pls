/*jslint plusplus: true, white: true, browser: true */
/*global CvPlsHelper, $ */

(function() {

  'use strict';

  CvPlsHelper.GrippieFactory = function() {};

  CvPlsHelper.GrippieFactory.prototype.create = function(options) {
    return new Grippie(options);
  };

}());