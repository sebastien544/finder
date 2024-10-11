searchBarMain?.addEventListener('blur', () => {
   var query = searchBar.value.trim()

   setTimeout(function() {
      query.length > 0 && updateQueryCount(query, true, false);
  }, 2000)
});

searchBarMain?.addEventListener("focus", async () => {
   const query = searchBar.value.trim();

   if (query) {
    let filterStored = getItemWithExpiration('filterTemp') || "";
    const results = await search(query, filterStored);
    if(searchBarMain){
      handleSendResultsToGA("search-bar-focus");
    }else{
      handleSendResultsToGA("search-bar-nav-focus");
    }
    displayResults(results, searchBarMain);
   }
});

searchBar?.removeEventListener("keydown", (e) => {
  keyDownEvent(e);
});

searchBar?.addEventListener("keydown", (e) => {
  if (e.key === 'Enter') {
     e.preventDefault(); // Empêche l'action par défaut pour la touche Entrée
 }
  keyDownEvent(e);
});

//async function suggest(query) {
//   try {
//     const response = await axios.post(
//       `${ES_URL}/_search`,
// //       //"https://ordotype-finder.es.eu-west-3.aws.elastic-cloud.com/ordotype-index-staging-2024-05-23/_search",
//       {
//         suggest: {
//           suggestion: {
//             prefix: query,
//             completion: {
//               field: "Slug",
//               fuzzy: {
//                 fuzziness: "2",
//               },
//             },
//           },
//         },
//       },
//       {
//         headers: {
//           "Content-Type": "application/json",
//           Authorization:
//             "ApiKey bFk2VGs0Y0JHcFJXRm1EZENyaGU6R0xpOHdPUENUSXlxS3NvMGhna3JTUQ==",
//         },       }
//     );

//     return response.data.suggest.suggestion[0].options.map((option) => ({
//       Name: option._source.Name,
//      Slug: option._source.Slug,
//       wordingLogo: hit._source.Wording_Logo,
//       Img: option._source.Logo_for_finder_URL,
//     }));
//   } catch (error) {
//     console.error(error);
//  }
// }
