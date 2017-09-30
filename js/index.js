$(function() {
    var socket = io.connect('http://localhost:3000');
    $('form').submit(function() {
        // Get current tab
        chrome.tabs.query({'active': true, 'currentWindow': true}, function (tabs) {
            // Get tab's address
            var url = tabs[0].url;

            // Send tab's address with the tag as a pair to the server
            if(isValidURL(url)) {
                socket.emit('post', $('#tag').val(), url);
            } else {
                $('#tag').attr('placeholder', 'Current tab is not an url'); 
            }

            // Empty the textfield
            $('#tag').val('');
        });
        return false;
    });

    // When client receive data from server
    socket.on('receive', function(tag, link) {
        $('#linklist').append($('<li>').text(link));
    });
});

// Predicate to check if tab address is a url with regex
function isValidURL(str) {
    var regex = /(http|https):\/\/(\w+:{0,1}\w*)?(\S+)(:[0-9]+)?(\/|\/([\w#!:.?+=&%!\-\/]))?/;
    if(!regex .test(str)) {
        return false;
    } else {
        return true;
    }
}

