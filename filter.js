async function search(query, filter, page) {
  try {
    const nameFuzziness =  query.length >= 5 ? 2 : query.length >= 4 ? "AUTO" : 0;                            
    
    const response = await axios.post(
      `https://ordotype-finder.es.eu-west-3.aws.elastic-cloud.com/ordotype-index-2025-09-26/_search`,
      {
        query: {
          function_score: {
            query: {
              bool: {
                must: [
                  {
                    bool: {
                      should: [
                        {
                          match_phrase_prefix: {
                            Name: {
                              query: query,
                              slop: 0,
                              max_expansions: 20,
                              boost: 4,
                            },
                          },
                        },
                        {
                          match: {
                            Name: {
                              query: query,
                              operator: "AND",
                              fuzziness: nameFuzziness,
                              boost: 3,
                            },
                          },
                        },
                        {
                          match_phrase_prefix: {
                            Alias: {
                              query: query,
                              slop: 0,
                              max_expansions: 20,
                              boost: 1.5,
                            },
                          },
                        },
                        {
                          match: {
                            Alias: {
                              query: query,
                              operator: "OR", // au moins un mot-clé
                              fuzziness: nameFuzziness,
                            },
                          },
                        },
                      ],
                      minimum_should_match: 1,
                    },
                  },
                ],

                filter: filter
                  ? [{ wildcard: { Filtres: `*${filter}*` } }]
                  : [],
                must_not: !filter
                  ? [
                      {
                        bool: {
                          must: [
                            { wildcard: { Filtres: `*only*` } },
                            {
                              bool: {
                                must_not: [{ term: { Filtres: `all-only` } }],
                              },
                            },
                          ],
                        },
                      },
                    ]
                  : [],
              },
            },
            field_value_factor: {
              field: "Importance",
              factor: 1.5,
              modifier: "none",
              missing: 1,
            },
          },
        },
        suggest: {
          med_suggest: {
            prefix: query,
            completion: {
              field: "Slug",
              fuzzy: {
                fuzziness: 2,
              },
              size: 10,
            },
          },
        },
        size: page ? 20 : 10,
        from: page ? page * 20 - 20 : 0,
        sort: [
          { _score: { order: "desc" } },
          { Alias: { order: "desc", missing: "_last" } },
          { "Ordonnances médicales": { order: "desc", missing: "_last" } },
          { "Conseils patient": { order: "desc", missing: "_last" } },
        ],
      },
      {
        headers: {
          "Content-Type": "application/json",
          Authorization:
            "ApiKey SEdpeW1wb0J5bkFkTnVyZVp3TUs6bTFuUDRhdDNRTEdnbWtrSEV4a3QwUQ==",
        },
      }
    );

     const hits = response.data.hits.hits;
   const suggestions = response.data.suggest?.med_suggest?.[0]?.options ?? [];

    const usingSuggestions = hits.length === 0 && suggestions.length > 0;
    const rawResults = usingSuggestions ? suggestions : hits;

    page && displayPagination(response.data.hits.total.value, query);

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
