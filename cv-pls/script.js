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

// queue with all active close votes
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

// post class
function Post($post) {
  var self = this;

  this.$post = $post.addClass('vote-request');
  this.id = null;
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

  if (this.postContainsQuestion()) {
    this.parseQuestionPost();
  }
}

// buffers up to 100 (maximum per API request) vote requests
function VoteRequestBuffer(voteRequestMessageQueue) {
  var self = this;

  this.items = 0;
  this.buffer = [];
  this.bufferIds = [];

  this.createBuffer = function(queue) {
    self.buffer = [];
    var post = queue.dequeue();
    while(post !== null && self.buffer.length <= 100) {
      self.buffer.push(post);

      post = queue.dequeue();
    }

    self.getBufferIds();
  };

  this.getBufferIds = function() {
    self.bufferIds = [];

    self.items = self.buffer.length;
    for (var i = 0; i < self.items; i++) {
      self.bufferIds.push(self.buffer[i].id);
    }
  };

  this.createBuffer(voteRequestMessageQueue);
}

// this is where all the items in the queue get processed
function VoteQueueProcessor() {
  var self = this;

  this.voteRequestBuffer = {};

  this.processQueue = function(voteRequestBuffer) {
    // no vote requests ready to be processed, so end here
    if (voteRequestBuffer.items == 0) {
      return null;
    }

    self.voteRequestBuffer = voteRequestBuffer;
  };

  this.formatVoteRequests = function() {
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

function StackApiOld() {
    var apiUrl = 'https://api.stackexchange.com/2.0/';

    var self = this;

    // get the URL of question
    this.getQuestionUrl = function(request) {
      return apiUrl + request.path + request.id;
    };

    // request the info of the question
    this.getQuestion = function(request, $post) {
        var url = self.getQuestionUrl(request);
        var apiData = {
            site: request.host,
            filter: request.filter,
            pagesize: 1,
            page: 1,
            body: 'true'
        };
        var ajaxSettings = {
            url: url,
            data: apiData,
            error: function(jqHr, status, error) {
              // request error
            },
            success: function(data, status, jqHr) {
                if (data.items == undefined || data.items.length == 0) {
                    // recordset error
                    return;
                }
                self.renderCvRequest(data.items[0], $post);
            }
        }
        $.ajax(ajaxSettings);
    };

    this.pollStatus = function(request, post) {
        var url = self.getQuestionUrl(request);
        var apiData = {
            site: request.host,
            filter: request.filter,
            pagesize: 1,
            page: 1,
            body: 'false'
        };
        var ajaxSettings = {
            url: url,
            data: apiData,
            error: function(jqHr, status, error) {
              // request error
            },
            success: function(data, status, jqHr) {
                if (data.items == undefined || data.items.length == 0) {
                    // recordset error
                    return;
                }
                if (typeof data.items[0].closed_date != 'undefined') {
                  var $onebox = $('.cv-request', $post);
                  var $title = $('.ob-post-title a', $onebox);

                  $onebox.addClass('closed');

                  chrome.extension.sendRequest({method: 'getStatus'}, function(statusSettings) {
                    var closed = '';
                    var reason = '';
                    if (statusSettings.reason == 'true') {
                      reason = ' as ' + questionInfo.closed_reason;
                    }
                    if ((statusSettings.status == 'true' || statusSettings.status == null) && typeof questionInfo.closed_date != 'undefined') {
                      closed = ' [closed' + reason + ']';
                    }
                    $title.text($title.text() + closed);
                  });
                }
            }
        }
        $.ajax(ajaxSettings);
    }

    // render the cv request as onebox
    this.renderCvRequest = function(item, $post) {
      chrome.extension.sendRequest({method: 'getHeight'}, function(heightSettings) {
        chrome.extension.sendRequest({method: 'getStatus'}, function(statusSettings) {
          $post.append(self.oneBox(item, heightSettings, statusSettings));
          $post.addClass('cvpls-new');
          if (heightSettings.height < $('.onebox', $post)[0].scrollHeight) {
            $('.onebox', $post).css('padding-bottom', '10px');
            $('.onebox .grippie', $post).width($('.onebox', $post).width()).show();
            $('.onebox', $post).gripHandler({
              cursor: 'n-resize',
              gripClass: 'grippie'
            });
          }
          $('html, body').animate({ scrollTop: $(document).height() }, 'slow');
        });
      });
    };

    // the html of the cv onebox
    this.oneBox = function(questionInfo, response, statusSettings) {
      var html = '';
      var height = '';
      if (response.height) {
        var unit = 'px';
        if (response.unit) {
          unit = response.unit;
        }
        height = ' height: ' + response.height + unit + ';';
      }

      var closed = '';
      var reason = '';
      if (statusSettings.reason == 'true') {
        reason = ' as ' + questionInfo.closed_reason;
      }
      if ((statusSettings.status == 'true' || statusSettings.status == null) && typeof questionInfo.closed_date != 'undefined') {
        closed = ' [closed' + reason + ']';
      }

      var closedClass = '';
      if (typeof questionInfo.closed_date != 'undefined') {
        closedClass = ' closed';
      }

      html+= '<div class="onebox ob-post cv-request' + closedClass + '" style="overflow: hidden; position: relative;' + height + '">';
      html+= '  <div class="ob-post-votes" title="This question has a score of ' + questionInfo.score + '.">' + questionInfo.score + '</div>';
      html+= '  <img width="20" height="20" class="ob-post-siteicon" src="http://sstatic.net/stackoverflow/img/apple-touch-icon.png" title="Stack Overflow">';
      html+= '  <div class="ob-post-title">Q: <a style="color: #0077CC;" href="' + questionInfo.link + '">' + questionInfo.title + closed + '</a></div>';
      html+= '  <p class="ob-post-body">';
      html+= '    <img width="32" height="32" class="user-gravatar32" src="' + questionInfo.owner.profile_image + '" title="' + questionInfo.owner.display_name + '" alt="' + questionInfo.owner.display_name + '">' + questionInfo.body;
      html+= '  </p>';
      html+= '  <div class="ob-post-tags">';

      var length = questionInfo.tags.length;
      for (var i = 0; i < length; i++) {
        html+= '    <a href="http://stackoverflow.com/questions/tagged/' + questionInfo.tags[i] + '">';
        html+= '      <span class="ob-post-tag" style="background-color: #E0EAF1; color: #3E6D8E; border-color: #3E6D8E; border-style: solid;">' + questionInfo.tags[i] + '</span>';
        html+= '    </a>';
      }

      html+= '    <div class="grippie" style="margin-right: 0px; background-position: 321px -823px; border: 1px solid #DDD; border-width: 0pt 1px 1px; cursor: s-resize; height: 9px; overflow: hidden; background-color: #EEE; margin-right: -8px; background-image: url(\'http://cdn.sstatic.net/stackoverflow/img/sprites.png?v=5\'); background-repeat: no-repeat; margin-top: 10px; display: none; position: absolute; bottom: 0; width: 250px;"></div>';
      html+= '  </div>';
      /*
        Temporary disabled close button until SO implements the write API
      */
      /*
      html+= '  <form action="" style="position: absolute; right: 10px; bottom: 16px;">';
      html+= '    <select name="cvpls-close-reason">';
      html+= '      <option value="dupe">exact duplicate (n/a)</option>';
      html+= '      <option value="offtopic">off topic (n/a)</option>';
      html+= '      <option value="notconstructive">not constructive (n/a)</option>';
      html+= '      <option value="noquestion">not a real question (n/a)</option>';
      html+= '      <option value="toolocalized">too localized (n/a)</option>';
      html+= '    <select>';
      html+= '    <button class="cvpls-close-question" data-questionid="' + questionInfo.question_id + '">close (n/a)</button>';
      html+= '  </form>';
      */
      html+= '  <div class="clear-both"></div>';
      html+= '</div>';

      return html;
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

// database class to get and save settings
function Settings() {
  var self = this;

  this.saveSetting = function(key, value) {
    localStorage.setItem(key, value);
  }

  this.getSetting = function(key) {
    return localStorage.getItem(key);
  }

  this.deleteSetting = function(key) {
    localStorage.remove(key);
  }

  this.truncate = function() {
    localStorage.clear();
  }

  this.isSoundEnabled = function() {
    if (self.getSetting('sound-notification') == 'true') {
      return true;
    }

    return false;
  }

  this.isAvatarEnabled = function() {
    if (self.getSetting('avatar-notification') == 'true') {
      return true;
    }

    return false;
  }
}

(function() {
  var chatRoom = new ChatRoom();
  var voteRequestMessageQueue = new VoteRequestQueue();
  var voteQueueProcessor = new VoteQueueProcessor();
  var voteRequestListener = new VoteRequestListener(chatRoom, voteRequestMessageQueue, voteQueueProcessor);
  voteRequestListener.init();

  var settings = new Settings();
  var stackApi = new StackApi();
  var audioPlayer = new AudioPlayer('http://or.cdn.sstatic.net/chat/so.mp3');
  //var cvHelper = new CvHelper(chatRoom, voteRequestMessageQueue, stackApi, settings, audioPlayer);
  //cvHelper.init();

  var notificationManager =  new NotificationManager(settings);

  // show icon when we are in a chatroom
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

  // handle click on notification on avatar
  $('body').on('click', '#cv-count', function() {
    cvHelper.displayLastCvRequest();

    return false;
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