/*jslint plusplus: true, white: true, browser: true */
/*global CvPlsHelper, $ */

(function() {

  'use strict';

  CvPlsHelper.AnimatorFactory = function() {};

  CvPlsHelper.AnimatorFactory.prototype.create = function(element) {
    return new Animator(element);
  };

}());