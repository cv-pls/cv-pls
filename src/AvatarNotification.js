CvPlsHelper.AvatarNotification = function(document, avatarNotificationStack, pluginSettings) {

  "use strict";

  var self, animating, updateQueued, cvCountEl;
  
  self = this;

  animating = false;
  updateQueued = false;

  cvCountEl = null;

  // Adds a post to the queue
  this.enqueue = function(post) {
    avatarNotificationStack.push(post);
    post.element.querySelector('a.cvhelper-question-link').addEventListener('click', function() {
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
    if (refresh || self.getCurrentNotificationValue() !== avatarNotificationStack.queue.length) {
      self.updateNotificationDisplay();
    }
  };

  this.getCurrentNotificationValue = function() {
    return cvCountEl === null ? 0 : parseInt(cvCountEl.firstChild.data, 10);
  };

  // Updates the avatar notification display
  this.updateNotificationDisplay = function() {
    var replyCountEl, css, opacity;

    if (!pluginSettings.getSetting("avatarNotification")) {
      return null;
    }

    // Prevent multiple calls in quick succession from causing missing notifications
    if (animating) {
      updateQueued = true;
      return null;
    }
    updateQueued = false;

    // Create the avatar notification element and add it to the DOM
    if (cvCountEl === null) {
      css = 'position: absolute; z-index: 4; top: 7px; left: 24px; '
          + 'color: white !important; background: -webkit-gradient(linear, left top, left bottom, from(#F11717), to(#F15417)); '
          + 'border-radius: 20px; -webkit-box-shadow: 1px 1px 2px #555; border: 3px solid white; cursor: pointer; '
          + 'font-family: arial,helvetica,sans-serif; font-size: 15px; font-weight: bold; text-align: center; '
          + 'height: 20px; line-height: 20px; min-width: 12px; padding: 0 4px; opacity: 0;';

      cvCountEl = document.createElement('div');
      cvCountEl.setAttribute('title', 'CV requests waiting for review');
      cvCountEl.setAttribute('id', 'cv-count');
      cvCountEl.setAttribute('style', css);
      cvCountEl.appendChild(document.createTextNode('0'));
      cvCountEl.addEventListener('click', self.navigateToLastRequest);

      replyCountEl = document.getElementById('reply-count');
      replyCountEl.parentNode.insertBefore(cvCountEl, replyCountEl.nextSibling);

    }

    cvCountEl.firstChild.data = avatarNotificationStack.queue.length;

    if (avatarNotificationStack.queue.length) {
      self.appear();
    } else {
      self.disappear();
    }

  };

  // Animation functions
  this.appear = function() {
    var newValue, oldValue = parseFloat(cvCountEl.style.opacity);
    animating = true;
    if (oldValue < 1) {
      newValue = oldValue + (33 / 500);
      if (newValue > 1) {
        newValue = 1;
      }
      cvCountEl.style.opacity = newValue;
      setTimeout(self.appear, 33);
    } else {
      animating = false;
      if (updateQueued) {
        self.updateNotificationDisplay();
      }
    }
  };
  this.disappear = function() {
    var newValue, oldValue = parseFloat(cvCountEl.style.opacity);
    animating = true;
    if (oldValue > 0) {
      newValue = oldValue - (33 / 500);
      if (newValue < 0) {
        newValue = 0;
      }
      cvCountEl.style.opacity = newValue;
      setTimeout(self.disappear, 33);
    } else {
      animating = false;
      if (updateQueued) {
        self.updateNotificationDisplay();
      }
    }
  };

  // Moves the screen to the last cv request on the stack (click handler for notification box)
  this.navigateToLastRequest = function() {
    var lastRequestPost, $lastCvRequestContainer, originalBackgroundColor, lastRequest = avatarNotificationStack.pop();
    if (lastRequest === null) {
      return null;
    }

    lastRequestPost = document.getElementById('message-'+lastRequest.id);
    if (lastRequestPost) {
      $lastCvRequestContainer = $(lastRequestPost);
      originalBackgroundColor = $lastCvRequestContainer.parents('.messages').css('backgroundColor');

      // check if question is deleted
      $lastCvRequestContainer.css('background', 'yellow');
      $('html, body', document).animate({scrollTop: $lastCvRequestContainer.offset().top}, 500, function() {
        $lastCvRequestContainer.animate({
          backgroundColor: originalBackgroundColor
        }, 5000);
      });
    } else {
      if (!pluginSettings.getSetting("removeLostNotifications")) { // Should never happen but just in case something goes wrong
        window.open('http://chat.stackoverflow.com/transcript/message/' + lastRequest.id + '#' + lastRequest.id, '_blank');
      }
    }

    self.updateNotificationDisplay();
  };

};