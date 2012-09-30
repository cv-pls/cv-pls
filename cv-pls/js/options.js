/*jslint plusplus: true, white: true, browser: true */
/*global jQuery, $, Settings, PluginSettings */

function SettingsManager(pluginSettings) {

  "use strict";

  this.init = function() {
    if (pluginSettings.getSetting("showIcon")) {
      $('input[name="showIcon"]').prop('checked', 'checked');
    }

    if (pluginSettings.getSetting("oneBox")) {
      $('input[name="oneBox"]').prop('checked', 'checked');
    } else {
      $('input[name="oneBoxHeight"]').attr('disabled', true);
      $('input[name="removeCompletedOneboxes"]').cvHelperToggleInput(false);
    }

    if (pluginSettings.getSetting("oneBoxHeight") !== null) {
      $('input[name="oneBoxHeight"]').val(pluginSettings.getSetting("oneBoxHeight"));
    }

    if (pluginSettings.getSetting("removeCompletedOneboxes")) {
      $('input[name="removeCompletedOneboxes"]').prop('checked', 'checked');
    }

    if (pluginSettings.getSetting("cvPlsButton")) {
      $('input[name="cvPlsButton"]').prop('checked', 'checked');
    }

    if (pluginSettings.getSetting("delvPlsButton")) {
      $('input[name="delvPlsButton"]').prop('checked', 'checked');
    }

    if (pluginSettings.getSetting("soundNotification")) {
      $('input[name="soundNotification"]').prop('checked', 'checked');
    }

    if (pluginSettings.getSetting("avatarNotification")) {
      $('input[name="avatarNotification"]').prop('checked', 'checked');
    } else {
      $('input[name="removeLostNotifications"], input[name="removeCompletedNotifications"]').cvHelperToggleInput(false);
    }

    if (pluginSettings.getSetting("removeLostNotifications")) {
      $('input[name="removeLostNotifications"]').prop('checked', 'checked');
    }

    if (pluginSettings.getSetting("removeCompletedNotifications")) {
      $('input[name="removeCompletedNotifications"]').prop('checked', 'checked');
    }

    if (pluginSettings.getSetting("desktopNotification")) {
      $('input[name="desktopNotification"]').prop('checked', 'checked');
    }

    if (pluginSettings.getSetting("showCloseStatus")) {
      $('input[name="showCloseStatus"]').prop('checked', 'checked');
    } else {
      $('input[name="pollCloseStatus"]').attr('disabled', true);
      $('input[name="pollInterval"]').attr('disabled', true);
    }

    if (pluginSettings.getSetting("pollCloseStatus")) {
      $('input[name="pollCloseStatus"]').prop('checked', 'checked');
    } else {
      $('input[name="pollInterval"]').attr('disabled', true);
    }

    $('input[name="pollInterval"]').val(pluginSettings.getSetting("pollInterval"));

    if (pluginSettings.getSetting("strikethroughCompleted")) {
      $('input[name="strikethroughCompleted"]').prop('checked', 'checked');
    }

    if (pluginSettings.getSetting("backlogEnabled")) {
      $('input[name="backlogEnabled"]').prop('checked', 'checked');
    } else {
      $('input[name="backlogAmount"]').attr('disabled', true);
      $('input[name="backlogRefresh"]').attr('disabled', true);
      $('input[name="backlogRefreshInterval"]').attr('disabled', true);
    }

    $('input[name="backlogAmount"]').val(pluginSettings.getSetting("backlogAmount"));
    $('input[name="backlogRefreshInterval"]').val(pluginSettings.getSetting("backlogRefreshInterval"));

    if (pluginSettings.getSetting("backlogRefresh")) {
      $('input[name="backlogRefresh"]').prop('checked', 'checked');
    } else {
      $('input[name="backlogRefreshInterval"]').attr('disabled', true);
    }

    if (pluginSettings.getSetting("dupesEnabled")) {
      $('input[name="dupesEnabled"]').prop('checked', 'checked');
    }
  };

}

(function($) {

  "use strict";

  var settings, pluginSettings, settingsManager;

  settings = new Settings();
  pluginSettings = new PluginSettings(settings);
  settingsManager = new SettingsManager(pluginSettings);

  settingsManager.init();

  $('input[name="showIcon"]').change(function() {
    settings.saveSetting('showIcon', $(this).prop('checked'));
  });

  $('input[name="oneBox"]').change(function() {
    var checked = $(this).prop('checked');
    settings.saveSetting('oneBox', checked);
    $('input[name="oneBoxHeight"]').attr('disabled', !checked);
    $('input[name="removeCompletedOneboxes"]').cvHelperToggleInput(checked);
  });

  $('input[name="oneBoxHeight"]').keyup(function() {
    settings.saveSetting('oneBoxHeight', $(this).val());
  });

  $('input[name="removeCompletedOneboxes"]').change(function() {
    settings.saveSetting('removeCompletedOneboxes', $(this).prop('checked'));
  });

  $('input[name="cvPlsButton"]').change(function() {
    settings.saveSetting('cvPlsButton', $(this).prop('checked'));
  });

  $('input[name="delvPlsButton"]').change(function() {
    settings.saveSetting('delvPlsButton', $(this).prop('checked'));
  });

  $('input[name="soundNotification"]').change(function() {
    settings.saveSetting('soundNotification', $(this).prop('checked'));
  });

  $('input[name="avatarNotification"]').change(function() {
    var checked = $(this).prop('checked');
    settings.saveSetting('avatarNotification', checked);
    $('input[name="removeLostNotifications"], input[name="removeCompletedNotifications"]').cvHelperToggleInput(checked);
  });

  $('input[name="removeLostNotifications"]').change(function() {
    settings.saveSetting('removeLostNotifications', $(this).prop('checked'));
  });

  $('input[name="removeCompletedNotifications"]').change(function() {
    settings.saveSetting('removeCompletedNotifications', $(this).prop('checked'));
  });

  $('input[name="desktopNotification"]').change(function() {
    settings.saveSetting('desktopNotification', $(this).prop('checked'));
  });

  $('input[name="showCloseStatus"]').change(function() {
    var checked, $poll;
    checked = $(this).prop('checked');
    settings.saveSetting('showCloseStatus', checked);

    if (checked) {
      $poll = $('input[name="pollCloseStatus"]');
      $poll.removeAttr('disabled');
      if ($poll.prop('checked')) {
        $(':input[name="pollInterval"]').removeAttr('disabled');
      } else {
        $(':input[name="pollInterval"]').attr('disabled', true);
      }
    } else {
      $(':input[name="pollCloseStatus"]').attr('disabled', true);
      $(':input[name="pollInterval"]').attr('disabled', true);
    }
  });

  $('input[name="pollCloseStatus"]').change(function() {
    var checked = $(this).prop('checked');
    settings.saveSetting('pollCloseStatus', checked);
    $('input[name="pollInterval"]').attr('disabled', !checked);
  });

  $('input[name="pollInterval"]').keyup(function() {
    settings.saveSetting('pollInterval', $(this).val());
  });

  $('input[name="strikethroughCompleted"]').change(function() {
    settings.saveSetting('strikethroughCompleted', $(this).prop('checked'));
  });

  $('input[name="backlogEnabled"]').change(function() {
    var checked, $refresh;
    checked = $(this).prop('checked');
    settings.saveSetting('backlogEnabled', checked);

    if (checked) {
      $('input[name="backlogAmount"]').removeAttr('disabled');
      $refresh = $('input[name="backlogRefresh"]');
      $refresh.removeAttr('disabled');
      if ($refresh.prop('checked')) {
        $(':input[name="backlogRefreshInterval"]').removeAttr('disabled');
      } else {
        $(':input[name="backlogRefreshInterval"]').attr('disabled', true);
      }
    } else {
      $(':input[name="backlogAmount"]').attr('disabled', true);
      $(':input[name="backlogRefresh"]').attr('disabled', true);
      $(':input[name="backlogRefreshInterval"]').attr('disabled', true);
    }
  });

  $('input[name="backlogAmount"]').keyup(function() {
    settings.saveSetting('backlogAmount', $(this).val());
  });

  $('input[name="backlogRefresh"]').change(function() {
    var checked = $(this).prop('checked');
    settings.saveSetting('backlogRefresh', checked);

    $(':input[name="backlogRefreshInterval"]').attr('disabled', !checked);
  });

  $('input[name="backlogRefreshInterval"]').keyup(function() {
    settings.saveSetting('backlogRefreshInterval', $(this).val());
  });

  $('input[name="dupesEnabled"]').change(function() {
    var checked = $(this).prop('checked');
    settings.saveSetting('dupesEnabled', checked);
  });

  $('input[name="showDupes"]').click(function() {
    var $dupesList, $heading, dupes, html, max, i;

    $dupesList = $('.dupesList');
    $heading = $('.heading', $dupesList);

    dupes = pluginSettings.getSetting("dupesList");

    if (dupes.length) {
      max = dupes.length;

      for(i = 0; i < max; i++) {
        html = '';
        html+= '<tr>';
        html+= '  <td class="title">' + dupes[i].title + '</td>';
        html+= '  <td class="url">' + dupes[i].url + '</td>';
        html+= '  <td class="delete"><img src="ui/delete.png" alt="delete" title="Delete"></td>';
        html+= '</tr>';

        $heading.after(html);
      }
    }

    $.blockUI({
      message: $dupesList.html(),
      css: {
        width: '960px',
        left: '17%',
        cursor: 'default'
      },
      onUnblock: function(){
        $('tr:not(.heading, .footer)', $dupesList).remove();
      }
    });
    $('.blockOverlay').click($.unblockUI);
  });

  $(document).on('click', '.table .delete', function() {
    var $row, $title, $url, dupes, max, i;

    $row = $(this).closest('tr');
    $title = $('.title', $row);
    $url = $('.url', $row);

    dupes = pluginSettings.getSetting("dupesList");
    max = dupes.length;
    for (i = 0; i < max; i++) {
      if (dupes[i].title === $title.text() && dupes[i].url === $url.text()) {
        dupes.splice(i, 1);
        break;
      }
    }

    settings.saveSetting('dupesList', JSON.stringify(dupes));

    $row.remove();
  });

  $(document).on('click', '.table .add', function() {
    var $row, $title, $url, dupes, html;

    $row = $(this).closest('tr');
    $title = $('[name="title"]', $row);
    $url = $('[name="url"]', $row);

    dupes = pluginSettings.getSetting("dupesList");
    dupes.push({
      title: $title.val(),
      url: $url.val()
    });

    settings.saveSetting('dupesList', JSON.stringify(dupes));

    html  = '<tr>';
    html += '  <td class="title">' + $title.val() + '</td>';
    html += '  <td class="url">' + $url.val() + '</td>';
    html += '  <td class="delete"><img src="ui/delete.png" alt="delete" title="Delete"></td>';
    html += '</tr>';

    $('.heading', $(this).closest('table')).after(html);
    $title.val('');
    $url.val('');
  });
}(jQuery));