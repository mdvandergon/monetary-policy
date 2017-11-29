/*
NOWCAST.JS

Modifying the original rate comparison with some forecast data
and params that you can fit for the next 5 years.
*/

function forecastSSA() {

}

function forecastTaylorRule() {

}

(function makeNowcast() {
  var svg2 = d3.select('#nowcast').append('svg')
    .attrs({
      width: svgWidth,
      height: svgHeight
    })
  width = +svg2.attr("width") - margin.left - margin.right
  height =  +svg2.attr("height") - margin.top - margin.bottom
  var nowcast = svg2.append('g')
    .attr('transform', 'translate(' + margin.left + ',' + margin.top + ')');

  var parseTime = d3.timeParse("%m/%d/%Y");

  var x = d3.scaleTime()
  .rangeRound([0, width]);

  var y = d3.scaleLinear()
  .rangeRound([height, 0]);

  // data
  var datafile = '/data/data.csv';

  // load and plot the first chart
  d3.csv(datafile, function(d) {
    // wrangle
    d.DATE = parseTime(d.DATE);
    d.FEDFUNDS = +d.FEDFUNDS;
    d.TAYLORRATE = +d.TAYLORRATE;
    return d;
  }, function(error, data) {
    if (error) throw error;
    x.domain(d3.extent(data, function(d) { return d.DATE; }));
    y.domain(d3.extent(data, function(d) { return d.FEDFUNDS; }));

    var fed_funds = d3.line()
      .x(function(d) { return x(d.DATE); })
      .y(function(d) { return y(d.FEDFUNDS); })
      .curve(d3.curveCatmullRom.alpha(0.5));
    var taylor_rate = d3.line()
      .x(function(d) { return x(d.DATE); })
      .y(function(d) { return y(d.TAYLORRATE); })
      .curve(d3.curveCatmullRom.alpha(0.5));

    nowcast.append("g")
      .attr("transform", "translate(0," + height + ")")
      .call(d3.axisBottom(x))
      .attr('class', 'axis')
      .select(".domain")
      .remove();

    nowcast.append("g")
      .call(d3.axisLeft(y))
      .attr('class', 'axis')
      .append("text")
      .attr("fill", "#000")
      .attr("transform", "rotate(-90)")
      .attr("y", 6)
      .attr("dy", "0.71em")
      .attr("text-anchor", "end")
      .text("Interest Rate (%)");

    var ff = nowcast.append("path")
      .attr("id", "fed-funds")
      .datum(data)
      .attr("fill", "none")
      .attr("stroke", "#666666")
      .attr("stroke-linejoin", "round")
      .attr("stroke-linecap", "round")
      .attr("stroke-width", 1)
      .attr("d", fed_funds);

    var tr =  nowcast.append("path")
      .attr("id", "taylor-rate")
      .datum(data)
      .attr("fill", "none")
      .attr("stroke", "#2F74FF")
      .attr("stroke-linejoin", "round")
      .attr("stroke-linecap", "round")
      .attr("stroke-width", 3)
      .attr("d", taylor_rate);
  });
})();
