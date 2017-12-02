/*
Forecast.JS

Modifying the original rate comparison with some forecast data
and params that you can fit for the next few years.
*/
// width and height are set by the render
var margin = {top: 20, right: 40, bottom: 40, left: 50};

function calcGap(d) {
  // given our data, make a forecast for
  var v;
  if (d.DATE >= '01/01/2018') {
    var v = (d.GDP_PROJ - d.GDPPC1_PROJ) / d.GDPPC1_PROJ;
  }
  return v
}

function calcTaylor(gdp, inf, gap) {
  // inputs are floats (gap is negative)
  return gdp + inf + 0.5*(gdp-inf) + 0.5*gap
}

function makeForecast(data) {
  // Holt Winters time series forecast
  var results = [],
      i = 0,
      season_length = 4,
      periods = 12,
      smoothingConstants = {
         alpha: 0.3,
         beta: 0.2,
         gamma: 0.5
      },
      Fct = forecast.HoltWinters(data, season_length, periods,
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

  var parseTime = d3.timeParse("%m/%d/%Y");

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
    d.PROJECTION = +0; // placeholder for forecast
    return d;
  }, function(error, data) {
    if (error) throw error;
    x.domain(d3.extent(data, function(d) { return d.DATE; }));
    y.domain(d3.extent(data, function(d) { return d.TAYLORRATE; }));

    // suppress null data
    var forecast_start = parseTime('01/01/2018');

    // series data
    var fed_funds = d3.line()
      .x(function(d) { return x(d.DATE); })
      .y(function(d) { return y(d.FEDFUNDS); })
      .defined(function(d) { return d.DATE < forecast_start ; })
      .curve(d3.curveCatmullRom.alpha(0.5));
    var taylor_rate = d3.line()
      .x(function(d) { return x(d.DATE); })
      .y(function(d) { return y(d.TAYLORRATE); })
      .defined(function(d) {
        return d.DATE < forecast_start
            & d.DATE < parseTime('07/01/2017'); })
      .curve(d3.curveCatmullRom.alpha(0.5));
    var ff_proj = d3.line()
      .x(function(d) { return x(d.DATE); })
      .y(function(d) { return y(d.FEDFUNDS_PROJ); })
      .defined(function(d) {
        return d.DATE >= forecast_start
              & d.DATE <= parseTime('01/01/2020'); })
      .curve(d3.curveCatmullRom.alpha(0.5));
    var taylor_rate_proj = d3.line()
      .x(function(d) { return x(d.DATE); })
      .y(function(d) { return y(d.PROJECTION); })
      .defined(function(d) { return d.DATE >= forecast_start ; })
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
      .attr('class', 'recession-bar')
      .transition()
      .delay(100)
      .attr('x', function(d) { return x(forecast_start); })
      .attr('y', 1)
      .attr('width', function() { return width - x(forecast_start); })
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
    options are buttons
      options.inflation
      options.growth
      options.productivity is fixed
    */

    console.log("Update triggered")

    // reasonable values
    var inf_range = [1,3],
        gwt_range = [0.5,4];
        // gap_range = [0.5,4];

    // get the options
    var options = {};
    options["inf"]  = d3.select("#inflation").node().value;
    options["gwt"]  = d3.select("#growth").node().value;
    // options["prod"]  = d3.select("#productivity").node().value;

    // starting values
    data.forEach(function(d) {
      // make a new projection
      var new_projection = d.PROJECTION + 0.1;
      d.PROJECTION = new_projection;
    });


    // select and update the projection
    projection = g.select('#projection').data()
    projection.attr('d', function(d){return line(d) + 'Z'})
    projection.enter().append('svg:path').attr('d', function(d){return line(d) + 'Z'})
    projection.exit().remove()

    // Scale the y range of the data again
    // y.domain([0, d3.max(data, function(d) { return d.PROJECTION; })]);

    // section transition
    svg.transition();
    // Make the changes
    forecast.select("#projection")   // change the line
        .duration(750)
        .attr("d", line(data));
    forecast.select(".x-axis") // change the x axis
        .duration(750)
        .call(xAxis);
    forecast.select(".y-axis") // change the y axis
        .duration(750)
        .call(yAxis);
  }

  // on keyup, update the line
  var fctOptions = d3.select('#graph-options').on('keyup', updateData);

  });

})();
