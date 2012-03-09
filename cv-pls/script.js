/*
  TODO

  Also make the sound options available through the extension options
  Check if questions already closed
*/

function CvHelper(stackApi, settings, soundPlayer) {

  this.stackApi = stackApi;
  this.settings = settings;
  this.soundPlayer = soundPlayer;

  this.lastMessageId = 0;

  var self = this;

  // check if room is finished loading
  this.init = function() {
    if ($('#loading').length) {
      setTimeout(self.init, 1000);
    } else {
      $('div.user-container div.messages div.message div.content').each(function() {
        var $post = $(this);

        self.lastMessageId = self.getMessageId($post.closest('div.message').attr('id'));

        if (self.isCloseRequest($post)) {
          self.formatCloseRequest($post);
        }
      });

      self.postListener();
    }
  }

  // get the message id from chat (e.g. id="message-12345678")
  this.getMessageId = function(id) {
    return id.substr(8);
  }

  // check if message is still pending
  this.isMessagePending = function(id) {
    if (id.substr(0, 7) == 'pending') {
      return true;
    }

    return false;
  }

  // sets the last message id
  this.setLastMessageId = function(id) {
    self.lastMessageId = id;
  }

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
          self.lastMessageId = currentMessageId;

          self.formatCloseRequest($post);

          if (self.settings.isSoundEnabled()) {
            self.soundPlayer.playNotification();
          }
        }
      }
    }

    setTimeout(self.postListener, 1000);
  }

  // find out whether post contains a close request
  this.isCloseRequest = function($post) {
    if ($('a .ob-post-tag:contains("cv-pls")', $post).length && $('a:contains("stackoverflow.com/questions/")', $post).length) {
      return true;
    }
    return false;
  }

  // create nice cv-pls box
  this.formatCloseRequest = function($post) {
    self.stackApi.getQuestion(self.getPostInfo(self.getQuestionId($post)), $post);
  }

  // retrieve question id form the url
  this.getQuestionId = function($post) {
    return $('a:contains("stackoverflow.com/questions/")', $post).attr('href').split('/')[4];
  }

  // create a nice object containing all the needed info for the request
  this.getPostInfo = function(questionId) {
    return {id: questionId, host: 'stackoverflow.com'};
  }
}

function StackApi() {
    var apiUrl = 'https://api.stackexchange.com/2.0/';

    var self = this;

    // get the URL of question
    this.getQuestionUrl = function(request) {
      return apiUrl + 'questions/' + request.id;
    }

    // request the info of the question
    this.getQuestion = function(request, $post) {
        var url = self.getQuestionUrl(request);
        var apiData = {
            site: request.host,
            filter: '!6LE4b5o5yvdNA',
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

    // render the cv request as onebox
    this.renderCvRequest = function(item, $post) {
      $post.append(self.oneBox(item));
    }

    // the html of the cv onebox
    this.oneBox = function(questionInfo) {
      var html = '';
      html+= '<div class="onebox ob-post" style="overflow: hidden;">';
      html+= '  <div class="ob-post-votes" title="This question has a score of ' + questionInfo.score + '.">' + questionInfo.score + '</div>';
      html+= '  <img width="20" height="20" class="ob-post-siteicon" src="http://sstatic.net/stackoverflow/img/apple-touch-icon.png" title="Stack Overflow">';
      html+= '  <div class="ob-post-title">Q: <a style="color: #0077CC;" href="' + questionInfo.link + '">' + questionInfo.title + '</a></div>';
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
    }
}

function NotificationManager(settings) {

  this.settings = settings;

  var self = this;

  // sound settings popup listener
  this.watchPopup = function() {
    var $popup = $('#chat-body > .popup');

    if ($popup.length) {
      var status = 'disabled';
      if (self.settings.isSoundEnabled()) {
        status = 'enabled';
      }

      $('ul.no-bullets', $popup).after('<hr><ul class="no-bullet" id="cvpls-sound"><li><a href="#">cv-pls (' + status + ')</a></li></ul>');
    } else {
      self.watchPopup();
    }
  }

  // toggle sound setting
  this.toggleSound = function() {
    var $option = $('#cvpls-sound a');
    if (self.settings.isSoundEnabled()) {
      self.settings.saveSetting('sound-notification', false);
      $option.text('cv-pls (disabled)');
    } else {
      self.settings.saveSetting('sound-notification', true);
      $option.text('cv-pls (enabled)');
    }
  }
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
}

function SoundPlayer() {
  this.beep = new Audio('http://or.cdn.sstatic.net/chat/so.mp3');

  var self = this;

  this.playNotification = function() {
    self.beep.play();
  }
}

(function() {
  var settings = new Settings();
  var stackApi = new StackApi();
  var soundPlayer = new SoundPlayer();
  var cvHelper = new CvHelper(stackApi, settings, soundPlayer);
  cvHelper.init();

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