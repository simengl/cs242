/**
 * Helper functions respect to getting information given a repo
 */
const axios = require('axios');
const conf = require('./config');
const helper = require('./helper');
const config = conf.config;
const cacheRoot = '.cache';
const metaFile = '.cache/meta';
const filteredMetaFile = '.cache/filteredMeta';



/**
 * List all the dirs in the repo
 * Compare it to the dirs we are searching for
 */
async function searchAssignmentDirInRepoUrl(url, rootDir, dirToSearch){
    var foundDir = [];
    await axios.get(url,{
        proxy:false,
        headers:{
            "Authorization" : "token 7876229856598e7137aed0ff5fc1bea548bb924d",
        }
    })
    .then(function (response) {
      // handle success
    //   console.debug(response.data);
      console.log("All directores in "+ url +": ")
      for(var [key, value] of Object.entries(response.data)){
        if (value.type.localeCompare("dir") == 0){
            console.log("    "+value.name)
            if (dirToSearch.indexOf(value.name) != -1){
                foundDir.push(value.name)
            }  
        }
      }
    })
    .catch(function (error) {
      // handle error
    //   console.log(error);
  
    })
    .finally(function () {
      // always executed

    });

    return foundDir;
} 


/**
 * Given url of an assignment directory, fetch all the download_urls for the files specified
 */
async function fetchAssignmentFilesUrls(url, files){
    var missingFile = files;
    var downloadUrls = [];
    
    await axios.get(url,{
        proxy:false,
    })
    .then(function (response) {
        // handle success
        for(var [key, value] of Object.entries(response.data)){
            var idx = files.indexOf(value.name);
            // console.log(value.name, idx)
            if (idx >= 0){
                console.log("found file: ", value.name)
                downloadUrls.push(value.download_url);
                missingFile.splice(idx, 1);
            }  

        }
    })
    .catch(function (error) {
      // handle error
      console.log(error);
  
    })
    .finally(function () {
    });

    return [downloadUrls, missingFile]
} 


/**
 * Given the downloadUrls, write the file to cache
 */
async function downloadFiles(assignDir, downloadUrls){
    for (var item of downloadUrls){
        var name = item.split("/");
        name = name[name.length - 1]
        await axios.get(item,{
            proxy:false,
        }) 
            .then(function (response) {
                helper.writeFile(assignDir+name, response.data);
            })
            .catch(function (error) {
                console.log(error);
            })
            .finally(function () {
                // always executed
            });
        }
}

/**
 * Writre assignet files to local cache given repoOwner and repoName
 */
module.exports.getAssignmentGradingFilesFromRepo =  async function(repoOwner, repoName) {
    var url = helper.createRepoContentUrl(repoOwner, repoName)
    var dirToSearch = [];
    for(var [key, value] of Object.entries(config.assigns)){
        dirToSearch.push(key);
    }


    var rootDir = cacheRoot+"/"+repoOwner;
    helper.createDirInCache(rootDir);

    var foundDir = [];
    try {
        foundDir = await searchAssignmentDirInRepoUrl(url,rootDir,dirToSearch);
    } catch (error) {
        console.error(error);
    }

    if (foundDir.length == 0){
        console.log("Failed to find any target directory at "+url + "\n")
    }else{
        foundDir.forEach( (item) => {
            var assignDir = rootDir + "/" + item;
            helper.createDirInCache(assignDir);
        })
    }

    for (var item of foundDir){
        var assignUrl = url + item;
        var files = config.assigns[item];
        // console.log(item, files)

        try {
            const [downloadUrls, missingFile] = await fetchAssignmentFilesUrls(assignUrl, files);
            if (missingFile.length > 0){
                console.log("Failed to find files with "+ repoOwner +": ", missingFile)
            }else{
                console.log("Found all files");
                await downloadFiles(rootDir+"/"+item+"/", downloadUrls)
            }


        } catch (error) {
            console.error(error);
        } 
    }

    console.log("\n")
}


/**
 * Filter out repos without the target directory
 */
module.exports.filterRepos =  async function(inputFile) {
    var dirToSearch = [];

    for(var [key, value] of Object.entries(config.assigns)){
        dirToSearch.push(key);
    }

    var input = helper.parseJsonFile(inputFile);
    var foundDir = [];

    var filteredDict = {}

    for (var key in input){
        var val = input[key]
        var url = helper.createRepoContentUrl(val.owner, val.name)
        var rootDir = cacheRoot+"/"+val.owner;
        foundDir = await searchAssignmentDirInRepoUrl(url,rootDir,dirToSearch);

        if (foundDir.length > 0){
            filteredDict[key] = val
        }
    }
    helper.writeFile(filteredMetaFile, JSON.stringify(filteredDict, null, 2))
    console.log("\n")
    return filteredDict;
}