/*jslint plusplus: true, white: true, browser: true */
/*global Audio, chrome */

CvPlsHelper.AudioPlayer = function(document, audioFile) {

  "use strict";

  var self = this,
      enabled = false,
      player;

  function initializeNativeAudioSupport() {
    try {
      player = new Audio();
      if (!player.canPlayType('audio/mp3')) {
        throw {};
      }
      player.src = audioFile;
      return true;
    } catch (e) {}
    return false;
  };

  function initializeJplayerSupport() {
    var notificationDiv, notificationEvent,
        eventAttacherScript, eventAttacherElement,
        notificationDivId = 'cvpls-jplayer',
        eventName = 'CvPlsJPlayerNotify';

    notificationDiv = document.createElement('div');
    notificationDiv.setAttribute('id', notificationDivId);

    // This is dangerously close to eval(), but the Chrome extension model requires we do it this way
    eventAttacherScript = "document.getElementById('" + notificationDivId + "').addEventListener('" + eventName + "', function() { $('#jplayer').jPlayer('play', 0); });"

    eventAttacherElement = document.createElement('script');
    eventAttacherElement.setAttribute('type', 'application/javascript');
    eventAttacherElement.appendChild(document.createTextNode(eventAttacherScript));

    document.body.appendChild(notificationDiv);
    document.head.appendChild(eventAttacherElement);

    notificationEvent = document.createEvent('Event');
    notificationEvent.initEvent('CustomJPlayerNotify', true, true);

    player = {
      play: function() {
        notificationDiv.dispatchEvent(notificationEvent);
      }
    };
  };

  this.playNotification = function() {
    if (enabled) {
      player.play();
    }
  };

  this.enable = function() {
    enabled = true;
  };

  this.disable = function() {
    enabled = false;
  };

  (function() {
    if (!initializeNativeAudioSupport()) {
      initializeJplayerSupport();
    }
  }());

};