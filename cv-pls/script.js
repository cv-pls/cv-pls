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
    xpathQuery = "//div[contains(@class,'message')]/div[contains(@class,'content') and not(contains(@class,'cvhelper-processed'))]";
    xpathResult = document.evaluate(xpathQuery, document.getElementById('chat'), null, XPathResult.UNORDERED_NODE_SNAPSHOT_TYPE, null);

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
      self.processQueue();
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
    if (!post.isOwnPost) {
      if (post.isVoteRequest) {
        self.voteRequestMessageQueue.enqueue(post);
      }
    }
  };

  // Adjust avatar notifications for removed post
  this.processRemovedPost = function($post) {
    var post = self.postFactory.create($post);
    if (!post.isOwnPost) { // Tempoary until own post handling is implemented
      if (post.isVoteRequest) {
        self.voteRemoveProcessor.removeLost(post);
      }
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

  // Enums FTW!
  this.voteTypes = {
    CV: 1,
    DELV: 2
  };
  this.postTypes = {
    NEW: 1,
    EDIT: 2,
    REMOVE: 3
  };

  // An attempt at a factory pattern implementation. I do not like this approach, but it works for now.
  if ($post === undefined) {
    this.activeUserClass = $('#active-user').attr('class').split(' ')[1]; // It's not as bad as a static property. It isn't. No it *isn't*. Shut up.
    this.create = function($post) {
      return new self.constructor($post, self.activeUserClass);
    };
    return;
  }

  this.$post = $post;
  this.id = $post.closest('div.message').attr('id').substr(8);
  this.questionId = null;
  this.isVoteRequest = false;
  this.voteType = null;
  this.postType = null;
  this.isOwnPost = false;

  this.setQuestionId = function() {
    var $links = $('a:contains("stackoverflow.com/questions/"), a:contains("stackoverflow.com/q/")', self.$post);

    if (!$links.length) {
      return false;
    }

    self.questionId = parseInt($links.attr('href').split('/')[4], 10);
    return true;
  };  

  this.parseQuestionPost = function() {

    // TODO: This is not very DRY, some of this work is already done in VoteRequestListener. Also the jQuery is crap.
    if (!$post.hasClass('neworedit')) {
      self.postType = self.postTypes.REMOVE;
    } else if ($('a.edits', $post.closest('div.message')).length) {
      self.postType = self.postTypes.EDIT;
    } else {
      self.postType = self.postTypes.NEW;
    }

    self.isOwnPost = $post.closest('.messages').prev().hasClass(activeUserClass);

    // TODO: Rewrite this. It kind of sucks.
    $('a .ob-post-tag', self.$post).each(function() {
      switch($(this).text()) {
        case 'cv-pls':
        case 'cv-maybe':
          self.isVoteRequest = true;
          self.voteType = self.voteTypes.CV;
          break;

        case 'delv-pls':
        case 'delv-maybe':
          self.isVoteRequest = true;
          self.voteType = self.voteTypes.DELV;
          break;

        default:
          break;
      }

    });

    if (self.isVoteRequest) {
      self.$post.addClass('cvhelper-vote-request');
      if ($(".cvhelper-vote-request-text", self.$post).length < 1) {
        // Required for strikethrough to work
        self.$post.html('<span class="cvhelper-vote-request-text">' + self.$post.html() + '</span>');
      }
      $('a[href^="http://stackoverflow.com/questions/' + self.questionId + '"], a[href^="http://stackoverflow.com/q/' + self.questionId + '"]', self.$post).addClass('cvhelper-question-link');
    }

  };

  $post.addClass('cvhelper-processed');//.children().wrapAll('<span class="cvhelper-vote-request-text"></span>');
  if (this.setQuestionId()) {
    this.parseQuestionPost();
  }

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
          avatarNotification.enqueue(post);

          if (pluginSettings.getSetting("oneBox")) {
            voteRequestFormatter.addOnebox(post.$post, question);
          }
        } else {
          if (!pluginSettings.getSetting("removeCompletedNotifications")) {
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

        avatarNotification.enqueue(post);
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
function VoteRequestFormatter(pluginSettings) {

  "use strict";

  var self = this;

  this.addOnebox = function($post, question) {
    $post.append(self.getOneboxHtml(question));
    self.processOneboxFormatting($post, question);
  };

  this.removeOnebox = function(post) {
    var $onebox = $('div.onebox', post.$post);
    if ($onebox.length) {
      $onebox.remove();
    }
  };

  this.strikethrough = function(post) {
    $('.cvhelper-vote-request-text', post.$post).css('textDecoration', 'line-through');
  };

  this.getOneboxHtml = function(question) {
    var html = '';

    html+= '<div class="onebox ob-post cv-request" style="overflow: hidden; position: relative;">';
    html+= '  <div class="ob-post-votes" title="This question has a score of ' + question.score + '.">' + question.score + '</div>';
    html+= '  <img width="20" height="20" class="ob-post-siteicon" src="http://sstatic.net/stackoverflow/img/apple-touch-icon.png" title="Stack Overflow">';
    html+= '  <div class="ob-post-title">Q: <a style="color: #0077CC;" href="' + question.link + '" class="cvhelper-question-link">' + question.title + '</a></div>';
    html+= '  <p class="ob-post-body">';
    html+= '    <img width="32" height="32" class="user-gravatar32" src="' + question.owner.profile_image + '" title="' + question.owner.display_name + '" alt="' + question.owner.display_name + '">' + question.body;
    html+= '  </p>';
    html+= '  <div class="ob-post-tags">';
    html+= self.getTagsHtml(question.tags);
    html+= '    <div class="grippie" style="margin-right: 0px; background-position: 321px -823px; border: 1px solid #DDD; border-width: 0pt 1px 1px; cursor: s-resize; height: 9px; overflow: hidden; background-color: #EEE; margin-right: -8px; background-image: url(\'http://cdn.sstatic.net/stackoverflow/img/sprites.png?v=5\'); background-repeat: no-repeat; margin-top: 10px; display: none; position: absolute; bottom: 0; width: 250px;"></div>';
    html+= '  </div>';
    html+= '  <div class="clear-both"></div>';
    html+= '</div>';

    return html;
  };

  this.getTagsHtml = function(tags) {
    var html = '', length = tags.length, i;

    for (i = 0; i < length; i++) {
      html+= '    <a href="http://stackoverflow.com/questions/tagged/' + tags[i] + '">';
      html+= '      <span class="ob-post-tag" style="background-color: #E0EAF1; color: #3E6D8E; border-color: #3E6D8E; border-style: solid;">' + tags[i] + '</span>';
      html+= '    </a>';
    }

    return html;
  };

  this.processOneboxFormatting = function($post, question) {
    var $onebox = $('div.onebox', $post);

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

  // Adds a post to the queue
  this.enqueue = function(post) {
    avatarNotificationStack.push(post);
    self.updateNotificationDisplay();
  };

  // Removes a post from the queue by post ID
  this.dequeue = function(id) {
    var i, stackPos = -1;

    for (i = avatarNotificationStack.queue.length - 1; i >= 0; i--) {
      if (avatarNotificationStack.queue[i].id === id) {
        stackPos = i;
        break;
      }
    }

    if (stackPos > -1) {
      avatarNotificationStack.queue.splice(stackPos, 1);
      self.updateNotificationDisplay();
    }
  };

  // Checks that all posts in the queue are still on the DOM
  this.reconcileQueue = function() {
    var i;

    for (i = avatarNotificationStack.queue.length - 1; i >= 0; i--) {
      if (document.getElementById('message-'+avatarNotificationStack.queue[i].id) === null) {
        avatarNotificationStack.queue.splice(i, 1);
      }
    }

    self.updateNotificationDisplay();
  };

  // Updates the avatar notification display
  this.updateNotificationDisplay = function() {
    if (!pluginSettings.getSetting("avatarNotification")) {
      return null;
    }

    if (avatarNotificationStack.queue.length) {
      // Create element if it doesn't exist and set to current stack size
      if (document.getElementById('cv-count') === null) {
        var html, css = '';

        css+= 'position:absolute; z-index:4; top:7px; left:24px;';
        css+= ' color:white !important; background: -webkit-gradient(linear, left top, left bottom, from(#F11717), to(#F15417));';
        css+= ' border-radius: 20px; -webkit-box-shadow:1px 1px 2px #555; border:3px solid white; cursor: pointer;';
        css+= ' font-family:arial,helvetica,sans-serif; font-size: 15px; font-weight: bold; height: 20px; line-height: 20px;';
        css+= ' min-width: 12px; padding: 0 4px; text-align: center; display: none;';
        html = '<div title="CV requests waiting for review" id="cv-count" style="' + css + '"></div>';

        $('#reply-count').after(html);
      }
      $('#cv-count').text(avatarNotificationStack.queue.length).show();
    } else {
      // Nothing left in queue, set to 0 and fade
      $('#cv-count').text("0").animate({
        opacity: 0
      }, 1000, function() {
        $(this).remove();
      });
    }
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
      if (!pluginSettings.getSetting("removeLostNotifications")) {
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

  voteRequestFormatter = new VoteRequestFormatter(pluginSettings);
  audioPlayer = new AudioPlayer('http://or.cdn.sstatic.net/chat/so.mp3');
  avatarNotificationStack = new RequestStack();
  avatarNotification = new AvatarNotification(avatarNotificationStack, pluginSettings);
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

  // handle click on link of a request
  $('body').on('click', '.cvhelper-question-link', function() {
    var id = $(this).closest('.message').attr('id').split('-')[1];
    avatarNotification.dequeue(id);
  });
}(jQuery));