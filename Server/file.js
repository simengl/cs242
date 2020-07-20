/**
 * Helper functions respect to getting information given a repo
 */
const axios = require('axios');
const conf = require('./config');
const helper = require('./helper');
const { exec } = require('child_process');
const credential = require('./credential').credential;
const {
    performance,
  } = require('perf_hooks');
const config = conf.config;
const cs225_token = credential.cs225_token;
const personal_token = credential.personal_token;
const cacheRoot = '.cache';
const metaFile = '.cache/meta';
const filteredMetaFile = '.cache/filteredMeta';



/**
 * Get dowbloadable url from file url
 */
async function downloadFile(url, name, token){
    url = url.split("?")[0]
    var download_url = "";
    console.log("token: ", token)
    await axios.get(url,{
        proxy:false,
        headers:{
            "Authorization" : "token "+token,
        }
    })
    .then(function (response) {
        // handle success
        download_url = response.data.download_url;
    })
    .catch(function (error) {
      // handle error
      console.log(error);
  
    })
    .finally(function () {
    });

    await axios.get(download_url,{
        proxy:false,
        headers:{
            "Authorization" : "token "+token,
        }
    })
    .then(function (response) {
        // handle success
        helper.writeFile(name, response.data);
    })
    .catch(function (error) {
      // handle error
      console.log(error);
  
    })
    .finally(function () {
    });

    return [download_url, name]
}


/**
 * Given meta data, download files in each entry
 */
async function downloadFiles(assignDir, meta){
    for(var [key, value] of Object.entries(meta)){
        var semester = meta.semester;
        if (typeof semester == "undefined"){
            await downloadFile(value.url, assignDir+key+"_"+value.name, cs225_token);
        }else{
            await downloadFile(value.url, assignDir+key+"_"+value.name, personal_token);
        }
        
    }
}

/**
 * Writre assignet files to local cache given repoOwner and repoName
 */
module.exports.getFilesFromMeta =  async function(meta) {
    var baseDir = ".cache/"+meta.record.assignmentId;

    for (var str of meta.record.idealName.split(".")){
        baseDir += "_"+str;
    }

    console.log("baseDir: "+baseDir)

    helper.createDirInCache(baseDir)
    baseDir += "/"
    await downloadFiles(baseDir, meta.results)


    console.time('Send MOSS request');
    var t0 = performance.now();
    exec('./moss.pl -l cc -c \"CS225 MP2 List.hpp\" '+ baseDir + '*.hpp', (err, stdout, stderr) => {
        if (err) {
            // node couldn't execute the command
            console.log(`err: ${err}`);
            return;
        }
        
        // the *entire* stdout and stderr (buffered)
        console.log(stdout);


        var t1 = performance.now();
        console.log("Took" + (t1 - t0)/1000.0 + " seconds.");
        console.log(`stderr: ${stderr}`);
        });
}