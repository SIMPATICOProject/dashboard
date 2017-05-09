angular.module('dashboard', ["ngIframeResizer"])
.controller('MainController', function() {
    var main = this;
    main.view = null;
    main.lang = "en";
    
    main.getEnrichmentUrl = function () {
      return "enrichment?lang=" + main.lang;
    };
    
    main.simpaticoURL = "https://simpatico.hi-iberia.es:4570/simpatico/api";
})

;