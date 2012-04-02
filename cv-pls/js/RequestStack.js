function RequestStack() {
  var self = this;

  this.queue = [];

  this.push = function(post) {
    self.queue.push(post);
  };

  this.pop = function() {
    if (!self.queue.length) {
      return null;
    }

    return self.queue.pop();
  };
}