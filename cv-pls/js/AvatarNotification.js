CvPlsHelper.AvatarNotification = function(document, window, avatarNotificationStack, pluginSettings) {

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
      self.$cvCount.click(self.navigateToLastRequest);
    }

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

};