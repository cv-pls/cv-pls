/*jslint plusplus: true, white: true, browser: true */
/*global CvPlsHelper, DOMChildListMutationListenerFactory */

(function() {

  'use strict';

  CvPlsHelper.ChatApplication = function(document, constructors, onInit) {
    this.document = document;
    this.constructors = constructors;
    this.onInit = onInit;
  };

  CvPlsHelper.ChatApplication.prototype.objects = null;

  CvPlsHelper.ChatApplication.prototype.start = function() {

    this.objects = {};

    var o = this.objects,
        constructors = this.constructors,
        onInit = this.onInit,
        document = this.document;

    // Settings accessors
    o.pluginSettings = new constructors.SettingsDataAccessor(new constructors.SettingsDataStore(), constructors.DefaultSettings);

    o.collectionFactory = new CvPlsHelper.CollectionFactory();

    // Vote request processing
    o.audioPlayer = new CvPlsHelper.AudioPlayer(document, 'http://or.cdn.sstatic.net/chat/so.mp3');
    o.desktopNotificationDispatcher = new constructors.DesktopNotificationDispatcher();
    o.desktopNotification = CvPlsHelper.DesktopNotification(o.pluginSettings, o.desktopNotificationDispatcher);
    o.stackApi = new CvPlsHelper.StackApi();

    o.avatarNotificationStack = o.collectionFactory.create();
    o.avatarNotificationDisplayFactory = CvPlsHelper.AvatarNotificationDisplayFactory(document);
    o.avatarNotificationManager = new CvPlsHelper.AvatarNotificationManager(document, o.avatarNotificationStack, o.avatarNotificationDisplayFactory, o.pluginSettings);
    o.voteRequestFormatter = new CvPlsHelper.VoteRequestFormatter(document, o.pluginSettings, o.avatarNotificationManager);
    o.voteRequestProcessor = new CvPlsHelper.VoteRequestProcessor(o.pluginSettings, o.voteRequestFormatter, o.audioPlayer, o.avatarNotificationManager);
    o.voteRemoveProcessor = new CvPlsHelper.VoteRemoveProcessor(o.pluginSettings, o.avatarNotificationManager);
    o.voteQueueProcessor = new CvPlsHelper.VoteQueueProcessor(o.stackApi, o.voteRequestProcessor);

    // Vote request listening
    o.mutationListenerFactory = new DOMChildListMutationListenerFactory();
    o.chatRoom = new CvPlsHelper.ChatRoom(document, o.mutationListenerFactory);
    o.oneBoxFactory = new CvPlsHelper.OneBoxFactory(document, o.pluginSettings, o.avatarNotificationManager);
    o.postFactory = new CvPlsHelper.PostFactory(document, o.chatRoom, o.oneBoxFactory);
    o.voteRequestBufferFactory = new CvPlsHelper.VoteRequestBufferFactory();
    o.postsOnScreen = o.collectionFactory.create();
    o.voteRequestListener = new CvPlsHelper.VoteRequestListener(o.chatRoom, o.mutationListenerFactory, o.postFactory, o.voteRequestBufferFactory, o.postsOnScreen, o.voteQueueProcessor, o.voteRemoveProcessor);

    // Vote status processors
    o.pollMessageQueue = o.collectionFactory.create();
    o.statusRequestProcessor = new CvPlsHelper.StatusRequestProcessor(o.pluginSettings, o.voteRequestFormatter, o.avatarNotificationManager);
    o.pollQueueProcessor = new CvPlsHelper.VoteQueueProcessor(o.stackApi, o.statusRequestProcessor);
    o.statusPolling = new CvPlsHelper.StatusPolling(o.pluginSettings, o.postsOnScreen, o.voteRequestBufferFactory, o.pollMessageQueue, o.pollQueueProcessor);

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
      o.statusPolling.start();

      // Initialisation callback
      if (typeof onInit === 'function') {
        onInit(o.pluginSettings);
      }
      document = constructors = onInit = null;
    });

  };

  CvPlsHelper.ChatApplication.prototype.shutdown = function() {
    this.objects.voteRequestListener.stop();
    this.objects.statusPolling.stop();

    // Destroy objects.
    // This probably needs improvement, need to check codebase for circular references that may cause memory leaks.
    this.objects = null;
  };

}());