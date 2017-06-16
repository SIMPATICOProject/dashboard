var procedures = {};
$(document).ready(function () {
  google.charts.load("current", {packages:["corechart"]});
	
  // Get SIMPATICO api url from controller
  var globalURL = parent.angular.element(parent.document.querySelector('[ng-controller="MainController as main"]')).scope().main.simpaticoURL;
  var ctzURL = parent.angular.element(parent.document.querySelector('[ng-controller="MainController as main"]')).scope().main.ctzURL;
  var cpdURL = parent.angular.element(parent.document.querySelector('[ng-controller="MainController as main"]')).scope().main.cpdURL;
  
  // Get language and load script for it
  var lang = getQueryStringValue("lang"); // Query string of the iframe's url, not the browser's
  
  var setProcedure = function(pId){
	    getSVGImage(cpdURL, pId);
	    fillEservices(pId, setEservice);
  }

  var setEservice = function(eServiceId) {
    
    $("*[id^='tae-']").html('');
    $("*[id^='ctz-']").html('');
    $("*[id^='wae-']").html('');
    $("*[id^='cdv-']").html('');
    $("*[id^='sessions-']").html('');	  
	  
    // Get real data
    // Ctzpedia stats
    getCtzQuestions(ctzURL, eServiceId);
    // Ctzpedia stats
    getCtzStats(eServiceId);
    // TAE stats
    getTAEStats(eServiceId);
    // WAE stats
    getWAEStats(eServiceId);
    // CDV stats
    getCDVStats(eServiceId);
    // Session data
    getSessionStats(eServiceId);
    //Satisfaction
    getSatisfaction(eServiceId);
  }
  
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
  
  fillProcedures(cpdURL, setProcedure);
  
  // Select function when procedure changes
  $('#procedures').change(function () {
    var id = $('#procedures option:selected').val();
    setProcedure(id);
  });  
  
  // Select function when eservice changes
  $('#eservices').change(function () {
    var id = $('#eservices option:selected').val();
    setEservice(id);
  });  
});

function fillProcedures(cpdURL, cb) {
  $.get(cpdURL+"/api/diagram/summary/list", function (data) {
    var select = $('#procedures');
    var first;
    data.sort(function(a,b){
    	return a.name.localeCompare(b.name);
    });
    data.forEach(function (procedure) {
      if (first == null) first = procedure.diagramId;
      select.append($('<option></option').val(procedure.diagramId).html(procedure.name));
      // Cache the service in the global variable
      procedures[procedure.diagramId] = procedure;
    });
    cb(first);
  });
}
function fillEservices(id, cb) {
	var procedure = procedures[id];
	var select = $('#eservices');
    var first = null;
    select.find('option').remove();
    
    procedure.phases.forEach(function (phase) {
      if (phase.eServiceId == null) return;
      
      if (first == null) first = phase.eServiceId;
      select.append($('<option></option').val(phase.eServiceId).html(phase.name));
    });
    cb(first);
}

function getSVGImage (cpdURL, procedureId) {	
    $('#svg-eservice').attr("src", cpdURL+"/assets/svg/"+procedureId+".svg");
}

function getQueryStringValue (key) {  
  return decodeURIComponent(window.location.search.replace(new RegExp("^(?:.*[&\\?]" + encodeURIComponent(key).replace(/[\.\+\*]/g, "\\$&") + "(?:\\=([^&]*))?)?.*$", "i"), "$1"));  
}

//CTZP questions
function getCtzQuestions (url, eservice) {
  $.get(url+'/questions/'+eservice, function (data) {
    $('#ctz-questions').html(data);
  });
}
//CTZP stats
function getCtzStats(eservice) {
	  $.get('./da/ctzp/'+eservice, function (data) {
		  data.aggregations.events.buckets.forEach(function(b){
			    $('#ctz-'+b.key).html(b.doc_count);
		  });
	  });
}
//TAE
function getTAEStats(eservice) {
	  $.get('./da/tae/'+eservice, function (data) {
		  data.aggregations.events.buckets.forEach(function(b){
			    $('#tae-'+b.key).html(b.doc_count);
		  });
	  });
	  $.get('./da/tae/'+eservice+'/actions', function (data) {
		  data.aggregations.actions.buckets.forEach(function(b){
			    $('#tae-action-'+b.key).html(b.doc_count);
		  });
	  });
}
//WAE
function getWAEStats(eservice) {
	  $.get('./da/wae/'+eservice, function (data) {
		  data.aggregations.events.buckets.forEach(function(b){
			    $('#wae-'+b.key).html(b.doc_count);
		  });
	  });
}
//CDV
function getCDVStats(eservice) {
	  $.get('./da/cdv/'+eservice, function (data) {
		  data.aggregations.events.buckets.forEach(function(b){
			    $('#cdv-'+b.key).html(b.doc_count);
		  });
		  data.aggregations.actions.buckets.forEach(function(b){
			    $('#cdv-action-'+b.key).html(b.doc_count);
		  });
	  });
}
//Sessions
function getSessionStats(eservice) {
	  $.get('./da/sessions/'+eservice, function (data) {
		  $('#sessions-number').html(data.hits.total);
		  $('#sessions-avg_duration').html(moment().startOf('day').add(data.aggregations.avg_duration.value,'ms').format('H[h] m[min] s[sec]'));
	  });
}
//Satisfactions
function getSatisfaction(eservice){
	  $.get('./da/satisfaction/'+eservice, function (stats) {
		  
	      var chart = new google.visualization.BarChart(document.getElementById("tae-satisfaction"));
	      var taeData = google.visualization.arrayToDataTable([
	    	  ['sat', 'value'],
	    	  ['', stats.aggregations['text-sat'].value+5]
	      ]);	  
		  var view = new google.visualization.DataView(taeData);
	      var options = {
	              height: 100,
	              legend: {position: 'none'},
	              hAxis: {
	                minValue: 0,
	                maxValue: 10
	              },
	              chartArea:{width: '100%'} 
	      };
	      chart.draw(view, options);

	      chart = new google.visualization.BarChart(document.getElementById("ctzp-satisfaction"));
	      var ctzpData = google.visualization.arrayToDataTable([
	    	  ['sat', 'value'],
	    	  ['', stats.aggregations['ctz-sat'].value+5]
	      ]);	  
		  view = new google.visualization.DataView(ctzpData);
	      chart.draw(view, options);
	      
		  var faces = stats.aggregations.faces.buckets;
		  var faceData = google.visualization.arrayToDataTable([
		        ['none', 'sad', 'normal', 'happy', { role: 'annotation' } ],
		        ['', faces.sad.doc_count, faces.normal.doc_count, faces.happy.doc_count, '']
		      ]);
		  
		  view = new google.visualization.DataView(faceData);

	      var facesOptions = {
	    		  isStacked: 'percent',
	    		  height: 100,
	              legend: {position: 'none'},
	              hAxis: {
	                minValue: 0,
	                ticks: [0, .25, .5, .75, 1]
	              }, 
	              series:  {
			    	  0:{color:'red'},
			      	  1:{color:'yellow'},
			      	  2:{color:'green'}
	              },
	              chartArea:{width: '100%'} 
	      };
	      chart = new google.visualization.BarChart(document.getElementById("faces"));
	      chart.draw(view, facesOptions);
	  });
}


