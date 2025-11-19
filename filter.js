async function search(query, filter, page) {
  try {
    const q = (query || "").toLowerCase().trim();
    if (!q) {
      return { results: [], fromSuggest: false };
    }

    // 🔹 Construire tous les préfixes 
    const prefixes = [];
    for (let i = q.length; i >= 1; i--) {
      const p = q.slice(0, i);
      if (!prefixes.includes(p)) {
        prefixes.push(p);
      }
    }

    // 🔹 Construire les clauses prefix avec boost décroissant
    // le plus long préfixe = boost le plus élevé
    const shouldClauses = prefixes.map((p, idx) => ({
      prefix: {
        "Name.keyword": {
          value: p,
          boost: prefixes.length - idx // ex : 5,4,3,2,1
        }
      }
    }));

    const body = {
      query: {
        function_score: {
          query: {
            bool: {
              should: shouldClauses,
              minimum_should_match: 1,
              filter: filter
                ? [{ wildcard: { Filtres: `*${filter}*` } }]
                : [],
              must_not: !filter
                ? [
                    {
                      bool: {
                        must: [
                          { wildcard: { Filtres: "*only*" } },
                          {
                            bool: {
                              must_not: [{ term: { Filtres: "all-only" } }]
                            }
                          }
                        ]
                      }
                    }
                  ]
                : []
            }
          },
          field_value_factor: {
            field: "Importance",
            factor: 1.5,
            modifier: "none",
            missing: 1
          }
        }
      },

      // 🔹 Suggest comme fallback éventuel (inchangé)
      suggest: {
        med_suggest: {
          prefix: query,
          completion: {
            field: "Slug",
            fuzzy: {
              fuzziness: 2
            }
          }
        }
      },

      size: 30,

      // 🔹 Tri : d'abord score (donc malad* > mala* > mal* > ma* > m*), puis alpha
      sort: [
        { _score: { order: "desc" } },
        { "Name.keyword": { order: "asc" } }
      ]
    };

    const response = await axios.post(
      `https://ordotype-finder.es.eu-west-3.aws.elastic-cloud.com/test/_search`,
      body,
      {
        headers: {
          "Content-Type": "application/json",
          Authorization:
            "ApiKey SEdpeW1wb0J5bkFkTnVyZVp3TUs6bTFuUDRhdDNRTEdnbWtrSEV4a3QwUQ==", // garde ta clé
        },
      }
    );

    const hits = response.data.hits.hits;
    const suggestions = response.data.suggest?.med_suggest?.[0]?.options ?? [];

    // 🔹 On n'utilise les suggestions que s'il n'y a VRAIMENT aucun hit
    const usingSuggestions = hits.length === 0 && suggestions.length > 0;
    const rawResults = usingSuggestions ? suggestions : hits;

    // 🔹 Pagination pour la page /search-result
    if (page) {
      displayPagination(response.data.hits.total.value, query);
    }

    const results = rawResults.map((item) => {
      const src = item._source ?? {};
      return {
        Name: src.Name,
        Slug: src.Slug,
        Img: src.Logo_for_finder_URL,
        wordingLogo: src.Wording_Logo,
        filtres: src.Filtres,
      };
    });

    return { results, fromSuggest: usingSuggestions };
  } catch (error) {
    console.error(error);
    return { results: [], fromSuggest: false };
  }
}

function displayResults(results, input) {
  let resultList = document.getElementById("search-results");
  let searchResultInner = "";

  if (resultList) {
    var searchResult = resultList.querySelector('#filter');
    if(searchResult){
      searchResultInner = searchResult.querySelector(`div[data-w-tab="Tab 1"] div.search-result-body`);
      searchResultInner.innerHTML = "";
    }
  }

  if (!resultList) {
    resultList = document.createElement("div");
    resultList.id = "search-results";

    const inputRect = input.getBoundingClientRect();

    if (window.matchMedia("(min-width: 480px)").matches) {
      resultList.style.cssText = "box-shadow: 0 0 0 1px rgb(35 38 59 / 10%), 0 6px 16px -4px rgb(35 38 59 / 15%); border-radius: 4px; padding: 8px; background: #fff;";
      if (input.id === "search-bar-nav") {
        resultList.style.width = `${inputRect.width * 2}px`;
        resultList.style.left = `${inputRect.left}px`;
      } else {
        resultList.style.width = `${inputRect.width}px`;
        resultList.style.left = `${inputRect.left}px`;
      }
    } else {
      resultList.style.width = `calc(100% - 1rem)`;
      resultList.style.marginLeft = '.5rem';
      resultList.style.marginRight = '.5rem';
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
            const scrollPercentage = mouseX / containerWidth;
            const scrollPosition = (contentWidth - containerWidth) * scrollPercentage;
            scrollContent.style.transform = `translateX(${-scrollPosition}px)`;
        });
    }
    searchResultInner = searchResult.querySelector(`div[data-w-tab="Tab 1"] div.search-result-body`)
    searchResult.querySelectorAll('a').forEach((link, index) => {
      if (activeFilter) {
        if (index === 0) link.classList.remove('w--current');
        if (activeFilter == transformString(link.innerText)) {
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
          clickEvent(activeFilter);
      })
    })

    resultList.appendChild(searchResult);
    document.querySelector("body").appendChild(resultList);
  }

  let shown = 0;

  results.forEach((result, index) => {
    if (shown >= 10) return;
    
    if (result.filtres.includes("only")){
      let filter;
      if (activeFilter == "") {
        filter = "all";
      } else {
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
      img.style.marginLeft = "5px";
      div.style.padding = "2px 8px";
    }
    div.appendChild(img);

    resultElement.style.cssText =
      "text-decoration: none; color: #0c0e16; padding: 8px 8px; display: flex; align-items: center; justify-content:space-between; font-size: 14px; border-radius: 4px;";

    resultElement.addEventListener("click", function(event) {
      event.preventDefault();
      handleSendClickResultToGA(input.id);
      window.location.href = `${baseUrl}/pathologies/${result.Slug}`;
    });

    resultElement.href = `${baseUrl}/pathologies/${result.Slug}`;
    resultElement.onmouseover = function () { this.style.background = "rgb(240,243,255)"; };
    resultElement.onmouseout  = function () { this.style.background = "none"; };

    resultElement.appendChild(document.createTextNode(result.Name));
    resultElement.appendChild(div);

    searchResultInner.appendChild(resultElement);

    shown++;
  });
}
