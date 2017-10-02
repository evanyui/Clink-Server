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
    socket.on('post', function(tagString, link) {
        // Connect to mongodb
        mongoClient.connect(url, function(err, db) {
            var collection = db.collection('documents');
            var documents = createDocuments(tagString, link); 
            insertDocuments(documents, collection, function() {

                // FOR TESTING
                // Search everything from the collection and print result
                collection.find({}).toArray(function(err, result) {
                    console.log(result);
                });

                // Close the db at the end always
                db.close();
            });
        });

        // TODO: Will replaced by return query result only when user query db
        // FOR TESTING
        // Send the tag link pair to every client
        io.emit('receive', tagString, link);
    });
});

// Helper function to create documents with different tags on one link
var createDocuments = function(tagString, link) {
    // To prevent duplication, use set to convert from and to array
    var tags = Array.from(new Set(tagString.split(/[ ,]+/)));
    var documents = [];
    tags.forEach(function(tag) {
        documents.push({key: tag, url: link});
    });
    return documents;
}

// Helper function to insert documents to db
var insertDocuments = function(documents, collection, callback) {
    collection.insertMany(documents, function(err, result) {
        callback(result);
    });
}

http.listen(3000, function() {
    console.log('listening on *:3000');
});
