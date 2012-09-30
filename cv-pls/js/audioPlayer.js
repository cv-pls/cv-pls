/*jslint plusplus: true, white: true, browser: true */
/*global Audio, chrome */

function AudioPlayer(audioFile) {

  "use strict";

  var self = this;

  this.audioFile = audioFile;
  this.audioPlayers = {
    enabled: false,
    nativeAudioSupported: false,
    nativeAudioPlayer: null,
    jPlayerSupported: false,
    jPlayerEvent: null
  };

  this.init = function() {
    self.initializeNativeAudioSupport();
    self.initializeJplayerSupport();
  };

  this.initializeNativeAudioSupport = function() {
    if (!window.Audio) {
      return null;
    }

    self.audioPlayers.nativeAudioPlayer = new Audio();

    if (!self.audioPlayers.nativeAudioPlayer.canPlayType('audio/mp3;')) {
      return null;
    }

    self.audioPlayers.nativeAudioPlayer.src = audioFile;
    self.audioPlayers.nativeAudioSupported = true;
  };

  this.initializeJplayerSupport = function() {
    var script = document.createElement('script'), customEvent;
    script.setAttribute('type', 'application/javascript');
    script.setAttribute('src', chrome.extension.getURL('js/custom-jplayer.js'));
    document.head.appendChild(script);

    customEvent = document.createEvent('Event');
    customEvent.initEvent('CustomJPlayerNotify', true, true);

    self.audioPlayers.jPlayerSupported = true;
    self.audioPlayers.jPlayerEvent = customEvent;
  };

  this.playNotification = function() {
    if (self.audioPlayers.nativeAudioSupported) {
      self.audioPlayers.nativeAudioPlayer.play();
    } else if (self.audioPlayers.jPlayerSupported) {
      document.getElementById('custom-communicationDIV').innerText = 'notify';
      document.getElementById('custom-communicationDIV').dispatchEvent(self.audioPlayers.jPlayerEvent);
    }
  };

  this.init();
}