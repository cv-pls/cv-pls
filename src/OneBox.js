/*jslint plusplus: true, white: true, browser: true */
/*global CvPlsHelper, $ */

(function() {

  'use strict';

  function getQuestionScore() {
    var voteDisplay = this.document.createElement('div');
    voteDisplay.setAttribute('class', 'ob-post-votes');
    voteDisplay.setAttribute('title', 'This question has a score of ' + this.post.questionData.score);
    this.scoreTextNode = this.document.createTextNode(this.post.questionData.score);
    voteDisplay.appendChild(this.scoreTextNode);
    return voteDisplay;
  }
  function getSiteIcon() {
    var siteIcon = this.document.createElement('img');
    siteIcon.setAttribute('class', 'ob-post-siteicon');
    siteIcon.setAttribute('width', '20');
    siteIcon.setAttribute('height', '20');
    siteIcon.setAttribute('src', 'http://sstatic.net/stackoverflow/img/apple-touch-icon.png');
    siteIcon.setAttribute('title', 'Stack Overflow');
    return siteIcon;
  }

  function getPostTitleAnchor() {
    var postTitleAnchor,
        avatarNotification = this.avatarNotification,
        post = this.post;
    postTitleAnchor = this.document.createElement('a');
    postTitleAnchor.setAttribute('href', this.post.questionData.link);
    postTitleAnchor.setAttribute('class', 'cvhelper-question-link');
    postTitleAnchor.setAttribute('style', 'color: #0077CC;');
    postTitleAnchor.addEventListener('click', function() {
      avatarNotification.dequeue(post);
    });
    postTitleAnchor.innerHTML = this.post.questionData.title;
    this.statusTextNode = this.document.createTextNode('');
    postTitleAnchor.appendChild(this.statusTextNode);
    return postTitleAnchor;
  }
  function getPostTitle() {
    var postTitle = this.document.createElement('div');
    postTitle.setAttribute('class', 'ob-post-title');
    postTitle.appendChild(this.document.createTextNode('Q: '));
    postTitle.appendChild(getPostTitleAnchor.call(this));
    return postTitle;
  }

  function getPostAvatar() {
    var postAvatar = this.document.createElement('img');
    postAvatar.setAttribute('class', 'user-gravatar32');
    postAvatar.style.width = '32px';
    postAvatar.style.height = '32px';
    postAvatar.setAttribute('src', this.post.questionData.owner.profile_image);
    postAvatar.setAttribute('title', this.post.questionData.owner.display_name);
    postAvatar.setAttribute('alt', this.post.questionData.owner.display_name);
    return postAvatar;
  }
  function getPostBody() {
    var postBody = this.document.createElement('p');
    postBody.setAttribute('class', 'ob-post-body');
    // What follows is nasty, but it is the least nasty thing I can come up with. Gloss over it and move on.
    postBody.innerHTML = this.post.questionData.body;
    postBody.insertBefore(getPostAvatar.call(this), postBody.firstChild);
    return postBody;
  }

  function getPostTag(tag) {
    var span, anchor;
    span = this.document.createElement('span');
    span.setAttribute('class', 'ob-post-tag');
    span.setAttribute('style', 'background-color: #E0EAF1; color: #3E6D8E; border-color: #3E6D8E; border-style: solid; margin-right: 6px;');
    span.appendChild(this.document.createTextNode(tag));
    anchor = this.document.createElement('a');
    anchor.setAttribute('href', 'http://stackoverflow.com/questions/tagged/' + tag);
    anchor.appendChild(span);
    return anchor;
  }
  function getPostTags() {
    var i, postTags = this.document.createElement('div');
    postTags.setAttribute('class', 'ob-post-tags');
    for (i = 0; i < this.post.questionData.tags.length; i++) {
      postTags.appendChild(getPostTag.call(this, this.post.questionData.tags[i]));
    }
    return postTags;
  }

  function getGrippie() {
    var style;
    style = 'margin-right: 0px; background-position: 321px -823px; border: 1px solid #DDD; border-width: 0pt 1px 1px;'
          + 'cursor: s-resize; height: 9px; overflow: hidden; background-color: #EEE; margin-right: -8px;'
          + 'background-image: url(\'http://cdn.sstatic.net/stackoverflow/img/sprites.png?v=5\'); background-repeat: no-repeat;'
          + 'margin-top: 10px; display: none; position: absolute; bottom: 0; width: 250px;';
    this.grippieElement = this.document.createElement('div');
    this.grippieElement.setAttribute('class', 'grippie');
    this.grippieElement.setAttribute('style', style);
    return this.grippieElement;
  }

  function createElement() {
    this.oneBoxElement = this.document.createElement('div');

    this.oneBoxElement.className = 'onebox ob-post cv-request';
    this.oneBoxElement.style.overflow = 'hidden';
    this.oneBoxElement.style.position = 'relative';

    this.oneBoxElement.appendChild(getQuestionScore.call(this));
    this.oneBoxElement.appendChild(getSiteIcon.call(this));
    this.oneBoxElement.appendChild(getPostTitle.call(this));
    this.oneBoxElement.appendChild(getPostBody.call(this));
    this.oneBoxElement.appendChild(getPostTags.call(this));
    this.oneBoxElement.appendChild(getGrippie.call(this));
  }

  function getCurrentStyle(element, property) {
    return element.ownerDocument.defaultView.getComputedStyle(element, null).getPropertyValue(property);
  }

  function processHeight() {
    var totalWidth, grippieX, currentY, self = this;

    this.grippieElement.style.width = getCurrentStyle(this.oneBoxElement, 'width');

    if (this.pluginSettings.getSetting('oneBoxHeight') !== null && this.pluginSettings.getSetting('oneBoxHeight') < this.oneBoxElement.scrollHeight) {
      this.oneBoxElement.style.height = this.pluginSettings.getSetting('oneBoxHeight') + 'px';
      this.oneBoxElement.style.paddingBottom = '10px';

      this.grippieFactory.create({
        target: self.oneBoxElement,
        grippie: self.grippieElement,
        cursor: 'n-resize'
      });

      // grippie width = 27px
      // I don't know what CSS the 27px comment is supposed to relate to?
      totalWidth = getCurrentStyle(this.grippieElement, 'width');
      grippieX = Math.ceil((totalWidth - 27) / 2);

      currentY = getCurrentStyle(this.grippieElement, 'background-position').split('px')[1];
      this.grippieElement.style.backgroundPosition = grippieX + 'px ' + currentY + 'px';
      this.grippieElement.style.display = 'block';
    }
  }
  function processStatus() {
    if (this.post.questionData.closed_date !== undefined && this.pluginSettings.getSetting('showCloseStatus')) {
      this.setStatusText('closed');
    }
  }
  function processFormatting() {
    processHeight.call(this);
    processStatus.call(this);
    scrollToBottom.call(this);
  }

  function scrollToBottom() {
    var start = this.document.defaultView.scrollY,
        end = this.document.documentElement.scrollHeight - this.document.documentElement.clientHeight;
    this.animator.cancel();
    this.animator.animate({
      startValue: start,
      endValue: end,
      totalTime: 1000,
      frameFunc: function(newValue, animation) {
        this.scroll(this.scrollX, newValue);
      },
      easing: 'decel'
    });
  }

  CvPlsHelper.OneBox = function(document, pluginSettings, avatarNotification, animator, grippieFactory, post) {
    this.document = document;
    this.pluginSettings = pluginSettings;
    this.avatarNotification = avatarNotification;
    this.animator = animator;
    this.grippieFactory = grippieFactory;
    this.post = post;
    createElement.call(this);
  };

  CvPlsHelper.OneBox.prototype.oneBoxElement = null;
  CvPlsHelper.OneBox.prototype.grippieElement = null;
  CvPlsHelper.OneBox.prototype.statusTextNode = null;
  CvPlsHelper.OneBox.prototype.scoreTextNode = null;

  CvPlsHelper.OneBox.prototype.refreshDisplay = function() {
    this.hide();
    this.show();
  };

  CvPlsHelper.OneBox.prototype.show = function() {
    this.post.contentElement.appendChild(this.oneBoxElement);
    processFormatting.call(this);
  };

  CvPlsHelper.OneBox.prototype.hide = function() {
    this.oneBoxElement.parentNode.removeChild(this.oneBoxElement);
  };

  CvPlsHelper.OneBox.prototype.setStatusText = function(statusText) {
    this.statusTextNode.data = ' [' + statusText + ']';
  };

  CvPlsHelper.OneBox.prototype.setScore = function(score) {
    this.scoreTextNode.data = String(score);
  };

}());