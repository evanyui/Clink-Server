$(function() {
    var socket = io.connect('http://localhost:3000');
    $('form').submit(function() {
        chrome.tabs.query({'active': true, 'currentWindow': true}, function (tabs) {
            var url = tabs[0].url;
            $('#tag').val('');
            if(isValidURL(url)) {
                socket.emit('post', $('#tag').val(), url);
            } else {
                $('#tag').attr('placeholder', 'Current tab is not an url'); 
            }
        });
        return false;
    });

    socket.on('receive', function(tag, link) {
        $('#linklist').append($('<li>').text(link));
    });
});


function isValidURL(str) {
    var regex = /(http|https):\/\/(\w+:{0,1}\w*)?(\S+)(:[0-9]+)?(\/|\/([\w#!:.?+=&%!\-\/]))?/;
    if(!regex .test(str)) {
        return false;
    } else {
        return true;
    }
}

