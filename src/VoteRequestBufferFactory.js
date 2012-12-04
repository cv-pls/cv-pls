/*jslint plusplus: true, white: true, browser: true */
/*global CvPlsHelper */

(function() {

  'use strict';

  CvPlsHelper.VoteRequestBufferFactory = function(collectionFactory) {
    this.collectionFactory = collectionFactory;
  };

  CvPlsHelper.VoteRequestBufferFactory.prototype.create = function(queue) {
    var buffer = this.collectionFactory.create();
    queue.forEach(function(post, i) {
      if (i > 100) {
        return false;
      }
      buffer.push(post);
    });
    return queue;
  };

}());