var app = require('express')();
var http = require('http').createServer(app);
var io = require('socket.io')(http);

// app.get('/',function(req, res) {
//    res.sendFile(__dirname + '/html/index.html');
// });

io.on('connection', function(socket) {
    console.log('connected');
    socket.on('post', function(tag, link) {

        io.emit('receive', tag, link);
       // socket.broadcast.emit('chat message', msg);
    });
});

http.listen(3000, function() {
    console.log('listening on *:3000');
});
