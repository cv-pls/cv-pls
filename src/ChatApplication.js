/*jslint plusplus: true, white: true, browser: true */
/*global CvPlsHelper, DOMChildListMutationListenerFactory */

(function() {

  'use strict';

  function makeDefaultSettingsObject(overrides) {
    var key, result = {};
    overrides = overrides || {};

    for (key in CvPlsHelper.DefaultSettings) {
      if (CvPlsHelper.DefaultSettings.hasOwnProperty(key)) {
        result[key] = CvPlsHelper.DefaultSettings[key];
      }
    }

    for (key in overrides) {
      if (overrides.hasOwnProperty(key)) {
        result[key] = overrides[key];
      }
    }

    return result;
  }

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
    o.pluginSettings = new constructors.SettingsDataAccessor(new constructors.SettingsDataStore(), makeDefaultSettingsObject(constructors.DefaultSettings));

    o.collectionFactory = new CvPlsHelper.CollectionFactory();
    o.postsOnScreen = o.collectionFactory.create();

    // Vote request processing
    o.audioPlayer = new CvPlsHelper.AudioPlayer(document, 'http://or.cdn.sstatic.net/chat/so.mp3');
    o.desktopNotificationDispatcher = new constructors.DesktopNotificationDispatcher();
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
    o.postFactory = new CvPlsHelper.PostFactory(document, o.pluginSettings, o.chatRoom, o.oneBoxFactory, o.avatarNotificationManager, o.animatorFactory);
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