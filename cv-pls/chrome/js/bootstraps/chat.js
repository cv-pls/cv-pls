/*jslint plusplus: true, white: true, browser: true */
/*global CvPlsHelper, chrome */

(function() {

  "use strict";

  var settingsDataStore, settingsDataAccessor, pluginSettings,
      audioPlayer, desktopNotificationDispatcher, stackApi,
      avatarNotificationStack, avatarNotification, voteRequestFormatter, voteRequestProcessor, voteRemoveProcessor, voteQueueProcessor,
      chatRoom, postFactory, voteRequestBufferFactory, voteRequestMessageQueue, voteRequestListener,
      pollMessageQueue, statusRequestProcessor, pollQueueProcessor, statusPolling,
      soundManager, buttonsManager, cvBacklog;

  function onInit() {
    var sound = document.getElementById('sound');

    // Enchance UI
    voteRequestListener.init();
    buttonsManager.init();
    if (sound) {
      sound.addEventListener('click', soundManager.watchPopup);
    }

    // Wait 1 minute before polling to prevent getting kicked from stack api
    setTimeout(statusPolling.pollStatus, 60000);

    // Show update page
    chrome.extension.sendMessage({method: 'checkUpdate'});

    // Add address bar icon
    if (pluginSettings.getSetting('showIcon')) {
      chrome.extension.sendMessage({method: 'showIcon'});
    }
  }

  // Settings accessors
  settingsDataStore = new CvPlsHelper.chrome.SettingsDataStore();
  settingsDataAccessor = new CvPlsHelper.chrome.ContentSettingsDataAccessor(settingsDataStore);
  pluginSettings = new CvPlsHelper.PluginSettings(settingsDataAccessor, CvPlsHelper.chrome.DefaultSettings);

  // Vote request processing
  audioPlayer = new CvPlsHelper.AudioPlayer(document, 'http://or.cdn.sstatic.net/chat/so.mp3');
  desktopNotificationDispatcher = new CvPlsHelper.chrome.DesktopNotificationDispatcher(pluginSettings);
  stackApi = new CvPlsHelper.StackApi();

  avatarNotificationStack = new CvPlsHelper.RequestStack();
  avatarNotification = new CvPlsHelper.AvatarNotification(document, window, avatarNotificationStack, pluginSettings);
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
  statusPolling = new CvPlsHelper.StatusPolling(pluginSettings, postFactory, voteRequestBufferFactory, pollMessageQueue, pollQueueProcessor);

  // UI enchancement
  buttonsManager = new CvPlsHelper.ButtonsManager(document, pluginSettings);
  soundManager = new CvPlsHelper.SoundManager(document, pluginSettings);
  cvBacklog = new CvPlsHelper.CvBacklog(document, pluginSettings, 'http://cvbacklog.gordon-oheim.biz/');

  // Set everything going
  pluginSettings.init(onInit);

}());