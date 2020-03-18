/**
 * Helper functions
 */
const fs = require('fs');
var exports = module.exports = {};

/**
 * create a dir in local cache
 */
exports.createDirInCache = function(dirName){
    if (!fs.existsSync(dirName)){
        fs.mkdirSync(dirName);
    }
    console.log("Created dir: "+dirName);
}

/**
 * create API url for a repo given repoOwner and repoName
 */
exports.createRepoContentUrl = function(repoOwner, repoName){
    return "https://api.github.com/repos/"+repoOwner+"/"+repoName+"/contents/"
}


/**
 * write content to filename
 */
exports.writeFile = function(fileName, content){
    console.log("Created file: "+fileName);
    fs.writeFileSync(fileName, content);
}


/**
 * append content to filename
 */
exports.appendFile = function(fileName, content){
    if (!fs.existsSync(fileName)){
        fs.writeFileSync(fileName, content);
    }else{
        fs.appendFileSync(fileName, content);
    }
}


/**
 * parse file into an Object
 */
exports.parseJsonFile = function(fileName){
    var data = fs.readFileSync(fileName, 'utf8').trim()
    return JSON.parse(data);
}

/**
 * Group the keywords array in assignment meta record into a
 */

exports.createARecord = function(record){
    keywords = record.keywords[0]
    for (var i = 1; i < record.keywords.length; i++){
        keywords += "+";
        keywords += record.keywords[i]
    }
    record.keywords = keywords

    return record
} 