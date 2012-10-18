/*jslint plusplus: true, white: true, browser: true */
/*global jQuery, $, VoteRequestListener, XPathResult, Settings, PluginSettings, AudioPlayer, RequestStack, StackApi, RequestQueue, chrome */

// Listens for new posts added to/removed from the DOM and queues/dequeues them if they contain vote requests
// Too many args for this constructor? Probably
function VoteRequestListener(chatRoom, postFactory, voteRequestBufferFactory, voteRequestMessageQueue, voteQueueProcessor, voteRemoveProcessor) {

  "use strict";

  var self = this;

  this.chatRoom = chatRoom;
  this.postFactory = postFactory;
  this.voteRequestBufferFactory = voteRequestBufferFactory;
  this.voteRequestMessageQueue = voteRequestMessageQueue;
  this.voteQueueProcessor = voteQueueProcessor;
  this.voteRemoveProcessor = voteRemoveProcessor;
  self.activeUserClass = $('#active-user').attr('class').split(' ')[1];

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
    if (self.isNewOrEditedMessage(event.srcElement)) {
      var $post = $('div.content', event.srcElement);
      self.processNewPost($post);
      setTimeout(self.processQueue, 0);
    }
  };

  // Event listener for DOMNodeRemoved event
  this.domNodeRemovedListener = function(event) {
    if (self.isRemovedMessage(event.srcElement)) {
      var $post = $('div.content', event.srcElement);
      self.processRemovedPost($post);
    }
  };

  // Enqueue post if it is a vote request
  this.processNewPost = function($post) {
    var post = self.postFactory.create($post);
    post.postType = post.postTypes.NEW;
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

}

// ChatRoom class
function ChatRoom() {

  "use strict";

  var self = this;

  this.status = false;

  this.checkRoomStatus = function() {
    if (document.getElementById('loading')) {
      setTimeout(self.checkRoomStatus, 1000);
    } else {
      self.setRoomStatus(true);
    }
  };

  this.setRoomStatus = function(status) {
    self.status = status;
  };

  this.isRoomLoaded = function() {
    return self.status;
  };

  this.checkRoomStatus();
}

// Post class
function Post($post, activeUserClass) {

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
  if ($post === undefined) {
    this.activeUserClass = document.getElementById('active-user').getAttribute('class').match(/user-\d+/)[0];
    this.create = function($post) {
      return new self.constructor($post, self.activeUserClass);
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
      self.voteType = self.voteTypes[xpathResult.snapshotItem(0).innerText.split('-').shift().toUpperCase()];

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

}

// Buffers up to 100 (maximum per API request) vote requests
function VoteRequestBuffer(voteRequestMessageQueue) {

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
}

// This is where all the items in the queue get processed
function VoteQueueProcessor(stackApi, voteRequestProcessor) {

  "use strict";

  var self = this;

  this.stackApi = stackApi;

  this.processQueue = function(voteRequestBuffer) {
    // no vote requests ready to be processed, so end here
    if (voteRequestBuffer.items === 0) {
      return null;
    }

    self.makeRequest(voteRequestBuffer);
  };

  this.makeRequest = function(voteRequestBuffer) {
    stackApi.makeRequest('questions', voteRequestBuffer, 'stackoverflow.com', '!6LE4b5o5yvdNA', voteRequestProcessor);
  };
}

// Callback function which handles the AJAX response from the stack-api
function VoteRequestProcessor(pluginSettings, voteRequestFormatter, audioPlayer, avatarNotification) {

  "use strict";

  var self = this;

  this.process = function(buffer, items) {
    var newQuestions = false, i, question, post;
    for (i = 0; i < buffer.items; i++) {
      post = buffer.posts[i];
      question = self.getQuestionById(items, buffer.questionIds[i]);

      if (!question) { // Question is deleted

        if (!pluginSettings.getSetting("removeCompletedNotifications")) {
          avatarNotification.enqueue(post);
        }
        if (pluginSettings.getSetting("strikethroughCompleted")) {
          voteRequestFormatter.strikethrough(post, question);
        }

      } else if (question.closed_date !== undefined) { // Question is closed

        newQuestions = true;

        if (post.voteType === post.voteTypes.DELV) {

          if (post.postType !== post.postTypes.EDIT) {
            avatarNotification.enqueue(post);
          }

          if (pluginSettings.getSetting("oneBox")) {
            voteRequestFormatter.addOnebox(post.$post, question);
          }

        } else {

          if (post.postType !== post.postTypes.EDIT && !pluginSettings.getSetting("removeCompletedNotifications")) {
            avatarNotification.enqueue(post);
          }

          if (pluginSettings.getSetting("oneBox") && !pluginSettings.getSetting("removeCompletedOneboxes")) {
            voteRequestFormatter.addOnebox(post.$post, question);
          }

          if (pluginSettings.getSetting("strikethroughCompleted")) {
            voteRequestFormatter.strikethrough(post, question);
          }

        }

      } else { // Question is open

        newQuestions = true;

        if (post.postType !== post.postTypes.EDIT) {
          avatarNotification.enqueue(post);
        }

        if (pluginSettings.getSetting("oneBox")) {
          voteRequestFormatter.addOnebox(post.$post, question);
        }

      }

    }

    if (newQuestions && audioPlayer.enabled && pluginSettings.getSetting("soundNotification")) {
      audioPlayer.playNotification();
    }
    // enable audioplayer after initial load
    audioPlayer.enabled = true;
  };

  this.getQuestionById = function(items, questionId) {
    var length = items.length, i;
    for (i = 0; i < length; i++) {
      if (items[i].question_id === questionId) {
        return items[i];
      }
    }

    return null;
  };
}

// Handles posts that fall off the top of the screen
function VoteRemoveProcessor(pluginSettings, avatarNotification) {
  // This whole class is kind of pointless
  // It's only really here as an LoD buffer
  // I still can't decide if it's actually necessary

  "use strict";

  var self = this;

  this.pluginSettings = pluginSettings;
  this.avatarNotification = avatarNotification;

  this.removeLost = function(post) {
    if (pluginSettings.getSetting("removeLostNotifications")) {
      self.avatarNotification.dequeue(post.id);
      self.avatarNotification.reconcileQueue();
    }
  };
}

// Turn cv / delv requests in nice oneboxes
function VoteRequestFormatter(pluginSettings, avatarNotification) {

  "use strict";

  var self = this;

  this.addOnebox = function($post, question) {
    var oneBox = self.getOnebox(question);
    $post.append(oneBox);
    self.processOneboxFormatting(oneBox, $post, question);
  };

  this.removeOnebox = function(post) {
    var $onebox = $('div.onebox', post.$post);
    if ($onebox.length) {
      $onebox.remove();
    }
  };

  this.strikethrough = function(post) {
    $('.cvhelper-vote-request-text', post.$post).css({
      textDecoration: 'line-through',
      color: '#222'
    });
  };

  this.getOnebox = function(question) {
    var oneBox,
        voteDisplay, siteIcon, postTitleContainer, postBodyContainer, postTagsContainer, clearDiv,
        postTitleAnchor, postAvatar, tagAnchor, tagSpan, i, grippie;

    oneBox = document.createElement('div');
    oneBox.setAttribute('class', 'onebox ob-post cv-request');
    oneBox.setAttribute('style', 'overflow: hidden; position: relative;'); // Yes yes I know. Feel free to fix it if you want. DOM is already verbose enough.

    voteDisplay = document.createElement('div');
    voteDisplay.setAttribute('class', 'ob-post-votes');
    voteDisplay.setAttribute('title', 'This question has a score of ' + question.score);
    voteDisplay.appendChild(document.createTextNode(question.score));
    oneBox.appendChild(voteDisplay);

    siteIcon = document.createElement('img');
    siteIcon.setAttribute('class', 'ob-post-siteicon');
    siteIcon.setAttribute('width', '20');
    siteIcon.setAttribute('height', '20');
    siteIcon.setAttribute('src', 'http://sstatic.net/stackoverflow/img/apple-touch-icon.png');
    siteIcon.setAttribute('title', 'Stack Overflow');
    oneBox.appendChild(siteIcon);

    postTitleAnchor = document.createElement('a');
    postTitleAnchor.setAttribute('href', question.link);
    postTitleAnchor.setAttribute('class', 'cvhelper-question-link');
    postTitleAnchor.setAttribute('style', 'color: #0077CC;');
    postTitleAnchor.addEventListener('click', function() {
      var id = $(this).closest('.message').attr('id').split('-')[1];
      avatarNotification.dequeue(id);
    });
    postTitleAnchor.appendChild(document.createTextNode(question.title));

    postTitleContainer = document.createElement('div');
    postTitleContainer.setAttribute('class', 'ob-post-title');
    postTitleContainer.appendChild(document.createTextNode('Q: '));
    postTitleContainer.appendChild(postTitleAnchor);
    oneBox.appendChild(postTitleContainer);

    postAvatar = document.createElement('img');
    siteIcon.setAttribute('class', 'user-gravatar32');
    siteIcon.setAttribute('width', '32');
    siteIcon.setAttribute('height', '32');
    siteIcon.setAttribute('src', question.owner.profile_image);
    siteIcon.setAttribute('title', question.owner.display_name);
    siteIcon.setAttribute('alt', question.owner.display_name);

    postBodyContainer = document.createElement('p');
    postBodyContainer.setAttribute('class', 'ob-post-body');
    postBodyContainer.appendChild(siteIcon);
    postBodyContainer.appendChild(document.createTextNode(question.body));
    oneBox.appendChild(postBodyContainer);

    postTagsContainer = document.createElement('div');
    postTagsContainer.setAttribute('class', 'ob-post-tags');

    for (i = 0; i < question.tags.length; i++) {
      tagSpan = document.createElement('span');
      tagSpan.setAttribute('class', 'ob-post-tag');
      tagSpan.setAttribute('style', 'background-color: #E0EAF1; color: #3E6D8E; border-color: #3E6D8E; border-style: solid;');
      tagSpan.appendChild(document.createTextNode(question.tags[i]));
      tagAnchor = document.createElement('a');
      tagAnchor.setAttribute('href', 'http://stackoverflow.com/questions/tagged/' + question.tags[i]);
      tagAnchor.appendChild(tagSpan);
      postTagsContainer.appendChild(tagAnchor);
    }

    grippie = document.createElement('div');
    grippie.setAttribute('class', 'grippie');
    grippie.setAttribute('style', 'margin-right: 0px; background-position: 321px -823px; border: 1px solid #DDD; border-width: 0pt 1px 1px; cursor: s-resize; height: 9px; overflow: hidden; background-color: #EEE; margin-right: -8px; background-image: url(\'http://cdn.sstatic.net/stackoverflow/img/sprites.png?v=5\'); background-repeat: no-repeat; margin-top: 10px; display: none; position: absolute; bottom: 0; width: 250px;');
    postTagsContainer.appendChild(grippie);
    oneBox.appendChild(postTagsContainer);

    clearDiv = document.createElement('div');
    clearDiv.setAttribute('class', 'clear-both');
    oneBox.appendChild(clearDiv);

    return oneBox;
  };

  this.processOneboxFormatting = function(oneBox, $post, question) {
    var $onebox = $(oneBox);

    self.processHeight($onebox);
    self.processStatus($onebox, question, $post);

    $('html, body').animate({ scrollTop: $(document).height() }, 'slow');
  };

  this.processHeight = function($onebox) {
    var $grippie = $('.grippie', $onebox), totalWidth, grippieX, currentY;

    $grippie.width($onebox.width());

    if (pluginSettings.getSetting("oneBoxHeight") !== null && pluginSettings.getSetting("oneBoxHeight") < $onebox[0].scrollHeight) {
      $onebox.height(pluginSettings.getSetting("oneBoxHeight"));
      $onebox.css('padding-bottom', '10px');
      $onebox.gripHandler({
        cursor: 'n-resize',
        gripClass: 'grippie'
      });

      totalWidth = $grippie.width();
      // grippie width = 27px
      grippieX = Math.ceil((totalWidth-27) / 2);
      currentY = $grippie.css('backgroundPosition').split('px ')[1];
      $grippie.css('backgroundPosition', grippieX + 'px ' + currentY).show();
    }
  };

  this.processStatus = function($onebox, question, $post) {
    if (question.closed_date === undefined || !pluginSettings.getSetting("showCloseStatus")) {
      return null;
    }

    var $title = $('.ob-post-title a', $onebox);
    $title.html($title.html() + ' [closed]');
    $post.addClass('cvhelper-closed');
  };
}

// Handles the avatar notifications
function AvatarNotification(avatarNotificationStack, pluginSettings) {

  "use strict";

  var self = this;

  this.animating = false;
  this.updateQueued = false;

  this.$cvCount = null;

  // Adds a post to the queue
  this.enqueue = function(post) {
    avatarNotificationStack.push(post);
    $('a.cvhelper-question-link', post.element)[0].addEventListener('click', function() {
      self.dequeue(post.id);
    });
    self.updateNotificationDisplay();
  };

  // Removes a post from the queue by post ID
  this.dequeue = function(id) {
    var i, stackPos = -1;

    // Find the post in the queue
    for (i = avatarNotificationStack.queue.length - 1; i >= 0; i--) {
      if (avatarNotificationStack.queue[i].id === id) {
        stackPos = i;
        break;
      }
    }

    // If we found it remove it and update display
    if (stackPos > -1) {
      avatarNotificationStack.queue.splice(stackPos, 1);
      self.updateNotificationDisplay();
    }
  };

  // Checks that all posts in the queue are still on the DOM
  this.reconcileQueue = function() {
    var i, refresh;

    // Iterate notification queue and remove any items that are no longer on the DOM
    refresh = false;
    for (i = avatarNotificationStack.queue.length - 1; i >= 0; i--) {
      if (document.getElementById('message-'+avatarNotificationStack.queue[i].id) === null) {
        refresh = true;
        avatarNotificationStack.queue.splice(i, 1);
      }
    }

    // Update notification if the stack has been altered or the current notification does not match the stack length
    if (refresh || parseInt(self.$cvCount.text(), 10) !== avatarNotificationStack.queue.length) {
      self.updateNotificationDisplay();
    }
  };

  // Updates the avatar notification display
  this.updateNotificationDisplay = function() {
    var html, css, opacity;

    if (!pluginSettings.getSetting("avatarNotification")) {
      return null;
    }

    // Prevent multiple calls in quick succession from causing missing notifications
    if (self.animating) {
      self.updateQueued = true;
      return null;
    }
    self.updateQueued = false;

    // Create the avatar notification element and add it to the DOM
    if (self.$cvCount === null) {
      css  = 'position:absolute; z-index:4; top:7px; left:24px;';
      css += ' color:white !important; background: -webkit-gradient(linear, left top, left bottom, from(#F11717), to(#F15417));';
      css += ' border-radius: 20px; -webkit-box-shadow:1px 1px 2px #555; border:3px solid white; cursor: pointer;';
      css += ' font-family:arial,helvetica,sans-serif; font-size: 15px; font-weight: bold; height: 20px; line-height: 20px;';
      css += ' min-width: 12px; padding: 0 4px; text-align: center; opacity: 0;';
      html = '<div title="CV requests waiting for review" id="cv-count" style="' + css + '"></div>';

      $('#reply-count').after(html);

      self.$cvCount = $('#cv-count');
    }

    /*
     The problem with avatar notification updates when posts are edited lies mainly in the lines below
     
     When a post is edited the original element is removed from the DOM and replaced with a new one. This
     causes the avatar notification to quickly decrement and then increment, which is particularly noticable
     when the post is the only notification, because it triggers the animation as well.
     
     In order to fix this, the code below needs to be run asynchronously and to check whether an element with
     the same post ID was re-added to the DOM in the meantime. Alternatively (probably better) this should be
     implemented in VoteRequestListener.
    */
    opacity = avatarNotificationStack.queue.length ? 1 : 0;

    self.$cvCount.text(avatarNotificationStack.queue.length);

    self.animating = true;
    self.$cvCount.animate({opacity: opacity}, 500, function() {
      self.animating = false;
      if (self.updateQueued) {
        self.updateNotificationDisplay();
      }
    });

  };

  // Moves the screen to the last cv request on the stack (click handler for notification box)
  this.navigateToLastRequest = function() {
    var lastRequest = avatarNotificationStack.pop(), lastRequestPost, lastCvRequestContainer, originalBackgroundColor;
    if (lastRequest === null) {
      return null;
    }

    lastRequestPost = $('#message-'+lastRequest.id);
    if (lastRequestPost.length) {
      lastCvRequestContainer = lastRequestPost;
      originalBackgroundColor = lastCvRequestContainer.parents('.messages').css('backgroundColor');

      // check if question is deleted
      if (lastCvRequestContainer.length) {
        lastCvRequestContainer.css('background', 'yellow');
        $('html, body').animate({scrollTop: lastCvRequestContainer.offset().top}, 500, function() {
          lastCvRequestContainer.animate({
            backgroundColor: originalBackgroundColor
          }, 5000);
        });
      }
    } else {
      if (!pluginSettings.getSetting("removeLostNotifications")) { // Should never happen but just in case something goes wrong
        window.open('http://chat.stackoverflow.com/transcript/message/' + lastRequest.id + '#' + lastRequest.id, '_blank');
      }
    }

    self.updateNotificationDisplay();
  };
}

// Handles the polling of the status of requests
function StatusPolling(pluginSettings, postFactory, voteRequestBufferFactory, pollMessageQueue, pollQueueProcessor) {

  "use strict";

  var self = this;
  this.postFactory = postFactory;
  this.voteRequestBufferFactory = voteRequestBufferFactory;

  this.pollStatus = function() {
    if (!pluginSettings.getSetting("pollCloseStatus")) {
      return false;
    }
    
    // sorry for the tight coupling
    $('.cvhelper-vote-request').each(function() {
      var post = self.postFactory.create($(this));

      pollMessageQueue.enqueue(post);
    });

    pollQueueProcessor.processQueue(self.voteRequestBufferFactory.create(pollMessageQueue));

    setTimeout(self.pollStatus, pluginSettings.getSetting("pollInterval")*60000);
  };
}

// Callback function which handles the AJAX response from the stack-api
function StatusRequestProcessor(pluginSettings, voteRequestFormatter, avatarNotification) {

  "use strict";

  var self = this;
  this.voteRequestFormatter = voteRequestFormatter;
  this.avatarNotification = avatarNotification;

  this.process = function(buffer, items) {
    var i, question, post, $title;

    for (i = 0; i < buffer.items; i++) {
      post = buffer.posts[i];
      question = self.getQuestionById(items, post.questionId);

      if (question) {
        if (question.closed_date !== undefined) { // question is closed

          if (post.voteType === post.voteTypes.CV) {
            if (pluginSettings.getSetting("removeCompletedNotifications")) {
              self.avatarNotification.dequeue(post.id);
            }
            if (pluginSettings.getSetting("removeCompletedOneboxes")) {
              self.voteRequestFormatter.removeOnebox(post);
            }
            if (pluginSettings.getSetting("strikethroughCompleted")) {
              self.voteRequestFormatter.strikethrough(post);
            }
          }

          if (pluginSettings.getSetting("showCloseStatus") && !post.$post.hasClass('cvhelper-closed')) {
            $title = $('.onebox .cvhelper-question-link', post.$post);
            $title.html($title.html() + ' [closed]');
            post.$post.addClass('cvhelper-closed');
          }
        }

      } else { // question is deleted

        if (pluginSettings.getSetting("removeCompletedNotifications")) {
          self.avatarNotification.dequeue(post.id);
        }
        if (pluginSettings.getSetting("removeCompletedOneboxes")) {
          self.voteRequestFormatter.removeOnebox(post);
        }
        if (pluginSettings.getSetting("strikethroughCompleted")) {
          self.voteRequestFormatter.strikethrough(post);
        }

      }
    }
  };

  // Fetches a question from the returned JSON object by question ID
  this.getQuestionById = function(items, questionId) {
    var length = items.length, i;
    for (i = 0; i < length; i++) {
      if (items[i].question_id === questionId) {
        return items[i];
      }
    }

    return null;
  };
}

// SoundManager class
function SoundManager(pluginSettings) {

  "use strict";

  var self = this;

  // Sound settings popup listener
  this.watchPopup = function() {
    var $popup = $('#chat-body > .popup'), status;

    if ($popup.length) {
      status = 'disabled';
      if (pluginSettings.getSetting("soundNotification")) {
        status = 'enabled';
      }

      $('ul.no-bullets', $popup).after('<hr><ul class="no-bullet" id="cvpls-sound"><li><a href="#">cv-pls (' + status + ')</a></li></ul>');
    } else {
      self.watchPopup();
    }
  };

  // Toggle sound setting
  this.toggleSound = function() {
    var $option = $('#cvpls-sound a');
    if (pluginSettings.getSetting("soundNotification")) {
      pluginSettings.settings.saveSetting('soundNotification', false);
      $option.text('cv-pls (disabled)');
      chrome.extension.sendRequest({method: 'saveSetting', key: 'soundNotification', value: false}, function(){});
    } else {
      pluginSettings.settings.saveSetting('soundNotification', true);
      $option.text('cv-pls (enabled)');
      chrome.extension.sendRequest({method: 'saveSetting', key: 'soundNotification', value: true}, function(){});
    }
  };
}

// ButtonsManager class
function ButtonsManager(pluginSettings) {

  "use strict";

  var self = this;

  this.init = function() {
    if (pluginSettings.getSetting("delvPlsButton")) {
      self.addDelvButton();
    }

    if (pluginSettings.getSetting("cvPlsButton")) {
      self.addCvButton();
    }
  };

  this.addCvButton = function() {
    var html = '<button class="button" id="cv-pls-button" style="margin-left: 4px;">cv-pls</button>';

    $('#upload-file').after(html);
  };

  this.addDelvButton = function() {
    var html = '<button class="button" id="delv-pls-button" style="margin-left: 4px;">delv-pls</button>';

    $('#upload-file').after(html);
  };
}

// DesktopNotification class
function DesktopNotification(pluginSettings) {

  "use strict";

  this.show = function(title, message) {
    if (!pluginSettings.getSetting("desktopNotification")) {
      return null;
    }

    chrome.extension.sendRequest({method: 'showNotification', title: title, message: message}, function(){});
  }.bind(this);
}

// CvBacklog class
function CvBacklog(pluginSettings, backlogUrl) {

  "use strict";

  var self = this;

  this.descriptionElem = $('#roomdesc');
  this.originalDescription = this.descriptionElem.html();

  this.show = function() {
  }.bind(this);

  this.hide = function() {
    this.descriptionElem.html(this.originalDescription);
  }.bind(this);

  this.refresh = function() {
    if (!pluginSettings.getSetting("backlogEnabled")) {
      return null;
    }

    $.ajax({
      headers: {
          Accept : 'application/json; charset=utf-8'
      },
      url: backlogUrl,
      error: function() {
        // request error, this should be taken care of :)
        // e.g. request quota reached
      },
      success: function(data) {
        var html = '', lineBreak = '', i, backlogAmount = parseInt(pluginSettings.getSetting("backlogAmount"), 10);

        for (i = 0; i < data.length; i++) {
          if (i === backlogAmount) {
            break;
          }

          html += lineBreak + self.buildCvLink(data[i]);

          lineBreak = '<br>';
        }

        self.descriptionElem.html(html);

        if (pluginSettings.getSetting("backlogRefresh")) {
          setTimeout(function() {
            self.refresh();
          }, (pluginSettings.getSetting("backlogRefreshInterval") * 60 * 1000));
        }
      }
    });
  };

  this.buildCvLink = function(cvRequest) {
    var requestType = (cvRequest.closed_date !== undefined) ? 'delv' : 'cv';
    return '[' + requestType + '-pls] <a href="' + cvRequest.link + '" target="_blank">' + cvRequest.title + '</a>';
  };

  self.refresh();
}

(function($) {

  "use strict";

  var settings, pluginSettings,
      soundManager,
      buttonsManager,
      voteRequestFormatter, audioPlayer, avatarNotificationStack, avatarNotification, voteRequestProcessor, voteRemoveProcessor,
      stackApi, voteQueueProcessor,
      chatRoom, postFactory, voteRequestBufferFactory, voteRequestMessageQueue, voteRequestListener,
      pollMessageQueue, statusRequestProcessor, pollQueueProcessor, statusPolling,
      desktopNotification,
      cvBacklog;

  settings = new Settings();
  pluginSettings = new PluginSettings(settings);

  soundManager = new SoundManager(pluginSettings);

  buttonsManager = new ButtonsManager(pluginSettings);

  audioPlayer = new AudioPlayer('http://or.cdn.sstatic.net/chat/so.mp3');
  avatarNotificationStack = new RequestStack();
  avatarNotification = new AvatarNotification(avatarNotificationStack, pluginSettings);
  voteRequestFormatter = new VoteRequestFormatter(pluginSettings, avatarNotification);
  voteRequestProcessor = new VoteRequestProcessor(pluginSettings, voteRequestFormatter, audioPlayer, avatarNotification);
  voteRemoveProcessor = new VoteRemoveProcessor(pluginSettings, avatarNotification);

  stackApi = new StackApi();
  voteQueueProcessor = new VoteQueueProcessor(stackApi, voteRequestProcessor);

  chatRoom = new ChatRoom();
  postFactory = new Post();
  voteRequestBufferFactory = new VoteRequestBuffer();
  voteRequestMessageQueue = new RequestQueue();
  voteRequestListener = new VoteRequestListener(chatRoom, postFactory, voteRequestBufferFactory, voteRequestMessageQueue, voteQueueProcessor, voteRemoveProcessor);

  pollMessageQueue = new RequestQueue();
  statusRequestProcessor = new StatusRequestProcessor(pluginSettings, voteRequestFormatter, avatarNotification);
  pollQueueProcessor = new VoteQueueProcessor(stackApi, statusRequestProcessor);
  statusPolling = new StatusPolling(pluginSettings, postFactory, voteRequestBufferFactory, pollMessageQueue, pollQueueProcessor);

  desktopNotification = new DesktopNotification(pluginSettings);

  cvBacklog = new CvBacklog(pluginSettings, 'http://cvbacklog.gordon-oheim.biz/');

  chrome.extension.sendRequest({method: 'getSettings'}, function(settingsJsonString) {
    pluginSettings.saveAllSettings(settingsJsonString);
    buttonsManager.init();
    voteRequestListener.init();
    // wait 1 minute before polling to prevent getting kicked from stack-api
    setTimeout(statusPolling.pollStatus, 60000);

    // desktop notifications test
    //desktopNotification.show('the <a href="#">title</a>', 'http://stackoverflow.com');

    cvBacklog.show();

    chrome.extension.sendRequest({method: 'showIcon'}, function(){});
    chrome.extension.sendRequest({method: 'checkUpdate'}, function(){});

    // sound options
    $('#sound').click(function() {
      soundManager.watchPopup();
    });

    // save sound setting
    $('body').on('click', '#cvpls-sound li', function() {
      soundManager.toggleSound();

      return false;
    });
  });

  // handle click on avatar notification
  $('body').on('click', '#cv-count', function() {
    avatarNotification.navigateToLastRequest();

    return false;
  });

  // handle cvpls button click
  $('body').on('click', '#cv-pls-button', function() {
    var val = $('#input').val();
    $('#input').val('[tag:cv-pls] ' + val).focus().putCursorAtEnd();

    if (val.toString() !== '') {
      $('#sayit-button').click();
    }
  });

  // handle delvpls button click
  $('body').on('click', '#delv-pls-button', function() {
    var val = $('#input').val();
    $('#input').val('[tag:delv-pls] ' + val).focus().putCursorAtEnd();

    if (val.toString() !== '') {
      $('#sayit-button').click();
    }
  });
}(jQuery));