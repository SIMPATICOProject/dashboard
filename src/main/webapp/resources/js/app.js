angular.module('dashboard', ["ngIframeResizer"])
.controller('MainController', function() {
    var main = this;
    main.view = null;
    main.lang = "es";
    
    main.getEnrichmentUrl = function () {
      return "enrichment?lang=" + main.lang;
    };
    
    // Configuration of variables for the EE tab
    main.simpaticoURL = "https://simpatico.hi-iberia.es:4570/simpatico/api";
    main.ctzURL = "https://simpatico.hi-iberia.es:4569/qae/api";
    main.cpdURL = "https://simpatico.hi-iberia.es:4570/cpd";
});