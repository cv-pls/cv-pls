/*jslint plusplus: true, white: true, browser: true */
/*global CvPlsHelper, Audio */

(function() {

  'use strict';

  function initializeNativeAudioSupport() {
    try {
      this.player = new Audio();
      if (this.player.canPlayType('audio/mp3')) {
        this.player.src = this.audioFile;
        return true;
      }
    } catch (e) {}
    return false;
  }

  function initializeJplayerSupport() {
    var notificationDiv, notificationEvent,
        eventAttacherScript, eventAttacherElement,
        notificationDivId = 'cvpls-jplayer',
        eventName = 'CvPlsJPlayerNotify';

    notificationDiv = this.document.createElement('div');
    notificationDiv.setAttribute('id', notificationDivId);

    // This is dangerously close to eval(), but the Chrome extension model requires we do it this way
    eventAttacherScript = "document.getElementById('" + notificationDivId + "').addEventListener('" + eventName + "', function() { $('#jplayer').jPlayer('play', 0); });";

    eventAttacherElement = this.document.createElement('script');
    eventAttacherElement.setAttribute('type', 'application/javascript');
    eventAttacherElement.appendChild(this.document.createTextNode(eventAttacherScript));

    this.document.body.appendChild(notificationDiv);
    this.document.head.appendChild(eventAttacherElement);

    notificationEvent = this.document.createEvent('Event');
    notificationEvent.initEvent('CustomJPlayerNotify', true, true);

    this.player = {
      play: function() {
        notificationDiv.dispatchEvent(notificationEvent);
      }
    };
  }

  CvPlsHelper.AudioPlayer = function(document, audioFile) {
    this.document = document;
    this.audioFile = audioFile;
    if (!initializeNativeAudioSupport.call(this)) {
      initializeJplayerSupport.call(this);
    }
  };

  CvPlsHelper.AudioPlayer.prototype.enabled = false;

  CvPlsHelper.AudioPlayer.prototype.playNotification = function() {
    if (this.enabled) {
      this.player.play();
    }
  };

  CvPlsHelper.AudioPlayer.prototype.enable = function() {
    this.enabled = true;
  };
  CvPlsHelper.AudioPlayer.prototype.disable = function() {
    this.enabled = false;
  };

}());