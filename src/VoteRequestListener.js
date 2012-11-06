// Listens for new posts added to/removed from the DOM and queues/dequeues them if they contain vote requests
// Too many args for this constructor? Probably
CvPlsHelper.VoteRequestListener = function(document, chatRoom, mutationListenerFactory, postFactory, voteRequestBufferFactory, voteRequestMessageQueue, voteQueueProcessor, voteRemoveProcessor) {

  'use strict';

  var chatContainer, self = this;

  this.activeUserClass = null;

  // Get classes of message as array, return empty array if element is not a <div>
  function getClassNameArray(element) {
    if (element.tagName === undefined || element.tagName.toLowerCase() !== 'div') {
      return [];
    }
    return element.className.split(/\s+/g);
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

  // Check if message is still pending
  function isMessagePending($post) {
    return $post.closest('div.message').attr('id').substr(0, 7) === 'pending';
  }

  // Process the voteRequestMessageQueue
  function processQueue() {
    if (voteRequestMessageQueue.queue.length > 0) {
      voteQueueProcessor.processQueue(voteRequestBufferFactory.create(voteRequestMessageQueue));
    }
  }

  // Enqueue post if it is a vote request
  function processNewPost($post) {
    var post = postFactory.create($post);
    post.postType = post.postTypes.NEW; // this sucks. fix please
    if (post.isVoteRequest && !post.isOwnPost) {
      voteRequestMessageQueue.enqueue(post);
    }
  }

  // Adjust notifications for removed post
  function processRemovedPost($post) {
    var post = postFactory.create($post);
    post.postType = post.postTypes.REMOVE;
    if (post.isVoteRequest && !post.isOwnPost) {
      setTimeout(function() {
        var editFound = false;
        voteRequestMessageQueue.each(function(item) {
          if (post.id === item.id && post.questionId === item.questionId) {
            item.postType = post.postTypes.EDIT;
            editFound = true;
            return false;
          }
        });
        if (!editFound) {
          voteRemoveProcessor.removeLost(post);
        }
      }, 0);
    }
  }

  // Event listener for DOMNodeInserted event
  function domNodeInsertedListener(event) {
    var $post, target = event.target || event.srcElement;
    if (isNewOrEditedMessage(target)) {
      $post = $('div.content', target);
      processNewPost($post);
      setTimeout(processQueue, 0);
    }
  }

  // Event listener for DOMNodeRemoved event
  function domNodeRemovedListener(event) {
    var $post, target = event.target || event.srcElement;
    if (isRemovedMessage(target)) {
      $post = $('div.content', target);
      processRemovedPost($post);
    }
  }

  function registerEventListeners() {
    chatContainer.addEventListener('DOMNodeInserted', domNodeInsertedListener);
    chatContainer.addEventListener('DOMNodeRemoved', domNodeRemovedListener);
  }

  function setChatContainer() {
    chatContainer = document.getElementById('chat');
  }

  function setActiveUserClass() {
    self.activeUserClass = $('#active-user', document).attr('class').split(' ')[1];
  }

  function processAllPosts() {
    var xpathQuery, xpathResult, i, $post;

    xpathQuery = ".//div[contains(concat(' ', @class, ' '),' message ')]/div[contains(concat(' ', @class, ' '), ' content ') and not(contains(concat(' ', @class, ' '), ' cvhelper-processed '))]";
    xpathResult = document.evaluate(xpathQuery, chatContainer, null, XPathResult.UNORDERED_NODE_SNAPSHOT_TYPE, null);

    for (i = 0; i < xpathResult.snapshotLength; i++) {
      $post = $(xpathResult.snapshotItem(i));

      // Skip pending messages and posts by current user
      if (!isMessagePending($post)) {
        processNewPost($post);
      }
    }
  }

  // Initialisation function
  this.start = function() {
    chatRoom.onLoad(function() {
      setActiveUserClass();
      setChatContainer();
      registerEventListeners();
      processAllPosts();
      processQueue();
    });
  };

  this.stop = function() {
    // Might need to do something here, not sure
  };

};