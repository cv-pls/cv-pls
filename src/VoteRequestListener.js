/*jslint plusplus: true, white: true, browser: true */
/*global CvPlsHelper */

// Listens for new posts added to/removed from the DOM and queues/dequeues them if they contain vote requests
(function() {

  'use strict';

  // Get classes of message as array, return empty array if element is not a <div>
  function getClassNameArray(element) {
    var raw, current, result = [];
    if (element && element.className) {
      raw = element.className.split(/\s+/g);
      while (raw.length) {
        current = raw.shift();
        if (current) {
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

  // Process the voteRequestMessageQueue
  function processQueue() {
    this.queueProcessPending = false;
    if (this.voteRequestMessageQueue.queue.length > 0) {
      this.voteQueueProcessor.processQueue(this.voteRequestBufferFactory.create(this.voteRequestMessageQueue));
    }
  }

  // Enqueue post if it is a vote request
  function processNewPost(element) {
    var post = this.postFactory.create($(element));
    post.postType = post.postTypes.NEW; // this sucks. fix please
    if (post.isVoteRequest && !post.isOwnPost) {
      this.voteRequestMessageQueue.enqueue(post);
    }
  }

  // Adjust notifications for removed post
  function processRemovedPost(element) {
    var post = postFactory.create($(post));
    post.postType = post.postTypes.REMOVE;
    if (post.isVoteRequest && !post.isOwnPost) {
      this.voteRemoveProcessor.removeLost(post);
    }
  }

  // Event listener for NodeAdded event
  function nodeAddedListener(node) {
    if (isNewOrEditedMessage(node)) {
      processNewPost.call(this, node.querySelector('div.content'));
      if (!this.queueProcessPending) {
        setTimeout(processQueue.bind(this), 0);
        this.queueProcessPending = true;
      }
    }
  }

  // Event listener for DOMNodeRemoved event
  function nodeRemovedListener(node) {
    if (isRemovedMessage(node)) {
      processRemovedPost.call(this, node.querySelector('div.content'));
    }
  }

  // Event listener for DOMNodeRemoved event
  function nodeReplacedListener(event) {
    // do something here
  }

  // Registers the mutation event listeners
  function registerEventListeners() {
    var listener = this.mutationListenerFactory.getListener(this.chatRoom.chatContainer);
    listener.on('NodeAdded', nodeAddedListener.bind(this));
    listener.on('NodeRemoved', nodeRemovedListener.bind(this));
    listener.on('NodeReplaced', nodeReplacedListener.bind(this));
  }

  // Process all existing message on room load
  function processAllPosts() {
    var posts, i, l;

    posts = this.chatRoom.chatContainer.querySelectorAll('div.message:not(.pending) div.content:not(.cvhelper-processed)');

    for (i = 0, l = posts.length; i < l; i++) {
      processNewPost.call(this, posts[i]);
    }

    processQueue.call(this);
  }

  // Too many args for this constructor? Probably
  CvPlsHelper.VoteRequestListener = function(chatRoom, mutationListenerFactory, postFactory, voteRequestBufferFactory, voteRequestMessageQueue, voteQueueProcessor, voteRemoveProcessor) {
    this.chatRoom = chatRoom;
    this.mutationListenerFactory = mutationListenerFactory;
    this.postFactory = postFactory;
    this.voteRequestBufferFactory = voteRequestBufferFactory;
    this.voteRequestMessageQueue = voteRequestMessageQueue;
    this.voteQueueProcessor = voteQueueProcessor; 
    this.voteRemoveProcessor = voteRemoveProcessor;
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