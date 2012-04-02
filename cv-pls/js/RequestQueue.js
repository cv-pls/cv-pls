function RequestQueue() {
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
}