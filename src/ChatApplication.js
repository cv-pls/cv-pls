/*jslint plusplus: true, white: true, browser: true */
/*global CvPlsHelper */

CvPlsHelper.ChatApplication = function(document, constructors, onInit) {

  "use strict";

  var pluginSettings,
      audioPlayer, desktopNotificationDispatcher, desktopNotification, stackApi,
      avatarNotificationStack, avatarNotification, voteRequestFormatter, voteRequestProcessor, voteRemoveProcessor, voteQueueProcessor,
      chatRoom, postFactory, voteRequestBufferFactory, voteRequestMessageQueue, voteRequestListener,
      pollMessageQueue, statusRequestProcessor, pollQueueProcessor, statusPolling,
      soundManager, buttonsManager, cvBacklog;

  this.start = function() {

    // Settings accessors
    pluginSettings = new constructors.SettingsDataAccessor(new constructors.SettingsDataStore(), constructors.DefaultSettings);

    // Vote request processing
    audioPlayer = new CvPlsHelper.AudioPlayer(document, 'http://or.cdn.sstatic.net/chat/so.mp3');
    desktopNotificationDispatcher = new constructors.DesktopNotificationDispatcher();
    desktopNotification = CvPlsHelper.DesktopNotification(pluginSettings, desktopNotificationDispatcher);
    stackApi = new CvPlsHelper.StackApi();

    avatarNotificationStack = new CvPlsHelper.RequestStack();
    avatarNotification = new CvPlsHelper.AvatarNotification(document, avatarNotificationStack, pluginSettings);
    voteRequestFormatter = new CvPlsHelper.VoteRequestFormatter(document, pluginSettings, avatarNotification);
    voteRequestProcessor = new CvPlsHelper.VoteRequestProcessor(pluginSettings, voteRequestFormatter, audioPlayer, avatarNotification);
    voteRemoveProcessor = new CvPlsHelper.VoteRemoveProcessor(pluginSettings, avatarNotification);
    voteQueueProcessor = new CvPlsHelper.VoteQueueProcessor(stackApi, voteRequestProcessor);

    // Vote request listening
    chatRoom = new CvPlsHelper.ChatRoom(document);
    postFactory = new CvPlsHelper.Post(document);
    voteRequestBufferFactory = new CvPlsHelper.VoteRequestBuffer();
    voteRequestMessageQueue = new CvPlsHelper.RequestQueue();
    voteRequestListener = new CvPlsHelper.VoteRequestListener(document, chatRoom, postFactory, voteRequestBufferFactory, voteRequestMessageQueue, voteQueueProcessor, voteRemoveProcessor);

    // Vote status processors
    pollMessageQueue = new CvPlsHelper.RequestQueue();
    statusRequestProcessor = new CvPlsHelper.StatusRequestProcessor(pluginSettings, voteRequestFormatter, avatarNotification);
    pollQueueProcessor = new CvPlsHelper.VoteQueueProcessor(stackApi, statusRequestProcessor);
    statusPolling = new CvPlsHelper.StatusPolling(document, pluginSettings, postFactory, voteRequestBufferFactory, pollMessageQueue, pollQueueProcessor);

    // UI enchancement
    buttonsManager = new CvPlsHelper.ButtonsManager(document, pluginSettings);
    soundManager = new CvPlsHelper.SoundManager(document, pluginSettings);
    cvBacklog = new CvPlsHelper.CvBacklog(document, pluginSettings, 'http://cvbacklog.gordon-oheim.biz/');

    // Set everything going
    pluginSettings.init(function() {
      // Enchance UI
      buttonsManager.init();
      soundManager.init();

      // Start background processes
      voteRequestListener.start();
      statusPolling.start();

      // Initialisation callback
      onInit();
    });

  };

  this.shutdown = function() {
    voteRequestListener.stop();
    statusPolling.stop();

    delete pluginSettings;
    delete audioPlayer;
    delete desktopNotificationDispatcher;
    delete desktopNotification;
    delete stackApi;
    delete avatarNotificationStack;
    delete avatarNotification;
    delete voteRequestFormatter;
    delete voteRequestProcessor;
    delete voteRemoveProcessor;
    delete voteQueueProcessor;
    delete chatRoom;
    delete postFactory;
    delete voteRequestBufferFactory;
    delete voteRequestMessageQueue;
    delete voteRequestListener;
    delete pollMessageQueue;
    delete statusRequestProcessor;
    delete pollQueueProcessor;
    delete statusPolling;
    delete soundManager;
    delete buttonsManager;
    delete cvBacklog;
  };

};