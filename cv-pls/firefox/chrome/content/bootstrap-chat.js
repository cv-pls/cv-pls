CvPlsHelper.BootStraps.Chat = {};

CvPlsHelper.chatBootstrap = function(doc) {
};

CvPlsHelper.chatShutdown = function(e) {
};

CvPlsHelper.questionBootstrap = function(doc) {
};

CvPlsHelper.questionShutdown = function(e) {};

CvPlsHelper.onPageLoad = function(e) {
  var doc = e.originalTarget;

  if (/^https?:\/\/stackoverflow.com\/(rooms|transcript)\//i.test(doc.location.href)) {
    CvPlsHelper.chatBootstrap(doc);
    doc.defaultView.addEventListener("unload", CvPlsHelper.chatShutdown, true);
  } else if (/^https?:\/\/stackoverflow.com\/questions\//i.test(doc.location.href)) {
    CvPlsHelper.questionBootstrap(doc);
    doc.defaultView.addEventListener("unload", CvPlsHelper.questionShutdown, true);
  }
};

CvPlsHelper.onWindowLoad = function() {
  window.removeEventListener("load", cvPlsHelper.onWindowLoad); // Should only run once
  cvPlsHelper.content = document.getElementById('appcontent');
  cvPlsHelper.content.addEventListener("DOMContentLoaded", CvPlsHelper.onPageLoad, true);
};

window.addEventListener("load", CvPlsHelper.onWindowLoad);