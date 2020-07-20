/**
* We need to specify assignment records, format like this:
* "assignment_name":{
*     // A list of fucntion call in the grades files
*     // Search those keywords by content can catch files/repos that are renamed 
*    keywords:[]
* }
*/

module.exports.config = {
    "assigns_meta": {
        "mp_traversals":{
            keywords:["ImageTraversal::Iterator::Iterator(",
                "ImageTraversal::Iterator & ImageTraversal::Iterator::operator++(",
                "Point ImageTraversal::Iterator::operator*(",
                "bool ImageTraversal::Iterator::operator!=("],
            excludeFilename : "ImageTraversal.h",
            acceptExtension : ".cpp",
            idealName:"ImageTraversal.cpp",
            assignmentId:"mp_traversals",
            semester:"cs225-sp20"
        }
    }
}


// var record = {
//     keyword:"_destroy(+insertFront(+insertBack(+split(+waterfall(+reverse(+reverseNth(+mergeWith(+mergesort(+in%3Afile+hpp+in%3Apath",
//     excludeFilename : "List.h",
//     acceptExtension : ".hpp",
//     idealName: "List.hpp",
//     assignmentId: "MP2",
// }

