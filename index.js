async function inputEvent(input, e) {
  currentFocus = -1;

  const query = input.value.trim();
  if (query) {
    let filterStored = getItemWithExpiration('filterTemp') || (activePlanIds.length === 1 && planIds.includes(activePlanIds[0]) ? "medecine-generale" : "");
    let results = await search(query, filterStored);
    if (results.length == 0) {
      results = await suggest(query);
    }
    if (results.length == 0) {
      let searchResults = document.getElementById("search-results");
      searchResults.style.background = "#ffffff";
      searchResults.style.padding = "16px";
      searchResults.innerHTML =
        `Pas de résultats pour "${query}". Vérifiez l'orthographe de votre recherche`;
      if (e.inputType != "deleteContentBackward" && query.length > 3) {
        updateQueryCount(query, false);
      }
      return true;
    }
    if (e.inputType != "deleteContentBackward" && query.length > 3) {
      updateQueryCount(query);
    }
    if (e.inputType == "deleteContentBackward"){
      document.querySelector("#search-results")?.remove();
    }
    handleSendResultsToGA(input.id);
    displayResults(results, input);
  } else {
    document.querySelector("#search-results")?.remove();
  }
}



