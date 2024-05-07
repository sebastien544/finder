var params = new URLSearchParams(location.search);
const query = params.get("query")
const page = params.get("page")

async function searchAll(query, page) {
    try {
      const response = await axios.post(
        `${ES_URL}/_search`,
      // "https://ordotype-finder.es.eu-west-3.aws.elastic-cloud.com/ordotype-index-2023-12-21c/_search",
        {
          query: {
            query_string: {
              query: query + "*",
              fields: [
                "Boost^6",
                "Name^5",
                "Alias^4",
                "Ordonnances médicales^3",
                "Conseils patient^2",
                "Informations cliniques - HTML",
              ],
            },
          },
          size: 10,
          from: page*10-10,
          sort: [
            { _score: { order: "desc" } },
            { Alias: { order: "desc", missing: "_last" } },
            { "Ordonnances médicales": { order: "desc", missing: "_last" } },
            { "Conseils patient": { order: "desc", missing: "_last" } },
          ],
        //   track_total_hits: true
        },
        {
          headers: {
            "Content-Type": "application/json",
            Authorization:
              "ApiKey bFk2VGs0Y0JHcFJXRm1EZENyaGU6R0xpOHdPUENUSXlxS3NvMGhna3JTUQ==",
          },
        }
      );

        
      document.getElementById('search-title').innerText = `${response.data.hits.total.value} Résultats pour "${query}"`;
      displayPagination(response.data.hits.total.value, query);
  
      return response.data.hits.hits.map((hit) => ({
        Name: hit._source.Name,
        Slug: hit._source.Slug,
        // url: hit._source.url,
        gratos: hit._source.gratos,
        Img: hit._source.Logo_for_finder_URL,
      }));
    } catch (error) {
      console.error(error);
    }
}

function displayPagination(totalResults, query){
  const totalPages = Math.ceil(totalResults / 10);
  const paginationDiv = document.getElementById('pagination');
  paginationDiv.style.cssText = "display: flex; justify-content: center;"

  if (totalPages <= 7) {
    for (let index = 1; index <= totalPages; index++) {
      let link  = document.createElement('a')
      link.style.cssText = 'text-decoration: none;margin: 0px 10px; font-weight: 600;'
      link.setAttribute('href', `http://ordotype.webflow.io/search-result?query=${query}&page=${index}`);
      let number = document.createTextNode(index);
      link.appendChild(number);
      paginationDiv.appendChild(link);
    }
  } else {
    for (let index = 1; index < 8; index++) {
        let link  = document.createElement('a')
        link.style.cssText = 'text-decoration: none;margin: 0px 10px; font-weight: 600;'
        link.style.color = index == page ? 'ffffffe6' : '#0c0e16';
        //link.style.backgroundColor = page > 4  ? '#3454f6' : 'none';
      
        let number = document.createTextNode(index);
        let href = index;
        switch (index) {
          case 2:
            if (page > 4) number = document.createTextNode('...');
            break;
          case 3:
            if (page > 4) {
              number = document.createTextNode(parseInt(page)-1);
              href = parseInt(page)-1;
            } 
            if ( page > totalPages - 3 ){ 
              number = document.createTextNode(totalPages - 4);
              href = totalPages - 4;
            }
            break;
          case 4:
            if (page > 4) {
              number = document.createTextNode(page);
              href = page;
            } 
            if ( page > totalPages - 3 ){ 
              number = document.createTextNode(totalPages - 3);
              href = totalPages - 3;
            }
            break;
          case 5: 
            if (page > 4) {
              number = document.createTextNode(parseInt(page)+1);
              href = parseInt(page)+1;
            } 
            if ( page > totalPages - 3 ){ 
              number = document.createTextNode(totalPages - 2);
              href = totalPages - 2;
            }
            break;
          case 6:
            if ( page > totalPages - 3 ){
              number = document.createTextNode(totalPages - 1);
              href = totalPages - 1;
            } else {
              number = document.createTextNode('...');
            }
            break;
          case 7:
            number = document.createTextNode(totalPages);
            href = totalPages;
            break;
          default:
            break;
        }

        link.setAttribute('href', `http://ordotype.webflow.io/search-result?query=${query}&page=${href}`);
        link.appendChild(number);
        paginationDiv.appendChild(link);
    }
  }
}

document.addEventListener("DOMContentLoaded", async function(){
    let results = await searchAll(query, page);
    if (results.length == 0) {
      results = await suggest(query);
    }
    const baseUrl = window.location.origin.includes('webflow.io') 
    ? 'https://ordotype.webflow.io' 
    : 'https://www.ordotype.fr';
    let resultList = document.getElementById("search-result-wraper");
    results.forEach((result, index) => {
        const resultElement = document.createElement("a");
    
        const img = document.createElement("img");
        img.style.width = "16px";
        img.style.height = "16px";
        img.style.marginLeft = "5px";  // Add some space between the image and the text
    
        resultElement.classList.add("search-result");
        const div =  document.createElement('div');
    
        // Check the gratos value and set the image source or make it invisible
        if (result.gratos == "FALSE") {
            img.setAttribute("src", result.Img);
            div.style.cssText = "background-color: #0c0e160d; display: flex; align-items: center; padding: 2px 8px; font-size:14px; border-radius: 4px;";
            window.matchMedia("(min-width: 480px)").matches && div.appendChild(document.createTextNode('Ordotype plus'));
            div.appendChild(img);
        } else {
            img.setAttribute("src", "data:image/gif;base64,R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7");
            img.style.opacity = "1"; // Maintain the opacity so the space is preserved
        }
    
        resultElement.style.cssText =
            "text-decoration: none; color: #0C0E1699; font-size: 16px; padding: 8px 8px; display: flex; align-items: center; justify-content:space-between";
    
        resultElement.addEventListener("click", function(event) {
            event.preventDefault();
            // handleSendClickResultToGA(input.id);
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
        result.gratos == "FALSE" ? resultElement.appendChild(div) : resultElement.appendChild(img);  // Add img element
    
        resultList.appendChild(resultElement);
    });
});
