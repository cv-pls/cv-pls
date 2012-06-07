// listens for new posts added to the DOM and queues them if they contain cv-pls / delv-pls requests
function VoteRequestListener(chatRoom, voteRequestMessageQueue, voteQueueProcessor) {
  var self = this;

  this.chatRoom = chatRoom;
  this.voteRequestMessageQueue = voteRequestMessageQueue;
  self.activeUserClass = $('#active-user').attr('class').split(' ')[1];

  this.init = function() {
    if (!self.chatRoom.isRoomLoaded()) {
      setTimeout(self.init, 1000);
    } else {
      self.postListener();
    }
  };

  this.postListener = function() {
    // we should do something smarter here. e.g. only loop through new posts
    $('div.user-container div.messages div.message div.content').each(function() {
      var $post = $(this);
      if ($post.hasClass('cvhelper-processed')) {
        return true;
      }

      if (self.isMessagePending($post)) {
        return false;
      }

      var post = new Post($post);

      if (self.isOwnPost($post)) {
        return true;
      }

      if (post.isVoteRequest) {
        self.voteRequestMessageQueue.enqueue(post);
      }
    });

    voteQueueProcessor.processQueue(new VoteRequestBuffer(self.voteRequestMessageQueue));

    setTimeout(self.postListener, 1000);
  };

  // check if message is still pending
  this.isMessagePending = function($post) {
    if ($post.closest('div.message').attr('id').substr(0, 7) == 'pending') {
      return true;
    }

    return false;
  };

  // check whether vote request is the user's
  this.isOwnPost = function($post) {
    var $userinfo = $post.closest('.messages').prev();
    if ($userinfo.attr('class').split(' ')[1] == self.activeUserClass) {
      return true;
    }

    return false;
  };
}

// chatroom class
function ChatRoom() {
  var self = this;

  this.status = false;

  this.checkRoomStatus = function() {
    if ($('#loading').length) {
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

// post class
function Post($post) {
  var self = this;

  this.$post = $post.addClass('cvhelper-processed');
  this.id = null;
  this.questionId = null;
  this.isVoteRequest = false;
  this.voteType = null;

  this.setMessageId = function() {
    self.id = self.$post.closest('div.message').attr('id').substr(8);
  }();

  this.postContainsQuestion = function() {
    if ($('a:contains("stackoverflow.com/questions/")', self.$post).length) {
      return true;
    }

    return false;
  };

  this.parseQuestionPost = function() {
    $('a .ob-post-tag', self.$post).each(function() {
      switch($(this).text()) {
        case 'cv-pls':
        case 'cv-maybe':
          self.isVoteRequest = true;
          self.voteType = 'cv';
          break;

        case 'delv-pls':
        case 'delv-maybe':
          self.isVoteRequest = true;
          self.voteType = 'delv';
          break;

        default:
          break;
      }
    });

    if (self.isVoteRequest) {
      self.$post.addClass('cvhelper-vote-request');
      $('a[href^="http://stackoverflow.com/questions/' + self.questionId + '"]', self.$post).addClass('cvhelper-question-link');
    }
  };

  this.setQuestionId = function() {
    self.questionId = $('a:contains("stackoverflow.com/questions/")', self.$post).attr('href').split('/')[4];
  };

  if (this.postContainsQuestion()) {
    this.setQuestionId();
    this.parseQuestionPost();
  }
}

// buffers up to 100 (maximum per API request) vote requests
function VoteRequestBuffer(voteRequestMessageQueue) {
  var self = this;

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
    self.postsIds = [];
    self.questionIds = [];

    self.items = self.posts.length;
    for (var i = 0; i < self.items; i++) {
      self.postsIds.push(self.posts[i].id);
      self.questionIds.push(self.posts[i].questionId);
    }
  };

  this.createBuffer(voteRequestMessageQueue);
}

// this is where all the items in the queue get processed
function VoteQueueProcessor(stackApi, voteRequestFormatter) {
  var self = this;

  this.stackApi = stackApi;

  this.processQueue = function(voteRequestBuffer) {
    // no vote requests ready to be processed, so end here
    if (voteRequestBuffer.items == 0) {
      return null;
    }

    self.makeRequest(voteRequestBuffer);
  };

  this.makeRequest = function(voteRequestBuffer) {
    stackApi.makeRequest('questions', voteRequestBuffer, 'stackoverflow.com', '!6LE4b5o5yvdNA', voteRequestFormatter);
  };
}

// callback function which handles the AJAX response from the stack-api
function VoteRequestProcessor(pluginSettings, voteRequestFormatter, audioPlayer, avatarNotification) {
  var self = this;

  this.process = function(buffer, items) {
    var newQuestions = false;
    for (var i = 0; i < buffer.items; i++) {
      var question = self.getQuestionById(items, buffer.questionIds[i]);

      // question is deleted?
      if (question === null) {
        continue;
      }

      newQuestions = true;
      avatarNotification.enqueue(new Post(buffer.posts[i].$post));

      if (pluginSettings.oneBox()) {
        voteRequestFormatter.addOnebox(buffer.posts[i].$post, question);
      }
    }

    if (pluginSettings.soundNotification() && audioPlayer.enabled && newQuestions) {
      audioPlayer.playNotification();
    }
    // enable audioplayer after initial load
    audioPlayer.enabled = true;
  };

  this.getQuestionById = function(items, questionId) {
    var length = items.length;
    for (var i = 0; i < length; i++) {
      if (items[i].question_id == questionId) {
        return items[i];
      }
    }

    return null;
  };
}

// turn cv / delv requests in nice oneboxes
function VoteRequestFormatter(pluginSettings) {
  var self = this;

  this.addOnebox = function($post, question) {
    $post.append(self.getOneboxHtml(question));
    self.processOneboxFormatting($post, question);
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
    var html = '';

    var length = tags.length;
    for (var i = 0; i < length; i++) {
      html+= '    <a href="http://stackoverflow.com/questions/tagged/' + tags[i] + '">';
      html+= '      <span class="ob-post-tag" style="background-color: #E0EAF1; color: #3E6D8E; border-color: #3E6D8E; border-style: solid;">' + tags[i] + '</span>';
      html+= '    </a>';
    }

    return html;
  };

  this.processOneboxFormatting = function($post, question) {
    var $onebox = $('.onebox', $post);

    self.processHeight($onebox);
    self.processStatus($onebox, question, $post);

    $('html, body').animate({ scrollTop: $(document).height() }, 'slow');
  };

  this.processHeight = function($onebox) {
    var $grippie = $('.grippie', $onebox);

    $grippie.width($onebox.width());

    if (pluginSettings.oneBoxHeight() !== null && pluginSettings.oneBoxHeight() < $onebox[0].scrollHeight) {
      $onebox.height(pluginSettings.oneBoxHeight());
      $onebox.css('padding-bottom', '10px');
      $onebox.gripHandler({
        cursor: 'n-resize',
        gripClass: 'grippie'
      });

      var totalWidth = $grippie.width();
      // grippie width = 27px
      var grippieX = Math.ceil((totalWidth-27) / 2);
      var currentY = $grippie.css('backgroundPosition').split('px ')[1];
      $grippie.css('backgroundPosition', grippieX + 'px ' + currentY).show();
    }
  };

  this.processStatus = function($onebox, question, $post) {
    if (!pluginSettings.showCloseStatus() || typeof question.closed_date == 'undefined') {
      return null;
    }

    var $title = $('.ob-post-title a', $onebox);
    $title.html($title.html() + ' [closed]');
    $post.addClass('cvhelper-closed');
  };
}

// handles the avatar notifications
function AvatarNotification(avatarNotificationStack, pluginSettings) {
  var self = this;

  this.enqueue = function($post) {
    avatarNotificationStack.push($post);
    self.displayNotitication();
  }

  this.displayNotitication = function() {
    if (!pluginSettings.avatarNotification()) {
      return null;
    }

    var $cvCount = $('#cv-count');

    if (!$cvCount.length) {
      var css = '';
      css+= 'position:absolute; z-index:4; top:7px; left:24px;';
      css+= ' color:white !important; background: -webkit-gradient(linear, left top, left bottom, from(#F11717), to(#F15417));';
      css+= ' border-radius: 20px; -webkit-box-shadow:1px 1px 2px #555; border:3px solid white; cursor: pointer;';
      css+= ' font-family:arial,helvetica,sans-serif; font-size: 15px; font-weight: bold; height: 20px; line-height: 20px;';
      css+= ' min-width: 12px; padding: 0 4px; text-align: center; display: none;';
      var html = '<div title="Cv request waiting for review" id="cv-count" style="' + css + '">' + avatarNotificationStack.queue.length + '</div>';

      $('#reply-count').after(html);
      $cvCount = $('#cv-count');
    } else {
      $cvCount.text(avatarNotificationStack.queue.length);
    }

    $cvCount.show();
  };

  this.navigateToLastRequest = function() {
    var lastRequest = avatarNotificationStack.pop();
    if (lastRequest === null) {
      return null;
    }

    var lastRequestPost = $('#message-'+lastRequest.id);
    if (lastRequestPost.length) {
      var lastCvRequestContainer = lastRequestPost;//.parent();
      var originalBackgroundColor = lastCvRequestContainer.parents('.messages').css('backgroundColor');

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
      window.open('http://chat.stackoverflow.com/transcript/message/' + lastRequest.id + '#' + lastRequest.id, '_blank');
    }

    self.updateSubtractedNotification();
  };

  this.manualDeleteFromStack = function(id) {
    var foundInStack = false;

    for (var i = avatarNotificationStack.queue.length-1; i >= 0; i--) {
      if (avatarNotificationStack.queue[i].id == id) {
        avatarNotificationStack.queue.splice(i, 1);
        foundInStack = true;
        break;
      }
    }

    if (foundInStack) {
      self.updateSubtractedNotification();
    }
  };

  this.updateSubtractedNotification = function() {
    var $cvCount = $('#cv-count');
    if ($cvCount.length) {
      $cvCount.text(avatarNotificationStack.queue.length);

      if (!avatarNotificationStack.queue.length) {
        $cvCount.animate({
          opacity: 0
        }, 1000, function() {
          $cvCount.remove();
        });
      }
    }
  };
}

// handles the polling of the status of requests
function StatusPolling(pluginSettings, pollMessageQueue, pollQueueProcessor) {
  var self = this;

  this.pollStatus = function() {
    if (!pluginSettings.pollCloseStatus()) {
      return false;
    }

    // sorry for the tight coupling
    $('.cvhelper-vote-request').each(function() {
      var post = new Post($(this));

      pollMessageQueue.enqueue(post);
    });

    pollQueueProcessor.processQueue(new VoteRequestBuffer(pollMessageQueue));

    setTimeout(self.pollStatus, pluginSettings.pollInterval()*60000);
  };
}

// callback function which handles the AJAX response from the stack-api
function StatusRequestProcessor(pluginSettings) {
  var self = this;

  this.process = function(buffer, items) {
    //var newQuestions = false;
    for (var i = 0; i < buffer.items; i++) {
      var question = self.getQuestionById(items, buffer.questionIds[i]);

      // question is deleted?
      if (question === null) {
        continue;
      }

      if (pluginSettings.showCloseStatus() && typeof question.closed_date != 'undefined') {
        if (!buffer.posts[i].$post.hasClass('cvhelper-closed')) {
          var $title = $('.onebox .cvhelper-question-link', buffer.posts[i].$post);
          $title.html($title.html() + ' [closed]');
          buffer.posts[i].$post.addClass('cvhelper-closed')
        }
      }
    }
  };

  this.getQuestionById = function(items, questionId) {
    var length = items.length;
    for (var i = 0; i < length; i++) {
      if (items[i].question_id == questionId) {
        return items[i];
      }
    }

    return null;
  };
}

function SoundManager(pluginSettings) {
  var self = this;

  // sound settings popup listener
  this.watchPopup = function() {
    var $popup = $('#chat-body > .popup');

    if ($popup.length) {
      var status = 'disabled';
      if (pluginSettings.soundNotification()) {
        status = 'enabled';
      }

      $('ul.no-bullets', $popup).after('<hr><ul class="no-bullet" id="cvpls-sound"><li><a href="#">cv-pls (' + status + ')</a></li></ul>');
    } else {
      self.watchPopup();
    }
  };

  // toggle sound setting
  this.toggleSound = function() {
    var $option = $('#cvpls-sound a');
    if (pluginSettings.soundNotification()) {
      pluginSettings.settings.saveSetting('soundNotification', false);
      $option.text('cv-pls (disabled)');
      chrome.extension.sendRequest({method: 'saveSetting', key: 'soundNotification', value: false}, function(response) { });
    } else {
      pluginSettings.settings.saveSetting('soundNotification', true);
      $option.text('cv-pls (enabled)');
      chrome.extension.sendRequest({method: 'saveSetting', key: 'soundNotification', value: true}, function(response) { });
    }
  };
}

function ButtonsManager(pluginSettings) {
  var self = this;

  this.init = function() {
    if (pluginSettings.delvPlsButton()) {
      self.addDelvButton();
    }

    if (pluginSettings.cvPlsButton()) {
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

function DesktopNotification(pluginSettings) {
  this.show = function(title, message) {
    if (!pluginSettings.desktopNotification()) {
      return null;
    }

    chrome.extension.sendRequest({method: 'showNotification', title: title, message: message}, function(response) { });
  }.bind(this);
}

function CvBacklog(pluginSettings, backlogUrl) {
  var self = this;

  this.descriptionElem = $('#roomdesc');
  this.originalDescription = this.descriptionElem.html();

  this.show = function() {
  }.bind(this);

  this.hide = function() {
    this.descriptionElem.html(this.originalDescription);
  }.bind(this);

  this.refresh = function() {
    if (!pluginSettings.backlogEnabled()) {
      return null;
    }

    $.ajax({
      headers: {
          Accept : 'application/json; charset=utf-8'
      },
      url: backlogUrl,
      error: function(jqHr, status, error) {
        // request error, this should be taken care of :)
        // e.g. request quota reached
      },
      success: function(data, status, jqHr) {
        var html = '';
        var lineBreak = '';

        for (var i = 0; i < data.length; i++) {
          if (i == pluginSettings.backlogAmount()) {
            break;
          }

          html += lineBreak + self.buildCvLink(data[i]);

          lineBreak = '<br>';
        }

        self.descriptionElem.html(html);

        if (pluginSettings.backlogRefresh()) {
          setTimeout(function() {
            self.refresh();
          }, (pluginSettings.backlogRefreshInterval() * 60 * 1000));
        }
      }
    });
  };

  this.buildCvLink = function(cvRequest) {
    return '[cv-pls] <a href="' + cvRequest.link + '" target="_blank">' + cvRequest.title + '</a>';
  };

  self.refresh();
}

(function($) {
  var settings = new Settings();
  var pluginSettings = new PluginSettings(settings);

  var soundManager = new SoundManager(pluginSettings);

  var buttonsManager = new ButtonsManager(pluginSettings);

  var voteRequestFormatter = new VoteRequestFormatter(pluginSettings);
  var audioPlayer = new AudioPlayer('http://or.cdn.sstatic.net/chat/so.mp3');
  var avatarNotificationStack = new RequestStack();
  var avatarNotification = new AvatarNotification(avatarNotificationStack, pluginSettings);
  var voteRequestProcessor = new VoteRequestProcessor(pluginSettings, voteRequestFormatter, audioPlayer, avatarNotification);

  var stackApi = new StackApi();
  var voteQueueProcessor = new VoteQueueProcessor(stackApi, voteRequestProcessor);

  var chatRoom = new ChatRoom();
  var voteRequestMessageQueue = new RequestQueue();
  var voteRequestListener = new VoteRequestListener(chatRoom, voteRequestMessageQueue, voteQueueProcessor);

  var pollMessageQueue = new RequestQueue();
  var statusRequestProcessor = new StatusRequestProcessor(pluginSettings);
  var pollQueueProcessor = new VoteQueueProcessor(stackApi, statusRequestProcessor);
  var statusPolling = new StatusPolling(pluginSettings, pollMessageQueue, pollQueueProcessor);

  var desktopNotification = new DesktopNotification(pluginSettings);

  var cvBacklog = new CvBacklog(pluginSettings, 'http://cvbacklog.gordon-oheim.biz/');

  chrome.extension.sendRequest({method: 'getSettings'}, function(settingsJsonString) {
    pluginSettings.saveAllSettings(settingsJsonString);
    buttonsManager.init();
    voteRequestListener.init();
    // wait 1 minute before polling to prevent getting kicked from stack-api
    setTimeout(statusPolling.pollStatus, 60000);

    // desktop notifications test
    //desktopNotification.show('the <a href="#">title</a>', 'http://stackoverflow.com');

    cvBacklog.show();

    chrome.extension.sendRequest({method: 'showIcon'}, function(response) { });
    chrome.extension.sendRequest({method: 'checkUpdate'}, function(response) { });

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

    if (val != '') {
      $('#sayit-button').click();
    }
  });

  // handle delvpls button click
  $('body').on('click', '#delv-pls-button', function() {
    var val = $('#input').val();
    $('#input').val('[tag:delv-pls] ' + val).focus().putCursorAtEnd();

    if (val != '') {
      $('#sayit-button').click();
    }
  });

  // handle click on link of a request
  $('body').on('click', '.cvhelper-question-link', function() {
    var id = $(this).closest('.message').attr('id').split('-')[1];
    avatarNotification.manualDeleteFromStack(id);
  });
})(jQuery);