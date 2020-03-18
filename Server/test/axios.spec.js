var axios = require('axios');
var MockAdapter = require('axios-mock-adapter');
var search = require('../search');
var helper = require('../helper');
var test_helper = require('./helper');


/**
 * Test getCS225SubmissionFilesPageRange
 * the reture value should be 34 
 */
describe('testGetCS225SubmissionFilesPageRange', () => {
  it('gets the right number of pages for CS225 submission pages', async () => {    
    try{
      var record = {
        keyword:"_destroy(+insertFront(+insertBack(+split(+waterfall(+reverse(+reverseNth(+mergeWith(+mergesort(+in%3Afile+hpp+in%3Apath",
        excludeFilename : "List.h",
        acceptExtension : ".hpp",
        idealName: "List.hpp",
        assignmentId: "MP2",
      }
      var ret = await search.getCS225SubmissionFilesPageRange(record);
      expect(ret).toBe(34);
    }catch(err){
      console.log(err)
    }
})});




/**
 * Testing getPageRange
 * gets the right number of pages for a query
 */
describe('testGetPageRange', () => {
    it('gets the right number of pages for a query', async () => {
      var mock = new MockAdapter(axios);
      mock.onGet('/test').replyOnce(200,{}, 
        test_helper.testGetPageRange_reply);

      
      try{
        var ret = await search.getPageRange('/test');
        expect(ret).toBe(16);
      }catch(err){
        console.log(err)
      }
  
  })});



/**
 * Test getCS225SubmissionFilesPageRange
 * the reture value should be 34 
 */
describe('testSearchCS225SubmissionFilesAtPageidx', () => {
  it('gets the result for CSS5 submission at page idx', async () => {    
    try{
      var record = {
        keyword:"_destroy(+insertFront(+insertBack(+split(+waterfall(+reverse(+reverseNth(+mergeWith(+mergesort(+in%3Afile+hpp+in%3Apath",
        excludeFilename : "List.h",
        acceptExtension : ".hpp",
        idealName: "List.hpp",
        assignmentId: "MP2",
      }
      var ret = await search.searchCS225SubmissionFilesAtPageidx(record, "10")
      expect(ret).toBe(
        helper.parseJsonFile(".cache/metaSubmission_10")
      );
    }catch(err){
      console.log(err)
    }
})});