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

  function elementHeight(element, newHeight) {
    var prevHeight = parseInt(element.ownerDocument.defaultView.getComputedStyle(element, null).getPropertyValue('height'), 10);
    if (newHeight !== undefined) {
      element.style.height = newHeight + 'px';
    }
    return prevHeight;
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
    this.grippieHeight = elementHeight(this.grippie);

    this.initialTargetHeight = elementHeight(this.target);
    this.maxTargetHeight = this.target.scrollHeight + this.grippieHeight;
  }

  function processGrippieElement() {
    var self = this;

    this.grippie.style.cursor = this.options.cursor;

    registerEventListener(this.grippie, 'mousedown', function(e) {
      e.preventDefault();
      e.stopPropagation();

      self.isResizing = true;

      self.lastPosY = e.pageY;
      self.minPosY = e.pageY - (elementHeight(self.target) - self.grippieHeight);
      self.maxPosY = self.minPosY + (self.maxTargetHeight - self.grippieHeight);
    });

    registerEventListener(this.grippie, 'dblclick', function() {
      var newHeight = elementHeight(self.target) < self.maxTargetHeight ? self.maxTargetHeight : self.initialTargetHeight;
      elementHeight(self.target, newHeight);
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
      var newTargetHeight, posYDiff;

      if (!self.isResizing || e.pageY < self.minPosY || e.pageY > self.maxPosY) {
        return;
      }

      posYDiff = e.pageY - self.lastPosY;
      self.lastPosY = e.pageY;

      newTargetHeight = elementHeight(self.target) + posYDiff;
      if (newTargetHeight > self.grippieHeight && newTargetHeight < self.maxTargetHeight) {
        elementHeight(self.target, newTargetHeight);
      }
    });

    registerEventListener(this.target.ownerDocument.defaultView, 'mouseup', function() {
      self.isResizing = false;
    });
  }

  Grippie = function(options) {
    normaliseOptions.call(this, options);
    processInitialState.call(this);
    processGrippieElement.call(this);
    processDocumentEvents.call(this);
  };

  Grippie.prototype.isResizing = false;

  Grippie.prototype.initialTargetHeight = null;
  Grippie.prototype.grippieHeight = null;
  Grippie.prototype.maxTargetHeight = null;

  Grippie.prototype.lastPosY = null;
  Grippie.prototype.minPosY = null;
  Grippie.prototype.maxPosY = null;

}());