/*jslint nomen: true, plusplus: true, white: true, browser: true */

var DOMChildListMutationListenerFactory;

(function() {

  'use strict';

  var MutationNodeList, MutationObserverWrapper, MutationEventWrapper;

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

  function applyFilter(callbacks, args) {
    // Applies an array of filter callbacks
    var i, l;
    args = args instanceof Array ? args : [args];
    for (i = 0, l = callbacks.length; i < l; i++) {
      try {
        if (callbacks[i].apply(null, args) === false) {
          return false;
        }
      } catch(e) {
        console.log(e.message);
        return false;
      }
    }
    return true;
  }

  // MutationNodeList class
  MutationNodeList = function() {
    this.nodes = [];
  };
  MutationNodeList.prototype.find = function(node, callback) {
    var i, l;
    if (typeof callback === 'function') {
      for (i = 0, l = this.nodes.length; i < l; i++) {
        try {
          if (callback(node, this.nodes[i])) {
            return this.nodes[i];
          }
        } catch(e) {}
      }
    }
    return null;
  };
  MutationNodeList.prototype.length = 0;
  MutationNodeList.prototype.contains = function(node) {
    return this.nodes.indexOf(node) >= 0;
  };
  MutationNodeList.prototype.item = function(index) {
    return this.nodes[index] !== undefined ? this.nodes[index] : null;
  };
  MutationNodeList.prototype.push = function(node) {
    this.nodes.push(node);
    this.length = this.nodes.length;
    return node;
  };
  MutationNodeList.prototype.unshift = function(node) {
    this.nodes.unshift(node);
    this.length = this.nodes.length;
    return node;
  };
  MutationNodeList.prototype.pop = function() {
    var result = this.nodes.pop();
    this.length = this.nodes.length;
    return result;
  };
  MutationNodeList.prototype.shift = function() {
    var result = this.nodes.shift();
    this.length = this.nodes.length;
    return result;
  };
  MutationNodeList.prototype.remove = function(node) {
    if (this.contains(node)) {
      this.nodes.splice(this.nodes.indexOf(node), 1);
      this.length = this.nodes.length;
    }
    return node;
  };

  /*
   * MutationObserverWrapper class
   */
  MutationObserverWrapper = function(parent, element) {
    // Constructor for MutationObserver wrapper
    this.parent = parent;
    this.element = element;
    this.callbacks = {
      nodeadded: [],
      noderemoved: [],
      nodereplaced: [],
      filteradded: [],
      filterremoved: [],
      filterreplaced: [],
      filtercompare: []
    };
    this.mutationObserver = parent.MOFactory.getObserver(this.observerCallback.bind(this));
  };
  initialiseConstants(MutationObserverWrapper);

  /*
   * Internal members
   */

  // Whether the observer is currently active (boolean flag)
  MutationObserverWrapper.prototype.observing = false;

  MutationObserverWrapper.prototype.observerCallback = function(mutations) {
    // Iterate over all nodes in mutation and fire event callbacks
    var i, j, k, l, m, n,
        newNode, oldNode, nodeArr,
        nodes = {
          added: new MutationNodeList(),
          removed: new MutationNodeList(),
          replaced: new MutationNodeList()
        };
    if (this.callbacks.nodereplaced.length) {
      n = this.callbacks.filtercompare.length;
      for (i = 0, l = mutations.length; i < l; i++) {
        for (j = 0, m = mutations[i].addedNodes.length; j < m; j++) {
          for (k = 0, newNode = mutations[i].addedNodes[j], oldNode = null; oldNode === null && k < n; k++) {
            oldNode = nodes.removed.find(newNode, this.callbacks.filtercompare[k]);
          }
          if (oldNode) {
            nodes.removed.remove(oldNode);
            if (applyFilter(this.callbacks.filterreplaced, [oldNode, newNode])) {
              nodes.replaced.push([oldNode, newNode]);
            }
          } else if (applyFilter(this.callbacks.filteradded, newNode)) {
            nodes.added.push(newNode);
          }
        }
        for (j = 0, m = mutations[i].removedNodes.length; j < m; j++) {
          for (k = 0, oldNode = mutations[i].removedNodes[j], newNode = null; newNode === null && k < n; k++) {
            newNode = nodes.added.find(oldNode, this.callbacks.filtercompare[k]);
          }
          if (newNode) {
            nodes.added.remove(newNode);
            if (applyFilter(this.callbacks.filterreplaced, [oldNode, newNode])) {
              nodes.replaced.push([oldNode, newNode]);
            }
          } else if (applyFilter(this.callbacks.filterremoved, oldNode)) {
            nodes.removed.push(oldNode);
          }
        }
      }
    } else {
      for (i = 0, l = mutations.length; i < l; i++) {
        for (j = 0, m = mutations[i].addedNodes.length; j < m; j++) {
          if (applyFilter(this.callbacks.filteradded, mutations[i].addedNodes[j])) {
            nodes.added.push(mutations[i].addedNodes[j]);
          }
        }
        for (j = 0, m = mutations[i].removedNodes.length; j < m; j++) {
          if (applyFilter(this.callbacks.filterremoved, mutations[i].removedNodes[j])) {
            nodes.removed.push(mutations[i].removedNodes[j]);
          }
        }
      }
    }
    while (nodes.added.length) {
      newNode = nodes.added.shift();
      for (i = 0, l = this.callbacks.nodeadded.length; i < l; i++) {
        this.callbacks.nodeadded[i](newNode);
      }
    }
    while (nodes.removed.length) {
      oldNode = nodes.removed.shift();
      for (i = 0, l = this.callbacks.noderemoved.length; i < l; i++) {
        this.callbacks.noderemoved[i](oldNode);
      }
    }
    while (nodes.replaced.length) {
      nodeArr = nodes.replaced.shift();
      for (i = 0, l = this.callbacks.nodereplaced.length; i < l; i++) {
        this.callbacks.nodereplaced[i](nodeArr[0], nodeArr[1]);
      }
    }
  };

  /*
   * Public methods
   */

  MutationObserverWrapper.prototype.getType = function() {
    // Integer identifying the underlying mechanism
    return this.LISTENER_TYPE_OBSERVER;
  };

  MutationObserverWrapper.prototype.isListening = function() {
    // Whether the listener is currently running
    return this.observing;
  };

  MutationObserverWrapper.prototype.on = function(eventName, callback) {
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

  MutationObserverWrapper.prototype.off = function(eventName, callback) {
    // De-register an event callback and stop the observer if no callbacks left
    var i;
    eventName = eventName.toLowerCase();
    if (this.callbacks[eventName] !== undefined) {
      i = this.callbacks[eventName].indexOf(callback);
      if (i > -1) {
        this.callbacks[eventName].splice(i, 1);
      }
    }
    if (this.observing && !this.callbacks.nodeadded.length && !this.callbacks.noderemoved.length && !this.callbacks.nodereplaced.length) {
      this.mutationObserver.disconnect();
      this.observing = false;
    }
  };


  /*
   * MutationEventWrapper definition
   */
  MutationEventWrapper = function(parent, element) {
    // Constructor for Mutation Events wrapper
    this.parent = parent;
    this.element = element;
    this.callbacks = {
      nodeadded: [],
      noderemoved: [],
      nodereplaced: [],
      filteradded: [],
      filterremoved: [],
      filterreplaced: [],
      filtercompare: []
    };
    this.nodeCache = {
      added: new MutationNodeList(),
      removed: new MutationNodeList(),
      replaced: new MutationNodeList()
    };
    this.hasCached = false;
  };
  initialiseConstants(MutationEventWrapper);

  /*
   * Internal members
   */

  // Whether the observer is currently active (boolean flag)
  MutationEventWrapper.prototype.insertObserving = false;
  MutationEventWrapper.prototype.removeObserving = false;

  MutationEventWrapper.prototype.processCache = function() {
    var i, j, l, m,
        oldNode, newNode, nodeArr;
    if (this.callbacks.nodereplaced.length) {
      m = this.callbacks.filtercompare.length;
      for (i = 0, l = this.nodeCache.added.length; i < l; i++) {
        for (j = 0, newNode = this.nodeCache.added.item(j), oldNode = null; oldNode === null && j < m; j++) {
          oldNode = this.nodeCache.removed.find(newNode, this.callbacks.filtercompare[j]);
        }
        if (oldNode) {
          this.nodeCache.removed.remove(oldNode);
          if (applyFilter(this.callbacks.filterreplaced, [oldNode, newNode])) {
            this.nodeCache.replaced.push([oldNode, newNode]);
          }
        } else if (!applyFilter(this.callbacks.filteradded, newNode)) {
          this.nodeCache.added.remove(newNode);
        }
      }
      for (i = 0, l = this.nodeCache.removed.length; i < l; i++) {
        if (!applyFilter(this.callbacks.filterremoved, this.nodeCache.removed.item(i))) {
          this.nodeCache.removed.remove(this.nodeCache.removed.item(i));
        }
      }
    } else {
      for (i = 0, l = this.nodeCache.added.length; i < l; i++) {
        if (!applyFilter(this.callbacks.filteradded, this.nodeCache.added.item(i))) {
          this.nodeCache.added.remove(this.nodeCache.added.item(i));
        }
      }
      for (i = 0, l = this.nodeCache.removed.length; i < l; i++) {
        if (!applyFilter(this.callbacks.filterremoved, this.nodeCache.removed.item(i))) {
          this.nodeCache.removed.remove(this.nodeCache.removed.item(i));
        }
      }
    }
    while (this.nodeCache.added.length) {
      newNode = this.nodeCache.added.shift();
      for (i = 0, l = this.callbacks.nodeadded.length; i < l; i++) {
        this.callbacks.nodeadded[i](newNode);
      }
    }
    while (this.nodeCache.removed.length) {
      oldNode = this.nodeCache.removed.shift();
      for (i = 0, l = this.callbacks.noderemoved.length; i < l; i++) {
        this.callbacks.noderemoved[i](oldNode);
      }
    }
    while (this.nodeCache.replaced.length) {
      nodeArr = this.nodeCache.replaced.shift();
      for (i = 0, l = this.callbacks.nodereplaced.length; i < l; i++) {
        this.callbacks.nodereplaced[i](nodeArr[0], nodeArr[1]);
      }
    }
    this.hasCached = false;
  };

  MutationEventWrapper.prototype.nodeInsertedListener = function(event) {
    this.nodeCache.added.push(event.target || event.srcElement);
    if (!this.hasCached) {
      setTimeout(this.processCache.bind(this), 0);
      this.hasCached = true;
    }
  };

  MutationEventWrapper.prototype.nodeRemovedListener = function(event) {
    this.nodeCache.removed.push(event.target || event.srcElement);
    if (!this.hasCached) {
      setTimeout(this.processCache.bind(this), 0);
      this.hasCached = true;
    }
  };

  /*
   * Public methods
   */

  MutationEventWrapper.prototype.getType = function() {
    // Integer identifying the underlying mechanism
    return this.LISTENER_TYPE_EVENT;
  };

  MutationEventWrapper.prototype.isListening = function() {
    // Whether the listener is currently running
    return this.insertObserving || this.removeObserving;
  };

  MutationEventWrapper.prototype.on = function(eventName, callback) {
    // Register an event callback and add the event listeners if required
    eventName = eventName.toLowerCase();
    if (this.callbacks[eventName] !== undefined && typeof callback === 'function' && this.callbacks[eventName].indexOf(callback) < 0) {
      this.callbacks[eventName].push(callback);
      if (!this.insertObserving && (this.callbacks.nodeadded.length || this.callbacks.nodereplaced.length)) {
        this.nodeInsertedListener = this.nodeInsertedListener.bind(this);
        this.element.addEventListener('DOMNodeInserted', this.nodeInsertedListener);
        this.insertObserving = true;
      }
      if (!this.removeObserving && (this.callbacks.noderemoved.length || this.callbacks.nodereplaced.length)) {
        this.nodeRemovedListener = this.nodeRemovedListener.bind(this);
        this.element.addEventListener('DOMNodeRemoved', this.nodeRemovedListener);
        this.removeObserving = true;
      }
    }
  };

  MutationEventWrapper.prototype.off = function(eventName, callback) {
    // De-register an event callback and remove the event listeners if no callbacks left
    var i;
    eventName = eventName.toLowerCase();
    if (this.callbacks[eventName] !== undefined) {
      i = this.callbacks[eventName].indexOf(callback);
      if (i > -1) {
        this.callbacks[eventName].splice(i, 1);
      }
      if (this.insertObserving && !this.callbacks.nodeadded.length && !this.callbacks.nodereplaced.length) {
        this.element.removeEventListener('DOMNodeInserted', this.nodeInsertedListener);
        this.insertObserving = false;
      }
      if (this.removeObserving && !this.callbacks.noderemoved.length && !this.callbacks.nodereplaced.length) {
        this.element.removeEventListener('DOMNodeRemoved', this.nodeRemovedListener);
        this.removeObserving = false;
      }
    }
  };

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
        DOMChildListMutationListenerFactory.prototype.WrapperInUse = MutationObserverWrapper;
      } else if (window.addEventListener) {
        DOMChildListMutationListenerFactory.prototype.WrapperInUse = MutationEventWrapper;
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
        obj = new MutationObserverWrapper(this, element);
      } else if (type === this.LISTENER_TYPE_EVENT) {
        // An exception will be thrown before we get here if it's not going to work
        obj = new MutationEventWrapper(this, element);
      } else {
        obj = new this.WrapperInUse(this, element);
      }
    } else {
      obj = new this.WrapperInUse(this, element);
    }
    return obj;
  };

}());