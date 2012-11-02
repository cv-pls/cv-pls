CvPlsHelper.ChatRoom = function(document) {

  "use strict";

  var self = this;

  this.status = false;

  this.checkRoomStatus = function() {
    if (document.getElementById('loading')) {
      setTimeout(self.checkRoomStatus, 1000);
    } else {
      self.setRoomStatus(true);
    }
  };

  this.setRoomStatus = function(status) {
    self.status = status;
  };

  this.isRoomLoaded = function() {
    return self.status;
  };

  this.checkRoomStatus();

};