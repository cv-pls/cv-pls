/*jslint plusplus: true, white: true, browser: true */
/*global CvPlsHelper, XPathResult */

CvPlsHelper.chrome.SettingsManager = function(pluginSettings, dupeSettingsManager) {

  "use strict";

  var self = this;

  this.getInputByName = function(name) {
    var input = document.evaluate(".//*[@name='"+name+"']", document.getElementById('page-container'), null, XPathResult.ORDERED_NODE_ITERATOR_TYPE, null).iterateNext();
    if (input) {
      self[name] = input;
      return true;
    }
    return false;
  };

  this.toggleInput = function(input, state) {
    var el, span, classes, classIndex;

    input.disabled = !state;

    for (el in input.parentNode.children) {
      if (typeof input.parentNode.children[el] !== 'function' && input.parentNode.children[el].hasOwnProperty('tagName') && input.parentNode.children[el].tagName.toUpperCase() === 'SPAN') {
        span = input.parentNode.children[el];
        break;
      }
    }

    if (span !== undefined) {
      classes = (span.getAttribute('class') || '').split(/\s+/);
      if (state) {
        classIndex = classes.indexOf('disabled');
        if (classIndex > -1) {
          classes.splice(classIndex, 1);
        }
      } else {
        classes.push('disabled');
      }
      span.setAttribute('class', classes.join(' ').replace(/^\s+|\s+$/, ''));
    }
  };

  this.initShowIcon = function() {
    if (self.getInputByName('showIcon')) {
      self.showIcon.checked = pluginSettings.getSetting('showIcon');
      self.showIcon.addEventListener('change', function() {
        pluginSettings.saveSetting('showIcon', this.checked);
      });
    }
  };

  this.initOneBox = function() {
    self.initOneBoxHeight();
    self.initRemoveCompletedOneboxes();
    if (self.getInputByName('oneBox')) {
      self.oneBox.checked = pluginSettings.getSetting('oneBox');
      if (!self.oneBox.checked) {
        self.oneBoxHeight.disabled = true;
        self.toggleInput(self.removeCompletedOneboxes, false);
      }
      self.oneBox.addEventListener('change', function() {
        pluginSettings.saveSetting('oneBox', this.checked);
        self.oneBoxHeight.disabled = !this.checked;
        self.toggleInput(self.removeCompletedOneboxes, this.checked);
      });
    }
  };
  this.initOneBoxHeight = function() {
    if (self.getInputByName('oneBoxHeight')) {
      self.oneBoxHeight.value = pluginSettings.getSetting('oneBoxHeight');
      self.oneBoxHeight.addEventListener('keyup', function() {
        pluginSettings.saveSetting('oneBoxHeight', this.value);
      });
      self.oneBoxHeight.addEventListener('click', function(e) {
        e.stopPropagation();
        return false;
      });
    }
  };
  this.initRemoveCompletedOneboxes = function() {
    if (self.getInputByName('removeCompletedOneboxes')) {
      self.removeCompletedOneboxes.checked = pluginSettings.getSetting('removeCompletedOneboxes');
      self.removeCompletedOneboxes.addEventListener('change', function() {
        pluginSettings.saveSetting('removeCompletedOneboxes', this.checked);
      });
    }
  };

  this.initCvPlsButton = function() {
    if (self.getInputByName('cvPlsButton')) {
      self.cvPlsButton.checked = pluginSettings.getSetting('cvPlsButton');
      self.cvPlsButton.addEventListener('change', function() {
        pluginSettings.saveSetting('cvPlsButton', this.checked);
      });
    }
  };

  this.initDelvPlsButton = function() {
    if (self.getInputByName('delvPlsButton')) {
      self.delvPlsButton.checked = pluginSettings.getSetting('delvPlsButton');
      self.delvPlsButton.addEventListener('change', function() {
        pluginSettings.saveSetting('delvPlsButton', this.checked);
      });
    }
  };

  this.initSoundNotification = function() {
    if (self.getInputByName('soundNotification')) {
      self.soundNotification.checked = pluginSettings.getSetting('soundNotification');
      self.soundNotification.addEventListener('change', function() {
        pluginSettings.saveSetting('soundNotification', this.checked);
      });
    }
  };

  this.initAvatarNotification = function() {
    self.initRemoveLostNotifications();
    self.initRemoveCompletedNotifications();
    if (self.getInputByName('avatarNotification')) {
      self.avatarNotification.checked = pluginSettings.getSetting('avatarNotification');
      if (!self.avatarNotification.checked) {
        self.toggleInput(self.removeLostNotifications, false);
        self.toggleInput(self.removeCompletedNotifications, false);
      }
      self.avatarNotification.addEventListener('change', function() {
        pluginSettings.saveSetting('avatarNotification', this.checked);
        self.toggleInput(self.removeLostNotifications, this.checked);
        self.toggleInput(self.removeCompletedNotifications, this.checked);
      });
    }
  };
  this.initRemoveLostNotifications = function() {
    if (self.getInputByName('removeLostNotifications')) {
      self.removeLostNotifications.checked = pluginSettings.getSetting('removeLostNotifications');
      self.removeLostNotifications.addEventListener('change', function() {
        pluginSettings.saveSetting('removeLostNotifications', this.checked);
      });
    }
  };
  this.initRemoveCompletedNotifications = function() {
    if (self.getInputByName('removeCompletedNotifications')) {
      self.removeCompletedNotifications.checked = pluginSettings.getSetting('removeCompletedNotifications');
      self.removeCompletedNotifications.addEventListener('change', function() {
        pluginSettings.saveSetting('removeCompletedNotifications', this.checked);
      });
    }
  };

  this.initDesktopNotification = function() {
    if (self.getInputByName('desktopNotification')) {
      self.desktopNotification.checked = pluginSettings.getSetting('desktopNotification');
      self.desktopNotification.addEventListener('change', function() {
        pluginSettings.saveSetting('desktopNotification', this.checked);
      });
    }
  };

  this.initShowCloseStatus = function() {
    self.initPollCloseStatus();
    if (self.getInputByName('showCloseStatus')) {
      self.showCloseStatus.checked = pluginSettings.getSetting('showCloseStatus');
      if (!self.showCloseStatus.checked) {
        self.toggleInput(self.pollCloseStatus, false);
        self.toggleInput(self.pollInterval, false);
      }
      self.showCloseStatus.addEventListener('change', function() {
        pluginSettings.saveSetting('showCloseStatus', this.checked);
        if (this.checked) {
          self.toggleInput(self.pollCloseStatus, true);
          if (self.pollCloseStatus.checked) {
            self.toggleInput(self.pollInterval, true);
          }
        } else {
          self.toggleInput(self.pollCloseStatus, false);
          self.toggleInput(self.pollInterval, false);
        }
      });
    }
  };
  this.initPollCloseStatus = function() {
    self.initPollInterval();
    if (self.getInputByName('pollCloseStatus')) {
      self.pollCloseStatus.checked = pluginSettings.getSetting('pollCloseStatus');
      if (!self.pollCloseStatus.checked) {
        self.toggleInput(self.pollInterval, false);
      }
      self.pollCloseStatus.addEventListener('change', function() {
        pluginSettings.saveSetting('pollCloseStatus', this.checked);
        self.toggleInput(self.pollInterval, this.checked);
      });
    }
  };
  this.initPollInterval = function() {
    if (self.getInputByName('pollInterval')) {
      self.pollInterval.value = pluginSettings.getSetting('pollInterval');
      self.pollInterval.addEventListener('keyup', function() {
        pluginSettings.saveSetting('pollInterval', this.value);
      });
      self.pollInterval.addEventListener('click', function(e) {
        e.stopPropagation();
        return false;
      });
    }
  };

  this.initStrikethroughCompleted = function() {
    if (self.getInputByName('strikethroughCompleted')) {
      self.strikethroughCompleted.checked = pluginSettings.getSetting('strikethroughCompleted');
      self.strikethroughCompleted.addEventListener('change', function() {
        pluginSettings.saveSetting('strikethroughCompleted', this.checked);
      });
    }
  };

  this.initBacklogEnabled = function() {
    self.initBacklogAmount();
    self.initBacklogRefresh();
    if (self.getInputByName('backlogEnabled')) {
      self.backlogEnabled.checked = pluginSettings.getSetting('backlogEnabled');
      if (!self.backlogEnabled.checked) {
        self.toggleInput(self.backlogAmount, false);
        self.toggleInput(self.backlogRefresh, false);
        self.toggleInput(self.backlogRefreshInterval, false);
      }
      self.backlogEnabled.addEventListener('change', function() {
        pluginSettings.saveSetting('backlogEnabled', this.checked);
        if (this.checked) {
          self.toggleInput(self.backlogAmount, true);
          self.toggleInput(self.backlogRefresh, true);
          if (self.backlogRefresh.checked) {
            self.toggleInput(self.backlogRefreshInterval, true);
          }
        } else {
          self.toggleInput(self.backlogAmount, false);
          self.toggleInput(self.backlogRefresh, false);
          self.toggleInput(self.backlogRefreshInterval, false);
        }
      });
    }
  };
  this.initBacklogAmount = function() {
    if (self.getInputByName('backlogAmount')) {
      self.backlogAmount.value = pluginSettings.getSetting('backlogAmount');
      self.backlogAmount.addEventListener('keyup', function() {
        pluginSettings.saveSetting('backlogAmount', this.value);
      });
    }
  };
  this.initBacklogRefresh = function() {
    self.initBacklogRefreshInterval();
    if (self.getInputByName('backlogRefresh')) {
      self.backlogRefresh.checked = pluginSettings.getSetting('backlogRefresh');
      if (!self.backlogRefresh.checked) {
        self.toggleInput(self.backlogRefreshInterval, false);
      }
      self.backlogRefresh.addEventListener('change', function() {
        pluginSettings.saveSetting('backlogRefresh', this.checked);
        self.backlogRefreshInterval.disabled = !this.checked;
      });
    }
  };
  this.initBacklogRefreshInterval = function() {
    if (self.getInputByName('backlogRefreshInterval')) {
      self.backlogRefreshInterval.value = pluginSettings.getSetting('backlogRefreshInterval');
      self.backlogRefreshInterval.addEventListener('keyup', function() {
        pluginSettings.saveSetting('backlogRefreshInterval', this.value);
      });
      self.backlogRefreshInterval.addEventListener('click', function(e) {
        e.stopPropagation();
        return false;
      });
    }
  };

  this.initDupesEnabled = function() {
    self.initShowDupes();
    if (self.getInputByName('dupesEnabled')) {
      self.dupesEnabled.checked = pluginSettings.getSetting('dupesEnabled');
      if (!self.dupesEnabled.checked) {
        self.toggleInput(self.showDupes, false);
      }
      self.dupesEnabled.addEventListener('change', function() {
        pluginSettings.saveSetting('dupesEnabled', this.checked);
        self.toggleInput(self.showDupes, this.checked);
      });
    }
  };
  this.initShowDupes = function() {
    if (self.getInputByName('showDupes') && dupeSettingsManager !== undefined) {
      self.showDupes.addEventListener('click', dupeSettingsManager.show);
    }
  };

  (function() {
    self.initShowIcon();
    self.initOneBox();
    self.initCvPlsButton();
    self.initDelvPlsButton();

    self.initSoundNotification();
    self.initAvatarNotification();
    self.initDesktopNotification();

    self.initShowCloseStatus();
    self.initStrikethroughCompleted();

    self.initBacklogEnabled();
    self.initDupesEnabled();
  }());

};