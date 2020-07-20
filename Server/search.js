/**
 * Main entry
 */
const axios = require('axios');
const conf = require('./config');
const helper = require('./helper');                                                                              
const repo = require('./repo');
const credential = require('./credential').credential;
const cs225_token = credential.cs225_token;
const personal_token = credential.personal_token;
const metaRepoFile = '.cache/meta';
const metaFileFile = '.cache/metaFile';
const metaSubmissionFile = '.cache/metaSubmission';
const inputFile = '.cache/metaSample';
var retryAfter = 0;
var exports = module.exports = {};


var dicts = {}

/**
 * Get the number of pages to collect all response
 */
exports.getPageRange = async function(url, token){
    var ret = 0;
    console.log("token:: "+ token)
    await axios.get(url,{
        proxy:false,
        headers: {"Authorization": "token "+token}
    })
    .then(function (response) {
        // console.log(response)
        var lastPageIdx = response.headers.link.split("<")[2].split(">")[0].split("=");
        ret = parseInt(lastPageIdx[lastPageIdx.length - 1])
    })
    .catch(function (error) {
        console.log("Got error");
    })
    .finally(function () {
        // always executed
    });
    return ret;
}

/**
 *  Fetch meta data for repos shown on one page
 */

exports.getOnePage = async function(url, token){
    console.log("token is :: ", token)

    var ret = 0;
    await axios.get(url,{
        proxy:false,
        headers: {"Authorization": "token "+token}
    }) 
    .then(function (response) {
        var items = response.data.items
        // console.log(response.data.items)

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
    })
    .catch(function (error) {
        console.log("Got err");
        ret =  -1;
    })
    return ret;
}

/**
 * Get all the pages respect to the query
 */
async function getAllPages(url, lastPageIdx, token){
    var ret;
    var successIdx = 1;
    for (var i = successIdx; i <= lastPageIdx; i++){
        var pageUrl = url + i.toString()
        console.log("Fetch page "+ i.toString())
        ret = await exports.getOnePage(pageUrl, token)
        console.log("ret value = " + ret.toString())
        if (ret == -1) {
            i = successIdx;
            await new Promise(r => setTimeout(r, 10000))
        }
        else {
            successIdx += 1
        };
        await new Promise(r => setTimeout(r, 500))
    }
}


/**
 *  Fetch meta data for repos shown on one page for file query
 */


exports.getOneFilePage = async function(url, token, idealFileName, exculdeFilename, acceptExtension){
    var ret = 0;
    
    await axios.get(url,{
        proxy:false,
        headers: {"Authorization": "token "+token}
    }) 
    .then(function (response) {
        console.log("==== response ====")
        // resetTime = response.headers['x-ratelimit-reset']
        // console.log(resetTime, new Date().getTime())
        // console.log(response.headers)
        var items = response.data.items
        if(exculdeFilename){
            for (var item of items){
                console.log(item.repository.full_name)
                if (exculdeFilename.localeCompare(item.name) == 0 || !item.name.includes(acceptExtension)){
                    // console.log("=== filtered "+ item.name+" ===")
                    continue
                }
                else if (idealFileName.localeCompare(item.name) == 0){
                    // console.log("=== exact "+item.name+" ===")
                    var dict =  {
                        "updated_at": item.repository.updated_at,
                        "name" : item.name, 
                        "owner" : item.repository.owner.login,
                        "url": item.url,
                        "html_url":item.html_url,
                    }
                    dicts.results[item.repository.owner.login] = dict
                }else{
                    // console.log("=== pass "+ item.name+" ===")
                }
            }
        }else{
            for (var item of items){
                console.log(item.repository.full_name)
                // console.log(item)
                // if (item.repository.owner.login.localeCompare("cs225-sp20") == 0){
                    var dict =  {
                        "name" : item.name, 
                        "semester" : item.repository.owner.login,
                        "owner": item.repository.name,
                        "url": item.url,
                        "html_url":item.html_url,
                    }
                    dicts.results[item.repository.name] = dict
                // }
            }
            
        }
    })
    .catch(function (error) {
        console.log("Got err: ", error);
        console.log(error.response.headers);
        retryAfter = error.response.headers['retry-after'];
        if (typeof retryAfter == "undefined"){
            retryAfter = error.response.headers['x-ratelimit-reset'] - (new Date().getTime()/1000)+1
        }
        ret =  -1;
    })

    return ret;
}

/**
 * Get all the pages respect to the file query
 */
async function getAllFilePages(url, token, lastPageIdx, idealFileName=null, exculdeFilename=null, acceptExtension=null){
    var ret;
    var successIdx = 1;
    for (var i = successIdx; i <= lastPageIdx; i++){
        var pageUrl = url + i.toString()
        console.log("Fetch page "+ i.toString())
        ret = await exports.getOneFilePage(pageUrl, token, idealFileName, exculdeFilename, acceptExtension,token)
        console.log("return = " + ret)
        if (ret == -1){
            i = successIdx -1;
            console.log("Retry After : ", retryAfter);
            await new Promise(r => setTimeout(r, retryAfter*1000))
            resetTime += 1;
        }
        else {
            successIdx += 1
        };
        // await new Promise(r => setTimeout(r, 1000))
    }
}


/**
 * Main function: search for all the repos with cs225 in its name
 */
exports.searchCS225ReposFromGithub = async function (){
    console.log("=== Search cs225 in repo name and description === ")
    var url = "https://api.github.com/search/repositories?q=cs225+in%3Aname,description&page=";
    var lastPageIdx = await exports.getPageRange(url, personal_token)
    console.log("Search Query [" + url + "] has " + lastPageIdx.toString() + " pages")
    await getAllPages(url, lastPageIdx, personal_token)
    var lastCount = Object.keys(dicts).length;
    console.log("Added "+lastCount.toString() +" new entries\n")

    helper.writeFile(metaRepoFile, JSON.stringify(dicts, null, 2))
}


exports.searchCS225Files = async function(fileRecord){
    console.log("=== Search cs225 in file content === ")
    dicts["record"] = fileRecord;
    dicts["results"] = {};
    var url = "https://api.github.com/search/code?q="+fileRecord.keywords+"&page=";

    var lastPageIdx = await exports.getPageRange(url,personal_token)
    console.log("Search Query [" + url + "] has " + lastPageIdx.toString() + " pages")
    await getAllFilePages(url, personal_token, lastPageIdx, fileRecord.idealName, fileRecord.excludeFilename, fileRecord.acceptExtension)
    var lastCount = Object.keys(dicts.results).length;
    console.log("Added "+lastCount.toString() +" new entries\n")

    helper.writeFile(metaFileFile, JSON.stringify(dicts, null, 2))
}

exports.getCS225SubmissionFilesPageRange = async function(fileRecord){
    console.log("=== Get "+fileRecord.idealName+" in CS225  submissions page range=== ")
    dicts["record"] = fileRecord;
    dicts["results"] = {};
    // var url = "https://github-dev.cs.illinois.edu/api/v3/search/repositories?q=cs225-sp20+in:name&per_page=100&page=";
    var url = "https://github-dev.cs.illinois.edu/api/v3/search/code?q=filename:"+fileRecord.idealName+"+org:"+fileRecord.semester+"&per_page=100&page=";
    var lastPageIdx = await exports.getPageRange(url, cs225_token)
    console.log("Search Query [" + url + "] has " + lastPageIdx.toString() + " pages")
    return lastPageIdx
}

exports.searchCS225SubmissionFiles = async function(fileRecord, lastPageIdx=34){
    console.log("=== Get "+fileRecord.idealName+" in CS225  submissions === ")
    dicts["record"] = fileRecord;
    dicts["results"] = {};
    // var url = "https://github-dev.cs.illinois.edu/api/v3/search/repositories?q=cs225-sp20+in:name&per_page=100&page=";
    var url = "https://github-dev.cs.illinois.edu/api/v3/search/code?q=filename:"+fileRecord.idealName+"+org:"+fileRecord.semester+"&per_page=100&page=";
    await getAllFilePages(url, cs225_token, lastPageIdx, null, null, null)
    var lastCount = Object.keys(dicts.results).length;
    console.log("Added "+lastCount.toString() +" new entries\n")

    helper.writeFile(metaSubmissionFile, JSON.stringify(dicts, null, 2))
}

exports.searchCS225SubmissionFilesAtPageidx = async function(fileRecord, pageIndex){
    console.log("=== Get "+fileRecord.idealName+" in CS225  submissions === ")
    dicts["record"] = fileRecord;
    dicts["results"] = {};
    // var url = "https://github-dev.cs.illinois.edu/api/v3/search/repositories?q=cs225-sp20+in:name&per_page=100&page=";
    var url = "https://github-dev.cs.illinois.edu/api/v3/search/code?q=filename:"+fileRecord.idealName+"+org:"+fileRecord.semester+"&per_page=100&page=";

    var pageUrl = url + pageIndex
    console.log("Fetch page "+ pageIndex)
    await exports.getOneFilePage(pageUrl, cs225_token, null,  null, null)
    var lastCount = Object.keys(dicts.results).length;
    console.log("Added "+lastCount.toString() +" new entries\n")

    helper.writeFile(metaSubmissionFile+"_"+pageIndex, JSON.stringify(dicts, null, 2))
    return dicts
}
