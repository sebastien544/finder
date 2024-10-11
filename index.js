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
