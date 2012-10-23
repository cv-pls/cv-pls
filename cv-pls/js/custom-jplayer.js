var notifyNode = document.createElement('div');
notifyNode.setAttribute('id', 'custom-communicationDIV');
document.documentElement.appendChild(notifyNode);

notifyNode.addEventListener('CustomJPlayerNotify', function() {
  var eventData = notifyNode.innerText;
  if (eventData === 'notify'){
    $('#jplayer').jPlayer('play', 0);
  }
});