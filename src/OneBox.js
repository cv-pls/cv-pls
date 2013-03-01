/*jslint plusplus: true, white: true, browser: true */
/*global CvPlsHelper */

/**
 * Represents a OneBox attached to a vote request post
 *
 * TODO: use more el.style properties and less inline style attributes
 */
(function() {
    'use strict';

    /**
     * Fetch the computed value of a style property declaration for an element
     *
     * @param HTMLElement element  The DOM element to inspect
     * @param string      property The name of the style property to fetch
     *
     * @return string The current value of the style property
     */
    function getCurrentStyle(element, property)
    {
        return element.ownerDocument.defaultView.getComputedStyle(element, null).getPropertyValue(property);
    }

    /**
     * Create the question score display element
     *
     * @return HTMLDivElement The created element
     */
    function getQuestionScore()
    {
        var voteDisplay = this.document.createElement('div');
        voteDisplay.setAttribute('class', 'ob-post-votes');
        voteDisplay.setAttribute('title', 'This question has a score of ' + this.post.questionData.score);

        this.scoreTextNode = this.document.createTextNode(this.post.questionData.score);
        voteDisplay.appendChild(this.scoreTextNode);

        return voteDisplay;
    }

    /**
     * Create the site icon image element
     *
     * @return HTMLImageElement The created element
     */
    function getSiteIcon()
    {
        var siteIcon = this.document.createElement('img');
        siteIcon.setAttribute('class', 'ob-post-siteicon');
        siteIcon.setAttribute('width', '20');
        siteIcon.setAttribute('height', '20');
        siteIcon.setAttribute('src', 'http://sstatic.net/stackoverflow/img/apple-touch-icon.png');
        siteIcon.setAttribute('title', 'Stack Overflow');

        return siteIcon;
    }

    /**
     * Create the question title anchor element
     *
     * @return HTMLAnchorElement The created element
     */
    function getPostTitleAnchor()
    {
        var postTitleAnchor,
            avatarNotification = this.avatarNotification,
            post = this.post;

        postTitleAnchor = this.document.createElement('a');
        postTitleAnchor.setAttribute('href', this.post.questionData.link);
        postTitleAnchor.setAttribute('class', 'cvhelper-question-link');
        postTitleAnchor.setAttribute('style', 'color: #0077CC;');
        postTitleAnchor.addEventListener('mousedown', function(e) {
            post.questionLinkMouseDownHandler(e);
        });
        postTitleAnchor.innerHTML = this.post.questionData.title;

        this.statusTextNode = this.document.createTextNode('');
        postTitleAnchor.appendChild(this.statusTextNode);

        return postTitleAnchor;
    }

    /**
     * Create the question title container element
     *
     * @return HTMLDivElement The created element
     */
    function getPostTitle()
    {
        var postTitle = this.document.createElement('div');
        postTitle.setAttribute('class', 'ob-post-title');
        postTitle.appendChild(this.document.createTextNode('Q: '));
        postTitle.appendChild(getPostTitleAnchor.call(this));

        return postTitle;
    }

    /**
     * Create the question owner avatar element
     *
     * @return HTMLAnchorElement The created element
     */
    function getPostAvatar()
    {
        var postAvatarImg, postAvatarA;

        postAvatarA = this.document.createElement('a');
        postAvatarA.setAttribute('href', this.post.questionData.owner.link);

        postAvatarImg = postAvatarA.appendChild(this.document.createElement('img'));
        postAvatarImg.setAttribute('class', 'user-gravatar32');
        postAvatarImg.style.width = '32px';
        postAvatarImg.style.height = '32px';
        postAvatarImg.setAttribute('src', this.post.questionData.owner.profile_image);
        postAvatarImg.setAttribute('title', this.post.questionData.owner.display_name + ' (' + this.post.questionData.owner.reputation + ')');
        postAvatarImg.setAttribute('alt', this.post.questionData.owner.display_name + ' (' + this.post.questionData.owner.reputation + ')');

        return postAvatarA;
    }

    /**
     * Create the post body container element
     *
     * @return HTMLParagraphElement The created element
     */
    function getPostBody()
    {
        var postBody = this.document.createElement('p');
        postBody.setAttribute('class', 'ob-post-body');

        // What follows is nasty, but it is the least nasty thing I can come up with. Gloss over it and move on.
        postBody.innerHTML = this.post.questionData.body;
        postBody.insertBefore(getPostAvatar.call(this), postBody.firstChild);

        return postBody;
    }

    /**
     * Create a post tag element from a string tag name
     *
     * @param string tag The tag name
     *
     * @return HTMLSpanElement The created element
     */
    function getPostTag(tag)
    {
        var span, anchor;

        span = this.document.createElement('span');
        span.setAttribute('class', 'ob-post-tag');
        span.setAttribute('style', 'background-color: #E0EAF1; color: #3E6D8E; border-color: #3E6D8E; border-style: solid; margin-right: 6px;');
        span.appendChild(this.document.createTextNode(tag));

        anchor = this.document.createElement('a');
        anchor.setAttribute('href', 'http://stackoverflow.com/questions/tagged/' + encodeURIComponent(tag));
        anchor.appendChild(span);

        return anchor;
    }

    /**
     * Create the post tags container element
     *
     * @return HTMLDivElement The created element
     */
    function getPostTags()
    {
        var i, postTags = this.document.createElement('div');

        postTags.setAttribute('class', 'ob-post-tags');
        for (i = 0; i < this.post.questionData.tags.length; i++) {
            postTags.appendChild(getPostTag.call(this, this.post.questionData.tags[i]));
        }

        return postTags;
    }

    /**
     * Create the grippie element
     *
     * @return HTMLDivElement The created element
     */
    function getGrippie()
    {
        var style = 'margin-right: 0px; background-position: 321px -823px; border: 1px solid #DDD; border-width: 0pt 1px 1px;'
                  + 'cursor: s-resize; height: 9px; overflow: hidden; background-color: #EEE; margin-right: -8px;'
                  + 'background-image: url(\'http://cdn.sstatic.net/stackoverflow/img/sprites.png?v=5\'); background-repeat: no-repeat;'
                  + 'margin-top: 10px; display: none; position: absolute; bottom: 0; width: 250px;';

        this.grippieElement = this.document.createElement('div');
        this.grippieElement.setAttribute('class', 'grippie');
        this.grippieElement.setAttribute('style', style);

        return this.grippieElement;
    }

    /**
     * Create the main OneBox container element
     */
    function createElement() {
        this.oneBoxElement = this.document.createElement('div');

        this.oneBoxElement.className = 'onebox ob-post cv-request';
        this.oneBoxElement.style.overflow = 'hidden';
        this.oneBoxElement.style.position = 'relative';

        this.oneBoxElement.appendChild(getQuestionScore.call(this));
        this.oneBoxElement.appendChild(getSiteIcon.call(this));
        this.oneBoxElement.appendChild(getPostTitle.call(this));
        this.oneBoxElement.appendChild(getPostBody.call(this));
        this.oneBoxElement.appendChild(getPostTags.call(this));
        this.oneBoxElement.appendChild(getGrippie.call(this));
    }

    /**
     * Process the initial height of the OneBox from the settings
     */
    function processHeight()
    {
        var totalWidth, grippieX, currentY, self = this;

        this.grippieElement.style.width = getCurrentStyle(this.oneBoxElement, 'width');

        if (this.pluginSettings.getSetting('oneBoxHeight') !== null && this.pluginSettings.getSetting('oneBoxHeight') < this.oneBoxElement.scrollHeight) {
            this.oneBoxElement.style.height = this.pluginSettings.getSetting('oneBoxHeight') + 'px';
            this.oneBoxElement.style.paddingBottom = '10px';

            this.grippieFactory.create({
                target: self.oneBoxElement,
                grippie: self.grippieElement,
                cursor: 'n-resize'
            });

            // 27px is the width of the background image
            totalWidth = getCurrentStyle(this.grippieElement, 'width');
            grippieX = Math.ceil((totalWidth - 27) / 2);

            currentY = getCurrentStyle(this.grippieElement, 'background-position').split('px')[1];
            this.grippieElement.style.backgroundPosition = grippieX + 'px ' + currentY + 'px';
            this.grippieElement.style.display = 'block';
        }
    }

    /**
     * Process the question status display from the question data
     */
    function processStatus()
    {
        if (this.post.questionData.closed_date !== undefined && this.pluginSettings.getSetting('showCloseStatus')) {
            this.setStatusText('closed');
        }
    }

    /**
     * Process the formatting of the OneBox
     */
    function processFormatting()
    {
        processHeight.call(this);
        processStatus.call(this);
        scrollToBottom.call(this);
    }

    /**
     * Scroll the viewport to the bottom of the chat room
     */
    function scrollToBottom()
    {
        var start = this.document.defaultView.scrollY,
            end = this.document.documentElement.scrollHeight - this.document.documentElement.clientHeight;

        this.animator.cancel();

        this.animator.animate({
            startValue: start,
            endValue: end,
            totalTime: 1000,
            easing: 'decel',

            frameFunc: function(newValue, animation) {
                this.scroll(this.scrollX, newValue);
            }
        });
    }

    /**
     * Constructor
     *
     * @param HTMLDocument                          document           The DOM document upon which the owner post resides
     * @param object                                pluginSettings     XBuilder settings module
     * @param CvPlsHelper.AvatarNotificationManager avatarNotification Avatar notification manager
     * @param object                                animator           XBuilder animation handler object
     * @param CvPlsHelper.GrippieFactory            grippieFactory     Factory which makes Grippie objects
     * @param CvPlsHelper.Post                      post               Post object to which this OneBox belongs
     */
    CvPlsHelper.OneBox = function(document, pluginSettings, avatarNotification, animator, grippieFactory, post) {
        this.document = document;
        this.pluginSettings = pluginSettings;
        this.avatarNotification = avatarNotification;
        this.animator = animator;
        this.grippieFactory = grippieFactory;
        this.post = post;

        createElement.call(this);
    };

    /**
     * @var HTMLDivElement The main OneBox container element
     */
    CvPlsHelper.OneBox.prototype.oneBoxElement = null;

    /**
     * @var HTMLDivElement The grippie element
     */
    CvPlsHelper.OneBox.prototype.grippieElement = null;

    /**
     * @var Text The text node that displays the question status
     */
    CvPlsHelper.OneBox.prototype.statusTextNode = null;

    /**
     * @var Text The text node that displays the question score
     */
    CvPlsHelper.OneBox.prototype.scoreTextNode = null;

    /**
     * Remove the OneBox from the DOM and add it again
     *
     * Useful for moving between edited message nodes
     */
    CvPlsHelper.OneBox.prototype.refreshDisplay = function() {
        this.hide();
        this.show();
    };

    /**
     * Add the OneBox elements to the DOM
     */
    CvPlsHelper.OneBox.prototype.show = function() {
        this.post.contentElement.appendChild(this.oneBoxElement);
        processFormatting.call(this);
    };

    /**
     * Remove the OneBox elements from the DOM
     */
    CvPlsHelper.OneBox.prototype.hide = function() {
        if (this.oneBoxElement.parentNode) {
            this.oneBoxElement.parentNode.removeChild(this.oneBoxElement);
        }
    };

    /**
     * Update the status portion of the question title
     *
     * @param string statusText The new status text
     */
    CvPlsHelper.OneBox.prototype.setStatusText = function(statusText) {
        this.statusTextNode.data = ' [' + statusText + ']';
    };

    /**
     * Update the displayed question score
     *
     * @param string score The new question score
     */
    CvPlsHelper.OneBox.prototype.setScore = function(score) {
        this.scoreTextNode.data = String(score);
    };
}());