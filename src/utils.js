// Function to create query object to search db
var createQuery = function(tagsString) {
    var tags = Array.from(new Set(stringToArray(tagsString)));
    var queryPredicates = [];
    tags.forEach(function(tag) {
        queryPredicates.push({key: tag});
    });
    return {$or: queryPredicates};
}

// Function to create documents with different tags on one link
var createDocuments = function(tagsString, link) {
    // To prevent duplication, use set to convert from array and back to array
    var tags = Array.from(new Set(stringToArray(tagsString)));
    var documents = [];
    tags.forEach(function(tag) {
        documents.push({key: tag, url: link, "createdAt": new Date()});
    });
    return documents;
}

// Helper function to decode string into arrays
// with commas and spaces
var stringToArray = function(string) {
    return string.split(/[ ,]+/);
}

module.exports = {
    createQuery,
    createDocuments,
    stringToArray
};


