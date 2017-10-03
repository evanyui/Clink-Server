var app = require('express')();
var http = require('http').createServer(app);
var io = require('socket.io')(http);
var mongoClient = require('mongodb').MongoClient;

var url = 'mongodb://localhost:27017/clink';

// app.get('/',function(req, res) {
//    res.sendFile(__dirname + '/html/index.html');
// });

// When a user is connected
io.on('connection', function(socket) {
    // Logging purpose only
    console.log('connected');

    // When user post link with tags
    socket.on('post', function(tagsString, link) {
        var documents = createDocuments(tagsString, link); 
        dbInsert(documents);
    });

    // When user query links
    socket.on('query', function(tagsString) {
        var query = createQuery(tagsString);
        dbQuery(query);
    });

    // Create respond to client side
    var respond = function(res) {
        socket.emit('receive', res);
    }

    // Insert documents into database
    var dbInsert = function(documents) {
        // Connect to mongodb
        mongoClient.connect(url, function(err, db) {
            // Find database, create one if does not exist
            var collection = db.collection('documents');
            collection.insertMany(documents, function(err, res) {
                // Callback function
                // Log insert result, may fail
                console.log(res);

                // Close the db at the end, always
                db.close();
            });
        });
    }

    // Query database
    var dbQuery = function(query) {
        // Connect to mongodb
        mongoClient.connect(url, function(err, db) {
            // Find database, careate one if does not exist
            var collection = db.collection('documents');
            // Search db with query and return result filter with flags
            var resultFlags = {_id: false, key: true, url: true};
            collection.find(query, resultFlags).toArray(function(err, res) {
                // Callback function
                console.log(res);
                // Respond results to client side
                respond(res);

                // Close the db at the end, always
                db.close();
            });
        });
    }
});

// Helper function to decode string into arrays
// with commas and spaces
var stringToArray = function(string) {
    return string.split(/[ ,]+/);
}

// Helper function to create query object to search db
var createQuery = function(tagsString) {
    var tags = Array.from(new Set(stringToArray(tagsString)));
    var queryPredicates = [];
    tags.forEach(function(tag) {
        queryPredicates.push({key: tag});
    });

    return {$or: queryPredicates};
}

// Helper function to create documents with different tags on one link
var createDocuments = function(tagsString, link) {
    // To prevent duplication, use set to convert from array and back to array
    var tags = Array.from(new Set(stringToArray(tagsString)));
    var documents = [];
    tags.forEach(function(tag) {
        documents.push({key: tag, url: link});
    });
    return documents;
}

// Server starts listening
http.listen(3000, function() {
    console.log('listening on *:3000');
});

