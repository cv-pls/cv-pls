function SettingsManager(pluginSettings) {
  this.init = function() {
    if (pluginSettings.showIcon()) {
      $('input[name="icon"]').prop('checked', 'checked');
    }

    if (pluginSettings.oneBox()) {
      $('input[name="oneboxcv"]').prop('checked', 'checked');
    } else {
      $('input[name="oneboxheight"]').attr('disabled', true);
    }

    if (pluginSettings.oneBoxHeight() !== null) {
      $('input[name="oneboxheight"]').val(pluginSettings.oneBoxHeight());
    }

    if (pluginSettings.cvPlsButton()) {
      $('input[name="cvbutton"]').prop('checked', 'checked');
    }

    if (pluginSettings.delvPlsButton()) {
      $('input[name="delvbutton"]').prop('checked', 'checked');
    }

    if (pluginSettings.soundNotification()) {
      $('input[name="beep"]').prop('checked', 'checked');
    }

    if (pluginSettings.avatarNotification()) {
      $('input[name="avatar"]').prop('checked', 'checked');
    }

    if (pluginSettings.removeLostNotifications()) {
      $('input[name="avatarlost"]').prop('checked', 'checked');
    }

    if (pluginSettings.removeCompletedNotifications()) {
      $('input[name="avatarcomplete"]').prop('checked', 'checked');
    }

    if (pluginSettings.desktopNotification()) {
      $('input[name="desktop"]').prop('checked', 'checked');
    }

    if (pluginSettings.showCloseStatus()) {
      $('input[name="status"]').prop('checked', 'checked');
    } else {
      $('input[name="poll"]').attr('disabled', true);
      $('input[name="pollinterval"]').attr('disabled', true);
    }

    if (pluginSettings.pollCloseStatus()) {
      $('input[name="poll"]').prop('checked', 'checked');
    } else {
      $('input[name="pollinterval"]').attr('disabled', true);
    }

    $('input[name="pollinterval"]').val(pluginSettings.pollInterval());

    if (pluginSettings.backlogEnabled()) {
      $('input[name="backlog"]').prop('checked', 'checked');
    } else {
      $('input[name="backlogamount"]').attr('disabled', true);
      $('input[name="backlogrefresh"]').attr('disabled', true);
      $('input[name="backloginterval"]').attr('disabled', true);
    }

    $('input[name="backlogamount"]').val(pluginSettings.backlogAmount());
    $('input[name="backloginterval"]').val(pluginSettings.backlogRefreshInterval());

    if (pluginSettings.backlogRefresh()) {
      $('input[name="backlogrefresh"]').prop('checked', 'checked');
    } else {
      $('input[name="backloginterval"]').attr('disabled', true);
    }

    if (pluginSettings.dupesEnabled()) {
      $('input[name="dupes"]').prop('checked', 'checked');
    }
  }
}

(function($) {
  var settings = new Settings();
  var pluginSettings = new PluginSettings(settings);
  var settingsManager = new SettingsManager(pluginSettings);
  settingsManager.init();

  $('input[name="icon"]').change(function() {
    settings.saveSetting('showIcon', $(this).prop('checked'));
  });

  $('input[name="oneboxcv"]').change(function() {
    var checked = $(this).prop('checked');
    settings.saveSetting('oneBox', checked);

    if (checked) {
      $(':input[name="oneboxheight"]').removeAttr('disabled');
    } else {
      $(':input[name="oneboxheight"]').attr('disabled', true);
    }
  });

  $('input[name="oneboxheight"]').keyup(function() {
    settings.saveSetting('oneBoxHeight', $(this).val());
  });

  $('input[name="cvbutton"]').change(function() {
    settings.saveSetting('cvPlsButton', $(this).prop('checked'));
  });

  $('input[name="delvbutton"]').change(function() {
    settings.saveSetting('delvPlsButton', $(this).prop('checked'));
  });

  $('input[name="beep"]').change(function() {
    settings.saveSetting('soundNotification', $(this).prop('checked'));
  });

  $('input[name="avatar"]').change(function() {
    var checked = $(this).prop('checked');

    settings.saveSetting('avatarNotification', checked);

    $('#avatarlost, #avatarcomplete').each(function() {
      $('input[type="checkbox"]', this).prop('disabled', !checked);
      if (checked) {
        $(this).addClass('disabled');
      } else {
        $(this).removeClass('disabled');
      }
    });
  });

  $('input[name="avatarlost"]').change(function() {
    settings.saveSetting('removeLostNotifications', $(this).prop('checked'));
  });

  $('input[name="avatarcomplete"]').change(function() {
    settings.saveSetting('removeCompletedNotifications', $(this).prop('checked'));
  });

  $('input[name="desktop"]').change(function() {
    settings.saveSetting('desktopNotification', $(this).prop('checked'));
  });

  $('input[name="status"]').change(function() {
    var checked = $(this).prop('checked');
    settings.saveSetting('showCloseStatus', checked);

    if (checked) {
      var $poll = $('input[name="poll"]');
      $poll.removeAttr('disabled');
      if ($($poll).prop('checked')) {
        $(':input[name="pollinterval"]').removeAttr('disabled');
      } else {
        $(':input[name="pollinterval"]').attr('disabled', true);
      }
    } else {
      $(':input[name="poll"]').attr('disabled', true);
      $(':input[name="pollinterval"]').attr('disabled', true);
    }
  });

  $('input[name="poll"]').change(function() {
    var checked = $(this).prop('checked');
    settings.saveSetting('pollCloseStatus', checked);

    if (checked) {
      $('input[name="pollinterval"]').removeAttr('disabled');
    } else {
      $('input[name="pollinterval"]').attr('disabled', true);
    }
  });

  $('input[name="pollinterval"]').keyup(function() {
    settings.saveSetting('pollInterval', $(this).val());
  });

  $('input[name="backlog"]').change(function() {
    var checked = $(this).prop('checked');
    settings.saveSetting('backlogEnabled', checked);

    if (checked) {
      $('input[name="backlogamount"]').removeAttr('disabled');
      var $refresh = $('input[name="backlogrefresh"]');
      $refresh.removeAttr('disabled');
      if ($refresh.prop('checked')) {
        $(':input[name="backloginterval"]').removeAttr('disabled');
      } else {
        $(':input[name="backloginterval"]').attr('disabled', true);
      }
    } else {
      $(':input[name="backlogamount"]').attr('disabled', true);
      $(':input[name="backlogrefresh"]').attr('disabled', true);
      $(':input[name="backloginterval"]').attr('disabled', true);
    }
  });

  $('input[name="backlogamount"]').keyup(function() {
    settings.saveSetting('backlogAmount', $(this).val());
  });

  $('input[name="backlogrefresh"]').change(function() {
    var checked = $(this).prop('checked');
    settings.saveSetting('backlogRefresh', checked);

    if (checked) {
      $(':input[name="backloginterval"]').removeAttr('disabled');
    } else {
      $(':input[name="backloginterval"]').attr('disabled', true);
    }
  });

  $('input[name="backloginterval"]').keyup(function() {
    settings.saveSetting('backlogRefreshInterval', $(this).val());
  });

  $('input[name="dupes"]').change(function() {
    var checked = $(this).prop('checked');
    settings.saveSetting('dupesEnabled', checked);
  });

  $('input[name="showdupes"]').click(function() {
    var $dupeslist = $('.dupeslist');
    var $heading = $('.heading', $dupeslist);

    var dupes = pluginSettings.dupesList();

    if (dupes !== []) {
      var html = '';
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
      message: $dupeslist.html(),
      css: {
        width: '960px',
        left: '17%',
        cursor: 'default'
      },
      onUnblock: function(){
        $('tr:not(.heading, .footer)', $dupeslist).remove();
      }
    });
    $('.blockOverlay').click($.unblockUI);
  });

  $(document).on('click', '.table .delete', function() {
    var $row = $(this).closest('tr');
    var $title = $('.title', $row);
    var $url = $('.url', $row);

    var dupes = pluginSettings.dupesList();
    var max = dupes.length;
    for(i = 0; i < max; i++) {
      if (dupes[i].title == $title.text() && dupes[i].url == $url.text()) {
        dupes.splice(i, 1);
        break;
      }
    }

    settings.saveSetting('dupesList', JSON.stringify(dupes));

    $row.remove();
  });

  $(document).on('click', '.table .add', function() {
    var $row = $(this).closest('tr');
    var $title = $('[name="title"]', $row);
    var $url = $('[name="url"]', $row);

    var dupes = pluginSettings.dupesList();
    dupes.push({
      title: $title.val(),
      url: $url.val()
    });

    settings.saveSetting('dupesList', JSON.stringify(dupes));

    var html = '';
    html += '<tr>';
    html += '  <td class="title">' + $title.val() + '</td>';
    html += '  <td class="url">' + $url.val() + '</td>';
    html += '  <td class="delete"><img src="ui/delete.png" alt="delete" title="Delete"></td>';
    html += '</tr>';

    $('.heading', $(this).closest('table')).after(html);
    $title.val('');
    $url.val('');
  });
})(jQuery);