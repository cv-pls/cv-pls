/*jslint plusplus: true, white: true, browser: true */
/*global CvPlsHelper, $ */

(function() {

  'use strict';

  function createNotificationElement() {
    var css, replyCountEl, notificationManager = this.notificationManager;

    css = 'position: absolute; z-index: 4; top: 7px; left: 24px; '
        + 'color: white !important; background: -webkit-gradient(linear, left top, left bottom, from(#F11717), to(#F15417)); '
        + 'border-radius: 20px; -webkit-box-shadow: 1px 1px 2px #555; border: 3px solid white; cursor: pointer; '
        + 'font-family: arial,helvetica,sans-serif; font-size: 15px; font-weight: bold; text-align: center; '
        + 'height: 20px; line-height: 20px; min-width: 12px; padding: 0 4px; opacity: 0;';

    this.displayElement = this.document.createElement('div');
    this.displayElement.setAttribute('title', 'CV requests waiting for review');
    this.displayElement.setAttribute('id', 'cv-count');
    this.displayElement.setAttribute('style', css);
    this.displayElement.appendChild(this.document.createTextNode('0'));
    this.displayElement.addEventListener('click', function() {
      notificationManager.navigateToLastRequest();
    });

    replyCountEl = this.document.getElementById('reply-count');
    replyCountEl.parentNode.insertBefore(this.displayElement, replyCountEl.nextSibling);
  }

  // Animation functions
  function showNotification() {
    var newValue, oldValue = parseFloat(this.displayElement.style.opacity), self = this;
    self.animating = true;
    if (oldValue < 1) {
      newValue = oldValue + (33 / 500);
      if (newValue > 1) {
        newValue = 1;
      }
      self.displayElement.style.opacity = newValue;
      setTimeout(function() {
        showNotification.call(self);
      }, 33);
    } else {
      self.visible = true;
      self.animating = false;
      if (self.updateQueued) {
        self.updateNotificationDisplay();
      }
    }
  }
  function hideNotification() {
    var newValue, oldValue = parseFloat(this.displayElement.style.opacity), self = this;
    self.animating = true;
    if (oldValue > 0) {
      newValue = oldValue - (33 / 500);
      if (newValue < 0) {
        newValue = 0;
      }
      self.displayElement.style.opacity = newValue;
      setTimeout(function() {
        hideNotification.call(self);
      }, 33);
    } else {
      self.visible = false;
      self.animating = false;
      if (self.updateQueued) {
        self.updateNotificationDisplay();
      }
    }
  }

  CvPlsHelper.AvatarNotificationDisplay = function(document, notificationManager) {
    this.document = document;
    this.notificationManager = notificationManager;
  };

  CvPlsHelper.AvatarNotificationDisplay.prototype.visible = false;
  CvPlsHelper.AvatarNotificationDisplay.prototype.animating = false;
  CvPlsHelper.AvatarNotificationDisplay.prototype.updateQueued = false;

  CvPlsHelper.AvatarNotificationDisplay.prototype.displayElement = null;
  CvPlsHelper.AvatarNotificationDisplay.prototype.value = 0;

  // Updates the avatar notification display
  CvPlsHelper.AvatarNotificationDisplay.prototype.update = function(value) {
    this.value = value;

    // Prevent multiple calls in quick succession from causing missing notifications
    if (this.animating) {
      this.updateQueued = true;
      return null;
    }
    this.updateQueued = false;

    // Create the avatar notification element and add it to the DOM
    if (this.displayElement === null) {
      createNotificationElement.call(this);
    }

    this.displayElement.firstChild.data = String(this.value);
    if (!this.visible && this.value > 0) {
      showNotification.call(this);
    } else if (this.visible && this.value < 1) {
      hideNotification.call(this);
    }
  };

}());