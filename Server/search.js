/**
 * Main entry
 */
const axios = require('axios');
const conf = require('./config');
const helper = require('./helper');                                                                              
const repo = require('./repo');
const metaRepoFile = '.cache/meta';
const metaFileFile = '.cache/metaFile';
const metaSubmissionFile = '.cache/metaSubmission';
const inputFile = '.cache/metaSample';
var exports = module.exports = {};


var dicts = {}

/**
 * Get the number of pages to collect all response
 */
exports.getPageRange = async function(url, token = "7876229856598e7137aed0ff5fc1bea548bb924d"){
    var ret = 0;
    await axios.get(url,{
        proxy:false,
        headers: {"Authorization": "token "+token}
    })
    .then(function (response) {
        var lastPageIdx = response.headers.link.split("<")[2].split(">")[0].split("=");
        ret = parseInt(lastPageIdx[lastPageIdx.length - 1])
    })
    .catch(function (error) {
        console.log(error);
    })
    .finally(function () {
        // always executed
    });
    return ret;
}

/**
 *  Fetch meta data for repos shown on one page
 */

exports.getOnePage = async function(url){
    await axios.get(url,{
        proxy:false,
        headers: {"Authorization": "token 7876229856598e7137aed0ff5fc1bea548bb924d"}
    }) 
    .then(function (response) {
        var items = response.data.items
        console.log(response.data.items)

        for (var item of items){
            var dict =  {
                "updated_at": item.updated_at,
                "name" : item.name, 
                "owner" : item.owner.login,
                "url": item.url,
                "html_url":item.html_url,
            }
            dicts[item.owner.login] = dict
        }
        return 0;
    })
    .catch(function (error) {
        console.log("Got err");
        return -1;
    })
    // return dicts
}

/**
 * Get all the pages respect to the query
 */
async function getAllPages(url, lastPageIdx){
    var ret;
    var successIdx = 1;
    for (var i = successIdx; i <= lastPageIdx; i++){
        var pageUrl = url + i.toString()
        console.log("Fetch page "+ i.toString())
        ret = await exports.getOnePage(pageUrl)
        console.log("ret value = " + ret.toString())
        if (ret == -1) {
            i = successIdx;
            await new Promise(r => setTimeout(r, 100000))
        }
        else {
            successIdx += 1
        };
        await new Promise(r => setTimeout(r, 100000))
    }
}


/**
 *  Fetch meta data for repos shown on one page for file query
 */


exports.getOneFilePage = async function(url, idealFileName, exculdeFilename, acceptExtension, token = "7876229856598e7137aed0ff5fc1bea548bb924d"){
    var ret = 0;
    
    await axios.get(url,{
        proxy:false,
        headers: {"Authorization": "token "+token}
    }) 
    .then(function (response) {
        var items = response.data.items
        if(exculdeFilename){
            for (var item of items){
                if (exculdeFilename.localeCompare(item.name) == 0 || !item.name.includes(acceptExtension)){
                    console.log("=== filtered "+ item.name+" ===")
                    continue
                }
                else if (idealFileName.localeCompare(item.name) == 0){
                    console.log("=== exact "+item.name+" ===")
                    var dict =  {
                        "updated_at": item.repository.updated_at,
                        "name" : item.name, 
                        "owner" : item.repository.owner.login,
                        "url": item.url,
                        "html_url":item.html_url,
                    }
                    dicts.results[item.repository.owner.login] = dict
                }else{
                    console.log("=== pass "+ item.name+" ===")
                }
            }
        }else{
            for (var item of items){
                if (item.repository.owner.login.localeCompare("cs225-fa18") == 0){
                    var dict =  {
                        "name" : item.name, 
                        "semester" : item.repository.owner.login,
                        "owner": item.repository.name,
                        "url": item.url,
                        "html_url":item.html_url,
                    }
                    dicts.results[item.repository.name] = dict
                }
            }
            
        }
    })
    .catch(function (error) {
        console.log("Got err");
        ret =  -1;
    })

    return ret;
}

/**
 * Get all the pages respect to the file query
 */
async function getAllFilePages(url, lastPageIdx, idealFileName=null, exculdeFilename=null, acceptExtension=null, token = "7876229856598e7137aed0ff5fc1bea548bb924d"){
    var ret;
    var successIdx = 1;
    for (var i = successIdx; i <= lastPageIdx; i++){
        var pageUrl = url + i.toString()
        console.log("Fetch page "+ i.toString())
        ret = await exports.getOneFilePage(pageUrl, idealFileName, exculdeFilename, acceptExtension,token)
        console.log("return = " + ret)
        if (ret == -1){
            i = successIdx -1;
            await new Promise(r => setTimeout(r, 10000))
        }
        else {
            successIdx += 1
        };
        await new Promise(r => setTimeout(r, 500))
    }
}


/**
 * Main function: search for all the repos with cs225 in its name
 */
exports.searchCS225ReposFromGithub = async function (){
    console.log("=== Search cs225 in repo name and description === ")
    var url = "https://api.github.com/search/repositories?q=cs225+in%3Aname,description&page=";
    var lastPageIdx = await exports.getPageRange(url)
    console.log("Search Query [" + url + "] has " + lastPageIdx.toString() + " pages")
    await getAllPages(url, lastPageIdx)
    var lastCount = Object.keys(dicts).length;
    console.log("Added "+lastCount.toString() +" new entries\n")

    helper.writeFile(metaRepoFile, JSON.stringify(dicts, null, 2))
}


exports.searchCS225Files = async function(fileRecord){
    console.log("=== Search cs225 in file content === ")
    dicts["record"] = fileRecord;
    dicts["results"] = {};
    var url = "https://api.github.com/search/code?q="+fileRecord.keywords+"&page=";

    var lastPageIdx = await exports.getPageRange(url)
    console.log("Search Query [" + url + "] has " + lastPageIdx.toString() + " pages")
    await getAllFilePages(url, lastPageIdx, fileRecord.idealName, fileRecord.excludeFilename, fileRecord.acceptExtension)
    var lastCount = Object.keys(dicts.results).length;
    console.log("Added "+lastCount.toString() +" new entries\n")

    helper.writeFile(metaFileFile, JSON.stringify(dicts, null, 2))
}

exports.getCS225SubmissionFilesPageRange = async function(fileRecord){
    console.log("=== Get "+fileRecord.idealName+" in CS225  submissions page range=== ")
    dicts["record"] = fileRecord;
    dicts["results"] = {};
    var url = "https://github-dev.cs.illinois.edu/api/v3/search/code?q="+fileRecord.idealName+"+in:path&page=";

    var lastPageIdx = await exports.getPageRange(url, "f221a291e6a1c81f7b3e45374ea42f241074b3fe")
    console.log("Search Query [" + url + "] has " + lastPageIdx.toString() + " pages")
    return lastPageIdx
}

exports.searchCS225SubmissionFiles = async function(fileRecord, lastPageIdx=34){
    console.log("=== Get "+fileRecord.idealName+" in CS225  submissions === ")
    dicts["record"] = fileRecord;
    dicts["results"] = {};
    var url = "https://github-dev.cs.illinois.edu/api/v3/search/code?q="+fileRecord.idealName+"+in:path&page=";

    await getAllFilePages(url, lastPageIdx, null, null, null, "f221a291e6a1c81f7b3e45374ea42f241074b3fe")
    var lastCount = Object.keys(dicts.results).length;
    console.log("Added "+lastCount.toString() +" new entries\n")

    helper.writeFile(metaSubmissionFile, JSON.stringify(dicts, null, 2))
}

exports.searchCS225SubmissionFilesAtPageidx = async function(fileRecord, pageIndex){
    console.log("=== Get "+fileRecord.idealName+" in CS225  submissions === ")
    dicts["record"] = fileRecord;
    dicts["results"] = {};
    var url = "https://github-dev.cs.illinois.edu/api/v3/search/code?q="+fileRecord.idealName+"+in:path&page=";

    var pageUrl = url + pageIndex
    console.log("Fetch page "+ pageIndex)
    await exports.getOneFilePage(pageUrl, null,  null, null, "f221a291e6a1c81f7b3e45374ea42f241074b3fe")
    var lastCount = Object.keys(dicts.results).length;
    console.log("Added "+lastCount.toString() +" new entries\n")

    helper.writeFile(metaSubmissionFile+"_"+pageIndex, JSON.stringify(dicts, null, 2))
    return dicts
}
