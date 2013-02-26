/*jslint plusplus: true, white: true, browser: true */
/*global CvPlsHelper */

(function() {

  'use strict';

  /*
   * Private methods
   */
  function setRoomLoaded() {
    this.loaded = true;

    getActiveUserClass.call(this);

    stopListener.call(this);
    while (this.callbacks.length) {
      this.callbacks.shift().call();
    }
  }

  function getActiveUserClass() {
    this.chatContainer = this.document.getElementById('chat');
    if (this.chatContainer) {
      this.activeUserClass = this.document.getElementById('active-user').className.match(/user-\d+/)[0];
    } else {
      this.chatContainer = this.document.getElementById('transcript');
      this.activeUserClass = 'user-' + // Ugh, do something about this please
        this.document.head
          .children[document.head.children.length - 1]
            .firstChild.data
              .match(/initTranscript\s*\([^,]+,\s*(\d+)/)[1];
    }
  }

  function mutationListenerCallback(node) {
    if (node.getAttribute && node.getAttribute('id') === 'loading') {
      setRoomLoaded.call(this);
    }
  }

  function startListener() {
    if (this.mutationListener && !this.mutationListener.isListening()) {
      this.mutationListener.on('NodeRemoved', mutationListenerCallback.bind(this));
    }
  }

  function stopListener() {
    if (this.mutationListener.isListening()) {
      this.mutationListener.off('NodeRemoved');
      this.mutationListener = null;
    }
  }

  function checkRoomStatus() {
    if (!this.loaded) {
      if (this.document.getElementById('loading')) {
        startListener.call(this);
      } else {
        setRoomLoaded.call(this);
      }
    }
  }

  /*
   * Constructor
   */
  CvPlsHelper.ChatRoom = function(document, mutationListenerFactory) {
    this.document = document;
    this.mutationListener = mutationListenerFactory.getListener(document.body);
    this.callbacks = [];
  };
  CvPlsHelper.ChatRoom.prototype.loaded = false;
  CvPlsHelper.ChatRoom.prototype.chatContainer = null;
  CvPlsHelper.ChatRoom.prototype.activeUserClass = null;

  /*
   * Public methods
   */
  CvPlsHelper.ChatRoom.prototype.isLoaded = function() {
    if (!this.loaded) {
      checkRoomStatus.call(this);
    }
    return this.loaded;
  };

  CvPlsHelper.ChatRoom.prototype.onLoad = function(callback) {
    if (this.isLoaded()) {
      callback();
    } else {
      this.callbacks.push(callback);
    }
  };

}());