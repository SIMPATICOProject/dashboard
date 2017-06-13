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

// Satisfactions
function getSatisfactionOld (url) {
  // Considerating every simplification: paragraph, sentence and word
  // Values from -5 to 5 -> -5 = 0%, 0 = 50%, 5 = 100%
  // TODO: This should be done server side
  $.get(url+'/logs/find?words=session-feedback', function (data) {
    var simpCount = 0;
    var ctzCount = 0;
    var averageWordsCount = 0;
    
    var paragraphSatisf = 0;
    var phraseSatisf = 0;
    var wordSatisf = 0;
    var ctzSatisf = 0;
    var wordsComments = 0;
    data.results.forEach(function (doc) {
      if (doc.data.slider_session_feedback_paragraph !== undefined) {
        paragraphSatisf += parseInt(doc.data.slider_session_feedback_paragraph);
        phraseSatisf += parseInt(doc.data.slider_session_feedback_phrase);
        wordSatisf += parseInt(doc.data.slider_session_feedback_word);
        simpCount++;
      }
      
      if (doc.data.slider_session_feedback_ctz !== undefined) {
        ctzSatisf += parseInt(doc.data.slider_session_feedback_ctz) + 5; // [-5,5] to [0-10]
        ctzCount++;
      }
      
      // average number of words in comments
      if (doc.data["session-feedback-comments-text"] !== undefined) {
        var wordsArr = doc.data["session-feedback-comments-text"].split(" ");
        wordsComments += wordsArr.length;
        averageWordsCount++;
        
      }
      if (doc.data["session-feedback-timeout-text"] !== undefined) {
        var wordsArr = doc.data["session-feedback-timeout-text"].split(" ");
        wordsComments += wordsArr.length;
        averageWordsCount++;
      }
    });
    
    var totalSimpSatisf = (paragraphSatisf + phraseSatisf + wordSatisf) / (simpCount*3);
    totalSimpSatisf = totalSimpSatisf * 100; // Percentage
    totalSimpSatisf = Math.round(totalSimpSatisf * 100) / 100 // 2 decimals only
    var progressbarSimpl = $('#bar-simpl-satisfaction');
    progressbarSimpl.html(totalSimpSatisf + "%");
    progressbarSimpl.css('width', totalSimpSatisf + "%");
    percentageChangeClass(progressbarSimpl, totalSimpSatisf);
    
    var totalCtzSatisf = (ctzSatisf*10) / ctzCount; // *10 to get the percentage
    totalCtzSatisf = Math.round(totalCtzSatisf * 100) / 100 // 2 decimals only
    var progressbarCtz = $('#bar-ctz-satisfaction');
    progressbarCtz.html(totalCtzSatisf + "%");
    progressbarCtz.css('width', totalCtzSatisf + "%");
    percentageChangeClass(progressbarCtz, totalCtzSatisf);
    
    // TODO: Or do it with the faces from the feedback
    var globalSatisf = (totalSimpSatisf + totalCtzSatisf) / 2;
    globalSatisf = Math.round(globalSatisf * 100) / 100 // 2 decimals only
    var progressbarGlobal = $('#bar-global-satisfaction');
    progressbarGlobal.html(globalSatisf + "%");
    progressbarGlobal.css('width', globalSatisf + "%");
    percentageChangeClass(progressbarGlobal, globalSatisf);
    
    // Average number of words
    var averageTotal = wordsComments / averageWordsCount;
    averageTotal = Math.round(averageTotal * 100) / 100 // 2 decimals only
    $('#averageWords').html(averageTotal);
    
    // Simplification stats -> number of times simplification was used == number of feedbacks with simplification form
    $('#simpl-1').html(simpCount);
    $('#simpl-2').html(0); // No data available
    $('#simpl-3').html(0); // No data available
    $('#simpl-4').html(0); // No data available
  });
}

// Averages
function getAverages (url) {
  $.get(url+'/logs/find?words=duration', function (data) {
    var count = data.count;
    var totalDuration = 0;
    data.results.forEach(function (doc) {
      totalDuration += doc.data.duration; // ms
    });
    
    totalDuration = (totalDuration / 1000) / count;
    totalDuration = Math.round(totalDuration * 100) / 100 // 2 decimals only
    if (totalDuration > 120) { // if more than 120 seconds, show it in minutes
      totalDuration = totalDuration / 60;
      totalDuration = Math.round(totalDuration * 100) / 100 // 2 decimals only
      $('#averageTime').html(totalDuration + " min");
    } else {
      $('#averageTime').html(totalDuration + " sec");
    }
  });
}

function percentageChangeClass (elem, percentage) {
  if (percentage < 30) {
    elem.removeClass();
    elem.addClass('progress-bar progress-bar-danger');
  } else if (percentage >= 30 && percentage < 70) {
    elem.removeClass();
    elem.addClass('progress-bar progress-bar-info');
  } else {
    elem.removeClass();
    elem.addClass('progress-bar progress-bar-success');
  }
}

