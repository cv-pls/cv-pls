CvPlsHelper.Post = function($post, document, activeUserClass) {

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
    document = $post;
    activeUserClass = document.getElementById('active-user').getAttribute('class').match(/user-\d+/)[0];
    this.create = function($post) {
      return new self.constructor($post, document, activeUserClass);
    };
    return;
  }

  this.$post = $post;
  this.element = $post[0];

  this.id = null;
  this.questionId = null;

  this.voteType = null;
  this.postType = 0;
  this.isVoteRequest = false;
  this.isOwnPost = false;

  // Constructor controller
  this.init = function() {
    self.setPostId();
    self.setIsOwnPost();
    self.setQuestionId();
    self.setVoteType();
    self.markProcessed();
  };

  // Sets the message ID of the post
  this.setPostId = function() {
    if (self.element.parentNode && self.element.parentNode.ownerDocument && self.element.parentNode.nodeType !== 11) {
      this.id = (self.element.parentNode.getAttribute('id') || "").substr(8) || null;
    }
  };

  // Determines whether the post was added by the active user
  this.setIsOwnPost = function() {
    var xpathQuery, xpathResult;
    if (self.id) {
      xpathQuery = "./a[contains(concat(' ', @class, ' '), ' " + activeUserClass + " ')]";
      xpathResult = document.evaluate(xpathQuery, self.element.parentNode.parentNode.parentNode, null, XPathResult.ORDERED_NODE_SNAPSHOT_TYPE, null);
      self.isOwnPost = Boolean(xpathResult.snapshotLength);
    }
  };

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

  this.addClass = function(el, className) {
    var classes = (el.getAttribute('class') || "").split(/\s+/g);
    if (classes.indexOf(className) < 0) {
      classes.push(className);
      el.setAttribute('class', classes.join(' ').replace(/^\s+|\s+$/g, ''));
    }
  };

  self.init();

};