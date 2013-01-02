/*jslint plusplus: true, white: true, browser: true */
/*global CvPlsHelper */

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
    var messageIdClass = (this.messageElement.getAttribute('id') || '').match(/message-(\d+)/);
    if (messageIdClass) {
      this.postId = parseInt(messageIdClass[1], 10);
    }
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
    this.tags = {};
    for (i = 0; i < tagElements.length; i++) {
      this.tags[tagElements[i].firstChild.data.toLowerCase()] = tagElements[i];
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
    var i, l, voteTag;

    voteTag = this.matchTag(/^(cv|delv)-(pls|maybe)$/);
    this.voteType = this.voteTypes[voteTag.split('-').shift().toUpperCase()];
    this.voteTagElement = this.tags[voteTag];

    if (!this.contentElement.querySelector('span.cvhelper-vote-request-text')) { // Required for strikethrough to work
      this.contentWrapperElement = this.document.createElement('span');
      this.contentWrapperElement.setAttribute('class', 'cvhelper-vote-request-text');
      while (this.contentElement.firstChild) {
        this.contentWrapperElement.appendChild(this.contentElement.removeChild(this.contentElement.firstChild));
      }
      this.contentElement.appendChild(this.contentWrapperElement);
    }
  }

  // Sets the question ID based on the first question link in the post
  function setQuestionId() {
    var questionLinks, i, l, parts;

    questionLinks = this.contentElement.querySelectorAll('a[href^="http://stackoverflow.com/questions/"], a[href^="http://stackoverflow.com/q/"]');

    for (i = 0, l = questionLinks.length; i < l; i++) {
      parts = questionLinks[i].getAttribute('href').match(/^http:\/\/stackoverflow\.com\/q(?:uestions)?\/(\d+)/);
      if (parts) {
        this.questionId = parseInt(parts[1], 10);
        this.questionLinkElement = questionLinks[i];
        addClass(questionLinks[i], 'cvhelper-question-link');
        break;
      }
    }

    if (!this.questionId) {
      this.isVoteRequest = false;
      this.voteType = null;
    }
  }

  // Adds a class to the element to indicate that it has been processed
  function markProcessed() {
    addClass(this.contentElement, 'cvhelper-processed');
  }

  function initPost() {
    if (this.contentElement) {
      loadTags.call(this);
      setIsVoteRequest.call(this);
      if (this.isVoteRequest) {
        setVoteType.call(this);
        setQuestionId.call(this);
      }
      markProcessed.call(this);
    }
  }

  function setPostElements(messageElement) {
    this.messageElement = messageElement;
    this.contentElement = messageElement.querySelector('div.content');
    this.animator = this.animatorFactory.create(messageElement);
    if (messageElement.parentNode) {
      this.messagesElement = messageElement.parentNode;
    }
  }

  function notify(type) {
    if (!(this.notificationHistory & type)) {
      this.avatarNotificationManager.enqueue(this);
      this.notificationHistory |= type;
      this.hasPendingNotification = true;
    }
  }

  function markCompleted() {
    this.isOutstandingRequest = false;
    if (this.pluginSettings.getSetting('removeCompletedNotifications')) {
      this.avatarNotificationManager.dequeue(this);
    }
    if (this.pluginSettings.getSetting('removeCompletedOneboxes')) {
      this.removeOneBox();
    }
    if (this.pluginSettings.getSetting('strikethroughCompleted')) {
      this.strikethrough();
    }
  }

  function enterStateOpen() {
    this.questionStatus = this.questionStatuses.OPEN;
    if (this.voteType === this.voteTypes.DELV && !this.isOwnPost) {
      this.voteTagElement.firstChild.data = this.voteTagElement.firstChild.data.replace('delv-', 'cv-');
    }
    this.addOneBox();
    notify.call(this, this.voteTypes.CV);
  }

  function enterStateClosed() {
    this.questionStatus = this.questionStatuses.CLOSED;
    if (this.voteType === this.voteTypes.DELV) {
      this.addOneBox();
      this.voteTagElement.firstChild.data = this.voteTagElement.firstChild.data.replace('cv-', 'delv-');
      notify.call(this, this.voteTypes.DELV);
    } else {
      markCompleted.call(this);
    }
  }

  function enterStateDeleted() {
    this.questionStatus = this.questionStatuses.DELETED;
    if (!this.hasQuestionData) {
      if (!this.pluginSettings.getSetting('removeCompletedNotifications')) {
        notify.call(this, this.voteType);
      }
      if (!this.pluginSettings.getSetting('removeCompletedOneboxes')) {
        this.addOneBox();
      }
    }
    markCompleted.call(this);
  }

  function updateOneBoxDisplay() {
    if (this.oneBox) {
      if (this.questionData) {
        this.oneBox.setScore(this.questionData.score);
      }
      if (this.pluginSettings.getSetting('showCloseStatus')) {
        switch (this.questionStatus) {
          case this.questionStatuses.CLOSED:
            this.oneBox.setStatusText('closed');
            break;
          case this.questionStatuses.DELETED:
            this.oneBox.setStatusText('deleted');
            break;
        }
      }
    }
  }

  // Constructor
  CvPlsHelper.Post = function(document, pluginSettings, chatRoom, oneBoxFactory, avatarNotificationManager, animatorFactory, messageElement) {
    this.document = document;
    this.pluginSettings = pluginSettings;
    this.chatRoom = chatRoom;
    this.oneBoxFactory = oneBoxFactory;
    this.avatarNotificationManager = avatarNotificationManager;
    this.animatorFactory = animatorFactory;
    setPostElements.call(this, messageElement);

    // These are outside initPost to avoid over-processing a replacement element
    setPostId.call(this);
    setIsOwnPost.call(this);

    initPost.call(this);
  };

  // Status Enums
  CvPlsHelper.Post.voteTypes = CvPlsHelper.Post.prototype.voteTypes = {
    ROV:  1,
    CV:   2,
    DELV: 4
  };
  CvPlsHelper.Post.questionStatuses = CvPlsHelper.Post.prototype.questionStatuses = {
    UNKNOWN: 0,
    OPEN:    1,
    CLOSED:  2,
    DELETED: 4
  };

  // Public properties
  CvPlsHelper.Post.prototype.messageElement = null;
  CvPlsHelper.Post.prototype.messagesElement = null;
  CvPlsHelper.Post.prototype.contentElement = null;
  CvPlsHelper.Post.prototype.contentWrapperElement = null;
  CvPlsHelper.Post.prototype.questionLinkElement = null;
  CvPlsHelper.Post.prototype.voteTagElement = null; 

  CvPlsHelper.Post.prototype.oneBox = null;
  CvPlsHelper.Post.prototype.animator = null;

  CvPlsHelper.Post.prototype.postId = null;
  CvPlsHelper.Post.prototype.questionId = null;

  CvPlsHelper.Post.prototype.hasQuestionData = false;
  CvPlsHelper.Post.prototype.questionData = null;
  CvPlsHelper.Post.prototype.questionStatus = 0;

  CvPlsHelper.Post.prototype.voteType = null;
  CvPlsHelper.Post.prototype.postType = 0;

  CvPlsHelper.Post.prototype.isVoteRequest = false;
  CvPlsHelper.Post.prototype.isOutstandingRequest = true;
  CvPlsHelper.Post.prototype.isOwnPost = false;
  CvPlsHelper.Post.prototype.isOnScreen = true;

  CvPlsHelper.Post.prototype.notificationHistory = 0;
  CvPlsHelper.Post.prototype.hasPendingNotification = false;

  // Public methods

  // Matches tags against the given expr (string or RegExp) and returns the first match
  CvPlsHelper.Post.prototype.matchTag = function(expr) {
    var propName, matches, result = null;
    if (typeof expr === 'string' && this.tags[String(expr).toLowerCase()] !== undefined) {
      result = expr;
    } else if (expr instanceof RegExp) {
      for (propName in this.tags) {
        if (this.tags.hasOwnProperty(propName)) {
          matches = String(propName).match(expr);
          if (matches) {
            result = matches[0];
            break;
          }
        }
      }
    }
    return result;
  };

  CvPlsHelper.Post.prototype.replaceElement = function(newNode, isSameQuestionId) {
    isSameQuestionId = isSameQuestionId || false;

    this.isVoteRequest = this.voteType = this.questionId = null;
    setPostElements.call(this, newNode);

    if (isSameQuestionId) {
      if (this.oneBox) {
        this.oneBox.refreshDisplay(this.contentElement);
      }
    } else {
      this.questionData = this.oneBox = null;
    }

    initPost.call(this);
  };

  CvPlsHelper.Post.prototype.setQuestionData = function(data) {
    this.questionData = data;

    if (!data) {
      if (this.questionStatus !== this.questionStatuses.DELETED) {
        enterStateDeleted.call(this);
      }
    } else if (data.closed_date !== undefined) {
      if (this.questionStatus !== this.questionStatuses.CLOSED) {
        enterStateClosed.call(this);
      }
    } else {
      if (this.questionStatus !== this.questionStatuses.OPEN) {
        enterStateOpen.call(this);
      }
    }

    this.hasQuestionData = true;
    updateOneBoxDisplay.call(this);
  };

  CvPlsHelper.Post.prototype.strikethrough = function() {
    this.contentWrapperElement.style.textDecoration = 'line-through';
    this.contentWrapperElement.style.color = '#222';
  };

  CvPlsHelper.Post.prototype.addOneBox = function() {
    if (!this.oneBox && !this.isOwnPost && this.questionData && this.pluginSettings.getSetting('oneBox')) {
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
    var originalBackgroundColor, scrollEnd, scrollTarget, rgbEnd, rgbDiff;

    function parseRGB(value) {
      var parts, result = {};
      parts = value.match(/^#([0-9a-f]{2})([0-9a-f]{2})([0-9a-f]{2})$/i);
      if (parts) {
        result.r = parseInt(parts[1], 16);
        result.g = parseInt(parts[2], 16);
        result.b = parseInt(parts[3], 16);
        return result;
      }
      parts = value.match(/^\s*rgba?\s*\(\s*([0-9]{1,3})\s*,\s*([0-9]{1,3})\s*,\s*([0-9]{1,3})\s*(?:,\s*([0-9]{1,3})\s*)?\)\s*$/i);
      if (parts) {
        result.r = parseInt(parts[1], 10);
        result.g = parseInt(parts[2], 10);
        result.b = parseInt(parts[3], 10);
        return result;
      }
    }

    if (this.isOnScreen) {
      scrollEnd = this.messageElement.offsetTop;
      scrollTarget = this.document.defaultView;
      originalBackgroundColor = this.document.defaultView.getComputedStyle(this.messagesElement, null).getPropertyValue('background-color');

      rgbEnd = parseRGB(originalBackgroundColor);
      rgbDiff = {
        r: rgbEnd.r - 255,
        g: rgbEnd.g - 255,
        b: rgbEnd.b
      };

      this.messageElement.style.backgroundColor = '#FFFF00';
      this.animator.animate({
        startValue: scrollTarget.scrollY,
        endValue: scrollEnd,
        totalTime: 500,
        frameFunc: function(newValue, animation) {
          scrollTarget.scroll(scrollTarget.scrollX, newValue);
        },
        easing: 'decel',
        complete: function() {
          this.animate({
            startValue: 0,
            endValue: 1,
            totalTime: 5000,
            frameFunc: function(newValue, animation) {
              var r, g, b;
              r = 255 + Math.floor(newValue * rgbDiff.r);
              g = 255 + Math.floor(newValue * rgbDiff.g);
              b = Math.floor(newValue * rgbDiff.b);
              this.style.backgroundColor = 'rgb('+r+', '+g+', '+b+')';
            }
          });
        }
      });
    } else {
      window.open('http://chat.stackoverflow.com/transcript/message/' + this.postId + '#' + this.postId, '_blank');
    }
  };

}());