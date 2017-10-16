var express = require('express');
var app = express();
var fs = require('fs');
// This line is from the Node.js HTTPS documentation.
var options = {
    key: fs.readFileSync('keys/key.pem'),
    cert: fs.readFileSync('keys/cert.pem'),
};
var https = require('https').createServer(options, app);
var io = require('socket.io')(https);
var mongoClient = require('mongodb').MongoClient;

// Set path to get external js
var path = require('path');
var src = path.dirname(require.main.filename);
var util = require(src + '/utils');

var dbURL = 'mongodb://localhost:27017/clink';

// Router function
app.use("/css", express.static(path.resolve('../Clink-Client/css')));
app.use("/js", express.static(path.resolve('../Clink-Client/js')));
app.get('/',function(req, res) {
   res.sendFile(path.resolve('../Clink-Client/html/index.html'));
});

// Never close db connection so that database can be reuse
// db.close();
var db, collection;

// Connect the database explicitly to create pooling database
mongoClient.connect(dbURL, (err, database) => {
    if(err)
        throw err;

    db = database;
    // Find collection, create one if does not exist
    collection = database.collection('documents');
    
    // Setting document expiration time of 1 hour
    collection.createIndex( { "createdAt": 1 }, { expireAfterSeconds: 3600 } )
});

// When a user is connected
io.on('connection', (socket) => {
    // Logging purpose only
    console.log(socket.id + ' connected');

    // When user disconnected
    socket.on('disconnect', () => {
        console.log(socket.id + ' disconnected');
    });

    // When user post link
    socket.on('post', (tagsString, link) => {
        var documents = util.createDocuments(tagsString, link); 
        dbInsert(documents);
    });

    // When user query tags
    socket.on('query', (tagsString) => {
        var query = util.createQuery(tagsString);
        dbQuery(query);
    });

    // When user join room, also query the room tag automatically
    socket.on('subscribe', (room) => {
        room = util.stringToArray(room)[0]; // only get the first tag if there are multiple
        socket.join(room);
        socket.emit('subscribe_callback', room);
    });

    // When user leave room
    socket.on('unsubscribe', (room) => {
        socket.leave(room);
        socket.emit('unsubcribe_callback', room);
    });

    // Insert documents into database
    var dbInsert = function(documents) {
        collection.insertMany(documents, (err, res) => {
            // Callback function
            console.log(res);

            // Respond posted links to all in room
            io.to(res.ops[0].key).emit('receive', res.ops);
        });
    }

    // Query database
    var dbQuery = function(query) {
        // Search db with query and return result filter with flags
        var resultFlags = {_id: false, key: true, url: true, "createdAt": true};
        collection.find(query, resultFlags).toArray((err, res) => {
            // Callback function
            console.log(res);

            // Respond query result to client
            socket.emit('receive', res);
        });
    }

});

// Server starts listening
https.listen(3000, () => {
    console.log('listening on *:3000');
});

