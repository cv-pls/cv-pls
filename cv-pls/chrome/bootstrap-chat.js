/*jslint plusplus: true, white: true, browser: true */
/*global jQuery, VoteRequestListener, XPathResult, Settings, PluginSettings, AudioPlayer, RequestStack, StackApi, RequestQueue, chrome */

(function() {

  "use strict";

  var settingsDataStore, settingsDataAccessor, pluginSettings,
      soundManager,
      buttonsManager,
      voteRequestFormatter, audioPlayer, avatarNotificationStack, avatarNotification, voteRequestProcessor, voteRemoveProcessor,
      stackApi, voteQueueProcessor,
      chatRoom, postFactory, voteRequestBufferFactory, voteRequestMessageQueue, voteRequestListener,
      pollMessageQueue, statusRequestProcessor, pollQueueProcessor, statusPolling,
      desktopNotificationDispatcher, desktopNotification,
      cvBacklog;

  settingsDataStore = new SettingsDataStore();
  settingsDataAccessor = new ChromeContentSettingsDataAccessor(settingsDataStore);
  pluginSettings = new PluginSettings(settingsDataAccessor);

  soundManager = new SoundManager(document, pluginSettings);

  buttonsManager = new ButtonsManager(document, pluginSettings);

  audioPlayer = new AudioPlayer('http://or.cdn.sstatic.net/chat/so.mp3');
  avatarNotificationStack = new RequestStack();
  avatarNotification = new AvatarNotification(document, window, avatarNotificationStack, pluginSettings);
  voteRequestFormatter = new VoteRequestFormatter(document, pluginSettings, avatarNotification);
  voteRequestProcessor = new VoteRequestProcessor(pluginSettings, voteRequestFormatter, audioPlayer, avatarNotification);
  voteRemoveProcessor = new VoteRemoveProcessor(pluginSettings, avatarNotification);

  stackApi = new StackApi();
  voteQueueProcessor = new VoteQueueProcessor(stackApi, voteRequestProcessor);

  chatRoom = new ChatRoom(document);
  postFactory = new Post(document);
  voteRequestBufferFactory = new VoteRequestBuffer();
  voteRequestMessageQueue = new RequestQueue();
  voteRequestListener = new VoteRequestListener(document, chatRoom, postFactory, voteRequestBufferFactory, voteRequestMessageQueue, voteQueueProcessor, voteRemoveProcessor);

  pollMessageQueue = new RequestQueue();
  statusRequestProcessor = new StatusRequestProcessor(pluginSettings, voteRequestFormatter, avatarNotification);
  pollQueueProcessor = new VoteQueueProcessor(stackApi, statusRequestProcessor);
  statusPolling = new StatusPolling(pluginSettings, postFactory, voteRequestBufferFactory, pollMessageQueue, pollQueueProcessor);

  desktopNotification = new DesktopNotification(pluginSettings);

  cvBacklog = new CvBacklog(document, pluginSettings, 'http://cvbacklog.gordon-oheim.biz/');

  pluginSettings.init(function() {
    var sound;

    buttonsManager.init();
    voteRequestListener.init();
    cvBacklog.show();

    setTimeout(statusPolling.pollStatus, 60000); // wait 1 minute before polling to prevent getting kicked from stack-api

    chrome.extension.sendMessage({method: 'showIcon'});
    chrome.extension.sendMessage({method: 'checkUpdate'});

    sound = document.getElementById('sound');
    if (sound) {
      sound.addEventListener('click', soundManager.watchPopup);
    }
  });
}());