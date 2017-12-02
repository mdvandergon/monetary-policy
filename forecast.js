/*
Forecast.JS

Modifying the original rate comparison with some forecast data
and params that you can fit for the next few years.
*/
// width and height are set by the render
var margin = {top: 20, right: 40, bottom: 40, left: 50};
var parseTime = d3.timeParse("%m/%d/%Y");

var FORECAST_START = parseTime('01/01/2018');

function projectData(data, options, verbose=false) {
  //* use projections to forecast rates
  // helper functions
  function calcGap(gdp, potential_gdp) {
    return (gdp - potential_gdp) / potential_gdp * 100;
  }
  function calcTaylor(gdp, inf, gap) {
    // inputs are floats (gap is negative)
    return gdp + inf + 0.5*(gdp-inf) + 0.5*gap
  }
  var forecastData = data.filter(function(d) { return d.DATE >= FORECAST_START });
  forecastData.forEach(function(d, i) {
    // calc the forecast with some FOMC projection data
    if (i < 3) {
      var gdp = d.GDP_PROJ,
          gdp_pot = d.GDPPOT_PROJ,
          gdppc1_pc1 = d.GDPPC1_PROJ,
          inf = d.INFLATION_PROJ,
          gap = calcGap(gdp, gdp_pot);
    }
    // otherwise, project it out using the previous year with growth
    else {
      var gdp = forecastData[i-1].GDP_PROJ * (1 + (+options.gwt/100)),
          gdp_pot = d.GDPPOT_PROJ, // we have projections for this
          gdppc1_pc1 = forecastData[i-1].GDPPC1_PROJ* (1+options.gwt/100),
          inf = +options.inf,
          gap = calcGap(gdp, gdp_pot);
      // save the previous year for the next calculation
      forecastData[i].GDP_PROJ = Math.round(gdp, 4);
      forecastData[i].GDPPC1_PROJ = Math.round(gdppc1_pc1, 4);
    }
    var newProjection = calcTaylor(gdppc1_pc1, inf, gap);
    d.PROJECTION = newProjection;

    if (verbose){
      console.log("forecast data:", gdp, gdppc1_pc1, inf,gap)
      console.log("projection "+i, newProjection);
    }

  });
  return data
}

function hwForecast(data) {
  // Holt Winters time series forecast
  var results = [],
      i = 0,
      season_length = 4,
      periods_to_forecast = 12,
      smoothingConstants = {
         alpha: 0.3,
         beta: 0.2,
         gamma: 0.5
      },
      Fct = forecast.HoltWinters(data, season_length, periods_to_forecast,
                                 smoothingConstants);

   for (i=0; i < Fct.length; ++i) {
       results.push([data.length + i, Fct[i]]);
   }
   console.log(results)
   return results
 };


(function makeNowcast() {
  var svg2 = d3.select('#forecast').append('svg')
    .attrs({
      width: svgWidth,
      height: svgHeight
    })
  width = +svg2.attr("width") - margin.left - margin.right
  height =  +svg2.attr("height") - margin.top - margin.bottom
  var forecast = svg2.append('g')
    .attr('transform', 'translate(' + margin.left + ',' + margin.top + ')');

  var x = d3.scaleTime()
  .rangeRound([0, width]);

  var y = d3.scaleLinear()
  .rangeRound([height, 0]);

  /*
  Data is from 2007 and has new fields:
    FEDFUNDS_PROJ: fed funds
    GDPPC1_PROJ: real_gdp growth projections
    INFLATION_PROJ
    GDPPOT_PROJ: potential gdp projections
    GDP_PROJ: projected gdp in dollars
  */
  var datafile = './data/data-forecast.csv';

  // load and plot the first chart
  d3.csv(datafile, function(d) {
    // wrangle
    d.DATE = parseTime(d.DATE);
    d.FEDFUNDS = +d.FEDFUNDS;
    d.TAYLORRATE = +d.TAYLORRATE;
    // projection data
    d.FEDFUNDS_PROJ = +d.FEDFUNDS_PROJ;
    d.GDPPC1_PROJ = +d.GDPPC1_PROJ;
    d.INFLATION_PROJ = +d.INFLATION_PROJ;
    d.GDPPOT_PROJ = +d.GDPPOT_PROJ;
    d.GDP_PROJ = +d.GDP_PROJ;
    d.PROJECTION = 0; // placeholder for forecast
    return d;
  }, function(error, data) {
    if (error) throw error;
    x.domain(d3.extent(data, function(d) { return d.DATE; }));
    y.domain(d3.extent(data, function(d) { return d.TAYLORRATE; }));

    // series data
    // only defined at certain dates
    var fed_funds = d3.line()
      .x(function(d) { return x(d.DATE); })
      .y(function(d) { return y(d.FEDFUNDS); })
      .defined(function(d) { return d.DATE < FORECAST_START ; })
      .curve(d3.curveCatmullRom.alpha(0.5));
    var taylor_rate = d3.line()
      .x(function(d) { return x(d.DATE); })
      .y(function(d) { return y(d.TAYLORRATE); })
      .defined(function(d) {
        return d.DATE < FORECAST_START
            & d.DATE < parseTime('07/01/2017'); })
      .curve(d3.curveCatmullRom.alpha(0.5));
    var ff_proj = d3.line()
      .x(function(d) { return x(d.DATE); })
      .y(function(d) { return y(d.FEDFUNDS_PROJ); })
      .defined(function(d) {
        return d.DATE >= FORECAST_START
              & d.DATE <= parseTime('01/01/2020'); })
      .curve(d3.curveCatmullRom.alpha(0.5));
    var taylor_rate_proj = d3.line()
      .x(function(d) { return x(d.DATE); })
      .y(function(d) { return y(d.PROJECTION); })
      .defined(function(d) { return d.DATE >= FORECAST_START ; })
      .curve(d3.curveCatmullRom.alpha(0.5));

    forecast.append("g")
      .attr("transform", "translate(0," + height + ")")
      .call(d3.axisBottom(x))
      .attr('class', 'axis x-axis')
      .select(".domain")
      .remove();

    forecast.append("g")
      .call(d3.axisLeft(y))
      .attr('class', 'axis y-axis')
      .append("text")
      .attr("fill", "#000")
      .attr("transform", "rotate(-90)")
      .attr("y", 6)
      .attr("dy", "0.71em")
      .attr("text-anchor", "end")
      .text("Interest Rate (%)");

    var ff = forecast.append("path")
      .attr("id", "fed-funds")
      .datum(data)
      .attr("fill", "none")
      .attr("stroke", "#888888")
      .attr("stroke-linejoin", "round")
      .attr("stroke-linecap", "round")
      .attr("stroke-width", 1)
      .attr("d", fed_funds);
    var ff_proj = forecast.append("path")
      .attr("id", "fed-funds-proj")
      .datum(data)
      .attr("fill", "none")
      .attr("stroke", "red")
      .attr("stroke-linejoin", "round")
      .attr("stroke-dasharray", ("3, 3"))
      .attr("stroke-linecap", "round")
      .attr("stroke-width", 1)
      .attr("d", ff_proj);
    var tr =  forecast.append("path")
      .attr("id", "taylor-rate")
      .datum(data)
      .attr("fill", "none")
      .attr("stroke", "#2F74FF")
      .attr("stroke-linejoin", "round")
      .attr("stroke-linecap", "round")
      .attr("stroke-width", 1)
      .attr("d", taylor_rate);
    var proj =  forecast.append("path")
      .attr("id", "projection")
      .datum(data)
      .attr("fill", "none")
      .attr("stroke", "#AB3C93")
      .attr("stroke-linejoin", "round")
      .attr("stroke-linecap", "round")
      .attr("stroke-width", 3)
      .attr("d", taylor_rate_proj);

    // end series
    // shade the forecast region
    forecast.append('rect')
      .attr('class', 'bar')
      .transition()
      .delay(100)
      .attr('x', function(d) { return x(FORECAST_START); })
      .attr('y', 1)
      .attr('width', function() { return width - x(FORECAST_START); })
      .attr('height', height)
      .attr('rx', 2)
      .attr('ry', 2);

    // plot legend
    var legendSize = 200;
    var ordinal = d3.scaleOrdinal()
      .domain(["Fed Funds", "FOMC Projection", "Taylor Rate", "Your Projection"])
      .range(["black", "red", "#2F74FF", "#AB3C93"]);

    var legend = forecast.append("g")
      .attr("class", "legend")
      .attr("transform", "translate("+(width - legendSize) +","+ 2*margin.top +")");

    var legendOrdinal = d3.legendColor()
      .shape("path", d3.symbol().type(d3.symbolCircle).size(legendSize)())
      .shapePadding(5)
      .cellFilter(function(d){ return d.label !== "e" })
      .scale(ordinal);

    legend.call(legendOrdinal);

    // hook into data.PROJ and setup the forecast
    // data.PROJECTION = makeForecast()

  // ** update forecast
  function updateData(data) {
    /*
    Take some existing projections and allow the user to forecast data
    options are the value of user input
      options.inflation
      options.growth
    */

    console.log("Forecast triggered")
    // get the options and coerce to number
    var options = {};
    options["inf"]  = +d3.select("#inflation").node().value;
    options["gwt"]  = $("input[name=growth]:checked").val()

    // get the data
    data = projectData(data, options);

    // select and update the projection
    projection = d3.select('#projection')
    projection.attr('d', function(d){return taylor_rate_proj(d)})
    projection.enter().append('svg:path').attr('d', function(d){return taylor_rate_proj(d)})
      .transition().delay(500)
    projection.exit().remove()

    // axis transition
    var update = forecast.transition()
    update.select(".x-axis")
        .duration(750)
        .call(x);
    update.select(".y-axis")
        .duration(750)
        .call(y);
  }

  updateData(data)
  // on input, update the line
  var updater = $('input').on('change', function() {
    updateData(data)});
  });

})();
