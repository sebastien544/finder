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

searchBar?.addEventListener("keydown", (e) => {
  if (e.key === 'Enter') {
     e.preventDefault(); // Empêche l'action par défaut pour la touche Entrée
 }
  keyDownEvent(e);
});

function keyDownEvent(e) {
  var x = document.getElementById("search-results") || document.querySelector(`div[data-w-tab="${activeTab}"] div.search-result-body`);
  if (x) {
     x = x.getElementsByTagName("a");
  }else {
     if (e.keyCode == 13) {
        const query = e.currentTarget.value.trim();
        window.location.href = `${baseUrl}/search-result?query=${query}&page=1`;
     }
  }
  if (e.keyCode == 40) {
    if (currentFocus == -1 && !window.location.pathname.includes("search-result")) currentFocus = 3;
    currentFocus++;
    /*and and make the current item more visible:*/
    addActive(x);
  } else if (e.keyCode == 38) {
    //up
    /*If the arrow UP key is pressed,
    decrease the currentFocus variable:*/
    currentFocus--;
    /*and and make the current item more visible:*/
    addActive(x);
  } else if (e.keyCode == 13) {
    if (currentFocus > -1) {
      /*and simulate a click on the "active" item:*/
      if (x) x[currentFocus].click();
    } else {
        const query = e.currentTarget.value.trim();
        window.location.href = `${baseUrl}/search-result?query=${query}&page=1`;
    }
  }
}

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
