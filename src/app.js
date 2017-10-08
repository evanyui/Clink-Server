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

    // When user post link with tags
    socket.on('post', function(tagsString, link) {
        var documents = util.createDocuments(tagsString, link); 
        dbInsert(documents);
    });

    // When user query links
    socket.on('query', function(tagsString) {
        var query = util.createQuery(tagsString);
        dbQuery(query);
    });

    // Create respond to client side
    var respond = function(res) {
        socket.emit('receive', res);
    }

    // Insert documents into database
    var dbInsert = function(documents) {
        collection.insertMany(documents, function(err, res) {
            // Callback function
            // Log insert result, may fail
            console.log(res);
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
            respond(res);
        });
    }

});

// Server starts listening
http.listen(3000, function() {
    console.log('listening on *:3000');
});

