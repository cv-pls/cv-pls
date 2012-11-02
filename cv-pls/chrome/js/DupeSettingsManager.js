/*jslint plusplus: true, white: true, browser: true */
/*global CvPlsHelper */

CvPlsHelper.chrome.DupeSettingsManager = function(pluginSettings) {

  "use strict";

  var self,
      opacityTicker,
      overlayDiv, displayDiv,
      tBody;
  
  self = this;
  opacityTicker = 0;

  // Dynamic element manipulators
  function makeDupeRow(dupe) {
    var row, cell, img;

    row = document.createElement('tr');

    cell = row.appendChild(document.createElement('td'));
    cell.innerHTML = dupe.title;
    cell.setAttribute('class', 'title');

    cell = row.appendChild(document.createElement('td'));
    cell.innerHTML = dupe.url;
    cell.setAttribute('class', 'url');

    cell = row.appendChild(document.createElement('td'));
    cell.setAttribute('class', 'delete');
    cell.addEventListener('click', function() {
      var dupes, i;

      dupes = pluginSettings.getSetting('dupesList');
      for (i = 0; i < dupes.length; i++) {
        if (dupes[i].title === this.parentNode.querySelector('td.title').innerText && dupes[i].url === this.parentNode.querySelector('td.url').innerText) {
          dupes.splice(i, 1);
          break;
        }
      }
      pluginSettings.saveSetting('dupesList', JSON.stringify(dupes));

      this.parentNode.parentNode.removeChild(this.parentNode);
    });

    img = cell.appendChild(document.createElement('img'));
    img.setAttribute('src', '../img/delete.png');
    img.setAttribute('alt', 'delete');
    img.setAttribute('title', 'Delete');

    return row;
  }
  function addDupesToTable() {
    var dupes = pluginSettings.getSetting('dupesList'),
        i, length;
    for (i = 0, length = dupes.length; i < length; i++) {
      tBody.appendChild(makeDupeRow(dupes[i]));
    }
  }

  function removeDupesFromTable() {
    while (tBody.hasChildNodes()) {
      tBody.removeChild(tBody.lastChild);
    }
  }

  // Display handlers
  function appear() {
    if (opacityTicker < 1) {
      opacityTicker += (1 / 9);
      if (opacityTicker > 1) {
        opacityTicker = 1;
      }
      overlayDiv.style.opacity = opacityTicker * 0.6;
      displayDiv.style.opacity = opacityTicker;
      setTimeout(appear, 10);
    }
  }

  function removeElementsFromDOM() {
    document.body.removeChild(overlayDiv);
    document.body.removeChild(displayDiv);
    removeDupesFromTable();
  }
  function disappear(callBack) {
    if (opacityTicker > 0) {
      opacityTicker -= (1 / 9);
      if (opacityTicker < 0) {
        opacityTicker = 0;
      }
      overlayDiv.style.opacity = opacityTicker * 0.6;
      displayDiv.style.opacity = opacityTicker;
      setTimeout(function() {
        disappear(callBack);
      }, 10);
    } else {
      removeElementsFromDOM();
    }
  }

  // Initial element creators
  function makeTableHeadTitleCell () {
    var cell = document.createElement('th');
    cell.setAttribute('class', 'title');
    cell.appendChild(document.createTextNode('Title'));
    return cell;
  }
  function makeTableHeadUrlCell () {
    var cell = document.createElement('th');
    cell.setAttribute('class', 'url');
    cell.appendChild(document.createTextNode('URL'));
    return cell;
  }
  function makeTableHeadDeleteCell () {
    var cell = document.createElement('th');
    cell.setAttribute('class', 'delete');
    return cell;
  }
  function makeTableHead () {
    var tHead, row;

    tHead = document.createElement('thead');
    row = tHead.appendChild(document.createElement('tr'));

    row.appendChild(makeTableHeadTitleCell());
    row.appendChild(makeTableHeadUrlCell());
    row.appendChild(makeTableHeadDeleteCell());

    return tHead;
  }

  function makeTableBody () {
    tBody = document.createElement('tbody');
    return tBody;
  }

  function makeTableFootTitleCell() {
    var cell, content;

    cell = document.createElement('td');
    cell.setAttribute('class', 'title');

    content = cell.appendChild(document.createElement('input'));
    content.setAttribute('type', 'text');
    content.setAttribute('name', 'title');
    content.setAttribute('placeholder', 'Title');

    return cell;
  }
  function makeTableFootUrlCell() {
    var cell, content;

    cell = document.createElement('td');
    cell.setAttribute('class', 'url');

    content = cell.appendChild(document.createElement('input'));
    content.setAttribute('type', 'text');
    content.setAttribute('name', 'url');
    content.setAttribute('placeholder', 'Question URL');

    return cell;
  }
  function makeTableFootAddCell() {
    var cell, content;

    cell = document.createElement('td');
    cell.setAttribute('class', 'add');
    cell.addEventListener('click', function() {
      var titleInput, urlInput, dupes;

      titleInput = this.parentNode.querySelector('td.title').firstChild;
      urlInput = this.parentNode.querySelector('td.url').firstChild;

      dupes = pluginSettings.getSetting("dupesList");
      dupes.push({
        title: titleInput.value,
        url: urlInput.value
      });
      pluginSettings.saveSetting('dupesList', JSON.stringify(dupes));

      this.parentNode.parentNode.parentNode.querySelector('tbody').appendChild(makeDupeRow({
        title: titleInput.value,
        url: urlInput.value
      }));

      titleInput.value = urlInput.value = '';
    });
    content = cell.appendChild(document.createElement('img'));
    content.setAttribute('src', '../img/add.png');
    content.setAttribute('alt', 'Add');
    content.setAttribute('title', 'Add');

    return cell;
  }
  function makeTableFoot() {
    var tFoot, row;

    tFoot = document.createElement('tfoot');
    row = tFoot.appendChild(document.createElement('tr'));

    row.appendChild(makeTableFootTitleCell());
    row.appendChild(makeTableFootUrlCell());
    row.appendChild(makeTableFootAddCell());

    return tFoot;
  }

  function makeTable() {
    var container, table;

    container = document.createElement('div');
    container.setAttribute('class', 'table');
    table = container.appendChild(document.createElement('table'));

    table.appendChild(makeTableHead());
    table.appendChild(makeTableBody());
    table.appendChild(makeTableFoot());

    return container;
  }

  function makeOverlayDiv() {
    var overlayStyles = "z-index: 1000; position: fixed; top: 0px; left: 0px; margin: 0px; padding: 0px; width: 100%; height: 100%; "
                      + "border: none; background-color: rgb(0, 0, 0); cursor: pointer; opacity: 0;";
    overlayDiv = document.createElement('div');
    overlayDiv.setAttribute('title', 'Click to close popup');
    overlayDiv.setAttribute('style', overlayStyles);
    overlayDiv.addEventListener('click', disappear);
  }
  function makeDisplayDiv() {
    var displayStyles = "z-index: 1011; position: fixed; top: 40%; left: 17%; margin: 0px; padding: 0px; width: 960px; text-align: center; "
                      + "color: #000000; border: 3px solid #AAAAAA; background-color: #FFFFFF; cursor: default; opacity: 0;";
    displayDiv = document.createElement('div');
    displayDiv.setAttribute('title', '');
    displayDiv.setAttribute('style', displayStyles);
    displayDiv.appendChild(makeTable());
    displayDiv.addEventListener('click', function(e) {
      e.stopPropagation();
    });
  }

  this.show = function() {
    addDupesToTable();
    document.body.appendChild(overlayDiv);
    document.body.appendChild(displayDiv);
    appear();
  };

  (function() {
    makeOverlayDiv();
    makeDisplayDiv();
  }());

};