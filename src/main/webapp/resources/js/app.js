angular.module('dashboard', ["ngIframeResizer"])
.controller('MainController', function() {
    var main = this;
    main.view = null;
    main.lang = "en";
    
    main.getEnrichmentUrl = function () {
      return "enrichment?lang=" + main.lang;
    };
    
    // Configuration of variables for the EE tab
    main.simpaticoURL = "https://simpatico.smartcommunitylab.it/simpatico-logs/api";
    main.ctzURL = "https://simpatico.smartcommunitylab.it/qae/api/stats";
    main.cpdURL = "https://simpatico.smartcommunitylab.it/cpd";
})

;