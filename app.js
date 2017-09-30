var app = require('express')();
var http = require('http').createServer(app);
var io = require('socket.io')(http);
var mongoClient = require('mongodb').MongoClient;

var url = 'mongodb://localhost:27017/clink';

// app.get('/',function(req, res) {
//    res.sendFile(__dirname + '/html/index.html');
// });

io.on('connection', function(socket) {
    console.log('connected');
    socket.on('post', function(tag, link) {
        // Connect to mongodb
        mongoClient.connect(url, function(err, db) {
            var collection = db.collection('documents');
            insertDocuments(link, tag, collection, function() {
                // Search everything from the collection and print result
                collection.find({}).toArray(function(err, result) {
                    console.log(result);
                });

                // Close the db at the end always
                db.close();
            });
        });

        // Send the tag link pair to every client
        io.emit('receive', tag, link);
    });
});

// Helper function to insert documents to db
var insertDocuments = function(link, tag, collection, callback) {
    var document = { key: tag, url: link};
    collection.insertOne(document, function(err, result) {
        callback(result);
    });
}

http.listen(3000, function() {
    console.log('listening on *:3000');
});
