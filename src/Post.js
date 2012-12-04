/*jslint plusplus: true, white: true, browser: true */
/*global CvPlsHelper, $ */

// Represents a post in the chatroom
(function() {

  'use strict';

  // Get classes of element as array
  function getClassNameArray(element) {
    var raw, current, result = [];
    if (element && element.className) {
      raw = element.className.split(/\s+/g);
      while (raw.length) {
        current = raw.shift();
        if (current.length && result.indexOf(current) < 0) {
          result.push(current);
        }
      }
    }
    return result;
  }

  // Adds a class name to an element
  function addClass(element, className) {
    var classes = getClassNameArray(element);
    if (classes.indexOf(className) < 0) {
      classes.push(className);
      element.className = classes.join(' ');
    }
  }

  // Tests whether an element has a class name
  function hasClass(element, className) {
    return getClassNameArray(element).indexOf(className) >= 0;
  }

  // Sets the message ID of the post
  function setPostId() {
    this.postId = parseInt((this.messageElement.getAttribute('id') || '').match(/message-(\d+)/)[1], 10);
    this.id = this.postId; // Remove asap
  }

  // Determines whether the post was added by the active user
  function setIsOwnPost() {
    if (this.postId && this.messageElement.parentNode && this.messageElement.parentNode.parentNode) {
      this.isOwnPost = hasClass(this.messageElement.parentNode.parentNode, this.chatRoom.activeUserClass);
    }
  }

  // Parses all tags into an array
  function loadTags() {
    var i, tagElements = this.contentElement.querySelectorAll('a span.ob-post-tag');
    this.tags = [];
    for (i = 0; i < tagElements.length; i++) {
      this.tags.push(tagElements[i].firstChild.data.toLowerCase());
    }
  }

  function setIsVoteRequest() {
    this.isVoteRequest = Boolean(this.matchTag(/^(cv|delv)-(pls|maybe)$/));
    if (this.isVoteRequest) {
      addClass(this.contentElement, 'cvhelper-vote-request');
    }
  }

  // Sets the vote type of the post and manipulates vote post structure for easy reference later on
  function setVoteType() {
    var i, l;

    this.voteType = this.voteTypes[this.matchTag(/^(cv|delv)-(pls|maybe)$/).split('-').shift().toUpperCase()];

    if (!this.contentElement.querySelector('span.cvhelper-vote-request-text')) { // Required for strikethrough to work
      this.textElement = this.document.createElement('span');
      this.textElement.setAttribute('class', 'cvhelper-vote-request-text');
      for (i = 0, l = this.contentElement.childNodes.length; i < l; i++) {
        this.textElement.appendChild(this.contentElement.removeChild(this.contentElement.childNodes[i]));
      }
      this.contentElement.appendChild(this.textElement);
    }
  }

  // Sets the question ID based on the first question link in the post
  function setQuestionId() {
    var questionLinks, i, l, parts;

    questionLinks = this.contentElement.querySelector('a[href^="http://stackoverflow.com/questions/"], a[href^="http://stackoverflow.com/q/');

    for (i = 0, l = questionLinks.length; i < l; i++) {
      parts = questionLinks[i].getAttribute('href').match(/^http:\/\/stackoverflow\.com\/questions\/(\d+)/);
      if (parts) {
        this.questionId = parseInt(parts[1], 10);
        addClass(questionLinks[i], 'cvhelper-question-link');
        break;
      }
    }
  }

  // Adds a class to the element to indicate that it has been processed
  function markProcessed() {
    addClass(this.contentElement, 'cvhelper-processed');
  }

  function initPost() {
    loadTags.call(this);
    setIsVoteRequest.call(this);
    if (this.isVoteRequest) {
      setVoteType.call(this);
      setQuestionId.call(this);
    }
    markProcessed.call(this);
  }

  function setPostElements(messageElement) {
    this.messageElement = messageElement;
    this.contentElement = messageElement.querySelector('div.content');
    this.element = this.contentElement;  // Remove asap
    this.$post = $(this.contentElement); // Remove asap
  }

  // Constructor
  CvPlsHelper.Post = function(document, chatRoom, oneBoxFactory, messageElement) {
    this.document = document;
    this.chatRoom = chatRoom;
    this.oneBoxFactory = oneBoxFactory;
    setPostElements.call(this, messageElement);

    // These are outside initPost to avoid over-processing a replacement element
    setPostId.call(this);
    setIsOwnPost.call(this);

    initPost.call(this);
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
  CvPlsHelper.Post.prototype.messageElement = null;
  CvPlsHelper.Post.prototype.contentElement = null; // This will replace .element asap
  CvPlsHelper.Post.prototype.textElement = null;

  CvPlsHelper.Post.prototype.oneBox = null;
  CvPlsHelper.Post.prototype.questionData = null;

  CvPlsHelper.Post.prototype.postId = null; // This will replace .id asap
  CvPlsHelper.Post.prototype.questionId = null;

  CvPlsHelper.Post.prototype.voteType = null;
  CvPlsHelper.Post.prototype.postType = 0;
  CvPlsHelper.Post.prototype.isVoteRequest = false;
  CvPlsHelper.Post.prototype.isOwnPost = false;
  CvPlsHelper.Post.prototype.isOnScreen = true;

  CvPlsHelper.Post.prototype.hasAvatarNotification = false;

  // Pending burnination
  CvPlsHelper.Post.prototype.id = null;
  CvPlsHelper.Post.prototype.element = null;
  CvPlsHelper.Post.prototype.$post = null;

  // Public methods

  // Matches tags against the given expr (string or RegExp) and returns the first match
  CvPlsHelper.Post.prototype.matchTag = function(expr) {
    var i, l, matches, result = null;
    if (typeof expr === 'string' && this.tags.indexOf(String(expr).toLowerCase()) >= 0) {
      result = expr;
    } else if (expr instanceof RegExp) {
      for (i = 0, l = this.tags.length; i < l; i++) {
        matches = this.tags[i].match(expr);
        if (matches) {
          result = matches[0];
          break;
        }
      }
    }
    return result;
  };

  CvPlsHelper.Post.prototype.replaceElement = function(newNode) {
    this.isVoteRequest = this.voteType = this.questionId = null;
    setPostElements.call(this, newNode);

    if (this.oneBox) {
      this.oneBox.refreshDisplay(this.contentElement);
    }

    initPost.call(this);
  };

  CvPlsHelper.Post.prototype.strikethrough = function() {
    this.textElement.style.textDecoration = 'line-through';
    this.textElement.style.color = '#222';
  };

  CvPlsHelper.Post.prototype.addOneBox = function() {
    if (!this.oneBox && this.questionData) {
      this.oneBox = this.oneBoxFactory.create(this);
      this.oneBox.show();
    }
  };

  CvPlsHelper.Post.prototype.removeOneBox = function() {
    if (this.oneBox) {
      this.oneBox.hide();
    }
  };

  CvPlsHelper.Post.prototype.scrollTo = function() {
    var $lastCvRequestContainer, originalBackgroundColor;

    if (this.isOnScreen) {
      $lastCvRequestContainer = $(this.messageElement);
      originalBackgroundColor = $lastCvRequestContainer.parents('.messages').css('backgroundColor');
      $lastCvRequestContainer.css('background', 'yellow');

      $('html, body', document).animate({scrollTop: $lastCvRequestContainer.offset().top}, 500, function() {
        $lastCvRequestContainer.animate({
          backgroundColor: originalBackgroundColor
        }, 5000);
      });
    } else {
      window.open('http://chat.stackoverflow.com/transcript/message/' + this.postId + '#' + this.postId, '_blank');
    }
  };

}());