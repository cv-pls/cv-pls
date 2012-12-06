var Grippie;

(function() {

  function registerEventListener(element, eventName, callBack) {
    if (element.addEventListener) {
      element.addEventListener(eventName, callBack);
    } else {
      eventName = 'on' + eventName.toLowerCase();
      element[eventName] = callBack;
    }
  }

  function getCurrentHeight(element) {
    return parseInt(element.ownerDocument.defaultView.getComputedStyle(element, null).getPropertyValue('height'), 10);
  }

  function normaliseOptions(options) {
    this.options = {};
    if (!options.target || !options.grippie) {
      throw new Error('You must supply a target element and a grippie element');
    }
    this.target = options.target;
    this.grippie = options.grippie;
    this.options.cursor = options.cursor || 'auto';
  }

  function processInitialState() {
    this.initialHeight = getCurrentHeight(this.target);
    this.totalHeight = this.target.scrollHeight + getCurrentHeight(this.grippie);
  }

  function processGrippieElement() {
    var self = this;

    this.grippie.style.cursor = this.options.cursor;

    registerEventListener(this.grippie, 'mousedown', function(e) {
      self.isResizing = true;
      self.currentPosY = e.pageY;
      e.preventDefault();
      e.stopPropagation();
    });

    registerEventListener(this.grippie, 'dblclick', function() {
      if (getCurrentHeight(self.target) < self.totalHeight) {
        self.target.style.height = self.totalHeight + 'px';
      } else {
        self.target.style.height = self.initialHeight + 'px';
      }
    });
  }

  function processDocumentEvents() {
    var self = this;

    registerEventListener(this.target.ownerDocument, 'mousedown', function(e) {
      if (self.isResizing) {
        e.preventDefault();
        e.stopPropagation();
      }
    });

    registerEventListener(this.target.ownerDocument, 'mousemove', function(e) {
      if (!self.isResizing) {
        return;
      }
      var newHeight = getCurrentHeight(self.target) + (e.pageY - self.currentPosY);
      self.currentPosY = e.pageY;
      if (newHeight > getCurrentHeight(self.grippie) && newHeight < self.totalHeight) {
        self.target.style.height = newHeight + 'px';
      }
    });

    registerEventListener(this.target.ownerDocument, 'mouseup', function() {
      self.isResizing = false;
    });
  }

  Grippie = function(options) {
    normaliseOptions.call(this, options);
    processInitialState.call(this);
    processGrippieElement.call(this);
    processDocumentEvents.call(this);
  };

  Grippie.prototype.initialHeight = null;
  Grippie.prototype.totalHeight = null;
  Grippie.prototype.isResizing = false;
  Grippie.prototype.currentPosY = null;

}());