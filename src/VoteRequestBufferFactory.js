/*jslint plusplus: true, white: true, browser: true */
/*global CvPlsHelper */

(function() {

  'use strict';

  CvPlsHelper.VoteRequestBufferFactory = function(collectionFactory) {
    this.collectionFactory = collectionFactory;
  };

  CvPlsHelper.VoteRequestBufferFactory.prototype.create = function(queue) {
    var i, l, buffer = this.collectionFactory.create();
    for (i = 0, l = queue.length; i < 100 && i < l; i++) {
      buffer.push(queue.shift());
    }
    return buffer;
  };

}());