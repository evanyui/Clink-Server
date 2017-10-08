var app = require('express')();
var http = require('http').createServer(app);
var io = require('socket.io')(http);
var mongoClient = require('mongodb').MongoClient;

var path = require('path');
var src = path.dirname(require.main.filename);
var util = require(src + '/utils');

var url = 'mongodb://localhost:27017/clink';

// Router function
// app.get('/',function(req, res) {
//    res.sendFile(__dirname + '/html/index.html');
// });

// Never close db connection so that database can be reuse
// db.close();
var db, collection;

// Connect the database explicitly to create pooling database
mongoClient.connect(url, function(err, database) {
    if(err)
        throw err;

    db = database;
    // Find collection, create one if does not exist
    collection = database.collection('documents');
});

// When a user is connected
io.on('connection', function(socket) {
    // Logging purpose only
    console.log('connected');

    // When user post link
    socket.on('post', function(tagsString, link) {
        var documents = util.createDocuments(tagsString, link); 
        dbInsert(documents);
    });

    // When user query tags
    socket.on('query', function(tagsString) {
        var query = util.createQuery(tagsString);
        dbQuery(query);
    });

    // When user join room, also query the room tag automatically
    socket.on('subscribe', function(room) {
        room = util.stringToArray(room)[0]; // only get the first tag if there are multiple
        socket.join(room);
        socket.emit('subscribe_callback', room);
    });

    // When user leave room
    socket.on('unsubscribe', function(room) {
        socket.leave(room);
        socket.emit('unsubcribe_callback', room);
    });

    // Insert documents into database
    var dbInsert = function(documents) {
        collection.insertMany(documents, function(err, res) {
            // Callback function
            console.log(res);

            // Respond posted links to all in room
            io.emit('receive', res.ops);
        });
    }

    // Query database
    var dbQuery = function(query) {
        // Search db with query and return result filter with flags
        var resultFlags = {_id: false, key: true, url: true};
        collection.find(query, resultFlags).toArray(function(err, res) {
            // Callback function
            console.log(res);

            // Respond query result to client
            socket.emit('receive', res);
        });
    }

});

// Server starts listening
http.listen(3000, function() {
    console.log('listening on *:3000');
});

