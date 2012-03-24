var notify_node = document.createElement('div');
notify_node.id = 'custom-communicationDIV';
document.documentElement.appendChild(notify_node);

notify_node.addEventListener('CustomJPlayerNotify', function() {
  var eventData = notify_node.innerText;
  if (eventData == 'notify'){
    $('#jplayer').jPlayer('play', 0);
  }
});