CvPlsHelper.VoteRequestProcessor = function(pluginSettings, voteRequestFormatter, audioPlayer, avatarNotification) {

  "use strict";

  var self = this;

  this.process = function(buffer, items) {
    var newQuestions = false, i, question, post;
    for (i = 0; i < buffer.items; i++) {
      post = buffer.posts[i];
      question = self.getQuestionById(items, buffer.questionIds[i]);

      if (!question) { // Question is deleted

        if (!pluginSettings.getSetting("removeCompletedNotifications")) {
          avatarNotification.enqueue(post);
        }
        if (pluginSettings.getSetting("strikethroughCompleted")) {
          voteRequestFormatter.strikethrough(post, question);
        }

      } else if (question.closed_date !== undefined) { // Question is closed

        newQuestions = true;

        if (post.voteType === post.voteTypes.DELV) {

          if (post.postType !== post.postTypes.EDIT) {
            avatarNotification.enqueue(post);
          }

          if (pluginSettings.getSetting("oneBox")) {
            voteRequestFormatter.addOnebox(post.$post, question);
          }

        } else {

          if (post.postType !== post.postTypes.EDIT && !pluginSettings.getSetting("removeCompletedNotifications")) {
            avatarNotification.enqueue(post);
          }

          if (pluginSettings.getSetting("oneBox") && !pluginSettings.getSetting("removeCompletedOneboxes")) {
            voteRequestFormatter.addOnebox(post.$post, question);
          }

          if (pluginSettings.getSetting("strikethroughCompleted")) {
            voteRequestFormatter.strikethrough(post, question);
          }

        }

      } else { // Question is open

        newQuestions = true;

        if (post.postType !== post.postTypes.EDIT) {
          avatarNotification.enqueue(post);
        }

        if (pluginSettings.getSetting("oneBox")) {
          voteRequestFormatter.addOnebox(post.$post, question);
        }

      }

    }

    if (newQuestions && pluginSettings.getSetting("soundNotification")) {
      audioPlayer.playNotification();
    }
    // enable audioplayer after initial load
    audioPlayer.enable();
  };

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