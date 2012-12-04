/*jslint plusplus: true, white: true, browser: true */
/*global CvPlsHelper */

(function() {

  "use strict";

  // Constructor
  CvPlsHelper.PostFactory = function(document, chatRoom, oneBoxFactory) {
    this.document = document;
    this.chatRoom = chatRoom;
    this.oneBoxFactory = oneBoxFactory;
  };

  // Factory method
  CvPlsHelper.PostFactory.prototype.create = function(element) {
    return new CvPlsHelper.Post(this.document, this.chatRoom, this.oneBoxFactory, element);
  };

}());