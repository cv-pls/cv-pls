/*jslint plusplus: true, white: true, browser: true */
/*global CvPlsHelper */

/**
 * Represents a post in the chatroom
 */
(function() {
    'use strict';

    /**
     * Get class names of a DOM element
     *
     * @param HTMLElement element The DOM element
     *
     * @return Array The class names of the element
     */
    function getClassNameArray(element)
    {
        var raw, current, result = [];
        if (element && element.className) {
            raw = element.className.split(/\s+/g);
            while (raw.length) {
                current = raw.shift();
                if (current.length && result.indexOf(current) < 0) {
                    result.push(current);
                }
            }
        }
        return result;
    }

    /**
     * Adds a class name to a DOM element
     *
     * @param HTMLElement element The DOM element
     * @param string      string  The class name to add
     */
    function addClass(element, className)
    {
        var classes = getClassNameArray(element);
        if (classes.indexOf(className) < 0) {
            classes.push(className);
            element.className = classes.join(' ');
        }
    }

    /**
     * Tests whether an element has a class name
     *
     * @param HTMLElement element The DOM element
     * @param string      string  The class name to add
     *
     * @return bool True if the element has the class name
     */
    function hasClass(element, className)
    {
        return getClassNameArray(element).indexOf(className) >= 0;
    }

    /**
     * Sets the message ID of the post from the ID of the message element
     */
    function setPostId()
    {
        var messageIdClass = (this.messageElement.getAttribute('id') || '').match(/message-(\d+)/);
        if (messageIdClass) {
            this.postId = parseInt(messageIdClass[1], 10);
        }
    }

    /**
     * Determines whether the post was added by the active user
     */
    function setIsOwnPost()
    {
        if (this.postId && this.messageElement.parentNode && this.messageElement.parentNode.parentNode) {
            this.isOwnPost = hasClass(this.messageElement.parentNode.parentNode, this.chatRoom.activeUserClass);
        }
    }

    /**
     * Parses all tags in the post body into an array
     */
    function loadTags()
    {
        var i, tagElements = this.contentElement.querySelectorAll('a span.ob-post-tag');
        this.tags = {};
        for (i = 0; i < tagElements.length; i++) {
            this.tags[tagElements[i].firstChild.data.toLowerCase()] = tagElements[i];
        }
    }

    /**
     * Determines whether the post contains a close/delete vote request
     */
    function setIsVoteRequest()
    {
        this.isVoteRequest = Boolean(this.matchTag(/^(cv|delv)-(pls|maybe)$/));
        if (this.isVoteRequest) {
            addClass(this.contentElement, 'cvhelper-vote-request');
        }
    }

    /**
     * Sets the vote type of the post and manipulates vote post structure for easy reference later on
     */
    function setVoteType()
    {
        var i, l, voteTag;

        voteTag = this.matchTag(/^(cv|delv)-(pls|maybe)$/);
        this.voteType = this.voteTypes[voteTag.split('-').shift().toUpperCase()];
        this.voteTagElement = this.tags[voteTag];

        if (!this.contentElement.querySelector('span.cvhelper-vote-request-text')) { // Required for strikethrough to work
            this.contentWrapperElement = this.document.createElement('span');
            this.contentWrapperElement.setAttribute('class', 'cvhelper-vote-request-text');
            while (this.contentElement.firstChild) {
                this.contentWrapperElement.appendChild(this.contentElement.removeChild(this.contentElement.firstChild));
            }
            this.contentElement.appendChild(this.contentWrapperElement);
        }
    }

    /**
     * Sets the question ID based on the first question link in the post
     */
    function setQuestionId()
    {
        var questionLinks, i, l, parts;

        questionLinks = this.contentElement.querySelectorAll('a[href^="http://stackoverflow.com/questions/"], a[href^="http://stackoverflow.com/q/"]');

        for (i = 0, l = questionLinks.length; i < l; i++) {
            parts = questionLinks[i].getAttribute('href').match(/^http:\/\/stackoverflow\.com\/q(?:uestions)?\/(\d+)/);
            if (parts) {
                this.questionId = parseInt(parts[1], 10);
                this.questionLinkElement = questionLinks[i];

                addClass(questionLinks[i], 'cvhelper-question-link');
                addQuestionLinkMouseDownHandler.call(this);

                break;
            }
        }

        if (!this.questionId) {
            this.isVoteRequest = false;
            this.voteType = null;
        }
    }

    /**
     * Adds a mousedown event handle to the question link element
     */
    function addQuestionLinkMouseDownHandler()
    {
        var self = this;

        this.questionLinkElement.addEventListener('mousedown', function(e) {
            self.questionLinkMouseDownHandler(e);
        });
    }

    /**
     * Adds a class name to the post on the DOM to indicate that it has been processed
     */
    function markProcessed()
    {
        addClass(this.contentElement, 'cvhelper-processed');
    }

    /**
     * Initialization routine to obtain information about the post from the DOM
     */
    function initPost()
    {
        if (this.contentElement) {
            loadTags.call(this);
            setIsVoteRequest.call(this);
            if (this.isVoteRequest) {
                setVoteType.call(this);
                setQuestionId.call(this);
            }
            markProcessed.call(this);
        }
    }

    /**
     * Get references to useful DOM elements that relate to the post
     *
     * @param HTMLElement messageElement The post message container element
     */
    function setPostElements(messageElement)
    {
        this.messageElement = messageElement;
        this.contentElement = messageElement.querySelector('div.content');
        this.animator = this.animatorFactory.create(messageElement);
        if (messageElement.parentNode) {
            this.messagesElement = messageElement.parentNode;

            try { // quick fix for transcript
                this.tinySignatureElement = this.messagesElement.parentNode.firstChild.firstChild;
                this.avatar32Element = this.tinySignatureElement.nextSibling;
                this.usernameElement = this.avatar32Element.nextSibling;
                this.flairElement = this.usernameElement.nextSibling;
                this.hasModifyableSignature = true;
            } catch (e) {}
        }
    }

    /**
     * Mark the post as having an oustanding notification and add an avatar notification
     *
     * @param int type The type of notification (cv/delv)
     */
    function notify(type)
    {
        if (!(this.notificationHistory & type)) {
            this.avatarNotificationManager.enqueue(this);
            this.notificationHistory |= type;
            this.hasPendingNotification = true;
        }
    }

    /**
     * Mark the vote request as complete
     */
    function markCompleted()
    {
        this.isOutstandingRequest = false;
        if (this.pluginSettings.getSetting('removeCompletedNotifications')) {
            this.avatarNotificationManager.dequeue(this);
        }
        if (this.pluginSettings.getSetting('removeCompletedOneboxes')) {
            this.removeOneBox();
        }
        if (this.pluginSettings.getSetting('strikethroughCompleted')) {
            this.strikethrough();
        }
    }

    /**
     * Manage oneboxing, notification and display
     *
     * Called when the vote request target enters the open state
     */
    function enterStateOpen()
    {
        this.questionStatus = this.questionStatuses.OPEN;

        if (this.voteType === this.voteTypes.DELV && !this.isOwnPost) {
            this.voteTagElement.firstChild.data = this.voteTagElement.firstChild.data.replace('delv-', 'cv-');
        }

        if (!isOneboxIgnored.call(this)) {
            this.addOneBox();
        }
        if (!isNotifyIgnored.call(this)) {
            notify.call(this, this.voteTypes.CV);
        }

        if (needsVisitedLabel.call(this)) {
            addVisitedLabel.call(this);
        }
    }

    /**
     * Manage oneboxing, notification and display
     *
     * Called when the vote request target enters the closed state
     */
    function enterStateClosed()
    {
        this.questionStatus = this.questionStatuses.CLOSED;
        if (this.voteType === this.voteTypes.DELV) {
            this.voteTagElement.firstChild.data = this.voteTagElement.firstChild.data.replace('cv-', 'delv-');

            if (!isOneboxIgnored.call(this)) {
                this.addOneBox();
            }
            if (!isNotifyIgnored.call(this)) {
                notify.call(this, this.voteTypes.DELV);
            }
        } else {
            markCompleted.call(this);
        }

        if (needsVisitedLabel.call(this)) {
            addVisitedLabel.call(this);
        }
    }

    /**
     * Manage oneboxing, notification and display
     *
     * Called when the vote request target enters the deleted state
     */
    function enterStateDeleted()
    {
        this.questionStatus = this.questionStatuses.DELETED;

        if (!this.hasQuestionData) {
            if (!this.pluginSettings.getSetting('removeCompletedOneboxes') && !isOneboxIgnored.call(this)) {
                this.addOneBox();
            }
            if (!this.pluginSettings.getSetting('removeCompletedNotifications') && !isNotifyIgnored.call(this)) {
                notify.call(this, this.voteType);
            }
        }

        markCompleted.call(this);

        if (needsVisitedLabel.call(this)) {
            addVisitedLabel.call(this);
        }
    }

    /**
     * Determine whether the post should be ignored for oneboxing
     *
     * @return bool True if the post should not be oneboxed
     */
    function isOneboxIgnored()
    {
        if (isVisited.call(this)) {
            return this.pluginSettings.getSetting('ignoreOneboxClickedPosts');
        }

        return false;
    }

    /**
     * Determine whether the post should be ignored for notifications
     *
     * @return bool True if the post should not raise notifications
     */
    function isNotifyIgnored()
    {
        if (isVisited.call(this)) {
            return this.pluginSettings.getSetting('ignoreNotifyClickedPosts');
        }

        return false;
    }

    /**
     * Determine whether the post needs to have a visited tag added
     *
     * @return bool True if the post should have a visited tag added
     */
    function needsVisitedLabel()
    {
        if (isVisited.call(this)) {
            return this.pluginSettings.getSetting('addVisitedLabelToClickedPosts');
        }

        return false;
    }

    /**
     * Prepend a "visited" label to the post content
     */
    function addVisitedLabel()
    {
        if (!this.hasVisitedLabel) {
            addLabelToContent.call(this, 'visited', '#008B00', '#B4EEB4');
            this.hasVisitedLabel = true;
        }
    }

    /**
     * Determine whether the post link has been previously visited by the user
     *
     * @return bool True if the post link has been previously visted by the user
     */
    function isVisited()
    {
        return this.clickTracker.isVisited(this.postId);
    }

    /**
     * Mark the post link as previously visited by the user
     */
    function markVisited()
    {
        var self = this;

        this.clickTracker.markVisited(this.postId);

        if (this.pluginSettings.getSetting('addVisitedLabelToClickedPosts')) {
            setTimeout(function() {
                addVisitedLabel.call(self);
            }, 1000);
        }
    }

    /**
     * Update the displayed data in a onebox
     *
     * Called after an API poll
     */
    function updateOneBoxDisplay()
    {
        if (this.oneBox) {
            if (this.questionData) {
                this.oneBox.setScore(this.questionData.score);
            }
            if (this.pluginSettings.getSetting('showCloseStatus')) {
                switch (this.questionStatus) {
                    case this.questionStatuses.CLOSED:
                        this.oneBox.setStatusText('closed');
                        break;
                    case this.questionStatuses.DELETED:
                        this.oneBox.setStatusText('deleted');
                        break;
                }
            }
        }
    }

    /**
     * Prepend a label to the post content
     *
     * @param string text      The label text
     * @param string foreColor Color for text and border
     * @param string backColor Color for background
     */
    function addLabelToContent(text, foreColor, backColor)
    {
        var labelEl, spacer;

        labelEl = this.document.createElement('span');

        labelEl.className = 'ob-post-tag';
        labelEl.setAttribute('style', '-webkit-border-radius: 5px; -moz-border-radius: 5px; border-radius: 5px;');
        labelEl.style.color = foreColor;
        labelEl.style.borderColor = foreColor;
        labelEl.style.backgroundColor = backColor;
        labelEl.style.borderStyle = 'solid';

        labelEl.appendChild(this.document.createTextNode(text));

        spacer = this.document.createTextNode(' ')

        this.contentElement.insertBefore(spacer, this.contentElement.firstChild);
        this.contentElement.insertBefore(labelEl, this.contentElement.firstChild);
    }

    /**
     * Show the tiny-style signature
     */
    function showSignatureTiny()
    {
        this.avatar32Element.style.display = 'none';
        this.usernameElement.style.display = 'none';
        this.flairElement.style.display = 'none';
        this.tinySignatureElement.style.display = 'block';
    }

    /**
     * Show the medium-style signature
     */
    function showSignatureMedium()
    {
        this.avatar32Element.style.display = 'block';
        this.usernameElement.style.display = 'block';
        this.flairElement.style.display = 'none';
        this.tinySignatureElement.style.display = 'none';
    }

    /**
     * Show the large-style signature
     */
    function showSignatureLarge()
    {
        this.avatar32Element.style.display = 'block';
        this.usernameElement.style.display = 'block';
        this.flairElement.style.display = 'block';
        this.tinySignatureElement.style.display = 'none';
    }

    /**
     * Constructor
     *
     * @param HTMLDocument                          document                  The DOM document upon which the post resides
     * @param object                                pluginSettings            XBuilder settings module
     * @param CvPlsHelper.ChatRoom                  chatRoom                  The chatroom object to which the post belongs
     * @param CvPlsHelper.OneBoxFactory             oneBoxFactory             Factory for making OneBoxes
     * @param CvPlsHelper.AvatarNotificationManager avatarNotificationManager Avatar notification manager object
     * @param CvPlsHelper.AnimatorFactory           animatorFactory           Factory for making animators
     * @param CvPlsHelper.ClickTracker              clickTracker              Tracks previously visited vote request links
     * @param HTMLElement                           messageElement            The post message container element
     */
    CvPlsHelper.Post = function(
        document, pluginSettings, chatRoom, oneBoxFactory, avatarNotificationManager,
        animatorFactory, clickTracker, messageElement
    ) {
        this.document = document;
        this.pluginSettings = pluginSettings;
        this.chatRoom = chatRoom;
        this.oneBoxFactory = oneBoxFactory;
        this.avatarNotificationManager = avatarNotificationManager;
        this.animatorFactory = animatorFactory;
        this.clickTracker = clickTracker;
        setPostElements.call(this, messageElement);

        // These are outside initPost to avoid over-processing a replacement element
        setPostId.call(this);
        setIsOwnPost.call(this);

        initPost.call(this);
    };

    /**
     * Enum of possible vote types
     */
    CvPlsHelper.Post.voteTypes = CvPlsHelper.Post.prototype.voteTypes = {
        ROV:    1,
        CV:     2,
        DELV: 4
    };

    /**
     * Enum of question statuses
     */
    CvPlsHelper.Post.questionStatuses = CvPlsHelper.Post.prototype.questionStatuses = {
        UNKNOWN: 0,
        OPEN:        1,
        CLOSED:    2,
        DELETED: 4
    };

    /**
     * @var HTMLElement The post content element
     */
    CvPlsHelper.Post.prototype.contentElement = null;

    /**
     * @var HTMLElement The post message container element
     */
    CvPlsHelper.Post.prototype.messageElement = null;

    /**
     * @var HTMLElement The post messages container element
     */
    CvPlsHelper.Post.prototype.messagesElement = null;

    /**
     * @var HTMLElement The post tiny signature element
     */
    CvPlsHelper.Post.prototype.tinySignatureElement = null;

    /**
     * @var HTMLElement The post 32px avatar element
     */
    CvPlsHelper.Post.prototype.avatar32Element = null;

    /**
     * @var HTMLElement The post username element
     */
    CvPlsHelper.Post.prototype.usernameElement = null;

    /**
     * @var HTMLElement The post flair (Rep) element
     */
    CvPlsHelper.Post.prototype.flairElement = null;

    /**
     * @var HTMLElement The post content wrapper element - created to make strikethrough play nice
     */
    CvPlsHelper.Post.prototype.contentWrapperElement = null;

    /**
     * @var HTMLElement The anchor that links to the vote request target question
     */
    CvPlsHelper.Post.prototype.questionLinkElement = null;

    /**
     * @var HTMLElement The tag element that identifies the vote request type
     */
    CvPlsHelper.Post.prototype.voteTagElement = null;

    /**
     * @var CvPlsHelper.OneBox The post's OneBox object
     */
    CvPlsHelper.Post.prototype.oneBox = null;

    /**
     * @var object The post's animation handler object
     */
    CvPlsHelper.Post.prototype.animator = null;

    /**
     * @var CvPlsHelper.ClickTracker Tracks previously visited vote request links
     */
    CvPlsHelper.Post.prototype.clickTracker = null;

    /**
     * @var int The SE ID of the post
     */
    CvPlsHelper.Post.prototype.postId = null;

    /**
     * @var int The SE ID of the target question
     */
    CvPlsHelper.Post.prototype.questionId = null;

    /**
     * @var bool Whether the question data has been retrieved from the SE API
     */
    CvPlsHelper.Post.prototype.hasQuestionData = false;

    /**
     * @var object The question data object (may be null for delete questions)
     */
    CvPlsHelper.Post.prototype.questionData = null;

    /**
     * @var int One of the questionStatuses enum values
     */
    CvPlsHelper.Post.prototype.questionStatus = 0;

    /**
     * @var int One of the voteTypes enum values
     */
    CvPlsHelper.Post.prototype.voteType = null;

    /**
     * @var int Unknown property, probably a left over from an earlier version
     *
     * TODO: [investigate-and-burninate-pls]
     */
    CvPlsHelper.Post.prototype.postType = 0;

    /**
     * @var bool Whether the post contains a vote request
     */
    CvPlsHelper.Post.prototype.isVoteRequest = false;

    /**
     * @var bool Whether the vote request has been completed
     */
    CvPlsHelper.Post.prototype.isOutstandingRequest = true;

    /**
     * @var bool Whether the post was created by the current user
     */
    CvPlsHelper.Post.prototype.isOwnPost = false;

    /**
     * @var bool Whether the post is still on the DOM
     */
    CvPlsHelper.Post.prototype.isOnScreen = true;

    /**
     * @var int A bitmask of values from the voteTypes enum, indicating which stages of the process have been notified
     */
    CvPlsHelper.Post.prototype.notificationHistory = 0;

    /**
     * @var bool Whether the post has an outstanding notification
     */
    CvPlsHelper.Post.prototype.hasPendingNotification = false;

    /**
     * @var bool Whether the post has a "visited" label
     */
    CvPlsHelper.Post.prototype.hasVisitedLabel = false;

    /**
     * @var bool Whether the post signature can be modified
     */
    CvPlsHelper.Post.prototype.hasModifyableSignature = false;

    /**
     * Matches tags against the given expr and returns the first match
     *
     * @param string|RegExp expr The expression to match
     *
     * @return HTMLElement|null The matching tag element or null if no match found
     */
    CvPlsHelper.Post.prototype.matchTag = function(expr)
    {
        var propName, matches, result = null;
        if (typeof expr === 'string' && this.tags[String(expr).toLowerCase()] !== undefined) {
            result = expr;
        } else if (expr instanceof RegExp) {
            for (propName in this.tags) {
                if (this.tags.hasOwnProperty(propName)) {
                    matches = String(propName).match(expr);
                    if (matches) {
                        result = matches[0];
                        break;
                    }
                }
            }
        }
        return result;
    };

    /**
     * Replaces the internal element set with different elements
     * Useful for posts that have been edited
     *
     * @param HTMLElement newNode          The new message container element
     * @param bool        isSameQuestionId If true keep the old onebox element
     */
    CvPlsHelper.Post.prototype.replaceElement = function(newNode, isSameQuestionId)
    {
        isSameQuestionId = isSameQuestionId || false;

        this.isVoteRequest = this.voteType = this.questionId = null;
        setPostElements.call(this, newNode);

        if (isSameQuestionId) {
            if (this.oneBox) {
                this.oneBox.refreshDisplay(this.contentElement);
            }
        } else {
            this.questionData = this.oneBox = null;
        }

        initPost.call(this);
    };

    /**
     * Set the data response object from the SE API
     *
     * @param object data The data response from the SE API
     */
    CvPlsHelper.Post.prototype.setQuestionData = function(data)
    {
        this.questionData = data;

        if (!data) {
            if (this.questionStatus !== this.questionStatuses.DELETED) {
                enterStateDeleted.call(this);
            }
        } else if (data.closed_date !== undefined) {
            if (this.questionStatus !== this.questionStatuses.CLOSED) {
                enterStateClosed.call(this);
            }
        } else {
            if (this.questionStatus !== this.questionStatuses.OPEN) {
                enterStateOpen.call(this);
            }
        }

        this.hasQuestionData = true;
        updateOneBoxDisplay.call(this);
    };

    /**
     * Strike through the post content
     */
    CvPlsHelper.Post.prototype.strikethrough = function()
    {
        this.contentWrapperElement.style.textDecoration = 'line-through';
        this.contentWrapperElement.style.color = '#222';
    };

    /**
     * Add a onebox to the post
     */
    CvPlsHelper.Post.prototype.addOneBox = function()
    {
        if (!this.oneBox && !this.isOwnPost && this.questionData && this.pluginSettings.getSetting('oneBox')) {
            this.oneBox = this.oneBoxFactory.create(this);
            this.oneBox.show();
            this.updateSignatureDisplay();
        }
    };

    /**
     * Update the displayed signature to the appropriate size
     *
     * Logic taken from the SE code
     */
    CvPlsHelper.Post.prototype.updateSignatureDisplay = function()
    {
        var messagesHeight;

        if (this.hasModifyableSignature) {
            messagesHeight = parseInt(this.document.defaultView.getComputedStyle(this.messagesElement).getPropertyValue('height'));

            if (messagesHeight <= 48) {
                showSignatureTiny.call(this);
            } else if (messagesHeight <= 61) {
                showSignatureMedium.call(this);
            } else {
                showSignatureLarge.call(this);
            }
        }
    };

    /**
     * Remove the onebox from the post
     */
    CvPlsHelper.Post.prototype.removeOneBox = function()
    {
        if (this.oneBox) {
            this.oneBox.hide();
            this.updateSignatureDisplay();
        }
    };

    /**
     * Handle the mousedown event on links to the target question
     *
     * @param Event e The event object
     */
    CvPlsHelper.Post.prototype.questionLinkMouseDownHandler = function(e)
    {
        var self = this;

        // Temporary fix for right click "bug"
        // TODO: implement this in a better way
        //if (e.button === 0 || e.button === 1) {
            this.avatarNotificationManager.dequeue(this);

            if (this.pluginSettings.getSetting('removeClickedOneboxes')) {
                setTimeout(function() {
                    self.removeOneBox();
                }, 1000);
            }

            markVisited.call(this);
        //}
    };

    /**
     * Scroll the window to the bring the post into the current view
     */
    CvPlsHelper.Post.prototype.scrollTo = function()
    {
        var originalBackgroundColor, scrollEnd, scrollTarget, rgbEnd, rgbDiff;

        function parseRGB(value)
        {
            var parts, result = {};
            parts = value.match(/^#([0-9a-f]{2})([0-9a-f]{2})([0-9a-f]{2})$/i);
            if (parts) {
                result.r = parseInt(parts[1], 16);
                result.g = parseInt(parts[2], 16);
                result.b = parseInt(parts[3], 16);
                return result;
            }
            parts = value.match(/^\s*rgba?\s*\(\s*([0-9]{1,3})\s*,\s*([0-9]{1,3})\s*,\s*([0-9]{1,3})\s*(?:,\s*([0-9]{1,3})\s*)?\)\s*$/i);
            if (parts) {
                result.r = parseInt(parts[1], 10);
                result.g = parseInt(parts[2], 10);
                result.b = parseInt(parts[3], 10);
                return result;
            }
        }

        if (this.isOnScreen) {
            scrollEnd = this.messageElement.offsetTop;
            scrollTarget = this.document.defaultView;
            originalBackgroundColor = this.document.defaultView.getComputedStyle(this.messagesElement, null).getPropertyValue('background-color');

            rgbEnd = parseRGB(originalBackgroundColor);
            rgbDiff = {
                r: rgbEnd.r - 255,
                g: rgbEnd.g - 255,
                b: rgbEnd.b
            };

            this.messageElement.style.backgroundColor = '#FFFF00';
            this.animator.animate({
                startValue: scrollTarget.scrollY,
                endValue: scrollEnd,
                totalTime: 500,
                frameFunc: function(newValue, animation) {
                    scrollTarget.scroll(scrollTarget.scrollX, newValue);
                },
                easing: 'decel',
                complete: function() {
                    this.animate({
                        startValue: 0,
                        endValue: 1,
                        totalTime: 5000,
                        frameFunc: function(newValue, animation) {
                            var r, g, b;
                            r = 255 + Math.floor(newValue * rgbDiff.r);
                            g = 255 + Math.floor(newValue * rgbDiff.g);
                            b = Math.floor(newValue * rgbDiff.b);
                            this.style.backgroundColor = 'rgb('+r+', '+g+', '+b+')';
                        }
                    });
                }
            });
        } else {
            window.open('http://chat.stackoverflow.com/transcript/message/' + this.postId + '#' + this.postId, '_blank');
        }
    };
}());