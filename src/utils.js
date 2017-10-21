// Function to create query object to search db
var createQuery = function(requirement) {
    var queryPredicates = [];
    if ('key' in requirement)
        queryPredicates.push({key: formatCaseAndSpace(requirement.key)});
    if ('url' in requirement)
        queryPredicates.push({url: formatCaseAndSpace(requirement.url)});
    return {$and: queryPredicates};
}

// Function to create document with a pair of tag and link 
var createDocument = function(tag, link) {
    tag = formatCaseAndSpace(tag);
    return {'key': tag, 'url': link, 'createdAt': new Date()};
}

var createFlags = function() {
    return {'_id': false, 'key': true, 'url': true, 'createdAt': true};
}

// Helper function to decode string into arrays
// with commas and spaces
var stringToArray = function(string) {
    return string.split(/[ ,]+/);
}

var formatCaseAndSpace = function(string) {
    return string.replace(/\s+/g, '').toLowerCase();
}

module.exports = {
    createQuery,
    createDocument,
    createFlags,
    stringToArray,
    formatCaseAndSpace
};


