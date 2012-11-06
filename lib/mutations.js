/*jslint plusplus: true, white: true, browser: true */

var DOMChildListMutationListenerFactory;

(function() {

  'use strict';

  function initialiseConstants(Constructor) {
    // This looks horrible, and it is. However, it's the most compatible way to do
    // this while still guaranteeing read-only properties where available.
    var constContainer = {};
    if (constContainer.__defineGetter__) {
      Constructor.__defineGetter__('LISTENER_TYPE_BEST', function() { return 1; });
      Constructor.__defineGetter__('LISTENER_TYPE_OBSERVER', function() { return 2; });
      Constructor.__defineGetter__('LISTENER_TYPE_EVENT', function() { return 3; });
      constContainer.__defineGetter__('LISTENER_TYPE_BEST', function() { return 1; });
      constContainer.__defineGetter__('LISTENER_TYPE_OBSERVER', function() { return 2; });
      constContainer.__defineGetter__('LISTENER_TYPE_EVENT', function() { return 3; });
    } else if (Object.defineProperty) {
      // You'd think this would be first, but you'd be wrong. Chrome read only on prototype no worky.
      Object.defineProperty(Constructor, 'LISTENER_TYPE_BEST', { value: 1, writable: false, enumerable: false, configurable: false });
      Object.defineProperty(Constructor, 'LISTENER_TYPE_OBSERVER', { value: 2, writable: false, enumerable: false, configurable: false });
      Object.defineProperty(Constructor, 'LISTENER_TYPE_EVENT', { value: 3, writable: false, enumerable: false, configurable: false });
      Object.defineProperty(constContainer, 'LISTENER_TYPE_BEST', { value: 1, writable: false, enumerable: false, configurable: false });
      Object.defineProperty(constContainer, 'LISTENER_TYPE_OBSERVER', { value: 2, writable: false, enumerable: false, configurable: false });
      Object.defineProperty(constContainer, 'LISTENER_TYPE_EVENT', { value: 3, writable: false, enumerable: false, configurable: false });
    } else {
      constContainer.LISTENER_TYPE_BEST = Constructor.LISTENER_TYPE_BEST = 1;
      constContainer.LISTENER_TYPE_OBSERVER = Constructor.LISTENER_TYPE_OBSERVER = 2;
      constContainer.LISTENER_TYPE_EVENT = Constructor.LISTENER_TYPE_EVENT = 3;
    }
    Constructor.prototype = constContainer;
  }

  if (!Function.prototype.bind) {
    // Function.bind() shim
    // https://developer.mozilla.org/en-US/docs/JavaScript/Reference/Global_Objects/Function/bind
    Function.prototype.bind = function (oThis) {
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
  DOMChildListMutationListenerFactory = function(){};
  initialiseConstants(DOMChildListMutationListenerFactory);
  
  DOMChildListMutationListenerFactory.prototype.MOFactory = {
    isSupported: function() {
      // Determines whether the environment supports MutationObservers and caches a
      // reference to the constructor if it does
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
      return new this.MOConstructor(callback);
    }
  };

  DOMChildListMutationListenerFactory.prototype.getListener = function(element, type) {
    // Determines which wrapper constructor to use, caches the result and gets an instance
    var obj;
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
    if (type !== undefined) {
      if (type === this.LISTENER_TYPE_OBSERVER) {
        if (!this.MOFactory.isSupported()) {
          throw new Error('Your browser does not support mutation observers');
        }
        obj = new this.MutationObserverWrapper(this, element);
      } else if (type === this.LISTENER_TYPE_EVENT) {
        // An exception will be thrown before we get here if it's not going to work
        obj = new this.MutationEventWrapper(this, element);
      } else {
        obj = new this.WrapperInUse(this, element);
      }
    } else {
      obj = new this.WrapperInUse(this, element);
    }
    return obj;
  };

  /*
   * MutationObserverWrapper definition
   */
  DOMChildListMutationListenerFactory.prototype.MutationObserverWrapper = function(parent, element) {
    // Constructor for MutationObserver wrapper
    this.parent = parent;
    this.element = element;
    this.callbacks = {
      nodeadded: [],
      noderemoved: []
    };
    this.mutationObserver = parent.MOFactory.getObserver(this.observerCallback.bind(this));
  };
  initialiseConstants(DOMChildListMutationListenerFactory.prototype.MutationObserverWrapper);

  /*
   * Internal members
   */

  // Whether the observer is currently active (boolean flag)
  DOMChildListMutationListenerFactory.prototype.MutationObserverWrapper.prototype.observing = false;

  DOMChildListMutationListenerFactory.prototype.MutationObserverWrapper.prototype.observerCallback = function(mutations) {
    // Iterate over all nodes in mutation and fire event callbacks
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

  /*
   * Public methods
   */

  DOMChildListMutationListenerFactory.prototype.MutationObserverWrapper.prototype.getType = function() {
    // Integer identifying the underlying mechanism
    return this.LISTENER_TYPE_OBSERVER;
  };

  DOMChildListMutationListenerFactory.prototype.MutationObserverWrapper.prototype.isListening = function() {
    // Whether the listener is currently running
    return this.observing;
  };

  DOMChildListMutationListenerFactory.prototype.MutationObserverWrapper.prototype.on = function(eventName, callback) {
    // Register an event callback and start the observer if required
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
    this.parent = parent;
    this.element = element;
    this.callbacks = {
      nodeadded: [],
      noderemoved: [],
      nodereplaced: []
    };
  };
  initialiseConstants(DOMChildListMutationListenerFactory.prototype.MutationEventWrapper);

  /*
   * Internal members
   */

  // Whether the observer is currently active (boolean flag)
  DOMChildListMutationListenerFactory.prototype.MutationObserverWrapper.prototype.insertObserving = false;
  DOMChildListMutationListenerFactory.prototype.MutationObserverWrapper.prototype.removeObserving = false;

  DOMChildListMutationListenerFactory.prototype.MutationEventWrapper.prototype.nodeInsertedListener = function(event) {
    // Fire insert callbacks
    var i, l, node = event.target || event.srcElement;
    for (i = 0, l = this.callbacks.nodeadded.length; i < l; i++) {
      this.callbacks.nodeadded[i](node);
    }
  };

  DOMChildListMutationListenerFactory.prototype.MutationEventWrapper.prototype.nodeRemovedListener = function(event) {
    // Fire remove callbacks
    var i, l, node = event.target || event.srcElement;
    for (i = 0, l = this.callbacks.noderemoved.length; i < l; i++) {
      this.callbacks.noderemoved[i](node);
    }
  };

  /*
   * Public methods
   */

  DOMChildListMutationListenerFactory.prototype.MutationEventWrapper.prototype.getType = function() {
    // Integer identifying the underlying mechanism
    return this.LISTENER_TYPE_EVENT;
  };

  DOMChildListMutationListenerFactory.prototype.MutationEventWrapper.prototype.isListening = function() {
    // Whether the listener is currently running
    return this.insertObserving || this.removeObserving;
  };

  DOMChildListMutationListenerFactory.prototype.MutationEventWrapper.prototype.on = function(eventName, callback) {
    // Register an event callback and add the event listeners if required
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

}());