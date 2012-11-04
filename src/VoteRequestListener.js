// Listens for new posts added to/removed from the DOM and queues/dequeues them if they contain vote requests
// Too many args for this constructor? Probably
CvPlsHelper.VoteRequestListener = function(document, chatRoom, postFactory, voteRequestBufferFactory, voteRequestMessageQueue, voteQueueProcessor, voteRemoveProcessor) {

  "use strict";

  var self = this;

  this.chatRoom = chatRoom;
  this.postFactory = postFactory;
  this.voteRequestBufferFactory = voteRequestBufferFactory;
  this.voteRequestMessageQueue = voteRequestMessageQueue;
  this.voteQueueProcessor = voteQueueProcessor;
  this.voteRemoveProcessor = voteRemoveProcessor;
  self.activeUserClass = $('#active-user', document).attr('class').split(' ')[1];

  // Initialisation function
  this.init = function() {

    // Declare variables
    var chat, xpathQuery, xpathResult, i, $post;

    // While room is not yet loaded wait 1 second then try again
    if (!self.chatRoom.isRoomLoaded()) {
      setTimeout(self.init, 1000);
      return;
    }

    // Register event listeners
    chat = document.getElementById('chat');
    chat.addEventListener('DOMNodeInserted', self.domNodeInsertedListener);
    chat.addEventListener('DOMNodeRemoved', self.domNodeRemovedListener);

    // Get/loop all posts on the DOM
    xpathQuery = ".//div[contains(concat(' ', @class, ' '),' message ')]/div[contains(concat(' ', @class, ' '), ' content ') and not(contains(concat(' ', @class, ' '), ' cvhelper-processed '))]";
    xpathResult = document.evaluate(xpathQuery, chat, null, XPathResult.UNORDERED_NODE_SNAPSHOT_TYPE, null);

    for (i = 0; i < xpathResult.snapshotLength; i++) {
      $post = $(xpathResult.snapshotItem(i));

      // Skip pending messages and posts by current user
      if (!self.isMessagePending($post)) {
        self.processNewPost($post);
      }
    }

    self.processQueue();
  };

  // Event listener for DOMNodeInserted event
  this.domNodeInsertedListener = function(event) {
    var $post, target = event.target || event.srcElement;
    if (self.isNewOrEditedMessage(target)) {
      $post = $('div.content', target);
      self.processNewPost($post);
      setTimeout(self.processQueue, 0);
    }
  };

  // Event listener for DOMNodeRemoved event
  this.domNodeRemovedListener = function(event) {
    var $post, target = event.target || event.srcElement;
    if (self.isRemovedMessage(target)) {
      $post = $('div.content', target);
      self.processRemovedPost($post);
    }
  };

  // Enqueue post if it is a vote request
  this.processNewPost = function($post) {
    var post = self.postFactory.create($post);
    post.postType = post.postTypes.NEW; // this sucks. fix please
    if (post.isVoteRequest && !post.isOwnPost) {
      self.voteRequestMessageQueue.enqueue(post);
    }
  };

  // Adjust notifications for removed post
  this.processRemovedPost = function($post) {
    var post = self.postFactory.create($post);
    post.postType = post.postTypes.REMOVE;
    if (post.isVoteRequest && !post.isOwnPost) {
      setTimeout(function() {
        var editFound = false;
        self.voteRequestMessageQueue.each(function(item) {
          if (post.id === item.id && post.questionId === item.questionId) {
            item.postType = post.postTypes.EDIT;
            editFound = true;
            return false;
          }
        });
        if (!editFound) {
          self.voteRemoveProcessor.removeLost(post);
        }
      }, 0);
    }
  };

  // Process the voteRequestMessageQueue
  this.processQueue = function() {
    if (self.voteRequestMessageQueue.queue.length > 0) {
      self.voteQueueProcessor.processQueue(self.voteRequestBufferFactory.create(self.voteRequestMessageQueue));
    }
  };

  // Get classes of message as array, return empty array if element is not a <div>
  // This is a slightly childish refusal to use jQuery in cases where it doesn't
  // make things much easier than they are in vanilla JS
  this.getClassNameArray = function(element) {
    if (element.tagName === undefined || element.tagName.toLowerCase() !== 'div') {
      return [];
    }
    return element.className.split(/\s+/g);
  };

  // Check if element is a new or edited post
  this.isNewOrEditedMessage = function(element) {
    var classes = self.getClassNameArray(element);
    return classes.indexOf('message') > -1 && classes.indexOf('neworedit') > -1;
  };

  // Check if element is a message being removed from the DOM
  this.isRemovedMessage = function(element) {
    var classes = self.getClassNameArray(element);
    return classes.indexOf('message') > -1 && classes.indexOf('posted') < 0;
  };

  // Check if message is still pending
  this.isMessagePending = function($post) {
    return $post.closest('div.message').attr('id').substr(0, 7) === 'pending';
  };

};