searchBar?.addEventListener("keydown", (e) => {
 if (e.key === 'Enter') {
      e.preventDefault(); // Empêche l'action par défaut pour la touche Entrée
  }
  keyDownEvent(e);
});


function keyDownEvent(e) {
  var x = document.getElementById("search-results") || document.querySelector(`div[data-w-tab="${activeTab}"] div.search-result-body`);
  if (x) x = x.getElementsByTagName("a");
  if (e.keyCode == 40) {
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
    /*If the ENTER key is pressed, prevent the form from being submitted,*/
    e.preventDefault();
    if (currentFocus > -1) {
      /*and simulate a click on the "active" item:*/
      if (x) x[currentFocus].click();
    } else {
        const query = e.currentTarget.value.trim();
        window.location.href = `${baseUrl}/search-result?query=${query}&page=1`;
    }
  }
}
