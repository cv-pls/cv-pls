CvPlsHelper.StatusRequestProcessor = function(pluginSettings, voteRequestFormatter, avatarNotification) {

  "use strict";

  var self = this;
  this.voteRequestFormatter = voteRequestFormatter;
  this.avatarNotification = avatarNotification;

  this.process = function(buffer, items) {
    var i, question, post, $title;

    for (i = 0; i < buffer.items; i++) {
      post = buffer.posts[i];
      question = self.getQuestionById(items, post.questionId);

      if (question) {
        if (question.closed_date !== undefined) { // question is closed

          if (post.voteType === post.voteTypes.CV) {
            if (pluginSettings.getSetting("removeCompletedNotifications")) {
              self.avatarNotification.dequeue(post.id);
            }
            if (pluginSettings.getSetting("removeCompletedOneboxes")) {
              self.voteRequestFormatter.removeOnebox(post);
            }
            if (pluginSettings.getSetting("strikethroughCompleted")) {
              self.voteRequestFormatter.strikethrough(post);
            }
          }

          if (pluginSettings.getSetting("showCloseStatus") && !post.$post.hasClass('cvhelper-closed')) {
            $title = $('.onebox .cvhelper-question-link', post.$post);
            $title.html($title.html() + ' [closed]');
            post.$post.addClass('cvhelper-closed');
          }
        }

      } else { // question is deleted

        if (pluginSettings.getSetting("removeCompletedNotifications")) {
          self.avatarNotification.dequeue(post.id);
        }
        if (pluginSettings.getSetting("removeCompletedOneboxes")) {
          self.voteRequestFormatter.removeOnebox(post);
        }
        if (pluginSettings.getSetting("strikethroughCompleted")) {
          self.voteRequestFormatter.strikethrough(post);
        }

      }
    }
  };

  // Fetches a question from the returned JSON object by question ID
  this.getQuestionById = function(items, questionId) {
    var length = items.length, i;
    for (i = 0; i < length; i++) {
      if (items[i].question_id === questionId) {
        return items[i];
      }
    }

    return null;
  };

};