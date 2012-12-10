/*jslint plusplus: true, white: true, browser: true */
/*global CvPlsHelper */

// Listens for new posts added to/removed from the DOM and queues/dequeues them if they contain vote requests
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

  // Check if element is a new or edited post
  function isNewOrEditedMessage(element) {
    var classes = getClassNameArray(element);
    return classes.indexOf('message') > -1 && classes.indexOf('neworedit') > -1;
  }

  // Check if element is a message being removed from the DOM
  function isRemovedMessage(element) {
    var classes = getClassNameArray(element);
    return classes.indexOf('message') > -1 && classes.indexOf('posted') < 0;
  }

  function isDeletedPost(element) {
    return Boolean(element.querySelector('span.deleted'));
  }

  function getMessageId(node) {
    var result, id = node.getAttribute('id').match(/^message-(\d+)$/i);
    result = id ? parseInt(id[1], 10) : 0;
    return result;
  }

  // Process the postsOnScreen
  function processQueue() {
    this.queueProcessPending = false;
    this.questionStatusPoller.poll();
  }

  // Schedule the queue process action
  function scheduleQueueProcess() {
    var self = this;
    if (!this.queueProcessPending) {
      setTimeout(function() {
        processQueue.call(self);
      }, 0);
      this.queueProcessPending = true;
    }
  }

  // Event listener for NodeAdded event
  function nodeAddedListener(node) {
    var existingPost, newPost = this.postFactory.create(node);
    if (newPost.isVoteRequest) {
      existingPost = this.postsOnScreen.query(function(post) {
        return post.hasQuestionData && post.questionId === newPost.questionId;
      }).shift();
      if (existingPost) {
        newPost.setQuestionData(existingPost.questionData);
      } else {
        scheduleQueueProcess.call(this);
      }
      this.postsOnScreen.push(newPost);
    }
  }

  // Event listener for DOMNodeRemoved event
  function nodeRemovedListener(node) {
    var post, postId = getMessageId(node);
    post = this.postsOnScreen.match('postId', postId);
    if (post) {
      post.isOnScreen = false;
      this.postsOnScreen.remove(post);
      this.voteRemoveProcessor.removeLost(post);
    }
  }

  // Event listener for DOMNodeRemoved event
  function nodeReplacedListener(oldNode, newNode) {
    var self = this,
        postId = getMessageId(oldNode),
        newPost = this.postFactory.create(newNode),
        oldPost = this.postsOnScreen.match('postId', postId),
        existingQuestionPost;
    if (oldPost) {
      if (!newPost.isVoteRequest) {
        this.postsOnScreen.remove(oldPost);
        this.voteRemoveProcessor.remove(oldPost);
      } else if (newPost.questionId === oldPost.questionId) {
        oldPost.replaceElement(newNode, true);
      } else {
        existingQuestionPost = this.postsOnScreen.query(function(post) {
          return post.hasQuestionData && post.questionId === newPost.questionId;
        }).shift();
        oldPost.replaceElement(newNode, false);
        if (existingQuestionPost) {
          oldPost.setQuestionData(existingQuestionPost.questionData);
        } else {
          scheduleQueueProcess.call(this);
        }
      }
    } else if (newPost.isVoteRequest) {
      existingQuestionPost = this.postsOnScreen.query(function(post) {
        return post.hasQuestionData && post.questionId === newPost.questionId;
      }).shift();
      if (existingQuestionPost) {
        newPost.setQuestionData(existingQuestionPost.questionData);
      } else {
        scheduleQueueProcess.call(this);
      }
      this.postsOnScreen.push(newPost);
    }
  }

  // Registers the mutation event listeners
  function registerEventListeners() {
    var listener = this.mutationListenerFactory.getListener(this.chatRoom.chatContainer);
    listener.on('NodeAdded', nodeAddedListener.bind(this));
    listener.on('FilterAdded', function(node) {
      return isNewOrEditedMessage(node);
    });
    listener.on('NodeRemoved', nodeRemovedListener.bind(this));
    listener.on('FilterRemoved', function(node) {
      return isRemovedMessage(node);
    });
    listener.on('NodeReplaced', nodeReplacedListener.bind(this));
    listener.on('FilterReplaced', function(oldNode, newNode) {
      return isNewOrEditedMessage(newNode);
    });
    listener.on('FilterCompare', function(node1, node2) {
      return node1.id === node2.id;
    });
  }

  // Process all existing message on room load
  function processAllPosts() {
    var posts, i, l;

    posts = this.chatRoom.chatContainer.querySelectorAll('div.message:not(.pending)');

    for (i = 0, l = posts.length; i < l; i++) {
      nodeAddedListener.call(this, posts[i]);
    }
  }

  // Too many args for this constructor? Probably, but I can't work out how to reduce it.
  CvPlsHelper.VoteRequestListener = function(chatRoom, mutationListenerFactory, postFactory, postsOnScreen, voteRemoveProcessor, questionStatusPoller) {
    this.chatRoom = chatRoom;
    this.mutationListenerFactory = mutationListenerFactory;
    this.postFactory = postFactory;
    this.postsOnScreen = postsOnScreen;
    this.voteRemoveProcessor = voteRemoveProcessor;
    this.questionStatusPoller = questionStatusPoller;
  };
  CvPlsHelper.VoteRequestListener.prototype.queueProcessPending = false;

  // Starts the background processes
  CvPlsHelper.VoteRequestListener.prototype.start = function() {
    this.chatRoom.onLoad(function() {
      registerEventListeners.call(this);
      processAllPosts.call(this);
    }.bind(this));
  };

  CvPlsHelper.VoteRequestListener.prototype.stop = function() {
    // Might need to do something here, not sure
  };

}());