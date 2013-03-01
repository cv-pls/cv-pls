/*jslint plusplus: true, white: true, browser: true */
/*global CvPlsHelper */

(function() {
    'use strict';

    /**
     * Create a backlog link element
     *
     * @param object data The data the describes the vote request
     *
     * @return HTMLDivElement The created element
     */
    function buildCvLink(cvRequest)
    {
        var div, a, requestType;

        requestType = (cvRequest.closed_date !== undefined) ? 'delv' : 'cv';

        div = this.document.createElement('div');
        div.appendChild(this.document.createTextNode('[' + requestType + '-pls] '));

        a = div.appendChild(this.document.createElement('a'));
        a.setAttribute('href', cvRequest.link);
        a.setAttribute('target', '_blank');
        a.innerHTML = cvRequest.title;

        return div;
    }

    /**
     * Process the ajax response from the backlog
     *
     * @param object data The decoded JSON response from the backlog
     */
    function processBacklogResponse(data)
    {
        var i, l;

        while (this.descriptionElement.hasChildNodes()) {
            this.descriptionElement.removeChild(this.descriptionElement.lastChild);
        }

        for (i = 0, l = data.length; i < l && i < this.pluginSettings.getSetting('backlogAmount'); i++) {
            this.descriptionElement.appendChild(buildCvLink.call(this, data[i]));
        }
    }

    /**
     * Constructor
     *
     * @param HTMLDocument                    document       The DOM document upon which the chat room resides
     * @param object                          pluginSettings XBuilder settings module
     * @param CvPlsHelper.CvBacklogUrlManager urlManager     The URL resolver object
     */
    CvPlsHelper.CvBacklog = function(document, pluginSettings, urlManager)
    {
        this.document = document;
        this.pluginSettings = pluginSettings;
        this.urlManager = urlManager;

        this.descriptionElement = document.getElementById('roomdesc');
    };

    /**
     * @var HTMLDocument The DOM document upon which the chat room resides
     */
    CvPlsHelper.CvBacklog.prototype.document = null;

    /**
     * @var object XBuilder settings module
     */
    CvPlsHelper.CvBacklog.prototype.pluginSettings = null;

    /**
     * @var CvPlsHelper.CvBacklogUrlManager The URL resolver object
     */
    CvPlsHelper.CvBacklog.prototype.urlManager = null;

    /**
     * @var string The original room description HTML string
     */
    CvPlsHelper.CvBacklog.prototype.originalDescription = null;

    /**
     * @var int Reference to the backlog poll timeout
     */
    CvPlsHelper.CvBacklog.prototype.timeout = null;

    /**
     * @var bool Whether the backlog is visible
     */
    CvPlsHelper.CvBacklog.prototype.visible = false;

    /**
     * Initialization routine
     */
    CvPlsHelper.CvBacklog.prototype.init = function()
    {
        var self = this;

        this.urlManager.onChatRoomLoad(function() {
            self.backlogUrl = self.urlManager.getBacklogUrl();
            self.refresh();
        });
    };

    /**
     * Refresh the backlog display in the room description
     */
    CvPlsHelper.CvBacklog.prototype.refresh = function()
    {
        var xhr,
            self = this,
            interval = this.pluginSettings.getSetting('backlogRefreshInterval') * 60 * 1000;

        this.timeout = null;

        if (!this.pluginSettings.getSetting('backlogEnabled') || !this.backlogUrl) {
            this.hide();
            return;
        }
        this.show();

        xhr = new XMLHttpRequest();
        xhr.open("GET", this.backlogUrl, true);
        xhr.setRequestHeader('Accept', 'application/json; charset=utf-8');
        xhr.onreadystatechange = function() {
            if (xhr.readyState === 4 && xhr.status === 200) {
                try {
                    processBacklogResponse.call(self, JSON.parse(xhr.responseText));
                } catch(e) { /* probably a JSON parse error occured, ignore it */ }
            }
        };
        xhr.send(null);

        if (this.pluginSettings.getSetting('backlogRefresh')) {
            this.timeout = setTimeout(function() {
                self.refresh();
            }, interval);
        }
    };

    /**
     * Show the backlog
     */
    CvPlsHelper.CvBacklog.prototype.show = function()
    {
        if (!this.visible) {
            this.visible = true;
            this.originalDescription = this.descriptionElement.innerHTML;
        }
    };

    /**
     * Hide the backlog
     */
    CvPlsHelper.CvBacklog.prototype.hide = function()
    {
        if (this.visible) {
            this.visible = false;
            this.descriptionElement.innerHTML = this.originalDescription;
            if (this.timeout !== null) {
                clearTimeout(this.timeout);
            }
        }
    };
}());