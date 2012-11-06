/*jslint plusplus: true, white: true, browser: true */

if (!Function.prototype.bind) {
  // Function.bind() shim
  // https://developer.mozilla.org/en-US/docs/JavaScript/Reference/Global_Objects/Function/bind
  Function.prototype.bind = function (oThis) {
    'use strict';
    if (typeof this !== "function") {
      throw new TypeError("Function.prototype.bind - what is trying to be bound is not callable");
    }
    var aArgs = Array.prototype.slice.call(arguments, 1), 
        FToBind = this, 
        FNOP = function () {},
        FBound = function () {
          return FToBind.apply(this instanceof FNOP && oThis ? this : oThis, aArgs.concat(Array.prototype.slice.call(arguments)));
        };
    FNOP.prototype = this.prototype;
    FBound.prototype = new FNOP();
    return FBound;
  };
}

/*
 * DOMChildListMutationListenerFactory definition
 */
function DOMChildListMutationListenerFactory() {'use strict';}

DOMChildListMutationListenerFactory.prototype.MOFactory = {
  isSupported: function() {
    // Determines whether the environment supports MutationObservers and caches a
    // reference to the constructor if it does
    'use strict';
    if (this.MOConstructor === undefined) {
      this.MOConstructor = null;
      if (window.MutationObserver !== undefined) { // Mozilla/standard
        this.MOConstructor = window.MutationObserver;
      } else if (window.WebKitMutationObserver !== undefined) { // Webkit
        this.MOConstructor = window.WebKitMutationObserver;
      }
    }
    return this.MOConstructor !== null;
  },
  getObserver: function(callback) {
    // Gets a MutationObserver instance
    'use strict';
    return new this.MOConstructor(callback);
  }
};

DOMChildListMutationListenerFactory.prototype.getListener = function(element) {
  // Determines which wrapper constructor to use, caches the result and gets an instance
  'use strict';
  if (this.WrapperInUse === undefined) {
    DOMChildListMutationListenerFactory.prototype.WrapperInUse = null;
    if (this.MOFactory.isSupported()) {
      DOMChildListMutationListenerFactory.prototype.WrapperInUse = this.MutationObserverWrapper;
    } else if (window.addEventListener) {
      DOMChildListMutationListenerFactory.prototype.WrapperInUse = this.MutationEventWrapper;
    }
  }
  if (this.WrapperInUse === null) {
    throw new Error('Your browser does not support Child List mutation listeners');
  }
  return new this.WrapperInUse(this, element);
};

/*
 * MutationObserverWrapper definition
 */
DOMChildListMutationListenerFactory.prototype.MutationObserverWrapper = function(parent, element) {
  // Constructor for MutationObserver wrapper
  'use strict';
  this.parent = parent;
  this.element = element;
  this.callbacks = {
    nodeadded: [],
    noderemoved: []
  };
  this.mutationObserver = parent.MOFactory.getObserver(this.observerCallback.bind(this));
};

// Whether the observer is currently active (boolean flag)
DOMChildListMutationListenerFactory.prototype.MutationObserverWrapper.prototype.observing = false;

DOMChildListMutationListenerFactory.prototype.MutationObserverWrapper.prototype.observerCallback = function(mutations) {
  // Iterate over all nodes in mutation and fire event callbacks
  'use strict';
  var i, j, k, l, m, n;
  for (i = 0, l = mutations.length; i < l; i++) {
    for (j = 0, m = mutations[i].removedNodes.length; j < m; j++) {
      for (k = 0, n = this.callbacks.noderemoved.length; k < n; k++) {
        this.callbacks.noderemoved[k](mutations[i].removedNodes[j]);
      }
    }
    for (j = 0, m = mutations[i].addedNodes.length; j < m; j++) {
      for (k = 0, n = this.callbacks.nodeadded.length; k < n; k++) {
        this.callbacks.nodeadded[k](mutations[i].addedNodes[j]);
      }
    }
  }
};

DOMChildListMutationListenerFactory.prototype.MutationObserverWrapper.prototype.on = function(eventName, callback) {
  // Register an event callback and start the observer if required
  'use strict';
  eventName = eventName.toLowerCase();
  if (this.callbacks[eventName] !== undefined && typeof callback === 'function' && this.callbacks[eventName].indexOf(callback) < 0) {
    this.callbacks[eventName].push(callback);
    if (!this.observing) {
      this.mutationObserver.observe(this.element, { childList: true, subtree: true });
      this.observing = true;
    }
  }
};

DOMChildListMutationListenerFactory.prototype.MutationObserverWrapper.prototype.off = function(eventName, callback) {
  // De-register an event callback and stop the observer if no callbacks left
  'use strict';
  var i;
  eventName = eventName.toLowerCase();
  if (this.callbacks[eventName] !== undefined) {
    i = this.callbacks[eventName].indexOf(callback);
    if (i > -1) {
      this.callbacks[eventName].splice(i, 1);
    }
  }
  if (this.observing && !this.callbacks.nodeadded.length && !this.callbacks.noderemoved.length) {
    this.mutationObserver.disconnect();
    this.observing = false;
  }
};

/*
 * MutationEventWrapper definition
 */
DOMChildListMutationListenerFactory.prototype.MutationEventWrapper = function(parent, element) {
  // Constructor for Mutation Events wrapper
  'use strict';
  this.parent = parent;
  this.element = element;
  this.callbacks = {
    nodeadded: [],
    noderemoved: []
  };
};

// Whether the observer is currently active (boolean flag)
DOMChildListMutationListenerFactory.prototype.MutationObserverWrapper.prototype.insertObserving = false;
DOMChildListMutationListenerFactory.prototype.MutationObserverWrapper.prototype.removeObserving = false;

DOMChildListMutationListenerFactory.prototype.MutationEventWrapper.prototype.nodeInsertedListener = function(event) {
  // Fire insert callbacks
  'use strict';
  var i, l, node = event.target || event.srcElement;
  for (i = 0, l = this.callbacks.nodeadded.length; i < l; i++) {
    this.callbacks.nodeadded[i](node);
  }
};

DOMChildListMutationListenerFactory.prototype.MutationEventWrapper.prototype.nodeRemovedListener = function(event) {
  // Fire remove callbacks
  'use strict';
  var i, l, node = event.target || event.srcElement;
  for (i = 0, l = this.callbacks.noderemoved.length; i < l; i++) {
    this.callbacks.noderemoved[i](node);
  }
};

DOMChildListMutationListenerFactory.prototype.MutationEventWrapper.prototype.on = function(eventName, callback) {
  // Register an event callback and add the event listeners if required
  'use strict';
  eventName = eventName.toLowerCase();
  if (this.callbacks[eventName] !== undefined && typeof callback === 'function' && this.callbacks[eventName].indexOf(callback) < 0) {
    this.callbacks[eventName].push(callback);
    if (!this.insertObserving && this.callbacks.nodeadded.length) {
      this.nodeInsertedListener = this.nodeInsertedListener.bind(this);
      this.element.addEventListener('DOMNodeInserted', this.nodeInsertedListener);
      this.insertObserving = true;
    }
    if (!this.removeObserving && this.callbacks.noderemoved.length) {
      this.nodeRemovedListener = this.nodeRemovedListener.bind(this);
      this.element.addEventListener('DOMNodeRemoved', this.nodeRemovedListener);
      this.removeObserving = true;
    }
  }
};

DOMChildListMutationListenerFactory.prototype.MutationEventWrapper.prototype.off = function(eventName, callback) {
  // De-register an event callback and remove the event listeners if no callbacks left
  'use strict';
  var i;
  eventName = eventName.toLowerCase();
  if (this.callbacks[eventName] !== undefined) {
    i = this.callbacks[eventName].indexOf(callback);
    if (i > -1) {
      this.callbacks[eventName].splice(i, 1);
    }
    if (this.insertObserving && !this.callbacks.nodeadded.length) {
      this.element.removeEventListener('DOMNodeInserted', this.nodeInsertedListener);
      this.insertObserving = false;
    }
    if (this.removeObserving && !this.callbacks.noderemoved.length) {
      this.element.removeEventListener('DOMNodeRemoved', this.nodeRemovedListener);
      this.removeObserving = false;
    }
  }
};


/*
 * Example Usage
 */
var factory = new DOMChildListMutationListenerFactory();
var listener = factory.getListener(document.getElementById('some-element'));
listener.on('NodeAdded', function(addedNode) {
  // Do stuff here
});