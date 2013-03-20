/*jslint plusplus: true, white: true, browser: true */
/*global CvPlsHelper */

/**
 * Listens for new posts added to/removed from the DOM and queues/dequeues them if they contain vote requests
 */
(function() {

    'use strict';

    /**
     * Get classes of element as array
     *
     * @param {HTMLElement} element The element who's class names should be retrieved
     *
     * @return Array Ordered list of the element's class names
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
     * Check if element is a new or edited post
     *
     * @param {HTMLElement} element The element to check
     *
     * @return {boolean} Whether the element is a new or edited post
     */
    function isNewOrEditedMessage(element)
    {
        var classes = getClassNameArray(element);
        return classes.indexOf('message') > -1 && classes.indexOf('neworedit') > -1;
    }

    /**
     * Check if element is a monologue
     *
     * @param {HTMLElement} element The element to check
     *
     * @return {boolean} Whether the element is a monologue
     */
    function isMonologue(element)
    {
        var classes = getClassNameArray(element);
        return classes.indexOf('monologue') > -1;
    }

    /**
     * Check if element is a message being removed from the DOM
     *
     * @param {HTMLElement} element The element to check
     *
     * @return {boolean} Whether the element is a message being removed from the DOM
     */
    function isRemovedMessage(element)
    {
        var classes = getClassNameArray(element);
        return classes.indexOf('message') > -1 && classes.indexOf('posted') < 0;
    }

    /**
     * Check if element is a deleted post
     *
     * @param {HTMLElement} element The element to check
     *
     * @return {boolean} Whether the element is a deleted post
     */
    function isDeletedPost(element)
    {
        return Boolean(element.querySelector('span.deleted'));
    }

    /**
     * Get the numeric part of the ID of a message element
     *
     * @param {HTMLElement} element The element to inspect
     *
     * @return {integer} The numeric part of the message ID
     */
    function getMessageId(element)
    {
        var result, id = element.getAttribute('id').match(/^message-(\d+)$/i);
        result = id ? parseInt(id[1], 10) : 0;

        return result;
    }

    /**
     * Process the postsOnScreen collection
     */
    function processQueue()
    {
        this.queueProcessPending = false;
        this.questionStatusPoller.poll();
    }

    /**
     * Schedule processQueue action
     */
    function scheduleQueueProcess()
    {
        var self = this;

        if (!this.queueProcessPending) {
            setTimeout(function() {
                processQueue.call(self);
            }, 0);

            this.queueProcessPending = true;
        }
    }

    /**
     * Event listener for NodeAdded event
     *
     * @param {DOMNode} node The node that was added to the DOM
     */
    function nodeAddedListener(node)
    {
        var existingPost, newPost = this.postFactory.create(node);

        if (newPost.isVoteRequest) {
            existingPost = this.postsOnScreen.query(function(post) {
                return post.hasQuestionData && post.questionId === newPost.questionId;
            }).shift();

            if (existingPost) {
                newPost.setQuestionData(existingPost.questionData);
            } else {
                scheduleQueueProcess.call(this);
            }
            this.postsOnScreen.push(newPost);
        }
    }

    /**
     * Event listener for NodeRemoved event
     *
     * @param {DOMNode} node The node that was removed from the DOM
     */
    function nodeRemovedListener(node)
    {
        var post, postId = getMessageId(node);

        post = this.postsOnScreen.match('postId', postId);
        if (post) {
            post.isOnScreen = false;
            this.postsOnScreen.remove(post);
            this.voteRemoveProcessor.removeLost(post);
        }
    }

    /**
     * Event listener for NodeReplaced event
     *
     * @param {DOMNode} oldNode The node that was removed from the DOM
     * @param {DOMNode} newNode The replacement node that was added to the DOM
     */
    function nodeReplacedListener(oldNode, newNode)
    {
        var self = this,
            postId = getMessageId(oldNode),
            newPost = this.postFactory.create(newNode),
            oldPost = this.postsOnScreen.match('postId', postId),
            existingQuestionPost;

        if (oldPost) {
            if (!newPost.isVoteRequest) {
                this.postsOnScreen.remove(oldPost);
                this.voteRemoveProcessor.remove(oldPost);
            } else if (newPost.questionId === oldPost.questionId) {
                oldPost.replaceElement(newNode, true);
            } else {
                existingQuestionPost = this.postsOnScreen.query(function(post) {
                    return post.hasQuestionData && post.questionId === newPost.questionId;
                }).shift();

                oldPost.replaceElement(newNode, false);
                if (existingQuestionPost) {
                    oldPost.setQuestionData(existingQuestionPost.questionData);
                } else {
                    scheduleQueueProcess.call(this);
                }
            }
        } else if (newPost.isVoteRequest) {
            existingQuestionPost = this.postsOnScreen.query(function(post) {
                return post.hasQuestionData && post.questionId === newPost.questionId;
            }).shift();

            if (existingQuestionPost) {
                newPost.setQuestionData(existingQuestionPost.questionData);
            } else {
                scheduleQueueProcess.call(this);
            }

            this.postsOnScreen.push(newPost);
        }
    }

    /**
     * Register the mutation event listeners
     */
    function registerEventListeners()
    {
        var listener = this.mutationListenerFactory.getListener(this.chatRoom.chatContainer);

        listener.on('FilterAdded', function(node) {
            var messages, i, l, result = [];

            if (isNewOrEditedMessage(node)) {
                return true;
            } else if (isMonologue(node)) {
                messages = node.querySelectorAll('.messages .message');

                for (i = 0, l = messages.length; i < l; i++) {
                    if (messages[i].className.split(/\s+/).indexOf('neworedit') < 0) {
                        result.push(messages[i]);
                    }
                }

                if (result.length > 0) {
                    return result;
                }
            }

            return false;
        });
        listener.on('FilterRemoved', function(node) {
            return isRemovedMessage(node);
        });
        listener.on('FilterReplaced', function(oldNode, newNode) {
            return isNewOrEditedMessage(newNode);
        });
        listener.on('FilterCompare', function(node1, node2) {
            return node1.id === node2.id;
        });

        listener.on('NodeAdded', nodeAddedListener.bind(this));
        listener.on('NodeRemoved', nodeRemovedListener.bind(this));
        listener.on('NodeReplaced', nodeReplacedListener.bind(this));
    }

    /**
     * Process all existing messages on the DOM - fired on room load
     */
    function processAllPosts()
    {
        var posts, i, l;

        posts = this.chatRoom.chatContainer.querySelectorAll('div.message:not(.pending)');

        for (i = 0, l = posts.length; i < l; i++) {
            nodeAddedListener.call(this, posts[i]);
        }
    }

    /**
     * Constructor
     *
     * @param {CvPlsHelper.ChatRoom}             chatRoom                The chat room object
     * @param {object}                           mutationListenerFactory Factory which makes mutation listener objects
     * @param {CvPlsHelper.PostFactory}          postFactory             Factory which makes Post objects
     * @param {CvPlsHelper.Collection}           postsOnScreen           Collection which holds all posts on screen
     * @param {CvPlsHelper.VoteRemoveProcessor}  voteRemoveProcessor     Object which removes vote requests from the notification queues
     * @param {CvPlsHelper.QuestionStatusPoller} questionStatusPoller    Object which controls the StackExchange API communication
     */
    CvPlsHelper.VoteRequestListener = function(chatRoom, mutationListenerFactory, postFactory, postsOnScreen, voteRemoveProcessor, questionStatusPoller)
    {
        this.chatRoom = chatRoom;
        this.mutationListenerFactory = mutationListenerFactory;
        this.postFactory = postFactory;
        this.postsOnScreen = postsOnScreen;
        this.voteRemoveProcessor = voteRemoveProcessor;
        this.questionStatusPoller = questionStatusPoller;
    };

    /**
     * @var {CvPlsHelper.ChatRoom} The chat room object
     */
    CvPlsHelper.VoteRequestListener.prototype.chatRoom = null;

    /**
     * @var {object} Factory which makes mutation listener objects
     */
    CvPlsHelper.VoteRequestListener.prototype.mutationListenerFactory = null;

    /**
     * @var {CvPlsHelper.PostFactory} Factory which makes Post objects
     */
    CvPlsHelper.VoteRequestListener.prototype.postFactory = null;

    /**
     * @var {CvPlsHelper.Collection} Collection which holds all posts on screen
     */
    CvPlsHelper.VoteRequestListener.prototype.postsOnScreen = null;

    /**
     * @var {CvPlsHelper.VoteRemoveProcessor} Object which removes vote requests from the notification queues
     */
    CvPlsHelper.VoteRequestListener.prototype.voteRemoveProcessor = null;

    /**
     * @var {CvPlsHelper.QuestionStatusPoller} Object which controls the StackExchange API communication
     */
    CvPlsHelper.VoteRequestListener.prototype.questionStatusPoller = null;

    /**
     * @var {boolean} Whether a processQueue operation is pending
     */
    CvPlsHelper.VoteRequestListener.prototype.queueProcessPending = false;

    /**
     * Start the background processes
     */
    CvPlsHelper.VoteRequestListener.prototype.start = function()
    {
        this.chatRoom.onLoad(function() {
            registerEventListeners.call(this);
            processAllPosts.call(this);
        }.bind(this));
    };

    /**
     * Stop the background processes
     */
    CvPlsHelper.VoteRequestListener.prototype.stop = function()
    {
        // Might need to do something here, not sure
    };
}());