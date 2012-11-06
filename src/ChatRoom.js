/*jslint plusplus: true, white: true, browser: true */
/*global CvPlsHelper */

(function() {

  "use strict";

  /*
   * Constructor
   */
  CvPlsHelper.ChatRoom = function(document, mutationListenerFactory) {
    this.document = document;
    this.mutationListener = mutationListenerFactory.getListener(document.body);
    this.callbacks = [];
  };

  /*
   * Internal members
   */
  CvPlsHelper.ChatRoom.prototype.loaded = false;

  CvPlsHelper.ChatRoom.prototype.mutationListenerCallback = function(node) {
    if (node.getAttribute && node.getAttribute('id') === 'loading') {
      this.setRoomLoaded();
    }
  };

  CvPlsHelper.ChatRoom.prototype.checkRoomStatus = function() {
    if (!this.loaded) {
      if (this.document.getElementById('loading')) {
        this.startListener();
      } else {
        this.setRoomLoaded();
      }
    }
  };

  CvPlsHelper.ChatRoom.prototype.startListener = function() {
    if (this.mutationListener && !this.mutationListener.isListening()) {
      this.mutationListenerCallback = this.mutationListenerCallback.bind(this);
      this.mutationListener.on('NodeRemoved', this.mutationListenerCallback);
    }
  };

  CvPlsHelper.ChatRoom.prototype.stopListener = function() {
    if (this.mutationListener.isListening()) {
      this.mutationListener.off('NodeRemoved', this.mutationListenerCallback);
      this.mutationListener = null;
    }
  };

  CvPlsHelper.ChatRoom.prototype.setRoomLoaded = function() {
    this.loaded = true;
    this.stopListener();
    while (this.callbacks.length) {
      this.callbacks.shift().call();
    }
  };

  /*
   * Public methods
   */
  CvPlsHelper.ChatRoom.prototype.isLoaded = function() {
    if (!this.loaded) {
      this.checkRoomStatus();
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