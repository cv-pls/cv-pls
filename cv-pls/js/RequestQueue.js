/*jslint plusplus: true, white: true, browser: true */

function RequestQueue() {

  "use strict";

  var self = this;

  this.queue = [];

  this.enqueue = function(post) {
    self.queue.push(post);
  };

  this.dequeue = function() {
    if (!self.queue.length) {
      return null;
    }
    return self.queue.shift();
  };

  this.each = function(callback) {
    var i;
    for (i = 0; i < self.queue.length; i++) {
      if (callback(self.queue[i], i) === false) {
        return false;
      }
    }
    return true;
  };
}