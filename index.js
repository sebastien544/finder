const planIds = ['pln_compte-praticien-offre-speciale-500-premiers--893z0o60', 'pln_praticien-belgique-2p70qka'];
const activePlanIds = JSON.parse(localStorage.getItem('_ms-mem')).planConnections
    .filter(item => item.status === "ACTIVE")
    .map(item => item.planId);

async function inputEvent(input, e) {
  currentFocus = -1;

  const query = input.value.trim();
  if (query) {
    let filterStored = (activePlanIds.length === 1 && planIds.includes(activePlanIds[0])) 
    ? "medecine-generale" 
    : getItemWithExpiration('filterTemp') || "";
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
    handleSendResultsToGA(input.id);
    displayResults(results, input);
  } else {
    document.querySelector("#search-results")?.remove();
  }
}

searchBar?.addEventListener("focus", async () => {
   const query = searchBar.value.trim();

   if (query) {
    let filterStored = (activePlanIds.length === 1 && planIds.includes(activePlanIds[0])) 
    ? "medecine-generale" 
    : getItemWithExpiration('filterTemp') || "";
    const results = await search(query, filterStored);
    if(searchBarMain){
      handleSendResultsToGA("search-bar-focus");
    }else{
      handleSendResultsToGA("search-bar-nav-focus");
    }
    displayResults(results, searchBar);
   }
});

// Display the search results
function displayResults(results, input) {
  let resultList = document.getElementById("search-results");
  let searchResultInner = ""
  
  if (resultList) {
    var searchResult = resultList.querySelector('#filter');
    searchResultInner = searchResult.querySelector(`div[data-w-tab="Tab 1"] div.search-result-body`);
    searchResultInner.innerHTML = "";
  }
  
  if (!resultList) {
    resultList = document.createElement("div");
    resultList.id = "search-results";

    const inputRect = input.getBoundingClientRect();
    
    if (window.matchMedia("(min-width: 480px)").matches){
    resultList.style.cssText =
      "box-shadow: 0 0 0 1px rgb(35 38 59 / 10%), 0 6px 16px -4px rgb(35 38 59 / 15%); border-radius: 4px; padding: 8px;background: #fff;";
      resultList.style.width = `${inputRect.width}px`;
      resultList.style.left = `${inputRect.left}px`;
    }
    else {
       resultList.style.width = `calc(100% - 2rem)`;
       resultList.style.marginLeft = '1rem';
       resultList.style.marginRight = '1rem';
    }
    resultList.style.position = (input.id == "search-bar-main" || input.id == "search-bar-hp") ? "absolute" : "fixed";
  
    resultList.style.top =
      (input.id == "search-bar-main" || input.id == "search-bar-hp") 
        ? `${inputRect.bottom + window.pageYOffset + 5}px`
        : `${inputRect.bottom + 5}px`;

    resultList.style.zIndex = (input.id == "search-bar-main" || input.id == "search-bar-hp") ? "9999" : "10000";
    resultList.style.background = "white";

    let searchResultOriginal = searchBarMain ? document.querySelector('#search-result') : document.querySelector('#search-result-nav');
    var searchResult = searchResultOriginal.cloneNode(true);
    searchResult.id = "filter";
    searchResult.style.display = "block";
    if(!searchBarMain){
        const scrollContainer = searchResult.querySelector('.search-result-tabs');
        const scrollContent = searchResult.querySelector('.srt-menu');
        
        scrollContent.addEventListener('mousemove', (e) => {
            const containerWidth = scrollContainer.offsetWidth;
            const contentWidth = scrollContent.scrollWidth;
            const mouseX = e.clientX - scrollContainer.getBoundingClientRect().left;
        
            // Calculer la position de défilement en fonction de la position de la souris
            const scrollPercentage = mouseX / containerWidth;
            const scrollPosition = (contentWidth - containerWidth) * scrollPercentage;
        
            scrollContent.style.transform = `translateX(${-scrollPosition}px)`;
        });
    }
    searchResultInner = searchResult.querySelector(`div[data-w-tab="Tab 1"] div.search-result-body`)
    searchResult.querySelectorAll('a').forEach((link, index) => {
    let filterStored = getItemWithExpiration('filterTemp');  
    if (activePlanIds.length === 1 && planIds.includes(activePlanIds[0])) {
        if (index === 0) link.classList.remove('w--current');
       if(link.innerText == "Médecine générale") link.classList.add('w--current');     
    } else if (filterStored) {
      if (index === 0) link.classList.remove('w--current');
      if (filterStored == transformString(link.innerText)) {
        link.classList.add('w--current');
        lastActiveTab = link.getAttribute('data-w-tab');
      }
    }
      link.addEventListener('click', (el) => {
          el.preventDefault();
          stringifiedFilter = transformString(el.target.innerText);
          activeFilter = el.target.innerText != "Tous les résultats" ? stringifiedFilter : "";
          setItemWithExpiration('filterTemp', activeFilter, 24);
          document.querySelector('#filter a[data-w-tab="'+lastActiveTab+'"]').classList.remove('w--current');
          el.currentTarget.classList.add('w--current')
          lastActiveTab = el.currentTarget.getAttribute('data-w-tab');
          clickEvent(activeFilter) ;
      })
    })

    resultList.appendChild(searchResult);

    document.querySelector("body").appendChild(resultList);
  }

  results.forEach((result, index) => {
     if (result.filtres.includes("only")){
        let filter;
        if (activeFilter == "") {
          filter = "all";
        }else {
          filter = transformString(activeFilter);
        }
        if (!result.filtres.includes(filter)) return;
    }
    const resultElement = document.createElement("a");

    const img = document.createElement("img");
    img.style.minWidth = "20px";
    img.style.height = "20px";
      
    resultElement.classList.add("search-result");
    const div =  document.createElement('div');
    
    img.setAttribute("src", result.Img);
    div.style.cssText = "display: flex; align-items: center; padding: 4px; color: #0c0e16; font-size: 14px;border-radius:4px;white-space: nowrap;";
    div.style.backgroundColor = "transparent";
       
    if (window.matchMedia("(min-width: 480px)").matches && input.id != "search-bar-nav"){
      div.appendChild(document.createTextNode(result.wordingLogo));
      img.style.marginLeft = "5px";  // Add some space between the image and the text
      div.style.padding = "2px 8px";    
    } 
    div.appendChild(img);
    
    resultElement.style.cssText =
            "text-decoration: none; color: #0c0e16; padding: 8px 8px; display: flex; align-items: center; justify-content:space-between; font-size: 14px;";

    resultElement.addEventListener("click", function(event) {
        event.preventDefault();
        handleSendClickResultToGA(input.id);
        window.location.href = `${baseUrl}/pathologies/${result.Slug}`;
    });

    //if (index === 0) resultElement.classList.add("autocomplete-active");
    resultElement.href = `${baseUrl}/pathologies/${result.Slug}`;
    resultElement.onmouseover = function () {
        this.style.background = "rgb(240,243,255)";
    };
    resultElement.onmouseout = function () {
        this.style.background = "none";
    };

    // Append elements to the resultElement
    resultElement.appendChild(document.createTextNode(result.Name));  // Add text node after img
    resultElement.appendChild(div);  // Add img element

    searchResultInner.appendChild(resultElement);
});

}
