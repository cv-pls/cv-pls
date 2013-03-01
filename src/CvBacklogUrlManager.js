/*jslint plusplus: true, white: true, browser: true */
/*global CvPlsHelper */

(function() {
    'use strict';

    /**
     * @var object A map of room ID -> backlog URLs
     */
    var urlMap = {
        "11":    "http://cvbacklog.gordon-oheim.biz/",
        "25318": "https://cv-backlog.pieterhordijk.com/25318/the-closing-room"
    };

    /**
     * Constructor
     *
     * @param CvPlsHelper.ChatRoom chatRoom The owner chat room object
     */
    CvPlsHelper.CvBacklogUrlManager = function(chatRoom)
    {
        this.chatRoom = chatRoom;

        this.callbacks = [];
    };

    /**
     * @var CvPlsHelper.ChatRoom The owner chat room object
     */
    CvPlsHelper.CvBacklogUrlManager.prototype.chatRoom = null;

    /**
     * @var Array List of load event callbacks
     */
    CvPlsHelper.CvBacklogUrlManager.prototype.callbacks = null;

    /**
     * Get the backlog URL based on the current room ID
     *
     * @return string|null The backlog URL, if one is registered for this room
     */
    CvPlsHelper.CvBacklogUrlManager.prototype.getBacklogUrl = function()
    {
        if (this.chatRoom.isLoaded() && urlMap[this.chatRoom.roomId] !== undefined) {
            return urlMap[this.chatRoom.roomId];
        }

        return null;
    };

    /**
     * Register a callback for the chat room's load event
     */
    CvPlsHelper.CvBacklogUrlManager.prototype.onChatRoomLoad = function(callback)
    {
        this.chatRoom.onLoad(callback);
    };
}());