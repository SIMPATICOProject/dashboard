angular.module('dashboard', ["ngIframeResizer"])
.controller('MainController', function() {
    var main = this;
    main.view = null;
    main.lang = "en";
    
    main.getEnrichmentUrl = function () {
      return "enrichment?lang=" + main.lang;
    };
})

;