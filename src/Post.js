/*jslint plusplus: true, white: true, browser: true */
/*global CvPlsHelper */

// Represents a post in the chatroom
(function() {

  // Adds a class name to an element
  function addClass(element, className) {
    var classes = (element.getAttribute('class') || "").split(/\s+/g);
    if (classes.indexOf(className) < 0) {
      classes.push(className);
      element.setAttribute('class', classes.join(' ').replace(/^\s+|\s+$/g, ''));
    }
  };

  // Sets the message ID of the post
  function setPostId() {
    if (this.element.parentNode && this.element.parentNode.ownerDocument && this.element.parentNode.nodeType !== 11) {
      this.id = this.postId = (this.element.parentNode.getAttribute('id') || "").substr(8) || null;
    }
  };

  // Determines whether the post was added by the active user
  function setIsOwnPost() {
    var xpathQuery, xpathResult;
    if (this.postId && this.element.parentNode.parentNode) {
      xpathQuery = "./a[contains(concat(' ', @class, ' '), ' " + activeUserClass + " ')]";
      xpathResult = document.evaluate(xpathQuery, this.element.parentNode.parentNode.parentNode, null, XPathResult.ORDERED_NODE_SNAPSHOT_TYPE, null);
      this.isOwnPost = Boolean(xpathResult.snapshotLength);
    }
  };

  // Constructor
  CvPlsHelper.Post = function(document, chatRoom, $post) {
    this.document = document;
    this.chatRoom = chatRoom;
    if ($post) {
      this.$post = $post;
      this.element = $post[0];

      setPostId.call(this);
      setIsOwnPost.call(this);
      setQuestionId.call(this);
      setVoteType.call(this);
      markProcessed.call(this);
    }
  };

  // Factory method
  CvPlsHelper.Post.prototype.create = function($post) {
    return new this.constructor(this.document, this.chatRoom, $post);
  };

  // Type Enums
  CvPlsHelper.Post.voteTypes = CvPlsHelper.Post.prototype.voteTypes = {
    CV: 1,
    DELV: 2
  };
  CvPlsHelper.Post.postTypes = CvPlsHelper.Post.prototype.postTypes = {
    EXISTING: 0,
    NEW: 1,
    EDIT: 2,
    REMOVE: 3
  };

  // Public properties
  CvPlsHelper.Post.prototype.$post = null;
  CvPlsHelper.Post.prototype.element = null;

  CvPlsHelper.Post.prototype.id = null;
  CvPlsHelper.Post.prototype.postId = null; // This will replace .id asap
  CvPlsHelper.Post.prototype.questionId = null;

  CvPlsHelper.Post.prototype.voteType = null;
  CvPlsHelper.Post.prototype.postType = 0;
  CvPlsHelper.Post.prototype.isVoteRequest = false;
  CvPlsHelper.Post.prototype.isOwnPost = false;

}());

CvPlsHelper.Post = function(document, $post, activeUserClass) {

  "use strict";

  var self = this;

  // Type Enums
  this.voteTypes = {
    CV: 1,
    DELV: 2
  };
  this.postTypes = {
    EXISTING: 0,
    NEW: 1,
    EDIT: 2,
    REMOVE: 3
  };

  // An attempt at a factory pattern implementation. I do not like this approach, but it works for now.
  if (activeUserClass === undefined) {
    activeUserClass = document.getElementById('active-user').className.match(/user-\d+/)[0];
    this.create = function($post) {
      return new self.constructor($post, document, activeUserClass);
    };
    return;
  }

  // Sets the question ID based on the first question link in the post
  this.setQuestionId = function() {
    var xpathQuery, xpathResult, i, parts, parsedId;

    xpathQuery = ".//a[starts-with(@href, 'http://stackoverflow.com/questions/') or starts-with(@href, 'http://stackoverflow.com/q/')]";
    xpathResult = document.evaluate(xpathQuery, self.element, null, XPathResult.ORDERED_NODE_SNAPSHOT_TYPE, null);

    for (i = 0; i < xpathResult.snapshotLength; i++) {
      parts = xpathResult.snapshotItem(i).getAttribute('href').split('/');
      if (parts.length > 4) {
        parsedId = parseInt(parts[4], 10);
        if (!isNaN(parsedId)) {
          self.questionId = parsedId;
          break;
        }
      }
    }

  };  

  // Sets the vote type of the post and manipulates vote post structure for easy reference later on
  this.setVoteType = function() {
    var xpathQuery, xpathResult;

    if (self.questionId === null) {
      return null;
    }

    xpathQuery = ".//a/span[contains(concat(' ', @class, ' '), ' ob-post-tag ') and contains(' cv-pls cv-maybe delv-pls delv-maybe ', concat(' ', text(), ' '))]";
    xpathResult = document.evaluate(xpathQuery, self.element, null, XPathResult.ORDERED_NODE_SNAPSHOT_TYPE, null);

    if (xpathResult.snapshotLength) {

      self.isVoteRequest = true;
      self.voteType = self.voteTypes[xpathResult.snapshotItem(0).firstChild.data.split('-').shift().toUpperCase()];

      self.addClass(self.element, 'cvhelper-vote-request');

      xpathQuery = ".//span[contains(concat(' ', @class, ' '), ' cvhelper-vote-request-text ')]";
      xpathResult = document.evaluate(xpathQuery, self.element, null, XPathResult.ORDERED_NODE_SNAPSHOT_TYPE, null);
      if (!xpathResult.snapshotLength) {
        self.element.innerHTML = '<span class="cvhelper-vote-request-text">' + self.element.innerHTML + '</span>'; // Required for strikethrough to work
      }

      xpathQuery = ".//a[starts-with(@href, 'http://stackoverflow.com/questions/" + self.questionId + "') or starts-with(@href, 'http://stackoverflow.com/q/" + self.questionId + "')]";
      xpathResult = document.evaluate(xpathQuery, self.element, null, XPathResult.ORDERED_NODE_ITERATOR_TYPE, null);
      self.addClass(xpathResult.iterateNext(), 'cvhelper-question-link');

    }

  };

  // Adds a class to the element to indicate that it has been processed
  this.markProcessed = function() {
    self.addClass(self.element, 'cvhelper-processed');
  };

  self.init();

};