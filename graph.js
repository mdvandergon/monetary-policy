/*
GRAPH.JS
The animated monetary policy charts
*/

// width and height are set by the render
var margin = {top: 20, right: 40, bottom: 40, left: 50};
var parseTime = d3.timeParse("%m/%d/%Y");

function drawLine(path, duration=2000) {
  var totalLength = path.node().getTotalLength();
  path
    .style('opacity',1)
    .attr("stroke-dasharray", totalLength + " " + totalLength)
    .attr("stroke-dashoffset", totalLength)
    .transition()
      .ease(d3.easeCubic)
      .duration(duration)
      .attr("stroke-dashoffset", 0);
}

function makeLegend(num_series) {
  var d = ["Fed Funds Rate", "Taylor Rule",  "Modified Taylor Rule (inflation)"].slice(0, num_series)
  var r = [ "#666666", "#2F74FF", "#FFBF2F"].slice(0, num_series)

  var legendSize = 200;
  var ordinal = d3.scaleOrdinal()
    .domain(d)
    .range(r);

  d3.select('.legend').remove()
  var legend = d3.select('svg').append("g")
    .attr("class", "legend")
    .attr("transform", "translate("+(width - legendSize) +","+ 2*margin.top +")");
  var legendOrdinal = d3.legendColor()
    .shape("path", d3.symbol().type(d3.symbolCircle).size(legendSize)())
    .shapePadding(10)
    .cellFilter(function(d){ return d.label !== "e" })
    .scale(ordinal);

  legend.call(legendOrdinal);
}

(function makePlot() {

  var svg = d3.select('#graph').append('svg')
    .attrs({
      width: svgWidth,
      height: svgHeight
    })
  var width = +svg.attr("width") - margin.left - margin.right;
  var height =  +svg.attr("height") - margin.top - margin.bottom;

  var g = svg.append('g')
    .attr('transform', 'translate(' + margin.left + ',' + margin.top + ')');

  var x = d3.scaleTime()
  .rangeRound([0, width]);

  var y = d3.scaleLinear()
  .rangeRound([height, 0]);

  // data
  var datafile = './data/data.csv';

  // load and plot the first chart
  d3.csv(datafile, function(d) {
    // wrangle
    d.DATE = parseTime(d.DATE);
    d.FEDFUNDS = +d.FEDFUNDS;
    d.TAYLORRATE = +d.TAYLORRATE;
    d.TAYLORRATE_MOD = +d.TAYLORRATE_MOD;
    d.GDPDEF_PC1 = +d.GDPDEF_PC1;
    d.CPILFESL_PC1 = +d.CPILFESL_PC1;
    d.GDPPOT = +d.GDPPOT;
    d.OUTPUTGAP = (d.GDPDEF_PC1- d.CPILFESL_PC1)/d.GDPPOT;
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
    var taylor_rate_mod = d3.line()
      .x(function(d) { return x(d.DATE); })
      .y(function(d) { return y(d.TAYLORRATE_MOD); })
      .curve(d3.curveCatmullRom.alpha(0.5));

    g.append("g")
      .attr("transform", "translate(0," + height+ ")")
      .call(d3.axisBottom(x))
      .attr('class', 'axis')
      .select(".domain")
      .remove();

    g.append("g")
      .call(d3.axisLeft(y))
      .attr('class', 'axis')
      .append("text")
      .attr("fill", "#000")
      .attr("transform", "rotate(-90)")
      .attr("y", 6)
      .attr("dy", "0.71em")
      .attr("text-anchor", "end")
      .text("Interest Rate (%)");

    // plotting the fed funds rate
    var ff = g.append("path")
      .attr("id", "fed-funds")
      .datum(data)
      .attr("fill", "none")
      .attr("stroke", "#666666")
      .attr("stroke-linejoin", "round")
      .attr("stroke-linecap", "round")
      .attr("stroke-width", 2)
      .attr("d", fed_funds);

    // plotting the taylor rate
    var tr =  g.append("path")
      .style("opacity", 0)
      .attr("id", "taylor-rate")
      .datum(data)
      .attr("fill", "none")
      .attr("stroke", "#2F74FF")
      .attr("stroke-linejoin", "round")
      .attr("stroke-linecap", "round")
      .attr("stroke-width", 3)
      .attr("d", taylor_rate)

    var tr_mod =  g.append("path")
      .style("opacity", 0)
      .attr("id", "taylor-rate-mod")
      .datum(data)
      .attr("fill", "none")
      .attr("stroke", "#FFBF2F")
      .attr("stroke-linejoin", "round")
      .attr("stroke-linecap", "round")
      .attr("stroke-width", 2)
      .attr("d", taylor_rate_mod)

    // create shading for the difference between rates
    var trUnder = d3.area()
      .x(function(d) { return x(d.DATE); })
      .y0(function(d) {return y(Math.max(d.FEDFUNDS, d.TAYLORRATE))})
      .y1(function(d) {return y(d.TAYLORRATE)});

    var trOver = d3.area()
      .x(function(d) { return x(d.DATE); })
      .y0(function(d) {return y(Math.max(d.FEDFUNDS, d.TAYLORRATE))})
      .y1(function(d) {return y(d.FEDFUNDS)});

    g.append("path")
      .datum(data)
      .style("fill", "red")
      .style("fill-opacity", 0)
      .attr("class", "difference under")
      .attr("d", trUnder);

    g.append("path")
      .datum(data)
      .style("fill", "green")
      .style("fill-opacity", 0)
      .attr("class", "difference over")
      .attr("d", trOver);

    // only draw the fed funds rate. draw taylor on scroll
    drawLine(ff);
    makeLegend(1);
  });

  // Adding the Taylor Rate
  function addTaylor() {
    // increase the contrast b/t lines
    var ff = d3.select('#fed-funds')
                .transition()
                .delay(250)
                .attr("stroke-width", 1)
                .attr("stroke", "#888888")

    var tr = d3.select('#taylor-rate')
    drawLine(tr);
    makeLegend(2);
  }

  function addDiff() {
    d3.selectAll('.difference').transition()
      .duration(2000)
      .style("fill-opacity", 0.2)
  }

  function addRecessions() {
    // add bars and annotations to make our point
    d3.csv('./data/recessions.csv', function(d) {
      // wrangle
      d.PEAK = parseTime(d.PEAK);
      d.TROUGH = parseTime(d.TROUGH);
      return d;
    }, function(error, recessions) {
      var rec_bars = g.selectAll('bar')
        .attr('id', 'recessions')
        .data(recessions)
        .enter()
        .append('rect')
        .attr('class', 'bar')
        .transition()
        .delay(250)
        .attr('x', function(d) { return x(d.PEAK); })
        .attr('y', 1)
        .attr('width', function(d) { return x(d.TROUGH) - x(d.PEAK); })
        .attr('height', height)
        .attr('rx', 2)
        .attr('ry', 2);

      // add annotation for a 1970s recession
      var annotation_x = x(parseTime('3/1/1975'));
      var annotation_y = y(8);
      var circle = g.append('circle')
      	.classed('annotation pulse', true)
        .style('fill', '#AB3C93')
        .attr("cx", annotation_x)
        .attr("cy", annotation_y)
        .attr("r", 10)
      	.lower();
      // add annotation for Great Recession
      var annotation_x = x(parseTime('6/1/2009'));
      var annotation_y = y(2);
      var circle = g.append('circle')
      	.classed('annotation pulse', true)
        .style('fill', '#AB3C93')
        .attr("cx", annotation_x)
        .attr("cy", annotation_y)
        .attr("r", 10)
      	.lower();
      });

    };

  function addInflation() {
    d3.selectAll('.annotation').transition().remove()
    d3.selectAll('.difference').transition().remove()
    var tr_mod = d3.select('#taylor-rate-mod')
    drawLine(tr_mod);
    makeLegend(3);
  }

  // update functions
  var updateFunctions = d3.range(d3.selectAll('#container-1 section > div').size())
    .map(function(){ return function(){} })

  // update the graph at these positions
  updateFunctions[2] = addTaylor;
  updateFunctions[3] = addDiff;
  updateFunctions[4] = addRecessions;
  updateFunctions[5] = addInflation;

  var lastI = -1
  var activeI = 0
  var gs = d3.graphScroll()
    .graph(d3.selectAll('#graph'))
    .container(d3.select('#container-1'))
    .sections(d3.selectAll('#container-1 section > div'))
    .eventId('c1')
    .on('active',function(i){
      activeI = i
      //call all fns last and active index
      var sign = activeI - lastI < 0 ? -1 : 1
      if (sign < 1) {
        // clear graph - not perfect
        d3.select("svg").remove()
        makePlot();
      }
      d3.range(lastI + sign, activeI + sign, sign).forEach(function(i){
        updateFunctions[i]();
      })
      lastI = activeI
    });
})()
