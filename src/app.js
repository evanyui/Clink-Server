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
var ObjectID = require('mongodb').ObjectID;

// Set path to get external js
var path = require('path');
var src = path.dirname(require.main.filename);
var util = require(src + '/utils');

var dbURL = 'mongodb://34.213.81.60:443/clink';

// Router function
app.use("/css", express.static(path.resolve('../Clink-Client/css')));
app.use("/js", express.static(path.resolve('../Clink-Client/js')));
app.use("/images", express.static(path.resolve('../Clink-Client/images')));
app.get('/',function(req, res) {
   res.sendFile(path.resolve('../Clink-Client/html/page.html'));
});
app.get('/popup',function(req, res) {
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
    collection.createIndex( { 'createdAt': 1 }, { expireAfterSeconds: 3600 } )
});

// Global
var DEFAULT_KEY_LENGTH = 3;

// When a user is connected
io.on('connection', (socket) => {
    // Logging purpose only
    console.log(socket.id + ' connected');

    // When user disconnected
    socket.on('disconnect', () => {
        console.log(socket.id + ' disconnected');
    });

    // When user post link
    socket.on('post', (tag, link) => {
        var doc = util.createDocument(tag, link); 
        dbUpdate(doc);
    });

    // When user query tags
    socket.on('query', (tag) => {
        var query = util.createQuery({key: tag});
        dbQuery(query);
    });

    // When user join room, also query the room tag automatically
    socket.on('subscribe', (room) => {
        room = util.formatCaseAndSpace(room); 
        socket.join(room);
        socket.emit('subscribe_callback', room);
    });

    // When user leave room
    socket.on('unsubscribe', (room) => {
        socket.leave(room);
        socket.emit('unsubcribe_callback', room);
    });

    // Insert documents into database
    var dbUpdate = function(doc) {
        if(!doc.key.trim())
            doc.key = new ObjectID().toHexString().substring(0, DEFAULT_KEY_LENGTH);

        collection.findOneAndUpdate({key: doc.key, url: doc.url},
                          doc,
                          {upsert: true},
                          (err, res) => {
                              // Callback function
                              console.log('\nUpdate Results:');
                              console.log(res);

                              // Respond posted links to all in room
                              socket.broadcast.to(doc.key).emit('receive', [doc]);
                              socket.emit('joinRoom', doc.key);

                              // Automatically query all the other links with same key
                              dbQuery(util.createQuery({key: doc.key}));
                          });
    }

    // Query database
    var dbQuery = function(query) {
        // Search db with query and return result filter with flags
        var resultFlags = util.createFlags();
        collection.find(query, resultFlags).toArray((err, res) => {
            // Callback function
            console.log('\nQuery Results:');
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

