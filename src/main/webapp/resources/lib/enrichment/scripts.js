$(document).ready(function () {
  // Get SIMPATICO api url from controller
  var globalURL = parent.angular.element(parent.document.querySelector('[ng-controller="MainController as main"]')).scope().main.simpaticoURL;
  var ctzURL = parent.angular.element(parent.document.querySelector('[ng-controller="MainController as main"]')).scope().main.ctzURL;
  
  // Get language and load script for it
  var lang = getQueryStringValue("lang"); // Query string of the iframe's url, not the browser's
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
  
  // Get info for the svg image
  var eserviceId = "96949573-5ba3-438d-b2dd-68c4fc41a8b7";
  getSVGImage(eserviceId);
  
  // Select function when eservice changes
  $('#eservice').change(function () {
    var id = $('#eservice option:selected').val();
    getSVGImage(id);
  });
  
  // Change between real and custom data
  $('#customData').click(function () {
    if ($(this).hasClass("toCustom")) {
      // Reload the iframe
      parent.document.getElementById("iFrameResizer0").contentDocument.location.reload(true);
    } else {
      $(this).html(window.SwaggerTranslator._tryTranslate("Cambiar a datos de prueba"));
      $(this).addClass("toCustom");
      // Satisfaction
      getSatisfaction(globalURL);
      // Averages
      getAverages(globalURL);
      // Ctzpedia stats
      getCtzQuestions(ctzURL, eserviceId);
      // Simplifications stats
      getSimplStats();
    }
  });
});

function getSVGImage (eserviceId) {
  $.get("https://simpatico.business-engineering.it/cpd/api/diagram/eService/"+eserviceId+"/summary", function (data) {
    console.log(data);
    // Set image's source url
    $('#svg-eservice').attr("src", data.svg);
  })
}

function getQueryStringValue (key) {  
  return decodeURIComponent(window.location.search.replace(new RegExp("^(?:.*[&\\?]" + encodeURIComponent(key).replace(/[\.\+\*]/g, "\\$&") + "(?:\\=([^&]*))?)?.*$", "i"), "$1"));  
}

// Satisfactions
function getSatisfaction (url) {
  // Considerating every simplification: paragraph, sentence and word
  // Values from -5 to 5 -> -5 = 0%, 0 = 50%, 5 = 100%
  // TODO: This should be done server side
  $.get(url+'/logs/find?words=session-feedback', function (data) {
    var simpCount = 0;
    var ctzCount = 0;
    
    var paragraphSatisf = 0;
    var phraseSatisf = 0;
    var wordSatisf = 0;
    var ctzSatisf = 0;
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
    $('#averageTime').html(totalDuration + " sec");
  });
}

// Stats
function getCtzQuestions (url, eservice) {
  $.get(url+'/questions/'+eservice, function (data) {
    $('#ctz-questions-1').html(data);
    $('#ctz-questions-2').html(0); // No data available
    $('#ctz-questions-3').html(0); // No data available
  });
}

function getSimplStats () {
  // TODO: No data available
  $('#simpl-1').html(0);
  $('#simpl-2').html(0);
  $('#simpl-3').html(0);
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

// Google charts
//google.charts.load('current', {'packages':['corechart']});
//google.charts.setOnLoadCallback(getDataFromAPI); // It will be called after the page finishes loading

function getDataFromAPI() {
  $.get(simpaticoAPI + '/analytics/find?sortdesc&words=time_per_tab&limit=1', function (data) {
    drawChartTime(data);
  });
  
  $.get(simpaticoAPI + '/analytics/find?words=duration_frecuency&sortdesc&limit=1', function (data) {
    drawChartHistogram(data);
  });
}

function drawChartTime(data) {
  var arrTabs = new Array(5).fill(0);
  if (data.results.length > 0) {
    data.results[0].data.payload.forEach(function (valueTab) {
  	  arrTabs.push(parseFloat(valueTab)); 
    });
  }
  
  var options = {
      title: 'Visit duration per tab (in minutes)',
      width: 500,
      height: 400,
      vAxis: {
        title: 'Time (sec)'
      }
    };
  
  // Paint data (average)
  var dataTable = google.visualization.arrayToDataTable([
    ['Page', 'Time on Site', { role: 'style' }],
    ['Solicitude', arrTabs[0], 'blue'],
    ['Documentación', arrTabs[1], 'green'],
    ['A onde acudir', arrTabs[2], 'purple'],
    ['Obxecto', arrTabs[3], 'orange'],
    ['Normativa', arrTabs[4], 'chocolate']
  ]);

  var chart = new google.visualization.ColumnChart(document.getElementById('chart_time'));
  chart.draw(dataTable, options);
}

function drawChartHistogram(data) {
  var options = {
      title: 'Duration frequency',
      width: 600,
      height: 400,
      pointSize: 4,
      hAxis: {
        title: 'Time (sec)'
      },
      vAxis: {
        title: 'Users'
      },
      colors: ['blue', 'green', 'purple', 'orange', 'chocolate']
    };
  
  var dataChart = google.visualization.arrayToDataTable([]);
  var chart = new google.visualization.LineChart(document.getElementById('chart_histogram'));
  var dateInfo = document.getElementById('date_info');
  
  
  var dataPayload = new Array(5).fill(new Array(5).fill(0));
  var dataCreated = new Date();
  if (data.results.length > 0) {
    dataPayload = data.results[0].data.payload;
    dataCreated = new Date(data.results[0].data.created);
  }
  
  // Crunch the data
  var array = [[]];
  array[0] = ['Time (sec)', 'Solicitude', 'Documentación', 'A onde acudir', 'Obxecto', 'Normativa'];
  array.push(['0-30', dataPayload[0][0], dataPayload[1][0], dataPayload[2][0], dataPayload[3][0], dataPayload[4][0]]);
  array.push(['30-60', dataPayload[0][1], dataPayload[1][1], dataPayload[2][1], dataPayload[3][1], dataPayload[4][1]]);
  array.push(['60-90', dataPayload[0][2], dataPayload[1][2], dataPayload[2][2], dataPayload[3][2], dataPayload[4][2]]);
  array.push(['90-120', dataPayload[0][3], dataPayload[1][3], dataPayload[2][3], dataPayload[3][3], dataPayload[4][3]]);
  array.push(['+120', dataPayload[0][4], dataPayload[1][4], dataPayload[2][4], dataPayload[3][4], dataPayload[4][4]]);
  
  // Paint the data
  dataChart = google.visualization.arrayToDataTable(array);
  
  chart.draw(dataChart, options);
  dateInfo.innerHTML = "&nbsp;Last analysis: " + dataCreated;
}

function minToSecs(min) {
  return min*60;
}