/*jslint nomen: true, plusplus: true, white: true, browser: true */

var DOMChildListMutationListenerFactory;

(function() {

    'use strict';

    var MutationNodeList, MutationObserverWrapper, MutationEventWrapper, MutationObserverFactory;

    /**
     * Applies an array of filter callbacks
     *
     * @param {array} callbacks The array of callbacks to apply
     * @param {array} args      And array of arguments to pass to the callbacks
     *
     * @return {boolean} The result of the callbacks
     */
    function applyFilter(callbacks, args)
    {
        var i, l, result = true;
        args = args instanceof Array ? args : [args];

        for (i = 0, l = callbacks.length; i < l; i++) {
            try {
                result = callbacks[i].apply(null, args);

                if (result === false) {
                    result = false;
                    break;
                } else if (typeof result === 'object' && result.length !== undefined) {
                    break;
                }
            } catch(e) {
                result = false;
                break;
            }
        }

        return result;
    }

    /**
     * Definition of object which holds a list of nodes that have been mutated
     */
    (function() {
        /**
         * Constructor
         */
        MutationNodeList = function()
        {
            this.nodes = [];
        };

        /**
         * @var {array} The items in the collection
         */
        MutationNodeList.prototype.nodes = 0;

        /**
         * @var {integer} The number of items in the collection
         */
        MutationNodeList.prototype.length = 0;

        /**
         * Find the first node that matches a callback criteria
         *
         * @param {DOMNode}  node     Base DOM node for comparison
         * @param {function} callback Callback function for comparison
         *
         * @return {DOMNode} The matched element or null if no match found
         */
        MutationNodeList.prototype.find = function(node, callback)
        {
            var i, l;

            if (typeof callback === 'function') {
                for (i = 0, l = this.nodes.length; i < l; i++) {
                    try {
                        if (callback.call(null, node, this.nodes[i])) {
                            return this.nodes[i];
                        }
                    } catch(e) {}
                }
            }

            return null;
        };

        /**
         * Determine whether the collection contains a specific node
         *
         * @param {DOMNode} node The node to check
         *
         * @return {boolean} Whether the collection contains a specific node
         */
        MutationNodeList.prototype.contains = function(node)
        {
            return this.nodes.indexOf(node) >= 0;
        };

        /**
         * Retrieve and item from the collection by index
         *
         * @param {integer} index The index of the element to retrieve
         *
         * @return {DOMNode} The element at the specified index or null if the index does not exist
         */
        MutationNodeList.prototype.item = function(index)
        {
            return this.nodes[index] !== undefined ? this.nodes[index] : null;
        };

        /**
         * Push an item on to the end of the collection
         *
         * @param {DOMNode} node The element to push onto the collection
         *
         * @return {DOMNode} The pushed node for method chaining
         */
        MutationNodeList.prototype.push = function(node)
        {
            this.nodes.push(node);
            this.length = this.nodes.length;
            return node;
        };

        /**
         * Unshift an item on to the beginning of the collection
         *
         * @param {DOMNode} node The element to unshift onto the collection
         *
         * @return {DOMNode} The unshifted node for method chaining
         */
        MutationNodeList.prototype.unshift = function(node)
        {
            this.nodes.unshift(node);
            this.length = this.nodes.length;
            return node;
        };

        /**
         * Pop an item off the end of the collection
         *
         * @return {DOMNode} The popped node
         */
        MutationNodeList.prototype.pop = function()
        {
            var result = this.nodes.pop();
            this.length = this.nodes.length;

            return result;
        };

        /**
         * Shift an item off the beginning of the collection
         *
         * @return {DOMNode} The shifted node
         */
        MutationNodeList.prototype.shift = function()
        {
            var result = this.nodes.shift();
            this.length = this.nodes.length;

            return result;
        };

        /**
         * Splice the internal array
         *
         * Document this properly
         */
        MutationNodeList.prototype.splice = function(pos, count)
        {
            return this.nodes.splice(pos, count);
        };

        /**
         * Remove a specific item from the collection
         *
         * @param {DOMNode} node The item to remove
         *
         * @return {DOMNode} The removed item for method chaining
         */
        MutationNodeList.prototype.remove = function(node)
        {
            if (this.contains(node)) {
                this.nodes.splice(this.nodes.indexOf(node), 1);
                this.length = this.nodes.length;
            }

            return node;
        };
    }());

    (function() {
        /**
         * Iterate over all added nodes in a mutation and categorise them as appropriate
         *
         * Takes into account nodes that have been replaced on the DOM based on the filtercompare event
         *
         * @param {array}  mutation The mutation being processed
         * @param {object} nodes    Map of NodeList objects representing the event categories
         */
        function processAddedNodesWithReplace(addedNodes, nodes)
        {
            var i, j, newNode, oldNode, filterResult;

            for (i = 0; addedNodes[i] !== undefined; i++) {
                newNode = addedNodes[i];
                oldNode = null;

                for (j = 0; this.callbacks.filtercompare[j] !== undefined; j++) {
                    oldNode = nodes.removed.find(newNode, this.callbacks.filtercompare[j]);

                    if (oldNode !== null) {
                        break;
                    }
                }

                if (oldNode !== null) {
                    nodes.removed.remove(oldNode);

                    if (applyFilter(this.callbacks.filterreplaced, [oldNode, newNode])) {
                        nodes.replaced.push([oldNode, newNode]);
                    }
                } else {
                    filterResult = applyFilter(this.callbacks.filteradded, newNode);

                    if (typeof filterResult === 'object') {
                        for (j = 0; filterResult[j] !== undefined; j++) {
                            nodes.added.push(filterResult[j]);
                        }
                    } else if (filterResult) {
                        nodes.added.push(newNode);
                    }
                }
            }
        }

        /**
         * Iterate over all added nodes in a mutation and categorise them as appropriate
         *
         * @param {array}  mutation The mutation being processed
         * @param {object} nodes    Map of NodeList objects representing the event categories
         */
        function processAddedNodesWithoutReplace(addedNodes, nodes)
        {
            var i, j, filterResult;

            for (i = 0; addedNodes[i] !== undefined; i++) {
                filterResult = applyFilter(this.callbacks.filteradded, addedNodes[i]);

                if (typeof filterResult === 'object') {
                    for (j = 0; filterResult[j] !== undefined; j++) {
                        nodes.added.push(filterResult[j]);
                    }
                } else if (filterResult) {
                    nodes.added.push(addedNodes[i]);
                }
            }
        }

        /**
         * Iterate over all removed nodes in a mutation and categorise them as appropriate
         *
         * Takes into account nodes that have been replaced on the DOM based on the filtercompare event
         *
         * @param {array}  mutation The mutation being processed
         * @param {object} nodes    Map of NodeList objects representing the event categories
         */
        function processRemovedNodesWithReplace(removedNodes, nodes)
        {
            var i, j, newNode, oldNode, filterResult;

            for (i = 0; removedNodes[i] !== undefined; i++) {
                oldNode = removedNodes[i];
                newNode = null;
    
                for (j = 0; this.callbacks.filtercompare[j] !== undefined; j++) {
                    newNode = nodes.added.find(oldNode, this.callbacks.filtercompare[j]);

                    if (newNode !== null) {
                        break;
                    }
                }
    
                if (newNode !== null) {
                    nodes.added.remove(newNode);

                    if (applyFilter(this.callbacks.filterreplaced, [oldNode, newNode])) {
                        nodes.replaced.push([oldNode, newNode]);
                    }
                } else {
                    filterResult = applyFilter(this.callbacks.filterremoved, oldNode);
    
                    if (typeof filterResult === 'object') {
                        for (j = 0; filterResult[j] !== undefined; j++) {
                            nodes.removed.push(filterResult[j]);
                        }
                    } else if (filterResult) {
                        nodes.removed.push(oldNode);
                    }
                }
            }
        }

        /**
         * Iterate over all removed nodes in a mutation and categorise them as appropriate
         *
         * @param {array}  mutation The mutation being processed
         * @param {object} nodes    Map of NodeList objects representing the event categories
         */
        function processRemovedNodesWithoutReplace(removedNodes, nodes)
        {
            var i, j, filterResult;
    
            for (i = 0; removedNodes[i] !== undefined; i++) {
                filterResult = applyFilter(this.callbacks.filterremoved, removedNodes[i]);
    
                if (typeof filterResult === 'object') {
                    for (j = 0; filterResult[j] !== undefined; j++) {
                        nodes.removed.push(filterResult[j]);
                    }
                } else if (filterResult) {
                    nodes.removed.push(removedNodes[i]);
                }
            }
        }

        /**
         * Trigger callbacks for the processed node lists
         *
         * @param {object} nodes Map of NodeList objects representing the event categories
         */
        function processMutationCallbacks(nodes)
        {
            var args, i;

            while (nodes.added.length) {
                args = nodes.added.shift();

                for (i = 0; this.callbacks.nodeadded[i] !== undefined; i++) {
                    this.callbacks.nodeadded[i].call(null, args);
                }
            }

            while (nodes.removed.length) {
                args = nodes.removed.shift();

                for (i = 0; this.callbacks.noderemoved[i] !== undefined; i++) {
                    this.callbacks.noderemoved[i].call(null, args);
                }
            }

            while (nodes.replaced.length) {
                args = nodes.replaced.shift();

                for (i = 0; this.callbacks.nodereplaced[i] !== undefined; i++) {
                    this.callbacks.nodereplaced[i].apply(null, args);
                }
            }
        }

        /**
         * Definition of object which wraps the mutation observer API
         */
        (function() {
            /**
             * Constructor
             *
             * @param {DOMNode}                 element                  The element being observed
             * @param {MutationObserverFactory} mutationObserverFactory  Factory which makes MutationObserver objects
             */
            MutationObserverWrapper = function(element, mutationObserverFactory)
            {
                this.element = element;
    
                this.callbacks = {
                    nodeadded:      [],
                    noderemoved:    [],
                    nodereplaced:   [],
                    filteradded:    [],
                    filterremoved:  [],
                    filterreplaced: [],
                    filtercompare:  []
                };
    
                this.mutationObserver = mutationObserverFactory.create(this.observerCallback.bind(this));
            };
    
            /**
             * @var {integer} Flag to indicate that the library uses the best available API
             */
            MutationObserverWrapper.prototype.LISTENER_TYPE_BEST = MutationObserverWrapper.LISTENER_TYPE_BEST = 1;

            /**
             * @var {integer} Flag to indicate that the library always uses mutation observers
             */
            MutationObserverWrapper.prototype.LISTENER_TYPE_OBSERVER = MutationObserverWrapper.LISTENER_TYPE_OBSERVER = 2;

            /**
             * @var {integer} Flag to indicate that the library always uses mutation events
             */
            MutationObserverWrapper.prototype.LISTENER_TYPE_EVENT = MutationObserverWrapper.LISTENER_TYPE_EVENT = 3;

            /**
             * @var {boolean} Whether the observer is currently active
             */
            MutationObserverWrapper.prototype.observing = false;

            /**
             * Iterate over all nodes in mutation and fire event callbacks
             *
             * @param {} mutations
             */
            MutationObserverWrapper.prototype.observerCallback = function(mutations)
            {
                var i, nodes = {
                    added: new MutationNodeList(),
                    removed: new MutationNodeList(),
                    replaced: new MutationNodeList()
                };

                if (this.callbacks.nodereplaced.length) {
                    for (i = 0; mutations[i] !== undefined; i++) {
                        processAddedNodesWithReplace.call(this, mutations[i].addedNodes, nodes);
                        processRemovedNodesWithReplace.call(this, mutations[i].removedNodes, nodes);
                    }
                } else {
                    for (i = 0; mutations[i] !== undefined; i++) {
                        processAddedNodesWithoutReplace.call(this, mutations[i].addedNodes, nodes);
                        processRemovedNodesWithoutReplace.call(this, mutations[i].removedNodes, nodes);
                    }
                }

                processMutationCallbacks.call(this, nodes);
            };

            /**
             * Get the value of the flag identifying the underlying mechanism
             *
             * @return {integer} The value of the flag identifying the underlying mechanism
             */
            MutationObserverWrapper.prototype.getType = function()
            {
                return this.LISTENER_TYPE_OBSERVER;
            };

            /**
             * Determine whether the listener is activer
             *
             * @return {boolean} Whether the listener is activer
             */
            MutationObserverWrapper.prototype.isListening = function()
            {
                return this.observing;
            };

            /**
             * Register an event callback and start the observer if required
             *
             * @param {string}   eventName The name of the event
             * @param {function} callback  Callback to handle the event
             */
            MutationObserverWrapper.prototype.on = function(eventName, callback)
            {
                eventName = eventName.toLowerCase();

                if (this.callbacks[eventName] !== undefined && typeof callback === 'function' && this.callbacks[eventName].indexOf(callback) < 0) {
                    this.callbacks[eventName].push(callback);

                    if (!this.observing) {
                        this.mutationObserver.observe(this.element, { childList: true, subtree: true });
                        this.observing = true;
                    }
                }
            };

            /**
             * De-register an event callback and stop the observer if no callbacks left
             *
             * @param {string}   eventName The name of the event
             * @param {function} callback  Callback to handle the event
             */
            MutationObserverWrapper.prototype.off = function(eventName, callback)
            {
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
        }());

        /**
         * Definition of object which wraps the mutation event API
         */
        (function() {
            /**
             * Constructor
             *
             * @param {DOMNode}                             element The element being observed
             */
            MutationEventWrapper = function(element)
            {
                this.element = element;

                this.callbacks = {
                    nodeadded:      [],
                    noderemoved:    [],
                    nodereplaced:   [],
                    filteradded:    [],
                    filterremoved:  [],
                    filterreplaced: [],
                    filtercompare:  []
                };

                this.nodeCache = {
                    added:    [],
                    removed:  [],
                    replaced: []
                };

                this.hasCached = false;
            };

            /**
             * @var {integer} Flag to indicate that the library uses the best available API
             */
            MutationEventWrapper.prototype.LISTENER_TYPE_BEST = MutationEventWrapper.LISTENER_TYPE_BEST = 1;

            /**
             * @var {integer} Flag to indicate that the library always uses mutation observers
             */
            MutationEventWrapper.prototype.LISTENER_TYPE_OBSERVER = MutationEventWrapper.LISTENER_TYPE_OBSERVER = 2;

            /**
             * @var {integer} Flag to indicate that the library always uses mutation events
             */
            MutationEventWrapper.prototype.LISTENER_TYPE_EVENT = MutationEventWrapper.LISTENER_TYPE_EVENT = 3;

            /**
             * @var {boolean} Whether the observer is currently active for inserted nodes
             */
            MutationEventWrapper.prototype.insertObserving = false;

            /**
             * @var {boolean} Whether the observer is currently active for removed nodes
             */
            MutationEventWrapper.prototype.removeObserving = false;

            /**
             * Process the cache of pending mutations
             */
            MutationEventWrapper.prototype.processCache = function()
            {
                var nodes = {
                    added:    new MutationNodeList(),
                    removed:  new MutationNodeList(),
                    replaced: new MutationNodeList()
                };

                this.hasCached = false;

                if (this.callbacks.nodereplaced.length) {
                    processAddedNodesWithReplace.call(this, this.nodeCache.added, nodes);
                    processRemovedNodesWithReplace.call(this, this.nodeCache.removed, nodes);
                } else {
                    processAddedNodesWithoutReplace.call(this, this.nodeCache.added, nodes);
                    processRemovedNodesWithoutReplace.call(this, this.nodeCache.removed, nodes);
                }
    
                processMutationCallbacks.call(this, nodes);
            };
    
            /**
             * Callback function for DOMNodeAdded event
             *
             * @param {MutationEvent} ev DOMNodeAdded Event object
             */
            MutationEventWrapper.prototype.nodeInsertedListener = function(ev)
            {
                var self, node;
    
                node = ev.target || ev.srcElement;
                this.nodeCache.added.push(node);
    
                if (!this.hasCached) {
                    self = this;
                    setTimeout(function() {
                        self.processCache();
                    }, 0);
    
                    this.hasCached = true;
                }
            };
    
            /**
             * Callback function for DOMNodeInserted event
             *
             * @param {MutationEvent} ev DOMNodeInserted Event object
             */
            MutationEventWrapper.prototype.nodeRemovedListener = function(ev)
            {
                var self, node;
    
                node = ev.target || ev.srcElement;
                this.nodeCache.removed.push(node);
    
                if (!this.hasCached) {
                    self = this;
                    setTimeout(function() {
                        self.processCache();
                    }, 0);
    
                    this.hasCached = true;
                }
            };
    
            /**
             * Get the value of the flag identifying the underlying mechanism
             *
             * @return {integer} The value of the flag identifying the underlying mechanism
             */
            MutationEventWrapper.prototype.getType = function()
            {
                return this.LISTENER_TYPE_EVENT;
            };
    
            /**
             * Determine whether the listener is activer
             *
             * @return {boolean} Whether the listener is activer
             */
            MutationEventWrapper.prototype.isListening = function()
            {
                return this.insertObserving || this.removeObserving;
            };
    
            /**
             * Register an event callback and start the observer if required
             *
             * @param {string}   eventName The name of the event
             * @param {function} callback  Callback to handle the event
             */
            MutationEventWrapper.prototype.on = function(eventName, callback)
            {
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
    
            /**
             * De-register an event callback and stop the observer if no callbacks left
             *
             * @param {string}   eventName The name of the event
             * @param {function} callback  Callback to handle the event
             */
            MutationEventWrapper.prototype.off = function(eventName, callback)
            {
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
        }());
    }());

    /**
     * Definition of MutationObserver factory object
     */
    (function() {
        /**
         * @var MutationObserver The mutation observer constructor in use
         */
        var ConstructorInUse;
        if (window.MutationObserver !== undefined) { // Mozilla/standard
            ConstructorInUse = window.MutationObserver;
        } else if (window.WebKitMutationObserver !== undefined) { // Chrome <27
            ConstructorInUse = window.WebKitMutationObserver;
        }

        /**
         * Constructor
         */
        MutationObserverFactory = function()
        {
            if (!ConstructorInUse) {
                throw new Error('Your browser does not support mutation observers');
            }
        };

        /**
         * Create a new MutationObserver object
         */
        MutationObserverFactory.prototype.create = function(callback)
        {
            return new ConstructorInUse(callback);
        };
    }());

    /**
     * Definition of public factory object
     */
    (function() {
        var mutationObserverFactory, WrapperInUse, observerSupported, eventsSupported;

        try {
            mutationObserverFactory = new MutationObserverFactory();
            WrapperInUse = MutationObserverWrapper;

            observerSupported = true;
            eventsSupported = Boolean(window.addEventListener);
        } catch (e) {
            observerSupported = false;

            if (window.addEventListener) {
                eventsSupported = true;
                WrapperInUse = MutationEventWrapper;
            } else {
                eventsSupported = false;
            }
        }

        /**
         * Constructor
         */
        DOMChildListMutationListenerFactory = function()
        {
            if (!WrapperInUse) {
                throw new Error('Your browser does not support Child List mutation listeners');
            }
        };

        /**
         * @var {integer} Flag to indicate that the library uses the best available API
         */
        DOMChildListMutationListenerFactory.prototype.LISTENER_TYPE_BEST = DOMChildListMutationListenerFactory.LISTENER_TYPE_BEST = 1;

        /**
         * @var {integer} Flag to indicate that the library always uses mutation observers
         */
        DOMChildListMutationListenerFactory.prototype.LISTENER_TYPE_OBSERVER = DOMChildListMutationListenerFactory.LISTENER_TYPE_OBSERVER = 2;

        /**
         * @var {integer} Flag to indicate that the library always uses mutation events
         */
        DOMChildListMutationListenerFactory.prototype.LISTENER_TYPE_EVENT = DOMChildListMutationListenerFactory.LISTENER_TYPE_EVENT = 3;

        /**
         * Create a new mutation listener object
         *
         * @param {DOMNode} element The node to observe
         * @param {integer} type    Flag to indicate the API that should be used
         */
        DOMChildListMutationListenerFactory.prototype.getListener = function(element, type)
        {
            switch (type) {
                case this.LISTENER_TYPE_OBSERVER:
                    if (!observerSupported) {
                        throw new Error('Your browser does not support mutation observers');
                    }

                    return new MutationObserverWrapper(element, mutationObserverFactory);

                case this.LISTENER_TYPE_EVENT:
                    if (!eventsSupported) {
                        throw new Error('Your browser does not support mutation events');
                    }

                    return new MutationEventWrapper(element);

                default:
                    return new WrapperInUse(element, mutationObserverFactory);
            }
        };
    }());
}());
