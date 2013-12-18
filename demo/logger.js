lsCache('zepto.js', function($){
  var div = $('<div />').css({
    'position': 'fixed',
    'left': '0',
    'top': '0',
    'background': 'rgba(255,255,255,0.3)'
  });
  $(function(){
    div.appendTo('body');
  });
  function log(msg){
    $('<p />').html(msg).appendTo(div);
  }
  return {
    log: log
  };
});

