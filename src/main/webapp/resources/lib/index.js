$(document).ready(function () {
  //Get language and load script for it
  var lang = getQueryStringValue("lang"); // Query string of the iframe's url, not the browser's
  if (lang == "") {
    lang = angular.element(document.querySelector('[ng-controller="MainController as main"]')).scope().main.lang;
  }

  console.log("LANG: " + lang);
  $.getScript("lang/"+lang+".js")
    .done(function (script, textStatus) {
      // i18n
      if(window.SwaggerTranslator) {
        window.SwaggerTranslator.translate();
      }
    })
    .fail(function (jqxhr, settings, exception) {
      console.log(exception);
    });
});

function getQueryStringValue (key) {  
  return decodeURIComponent(window.location.search.replace(new RegExp("^(?:.*[&\\?]" + encodeURIComponent(key).replace(/[\.\+\*]/g, "\\$&") + "(?:\\=([^&]*))?)?.*$", "i"), "$1"));  
}