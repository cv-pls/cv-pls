/*jslint plusplus: true, white: true, browser: true */
/*global CvPlsHelper */

(function() {

  'use strict';

  function putCursorAtEnd(element) {
    var val;
    if (element.focus) {
      element.focus();
    }
    if (element.setSelectionRange) {
      element.setSelectionRange(element.value.length + 1, element.value.length + 1);
    } else {
      val = element.value;
      element.value = '';
      element.value = val;
    }
  }

  function addButton(document, voteType) {
    var newButton, cancelEditButton;

    voteType += '-pls';

    newButton = document.createElement('button');
    newButton.setAttribute('class', 'button');
    newButton.setAttribute('id', voteType + '-button');
    newButton.style.marginRight = '4px';
    newButton.appendChild(document.createTextNode(voteType));

    newButton.addEventListener('click', function() {
      var input, ev;

      input = document.getElementById('input');
      input.value = '[tag:' + voteType + '] ' + input.value;
      putCursorAtEnd(input);

      if (input.value.replace(/\s+/, '') !== '[tag:' + voteType + ']') {
        ev = document.createEvent('MouseEvents');
        ev.initMouseEvent('click', true, true, window, 0, 0, 0, 0, 0, false, false, false, false, 0, null);
        document.getElementById('sayit-button').dispatchEvent(ev);
      }
    });

    cancelEditButton = document.getElementById('cancel-editing-button');
    cancelEditButton.parentNode.insertBefore(newButton, cancelEditButton);
  }

  CvPlsHelper.ButtonsManager = function(document, pluginSettings) {
    this.document = document;
    this.pluginSettings = pluginSettings;
  };

  CvPlsHelper.ButtonsManager.prototype.init = function() {
    if (this.pluginSettings.getSetting('cvPlsButton')) {
      addButton(this.document, 'cv');
    }

    if (this.pluginSettings.getSetting('delvPlsButton')) {
      addButton(this.document, 'delv');
    }
  };

}());