/*jslint plusplus: true, white: true, browser: true */
/*global CvPlsHelper */

CvPlsHelper.ChatApplication = function(document, constructors, onInit) {

  "use strict";

  var objects = {};

  this.start = function() {

    // Settings accessors
    objects.pluginSettings = new constructors.SettingsDataAccessor(new constructors.SettingsDataStore(), constructors.DefaultSettings);

    // Vote request processing
    objects.audioPlayer = new CvPlsHelper.AudioPlayer(document, 'http://or.cdn.sstatic.net/chat/so.mp3');
    objects.desktopNotificationDispatcher = new constructors.DesktopNotificationDispatcher();
    objects.desktopNotification = CvPlsHelper.DesktopNotification(objects.pluginSettings, objects.desktopNotificationDispatcher);
    objects.stackApi = new CvPlsHelper.StackApi();

    objects.avatarNotificationStack = new CvPlsHelper.RequestStack();
    objects.avatarNotification = new CvPlsHelper.AvatarNotification(document, objects.avatarNotificationStack, objects.pluginSettings);
    objects.voteRequestFormatter = new CvPlsHelper.VoteRequestFormatter(document, objects.pluginSettings, objects.avatarNotification);
    objects.voteRequestProcessor = new CvPlsHelper.VoteRequestProcessor(objects.pluginSettings, objects.voteRequestFormatter, objects.audioPlayer, objects.avatarNotification);
    objects.voteRemoveProcessor = new CvPlsHelper.VoteRemoveProcessor(objects.pluginSettings, objects.avatarNotification);
    objects.voteQueueProcessor = new CvPlsHelper.VoteQueueProcessor(objects.stackApi, objects.voteRequestProcessor);

    // Vote request listening
    objects.mutationListenerFactory = new DOMChildListMutationListenerFactory();
    objects.chatRoom = new CvPlsHelper.ChatRoom(document, objects.mutationListenerFactory);
    objects.postFactory = new CvPlsHelper.Post(document);
    objects.voteRequestBufferFactory = new CvPlsHelper.VoteRequestBuffer();
    objects.voteRequestMessageQueue = new CvPlsHelper.RequestQueue();
    objects.voteRequestListener = new CvPlsHelper.VoteRequestListener(document, objects.chatRoom, objects.mutationListenerFactory, objects.postFactory, objects.voteRequestBufferFactory, objects.voteRequestMessageQueue, objects.voteQueueProcessor, objects.voteRemoveProcessor);

    // Vote status processors
    objects.pollMessageQueue = new CvPlsHelper.RequestQueue();
    objects.statusRequestProcessor = new CvPlsHelper.StatusRequestProcessor(objects.pluginSettings, objects.voteRequestFormatter, objects.avatarNotification);
    objects.pollQueueProcessor = new CvPlsHelper.VoteQueueProcessor(objects.stackApi, objects.statusRequestProcessor);
    objects.statusPolling = new CvPlsHelper.StatusPolling(document, objects.pluginSettings, objects.postFactory, objects.voteRequestBufferFactory, objects.pollMessageQueue, objects.pollQueueProcessor);

    // UI enchancement
    objects.buttonsManager = new CvPlsHelper.ButtonsManager(document, objects.pluginSettings);
    objects.soundManager = new CvPlsHelper.SoundManager(document, objects.pluginSettings);
    objects.cvBacklog = new CvPlsHelper.CvBacklog(document, objects.pluginSettings, 'http://cvbacklog.gordon-oheim.biz/');

    // Set everything going
    objects.pluginSettings.init(function() {
      // Enchance UI
      objects.buttonsManager.init();
      objects.soundManager.init();

      // Start background processes
      objects.voteRequestListener.start();
      objects.statusPolling.start();

      // Initialisation callback
      if (typeof onInit === 'function') {
        onInit(objects.pluginSettings);
      }
      document = constructors = onInit = null;
    });

  };

  this.shutdown = function() {
    objects.voteRequestListener.stop();
    objects.statusPolling.stop();

    // Destroy objects.
    // This probably needs improvement, need to check codebase for circular references that may cause memory leaks.
    objects = null;
  };

};