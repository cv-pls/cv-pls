CvPlsHelper.VoteRequestFormatter = function(document, pluginSettings, avatarNotification) {

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
    var oneBox = document.createElement('div');

    oneBox.setAttribute('class', 'onebox ob-post cv-request');
    oneBox.setAttribute('style', 'overflow: hidden; position: relative;'); // Yes yes I know. Feel free to fix it if you want. DOM is already verbose enough.

    oneBox.appendChild(self.getVoteDisplay(question));
    oneBox.appendChild(self.getSiteIcon());
    oneBox.appendChild(self.getPostTitle(question));
    oneBox.appendChild(self.getPostBody(question));
    oneBox.appendChild(self.getPostTags(question));
    oneBox.appendChild(self.getGrippie());

    return oneBox;
  };

  this.getVoteDisplay = function(question) {
    var voteDisplay = document.createElement('div');
    voteDisplay.setAttribute('class', 'ob-post-votes');
    voteDisplay.setAttribute('title', 'This question has a score of ' + question.score);
    voteDisplay.appendChild(document.createTextNode(question.score));
    return voteDisplay;
  };

  this.getSiteIcon = function() {
    var siteIcon = document.createElement('img');
    siteIcon.setAttribute('class', 'ob-post-siteicon');
    siteIcon.setAttribute('width', '20');
    siteIcon.setAttribute('height', '20');
    siteIcon.setAttribute('src', 'http://sstatic.net/stackoverflow/img/apple-touch-icon.png');
    siteIcon.setAttribute('title', 'Stack Overflow');
    return siteIcon;
  };

  this.getPostTitle = function(question) {
    var postTitle = document.createElement('div');
    postTitle.setAttribute('class', 'ob-post-title');
    postTitle.appendChild(document.createTextNode('Q: '));
    postTitle.appendChild(self.getPostTitleAnchor(question));
    return postTitle;
  };

  this.getPostTitleAnchor = function(question) {
    var postTitleAnchor = document.createElement('a');
    postTitleAnchor.setAttribute('href', question.link);
    postTitleAnchor.setAttribute('class', 'cvhelper-question-link');
    postTitleAnchor.setAttribute('style', 'color: #0077CC;');
    postTitleAnchor.addEventListener('click', function() {
      var id = $(this).closest('.message').attr('id').split('-')[1];
      avatarNotification.dequeue(id);
    });
    postTitleAnchor.innerHTML = question.title;
    return postTitleAnchor;
  };

  this.getPostBody = function(question) {
    var postBody = document.createElement('p');
    postBody.setAttribute('class', 'ob-post-body');
    // What follows is nasty, but it is the least nasty thing I can come up with. Gloss over it and move on.
    postBody.innerHTML = question.body;
    postBody.insertBefore(self.getPostAvatar(question), postBody.firstChild);
    return postBody;
  };

  this.getPostAvatar = function(question) {
    var postAvatar = document.createElement('img');
    postAvatar.setAttribute('class', 'user-gravatar32');
    postAvatar.setAttribute('width', '32');
    postAvatar.setAttribute('height', '32');
    postAvatar.setAttribute('src', question.owner.profile_image);
    postAvatar.setAttribute('title', question.owner.display_name);
    postAvatar.setAttribute('alt', question.owner.display_name);
    return postAvatar;
  };

  this.getPostTags = function(question) {
    var i, postTags = document.createElement('div');
    postTags.setAttribute('class', 'ob-post-tags');
    for (i = 0; i < question.tags.length; i++) {
      postTags.appendChild(self.getPostTag(question.tags[i]));
    }
    return postTags;
  };

  this.getPostTag = function(tag) {
    var span, anchor;
    span = document.createElement('span');
    span.setAttribute('class', 'ob-post-tag');
    span.setAttribute('style', 'background-color: #E0EAF1; color: #3E6D8E; border-color: #3E6D8E; border-style: solid; margin-right: 6px;');
    span.appendChild(document.createTextNode(tag));
    anchor = document.createElement('a');
    anchor.setAttribute('href', 'http://stackoverflow.com/questions/tagged/' + tag);
    anchor.appendChild(span);
    return anchor;
  };

  this.getGrippie = function() {
    var style, grippie;
    style = 'margin-right: 0px; background-position: 321px -823px; border: 1px solid #DDD; border-width: 0pt 1px 1px;'
          + 'cursor: s-resize; height: 9px; overflow: hidden; background-color: #EEE; margin-right: -8px;'
          + 'background-image: url(\'http://cdn.sstatic.net/stackoverflow/img/sprites.png?v=5\'); background-repeat: no-repeat;'
          + 'margin-top: 10px; display: none; position: absolute; bottom: 0; width: 250px;';
    grippie = document.createElement('div');
    grippie.setAttribute('class', 'grippie');
    grippie.setAttribute('style', style);
    return grippie;
  };

  this.getClearDiv = function() {
    var clearDiv = document.createElement('div');
    clearDiv.setAttribute('class', 'clear-both');
    return clearDiv;
  };

  this.processOneboxFormatting = function(oneBox, $post, question) {
    var $onebox = $(oneBox);

    self.processOneboxHeight($onebox);
    self.processOneboxStatus($onebox, $post, question);

    $('html, body').animate({ scrollTop: $(document).height() }, 'slow');
  };

  this.processOneboxHeight = function($onebox) {
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

  this.processOneboxStatus = function($onebox, $post, question) {
    if (question.closed_date === undefined || !pluginSettings.getSetting("showCloseStatus")) {
      return null;
    }

    var $title = $('.ob-post-title a', $onebox);
    $title.html($title.html() + ' [closed]');
    $post.addClass('cvhelper-closed');
  };

};