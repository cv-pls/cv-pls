/*
  TODO

  Add an optional beep notification (need to look for SO beep file on page) and integrate it with the chatroom sound settings
  Check if questions already closed
*/

function CvHelper(stackApi) {

  this.stackApi = stackApi;

  var that = this;

  // check if room is finished loading
  this.init = function() {
    if ($('#loading').length) {
      setTimeout(that.init, 1000);
    } else {
      $('div.user-container div.messages div.message div.content').each(function() {
        $post = $(this);
        if (that.isCloseRequest($post)) {
          that.formatCloseRequest($post);
        }
      });
    }
  }

  // find out whether post contains a close request
  this.isCloseRequest = function ($post) {
    if ($('a .ob-post-tag:contains("cv-pls")', $post).length && $('a:contains("stackoverflow.com/questions/")', $post).length) {
      return true;
    }
    return false;
  }

  // create nice cv-pls box
  this.formatCloseRequest = function ($post) {
    that.stackApi.getQuestion(that.getPostInfo(that.getQuestionId($post)), $post);
  }

  // retrieve question id form the url
  this.getQuestionId = function ($post) {
    return $('a:contains("stackoverflow.com/questions/")', $post).attr('href').split('/')[4];
  }

  // create a nice object containing all the needed info for the request
  this.getPostInfo = function (questionId) {
    return {id: questionId, host: 'stackoverflow.com'};
  }
}

function StackApi() {
    var apiUrl = 'https://api.stackexchange.com/2.0/';

    var that = this;

    // get the URL of question
    this.getQuestionUrl = function (request) {
      return apiUrl + 'questions/' + request.id;
    }

    // request the info of the question
    this.getQuestion = function (request, $post) {
        var url = that.getQuestionUrl(request);
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
                that.renderCvRequest(data.items[0], $post);
            }
        }
        $.ajax(ajaxSettings);
    };

    // render the cv request as onebox
    this.renderCvRequest = function (item, $post) {
      $post.append(that.oneBox(item));
    }

    // the html of the cv onebox
    this.oneBox = function (questionInfo) {
      var html = '';
      html+= '<div class="onebox ob-post">';
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

(function() {
  var stackApi = new StackApi();
  var cvHelper = new CvHelper(stackApi);
  cvHelper.init();

  // show icon when we are in a chatroom
  chrome.extension.sendRequest({method: "showIcon"}, function(response) { });

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
          // prevent error because the StackExchaneg api isn't available
          data = data.replace('if (StackExchange.options.isMobile) {', 'if (1==2) {');
          $button.closest('.message').prepend(data);
        }
    }
    $.ajax(ajaxSettings);

    return false;
  });
})(jQuery);