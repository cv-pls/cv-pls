/*jslint plusplus: true, white: true, browser: true */
/*global CvPlsHelper, DOMChildListMutationListenerFactory */

(function() {

  'use strict';

  CvPlsHelper.ChatApplication = function(document, moduleLoader) {
    this.document = document;
    this.moduleLoader = moduleLoader;
    this.objects = {};
  };

  CvPlsHelper.ChatApplication.prototype.objects = null;

  CvPlsHelper.ChatApplication.prototype.start = function(callBack) {
    var o = this.objects,
        document = this.document;

    // Settings accessors
    o.pluginSettings = this.moduleLoader.loadModule('settings', CvPlsHelper.DefaultSettings);

    o.collectionFactory = new CvPlsHelper.CollectionFactory();
    o.postsOnScreen = o.collectionFactory.create();

    o.dataStore = new CvPlsHelper.PersistentDataStore('cv-pls');

    // Vote request processing
    o.audioPlayer = new CvPlsHelper.AudioPlayer(document, 'http://or.cdn.sstatic.net/chat/so.mp3');
    o.desktopNotificationDispatcher = this.moduleLoader.loadModule('notifications');
    o.desktopNotification = new CvPlsHelper.DesktopNotification(o.pluginSettings, o.desktopNotificationDispatcher);
    o.stackApi = new CvPlsHelper.StackApi(o.collectionFactory);

    o.avatarNotificationStack = o.collectionFactory.create();
    o.avatarNotificationDisplayFactory = new CvPlsHelper.AvatarNotificationDisplayFactory(document);
    o.avatarNotificationManager = new CvPlsHelper.AvatarNotificationManager(document, o.avatarNotificationStack, o.avatarNotificationDisplayFactory, o.pluginSettings);

    // Question status processors
    o.apiResponseProcessor = new CvPlsHelper.ApiResponseProcessor(o.pluginSettings, o.audioPlayer);
    o.pollQueueProcessor = new CvPlsHelper.VoteQueueProcessor(o.stackApi, o.apiResponseProcessor);
    o.voteRequestBufferFactory = new CvPlsHelper.VoteRequestBufferFactory(o.collectionFactory);
    o.questionStatusPoller = new CvPlsHelper.QuestionStatusPoller(o.pluginSettings, o.postsOnScreen, o.voteRequestBufferFactory, o.pollQueueProcessor);

    // Vote request listening
    o.mutationListenerFactory = new DOMChildListMutationListenerFactory();
    o.animatorFactory = new CvPlsHelper.AnimatorFactory();
    o.grippieFactory = new CvPlsHelper.GrippieFactory();
    o.chatRoom = new CvPlsHelper.ChatRoom(document, o.mutationListenerFactory);
    o.oneBoxFactory = new CvPlsHelper.OneBoxFactory(document, o.pluginSettings, o.avatarNotificationManager, o.animatorFactory, o.grippieFactory);
    o.clickTracker = new CvPlsHelper.ClickTracker(o.pluginSettings, o.dataStore);
    o.postFactory = new CvPlsHelper.PostFactory(document, o.pluginSettings, o.chatRoom, o.oneBoxFactory, o.avatarNotificationManager, o.animatorFactory, o.clickTracker);
    o.voteRemoveProcessor = new CvPlsHelper.VoteRemoveProcessor(o.pluginSettings, o.avatarNotificationManager);
    o.voteRequestListener = new CvPlsHelper.VoteRequestListener(o.chatRoom, o.mutationListenerFactory, o.postFactory, o.postsOnScreen, o.voteRemoveProcessor, o.questionStatusPoller);

    // UI enchancement
    o.buttonsManager = new CvPlsHelper.ButtonsManager(document, o.pluginSettings);
    o.soundManager = new CvPlsHelper.SoundManager(document, o.pluginSettings);
    o.cvBacklog = new CvPlsHelper.CvBacklog(document, o.pluginSettings, 'http://cvbacklog.gordon-oheim.biz/');

    // Set everything going
    o.pluginSettings.init(function() {
      // Enchance UI
      o.buttonsManager.init();
      o.soundManager.init();

      // Start background processes
      o.voteRequestListener.start();
      o.questionStatusPoller.schedulePoll();
      o.cvBacklog.refresh();

      // Initialisation callback
      if (typeof callBack === 'function') {
        callBack(o.pluginSettings);
      }
    });

  };

  CvPlsHelper.ChatApplication.prototype.shutdown = function() {
    // This may need further improvement, need to check codebase for circular references that may cause memory leaks.

    var o = this.objects;

    // Stop persistent processes that insert themselves into the event queue
    o.voteRequestListener.stop();
    o.questionStatusPoller.clearSchedule();

    // Trash post collections
    o.postsOnScreen.truncate();
    o.avatarNotificationStack.truncate();

    // Destroy objects
    this.objects = {};
  };

}());