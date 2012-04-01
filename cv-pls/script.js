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

// queue with all active close requests
function VoteRequestQueue() {
  var self = this;

  this.queue = [];

  this.enqueue = function(post) {
    self.queue.push(post);
  };

  this.dequeue = function() {
    if (!self.queue.length) {
      return null;
    }

    return self.queue.shift();
  };
}

// stack with all actoive close requests
function VoteRequestStack() {
  var self = this;

  this.queue = [];

  this.push = function(post) {
    self.queue.push(post);
  };

  this.pop = function() {
    if (!self.queue.length) {
      return null;
    }

    return self.queue.pop();
  };
}

// post class
function Post($post) {
  var self = this;

  this.$post = $post.addClass('vote-request');
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
    html+= '  <div class="ob-post-title">Q: <a style="color: #0077CC;" href="' + question.link + '">' + question.title + '</a></div>';
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
    self.processStatus($onebox, question);

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
      $grippie.show();
    }
  };

  this.processStatus = function($onebox, question) {
    if (!pluginSettings.showCloseStatus() || typeof question.closed_date == 'undefined') {
      return null;
    }

    var $title = $('.ob-post-title a', $onebox);
    $title.html($title.html() + ' [closed]');
  };
}

function VoteRequestListener(chatRoom, voteRequestMessageQueue, voteQueueProcessor) {
  var self = this;

  this.chatRoom = chatRoom;
  this.voteRequestMessageQueue = voteRequestMessageQueue;

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
      if ($post.hasClass('vote-request')) {
        return false;
      }
      var post = new Post($post);

      if (post.isVoteRequest) {
        self.voteRequestMessageQueue.enqueue(post);
      }
    });

    voteQueueProcessor.processQueue(new VoteRequestBuffer(self.voteRequestMessageQueue));

    setTimeout(self.postListener, 1000);
  };
}

function StackApi() {
  var self = this;

  this.baseUrl = 'https://api.stackexchange.com/2.0/';
  this.requestMethods = {
    questions: {
      urlPath: 'questions/'
    }
  };

  this.makeRequest = function(type, buffer, site, filter, responseProcessor) {
    var url = self.baseUrl + self.requestMethods[type].urlPath + self.parseIds(buffer.questionIds);
    var requestData = {
      site: site,
      filter: filter,
      pagesize: buffer.items,
    };
    var requestSettings = {
        url: url,
        data: requestData,
        error: function(jqHr, status, error) {
          // request error, this should be taken care of :)
          // e.g. request quota reached
        },
        success: function(data, status, jqHr) {
            if (data.items == undefined || data.items.length == 0) {
                // questions deleted?
                return;
            }
            responseProcessor.process(buffer, data.items);
        }
    }
    $.ajax(requestSettings);
  };

  this.parseIds = function(ids) {
    return ids.join(';');
  };
}

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
      var css = 'position:absolute; z-index:4; top:7px; left:24px; color:white !important; background: -webkit-gradient(linear, left top, left bottom, from(#F11717), to(#F15417)); border-radius: 20px; -webkit-box-shadow:1px 1px 2px #555; border:3px solid white; cursor: pointer; font-family:arial,helvetica,sans-serif; font-size: 15px; font-weight: bold; height: 20px; line-height: 20px; min-width: 12px; padding: 0 4px; text-align: center; display: none;';
      var html = '<div title="Cv request waiting for review" id="cv-count" style="' + css + '">' + avatarNotificationStack.queue.length + '</div>';

      $('#reply-count').after(html);
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

function CvHelper(chatRoom, voteRequestQueue, stackApi, settings, soundPlayer) {
  var self = this;

  this.chatRoom = chatRoom;
  this.voteRequestQueue = voteRequestQueue;



  //this.stackApi = stackApi;
  //this.settings = settings;
  //this.soundPlayer = soundPlayer;

  //this.lastMessageId = 0;

  //this.requests = [];

  // check if room is finished loading
  this.init = function() {
    if (!self.chatRoom.isRoomLoaded()) {
      setTimeout(self.init, 1000);
    } else {
      $('div.user-container div.messages div.message div.content').each(function() {
        var post = new Post($(this));

        if (post.isVoteRequest) {
          self.voteRequestQueue.enqueue(post);

          //self.displayCvCount(true);
          //self.formatCloseRequest($post);
        }
      });
console.log(self.voteRequestQueue.queue);
      //self.postListener();

      chrome.extension.sendRequest({method: 'getPolling'}, function(pollingSettings) {
        if (pollingSettings.poll) {
          //self.pollStatus(pollingSettings);
        }
      });
    }
  };

  this.pollStatus = function() {
    $('div.cv-request:not(.closed)').each(function() {
      var $post = $(this).closest('div.content');

      stackApi.pollStatus(self.getPostInfo(self.getQuestionId($post)), $post);
    });

    chrome.extension.sendRequest({method: 'getPolling'}, function(pollingSettings) {
      if (pollingSettings.poll) {
        var timeout = 5;
        if (pollingSettings.interval) {
          timeout = pollingSettings.interval;
        }
        setTimeout(function() {
          self.pollStatus();
        }, timeout*60000);
      }
    });
  }

  // check if message is still pending
  this.isMessagePending = function(id) {
    if (id.substr(0, 7) == 'pending') {
      return true;
    }

    return false;
  };

  // sets the last message id
  this.setLastMessageId = function(id) {
    self.lastMessageId = id;
  };

  // adds a listener for new chat-messages
  this.postListener = function() {
    var $currentMessage = $('div.user-container div.messages div.message:last');
    var rawId = $currentMessage.attr('id');
    var currentMessageId = self.getMessageId(rawId);

    // only try to format when post is finished loading
    if (!self.isMessagePending(rawId)) {
      var $post = $('div.content', $currentMessage);

      if (currentMessageId > self.lastMessageId && $post.length) {
        self.lastMessageId = currentMessageId;

        if (self.isCloseRequest($post)) {
          self.requests.push($post.parent().attr('id'));
          self.lastMessageId = currentMessageId;

          self.displayCvCount();
          self.formatCloseRequest($post);

          if (self.settings.isSoundEnabled()) {
            self.soundPlayer.playNotification();
          }
        }
      }
    }

    setTimeout(self.postListener, 1000);
  };

  // onclick scroll to and highlight yellow oldest / latest and substract one cv requests from counter
  this.displayCvCount = function(onload) {
    onload = typeof onload !== 'undefined' ? onload : false;

    chrome.extension.sendRequest({method: 'getAvatarNotification'}, function(avatarSettings) {
      if (avatarSettings.enabled == 'true' && (!onload || (onload && avatarSettings.onload == 'true'))) {
        var $cvCount = $('#cv-count');
        if (!$cvCount.length) {
          var css = 'position:absolute; z-index:4; top:7px; left:24px; color:white !important; background: -webkit-gradient(linear, left top, left bottom, from(#F11717), to(#F15417)); border-radius: 20px; -webkit-box-shadow:1px 1px 2px #555; border:3px solid white; cursor: pointer; font-family:arial,helvetica,sans-serif; font-size: 15px; font-weight: bold; height: 20px; line-height: 20px; min-width: 12px; padding: 0 4px; text-align: center; display: none;';
          var html = '<div title="Cv request waiting for review" id="cv-count" style="' + css + '">1</div>';

          $('#reply-count').after(html);
        } else {
          $cvCount.text(parseInt($cvCount.text(), 10)+1);
        }

        if (!onload || (onload && avatarSettings.onload == 'true')) {
          $cvCount.show();
        }
      }
    });
  };

  // handle displaying the last cv request and update the notification count
  this.displayLastCvRequest = function() {
    var lastCvRequestPost = $('.cvpls-new').last().removeClass('cvpls-new');
    var lastCvRequestId = self.requests.pop();
    var $cvCount = $('#cv-count');

    // check if cv request is still on page. if not we need to open the transaction log with the question
    if ($('#'+lastCvRequestId).length) {
      var lastCvRequestContainer = lastCvRequestPost.parent();
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
      window.open('http://chat.stackoverflow.com/transcript/message/' + self.getMessageId(lastCvRequestId) + '#' + self.getMessageId(lastCvRequestId), '_blank');
    }

    if ($cvCount.length) {
      var newCvCount = (parseInt($cvCount.text(), 10)-1);
      $cvCount.text(newCvCount);

      if (newCvCount == 0) {
        $cvCount.animate({
          opacity: 0
        }, 1000, function() {
          $cvCount.remove();
        });
      }
    }
  };

  // possible values: Nameroom | chat.stack... or (*) Nameroom | chat.stack... or (2) Nameroom | chat.stack... or (2*) Nameroom | chat.stack...
  this.notifyInTitlebar = function() {
    var currentTitle = document.title;
  };

  // find out whether post contains a close request
  this.isCloseRequest = function($post) {
    if ($('a .ob-post-tag:contains("cv-pls")', $post).length && $('a:contains("stackoverflow.com/questions/")', $post).length) {
      return true;
    }
    return false;
  };

  // create nice cv-pls box
  this.formatCloseRequest = function($post) {
    chrome.extension.sendRequest({method: 'getSetting', key: 'cv-onebox'}, function(response) {
      if (response.value == null || response.value == 'true') {
        self.stackApi.getQuestion(self.getPostInfo(self.getQuestionId($post)), $post);
      }
    });
  };

  // retrieve question id form the url
  this.getQuestionId = function($post) {
    return $('a:contains("stackoverflow.com/questions/")', $post).attr('href').split('/')[4];
  };

  // create a nice object containing all the needed info for the request
  this.getPostInfo = function(questionId) {
    return {
      id: questionId,
      host: 'stackoverflow.com',
      path: 'questions/',
      filter: '!6LE4b5o5yvdNA'
    };
  };
}

function NotificationManager(settings) {

  this.settings = settings;

  var self = this;

  // sound settings popup listener
  this.watchPopup = function() {
    var $popup = $('#chat-body > .popup');

    if ($popup.length) {
      chrome.extension.sendRequest({method: 'getSetting', key: 'sound-notification'}, function(response) {
        settings.saveSetting('sound-notification', response.value);

        var status = 'disabled';
        if (self.settings.isSoundEnabled()) {
          status = 'enabled';
        }

        $('ul.no-bullets', $popup).after('<hr><ul class="no-bullet" id="cvpls-sound"><li><a href="#">cv-pls (' + status + ')</a></li></ul>');
      });
    } else {
      self.watchPopup();
    }
  };

  // toggle sound setting
  this.toggleSound = function() {
    var $option = $('#cvpls-sound a');
    if (self.settings.isSoundEnabled()) {
      self.settings.saveSetting('sound-notification', false);
      $option.text('cv-pls (disabled)');
      chrome.extension.sendRequest({method: 'saveSetting', key: 'sound-notification', value: false}, function(response) { });
    } else {
      self.settings.saveSetting('sound-notification', true);
      $option.text('cv-pls (enabled)');
      chrome.extension.sendRequest({method: 'saveSetting', key: 'sound-notification', value: true}, function(response) { });
    }
  };
}

(function($) {
  var settings = new Settings();
  var pluginSettings = new PluginSettings(settings);

  var voteRequestFormatter = new VoteRequestFormatter(pluginSettings);
  var audioPlayer = new AudioPlayer('http://or.cdn.sstatic.net/chat/so.mp3');
  var avatarNotificationStack = new VoteRequestStack();
  var avatarNotification = new AvatarNotification(avatarNotificationStack, pluginSettings);

  var voteRequestProcessor = new VoteRequestProcessor(pluginSettings, voteRequestFormatter, audioPlayer, avatarNotification);

  var stackApi = new StackApi();
  var voteQueueProcessor = new VoteQueueProcessor(stackApi, voteRequestProcessor);

  var chatRoom = new ChatRoom();
  var voteRequestMessageQueue = new VoteRequestQueue();
  var voteRequestListener = new VoteRequestListener(chatRoom, voteRequestMessageQueue, voteQueueProcessor);

  chrome.extension.sendRequest({method: 'getSettings'}, function(settingsJsonString) {
    pluginSettings.saveAllSettings(settingsJsonString);
    voteRequestListener.init();

    //var settings = new Settings();
    //var stackApi = new StackApi();
    //var audioPlayer = new AudioPlayer('http://or.cdn.sstatic.net/chat/so.mp3');
    //var cvHelper = new CvHelper(chatRoom, voteRequestMessageQueue, stackApi, settings, audioPlayer);
    //cvHelper.init();

    var notificationManager =  new NotificationManager(settings);

    chrome.extension.sendRequest({method: "showIcon"}, function(response) { });

    // sound options
    $('#sound').click(function() {
      notificationManager.watchPopup();
    });

    // save sound setting
    $('body').on('click', '#cvpls-sound li', function() {
      notificationManager.toggleSound();

      return false;
    });

    // handle click on avatar notification
    $('body').on('click', '#cv-count', function() {
      avatarNotification.navigateToLastRequest();

      return false;
    });
  });

  // handle close question
  $('#chat').on('click', '.cvpls-close-question', function() {
    var $button = $(this);
    //http://stackoverflow.com/posts/popup/close/9545683?_=1330791992338
    var url = 'http://stackoverflow.com/posts/popup/close/' + $(this).data('questionid');
    var ajaxSettings = {
        url: url,
        dataType: 'html',
        error: function(jqHr, status, error) {
          // request error
        },
        success: function(data, status, jqHr) {
          // prevent error because the StackExchange js isn't available in chat
          data = data.replace('if (StackExchange.options.isMobile) {', 'if (1==2) {');
          $button.closest('.message').prepend(data);
        }
    }
    $.ajax(ajaxSettings);

    return false;
  });
})(jQuery);