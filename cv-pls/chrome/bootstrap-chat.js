/*jslint plusplus: true, white: true, browser: true */
/*global jQuery, VoteRequestListener, XPathResult, Settings, PluginSettings, AudioPlayer, RequestStack, StackApi, RequestQueue, chrome */

(function($) {

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

  soundManager = new SoundManager(pluginSettings);

  buttonsManager = new ButtonsManager(pluginSettings);

  audioPlayer = new AudioPlayer('http://or.cdn.sstatic.net/chat/so.mp3');
  avatarNotificationStack = new RequestStack();
  avatarNotification = new AvatarNotification(avatarNotificationStack, pluginSettings);
  voteRequestFormatter = new VoteRequestFormatter(pluginSettings, avatarNotification);
  voteRequestProcessor = new VoteRequestProcessor(pluginSettings, voteRequestFormatter, audioPlayer, avatarNotification);
  voteRemoveProcessor = new VoteRemoveProcessor(pluginSettings, avatarNotification);

  stackApi = new StackApi();
  voteQueueProcessor = new VoteQueueProcessor(stackApi, voteRequestProcessor);

  chatRoom = new ChatRoom();
  postFactory = new Post();
  voteRequestBufferFactory = new VoteRequestBuffer();
  voteRequestMessageQueue = new RequestQueue();
  voteRequestListener = new VoteRequestListener(chatRoom, postFactory, voteRequestBufferFactory, voteRequestMessageQueue, voteQueueProcessor, voteRemoveProcessor);

  pollMessageQueue = new RequestQueue();
  statusRequestProcessor = new StatusRequestProcessor(pluginSettings, voteRequestFormatter, avatarNotification);
  pollQueueProcessor = new VoteQueueProcessor(stackApi, statusRequestProcessor);
  statusPolling = new StatusPolling(pluginSettings, postFactory, voteRequestBufferFactory, pollMessageQueue, pollQueueProcessor);

  desktopNotification = new DesktopNotification(pluginSettings);

  cvBacklog = new CvBacklog(pluginSettings, 'http://cvbacklog.gordon-oheim.biz/');

  pluginSettings.init(function() {
    buttonsManager.init();
    voteRequestListener.init();
    cvBacklog.show();

    setTimeout(statusPolling.pollStatus, 60000); // wait 1 minute before polling to prevent getting kicked from stack-api

    chrome.extension.sendRequest({method: 'showIcon'}, function(){});
    chrome.extension.sendRequest({method: 'checkUpdate'}, function(){});

    $('#sound').click(function() {
      soundManager.watchPopup();
    });
  });

  // handle click on avatar notification
  $('body').on('click', '#cv-count', function() {
    avatarNotification.navigateToLastRequest();

    return false;
  });

  // handle cvpls button click
  $('body').on('click', '#cv-pls-button', function() {
    var val = $('#input').val();
    $('#input').val('[tag:cv-pls] ' + val).focus().putCursorAtEnd();

    if (val.toString() !== '') {
      $('#sayit-button').click();
    }
  });

  // handle delvpls button click
  $('body').on('click', '#delv-pls-button', function() {
    var val = $('#input').val();
    $('#input').val('[tag:delv-pls] ' + val).focus().putCursorAtEnd();

    if (val.toString() !== '') {
      $('#sayit-button').click();
    }
  });
}(jQuery));