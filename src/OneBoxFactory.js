/*jslint plusplus: true, white: true, browser: true */
/*global CvPlsHelper */

(function() {

  "use strict";

  CvPlsHelper.OneBoxFactory = function(document, pluginSettings, avatarNotification) {
    this.document = document;
    this.pluginSettings = pluginSettings;
    this.avatarNotification = avatarNotification;
  };

  CvPlsHelper.OneBoxFactory.prototype.create = function(post) {
    return new CvPlsHelper.OneBox(this.document, this.pluginSettings, this.avatarNotification, post);
  };

}());