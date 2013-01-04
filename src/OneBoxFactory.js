/*jslint plusplus: true, white: true, browser: true */
/*global CvPlsHelper */

(function() {

  "use strict";

  CvPlsHelper.OneBoxFactory = function(document, pluginSettings, avatarNotificationManager, animatorFactory, grippieFactory) {
    this.document = document;
    this.pluginSettings = pluginSettings;
    this.avatarNotificationManager = avatarNotificationManager;
    this.animator = animatorFactory.create(document.defaultView);
    this.grippieFactory = grippieFactory;
  };

  CvPlsHelper.OneBoxFactory.prototype.create = function(post) {
    return new CvPlsHelper.OneBox(this.document, this.pluginSettings, this.avatarNotificationManager, this.animator, this.grippieFactory, post);
  };

}());