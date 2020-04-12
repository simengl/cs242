/**
 * Main entry
 */
const search = require('./search');
const repo = require('./repo');
const helper = require('./helper');  
const file = require('./file');
const config = require('./config');
const inputFile = '.cache/metaSample';
const inputFilter = '.cache/filterSample';
const { exec } = require('child_process');
const axios = require('axios');

var mode = process.argv[2];

/* Usage:
 * npm run search //will search all the open github repos with `cs225` in their name
 * npm
 */

         // var record = {
        //     keyword:"_destroy(+insertFront(+insertBack(+split(+waterfall(+reverse(+reverseNth(+mergeWith(+mergesort(+in%3Afile+hpp+in%3Apath",
        //     excludeFilename : "List.h",
        //     acceptExtension : ".hpp",
        //     idealName: "List.hpp",
        //     assignmentId: "MP2",
        // }

async function index(){
    if (mode.localeCompare("search") == 0){

        var record = helper.createARecord(config.config.assigns_meta.mp_traversals);
        console.log(record)
    
        if (process.argv.length>3 && process.argv[3].localeCompare("file") == 0){
            // npm run search file
            search.searchCS225Files(record)
        }else if (process.argv.length>3 && process.argv[3].localeCompare("submission") == 0){
            // npm run search submission

            const lastPageIdx = await search.getCS225SubmissionFilesPageRange(record)
            if(process.argv.length>4){
                if(process.argv[4].localeCompare("mt") == 0){
                    for(var i = 1; i <= lastPageIdx; i++){
                        exec("npm run search submission "+i.toString(), (err, stdout, stderr) => {
                            if (err) {
                                // node couldn't execute the command
                                console.log(`err: ${err}`);
                                return;
                            }
                            
                            // the *entire* stdout and stderr (buffered)
                            console.log(stdout);
                            });
                        }
                }else{
                    // npm run search submission <idx>
                    search.searchCS225SubmissionFilesAtPageidx(record, process.argv[4])
                }
            }else{
                // npm run search submission
                search.searchCS225SubmissionFiles(record, lastPageIdx)
            }
        }else{
            // npm run search
            search.searchCS225ReposFromGithub()
        }
    }
    
    else if (mode.localeCompare("store") == 0){
        // npm run store <metafile>
    
        if (process.argv.length>3){
            console.log("=== store files in "+ process.argv[3] +" ===")
            var input = helper.parseJsonFile(process.argv[3]);
            file.getFilesFromMeta(input)
        }else{
            console.log("Usage: npm run store <metafile>")
        }
    }
    
    else if (mode.localeCompare("filter") == 0){
        // npm run filter
        repo.filterRepos(inputFilter);
    }
}


index();