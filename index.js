async function inputEvent(input, e) {
  currentFocus = 3;

  const query = input.value.trim();
  if (query) {
    let filterStored = localStorage.getItem('filter') || "";
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

async function search(query, filter) {
  try {
    const response = await axios.post(
      //`${ES_URL}/_search`,
      "https://ordotype-finder.es.eu-west-3.aws.elastic-cloud.com/ordotype-index-2024-10-01/_search",
      {
        query : {
          function_score : {
            query: {
              bool: {
                must: [
                    {
                      bool: {
                        should : [
                          {
                            query_string: {
                              query: query + "*",
                              fields: [
                                  "Boost^6",
                                  "Name^5",
                                  "Alias^4",
                                  "Ordonnances médicales^3",
                                  "Conseils patient^2",
                                  "Informations cliniques - HTML",
                              ]
                            }
                          },
                          {
                            fuzzy: {
                              Name: {
                                  value: query,
                                  fuzziness: "AUTO"
                              }
                            }
                          },
                          {
                            fuzzy: {
                              Alias: {
                                  value: query,
                                  fuzziness: "AUTO"
                              }
                            }
                          }
                        ]
                      }
                    }
                  ],
                  "filter": filter ? [
                  {
                    "wildcard": {
                      "Filtres": `*${filter}*`
                    }
                  }
                ] : [],
                "must_not": !filter ? [
                {
                  "bool": {
                    "must": [
                      {
                        "wildcard": {
                          "Filtres": `*only*`
                        }
                      },
                      {
                        "bool": {
                          "must_not": [
                            {
                              "term": {
                                "Filtres": `all-only`
                              }
                            }
                          ]
                        }
                      }
                    ]
                  }
                }
                ] : []
              }
            },
            field_value_factor: {
              field: "Importance",  // Champ numérique utilisé pour la pondération
              factor: 1.5,          // Facteur multiplicatif pour ajuster l'impact
              modifier: "none",      // Modificateur pour ajuster l'influence (options : "none", "sqrt", "log", etc.)
              missing : 1
            }
          }
        },
        size: 10,
        sort: [
          { _score: { order: "desc" } },
          { Alias: { order: "desc", missing: "_last" } },
          { "Ordonnances médicales": { order: "desc", missing: "_last" } },
          { "Conseils patient": { order: "desc", missing: "_last" } },
        ]
      },
      {
        headers: {
          "Content-Type": "application/json",
          Authorization:
            "ApiKey bFk2VGs0Y0JHcFJXRm1EZENyaGU6R0xpOHdPUENUSXlxS3NvMGhna3JTUQ==",
        },
      }
    );
      
    return response.data.hits.hits.map((hit) => ({
      Name: hit._source.Name,
      Slug: hit._source.Slug,
      Img: hit._source.Logo_for_finder_URL,
      wordingLogo: hit._source.Wording_Logo,
      filtres: hit._source.Filtres
    }));
  } catch (error) {
    console.error(error);
  }
}
