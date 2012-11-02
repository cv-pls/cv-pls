CvPlsHelper.VoteRequestBuffer = function(voteRequestMessageQueue) {

  "use strict";

  var self = this;

  // An attempt at a factory pattern implementation. I do not like this approach, but it works for now.
  if (voteRequestMessageQueue === undefined) {
    this.create = function(voteRequestMessageQueue) {
      return new self.constructor(voteRequestMessageQueue);
    };
    return;
  }

  this.items = 0;
  this.posts = [];
  this.postsIds = [];
  this.questionIds = [];

  this.createBuffer = function(queue) {
    self.posts = [];
    var post = queue.dequeue();
    while(post !== null && self.posts.length <= 100) {
      self.posts.push(post);
      post = queue.dequeue();
    }

    self.setIds();
  };

  this.setIds = function() {
    var i;

    self.postsIds = [];
    self.questionIds = [];

    self.items = self.posts.length;
    for (i = 0; i < self.items; i++) {
      self.postsIds.push(self.posts[i].id);
      self.questionIds.push(self.posts[i].questionId);
    }
  };

  this.createBuffer(voteRequestMessageQueue);
};