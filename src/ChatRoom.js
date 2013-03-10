/*jslint plusplus: true, white: true, browser: true */
/*global CvPlsHelper */

(function() {
    'use strict';

    /**
     * Set the room status as loaded and fire load event callbacks
     */
    function setRoomLoaded()
    {
        this.loaded = true;

        getActiveUserClass.call(this);
        getRoomId.call(this);

        stopListener.call(this);
        while (this.callbacks.length) {
            this.callbacks.shift().call();
        }
    }

    /**
     * Get the classname used for the active user's posts from the DOM
     */
    function getActiveUserClass()
    {
        this.chatContainer = this.document.getElementById('chat');
        if (this.chatContainer) {
            this.activeUserClass = this.document.getElementById('active-user').className.match(/user-\d+/)[0];
        } else {
            this.chatContainer = this.document.getElementById('transcript');
            this.activeUserClass = 'user-' + // Ugh, do something about this please
                this.document.head
                    .children[this.document.head.children.length - 1]
                        .firstChild.data
                            .match(/initTranscript\s*\([^,]+,\s*(\d+)/)[1];
        }
    }

    /**
     * Get the room ID from the DOM
     */
    function getRoomId()
    {
        this.roomId = parseInt(this.document.querySelector('a.button[href^="/transcript/"]').getAttribute('href').match(/transcript\/(\d+)/)[1]);
    }

    /**
     * Callback for the mutation listener
     *
     * @param HTMLElement node The HTML element that was removed from the DOM
     */
    function mutationListenerCallback(node)
    {
        if (node.getAttribute && node.getAttribute('id') === 'loading') {
            setRoomLoaded.call(this);
        }
    }

    /**
     * Start the mutation listener
     */
    function startListener()
    {
        if (this.mutationListener && !this.mutationListener.isListening()) {
            this.mutationListener.on('NodeRemoved', mutationListenerCallback.bind(this));
        }
    }

    /**
     * Stop the mutation listener
     */
    function stopListener()
    {
        if (this.mutationListener.isListening()) {
            this.mutationListener.off('NodeRemoved');
            this.mutationListener = null;
        }
    }

    /**
     * Check the loaded status of the room
     */
    function checkRoomStatus()
    {
        if (!this.loaded) {
            if (this.document.getElementById('loading')) {
                startListener.call(this);
            } else {
                setRoomLoaded.call(this);
            }
        }
    }

    /**
     * Constructor
     *
     * @param {HTMLDocument} document                The document object on which the room resides
     * @param {object}       mutationListenerFactory XBuilder mutation listener module
     */
    CvPlsHelper.ChatRoom = function(document, mutationListenerFactory)
    {
        this.document = document;
        this.mutationListener = mutationListenerFactory.getListener(this.document.body);

        this.callbacks = [];
    };

    /**
     * @var Array List of load event callbacks
     */
    CvPlsHelper.ChatRoom.prototype.callbacks = null;

    /**
     * @var bool Whether the room is loaded
     */
    CvPlsHelper.ChatRoom.prototype.loaded = false;

    /**
     * @var HTMLDivElement The main container element for chat
     */
    CvPlsHelper.ChatRoom.prototype.chatContainer = null;

    /**
     * @var string The classname used for the active user's posts
     */
    CvPlsHelper.ChatRoom.prototype.activeUserClass = null;

    /**
     * @var int The ID of the chat room
     */
    CvPlsHelper.ChatRoom.prototype.roomId = null;

    /**
     * Determine whether the room is loader
     *
     * @return bool Whether the room is loaded
     */
    CvPlsHelper.ChatRoom.prototype.isLoaded = function()
    {
        if (!this.loaded) {
            checkRoomStatus.call(this);
        }

        return this.loaded;
    };

    /**
     * Register a callback for the load event
     */
    CvPlsHelper.ChatRoom.prototype.onLoad = function(callback)
    {
        if (this.isLoaded()) {
            callback.call();
        } else {
            this.callbacks.push(callback);
        }
    };
}());