/*
GRAPH.JS
The animated monetary policy charts
*/

// width and height are set by the render
var margin = {top: 20, right: 40, bottom: 40, left: 50};

function drawLine(path, duration=2500) {
  var totalLength = path.node().getTotalLength();
  path
    .style('opacity',1)
    .attr("stroke-dasharray", totalLength + " " + totalLength)
    .attr("stroke-dashoffset", totalLength)
    .transition()
      .duration(duration)
      .attr("stroke-dashoffset", 0);
}

function makeLegend() {
  var legendSize = 200;
  var ordinal = d3.scaleOrdinal()
    .domain(["Fed Funds Rate", "Taylor Rule"])
    .range([ "#666666", "#2F74FF"]);

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

  var parseTime = d3.timeParse("%m/%d/%Y");

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

    // Initialize tooltip
    var tip = d3.tip()
      .attr('class', 'd3-tip')
      .offset([100, 0])
      .html(function(d) {
        console.log(d.OUTPUTGAP, d.GDPDEF_PC1)
        return    "<h6>Taylor Rate Calculation</h6>"
                  +"<p>growth: " + (d.GDPDEF_PC1 + 0.02) + "<br>"
                  + "inflation: "+ 2 +"%<br>"
                  + "output gap: "+ d.OUTPUTGAP + "%<br>"
                  + "<h6>=<span style='color:#E82C0C'> " + d.TAYLORRATE + "</span></h6>";
      })
    g.call(tip)

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
      .on('mouseover', tip.show)
      .on('mouseout', tip.hide);

    // create shading for the difference between rates
    var trDiff = d3.area()
      .x(function(d) { return x(d.DATE); })
      .y(function(d) {return y(Math.max(d.FEDFUNDS, d.TAYLORRATE))})
      .y0(function(d) {return y(d.TAYLORRATE)});

    var ffDiff = d3.area()
      .x(function(d) { return x(d.DATE); })
      .y(function(d) {return y(Math.max(d.FEDFUNDS, d.TAYLORRATE))})
      .y0(function(d) {return y(d.FEDFUNDS)});

    g.append("path")
      .style("fill", "green")
      .style("fill-opacity", .5)
      .attr("class", "difference")
      .attr("d", trDiff(data))

    g.append("path")
      .style("fill", "red")
      .style("fill-opacity", .5)
      .attr("class", "difference")
      .attr("d", ffDiff(data))

    // only draw the fed funds rate. draw taylor on scroll
    drawLine(ff);
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
    drawLine(tr,2000);
    makeLegend();
  }

  function addDiff() {
    // https://bl.ocks.org/mbostock/3894205

    var tr = d3.select('#taylor-rate').node()
    var ff = d3.select('#fed-funds').node()
  }

  function addRecessions() {

    d3.csv('./data/recessions.csv', function(d) {
      // wrangle
      d.PEAK = parseTime(d.PEAK);
      d.TROUGH = parseTime(d.TROUGH);
      return d;
    }, function(error, recessions) {

      x.domain(d3.extent(recessions, function(d) { return d.PEAK; }));
      g.selectAll('bar')
        .data(recessions)
        .enter()
        .append('rect')
        .attr('class', 'recession-bar')
        .transition()
        .delay(250)
        .attr('x', function(d) { return x(d.PEAK); })
        .attr('y', 1)
        .attr('width', function(d) { return x(d.TROUGH) - x(d.PEAK); })
        .attr('height', height)
        .attr('rx', 2)
        .attr('ry', 2)
        .style('fill', function(d) {
            var gr
            if (d.PEAK == "12/1/07") { gr = "#FF6548"}
            return gr
          });
      });
    };

  function addInflation() {
      // we'll add a modified taylor rule
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
    .on('active', function(i){
      activeI = i
      console.log("Update Function to call:",i);

      //call all fns last and active index
      var sign = activeI - lastI < 0 ? -1 : 1
      if (sign < 1) {
        // clear graph - not perfect
        d3.select("svg").remove()
        makePlot();
      }
      d3.range(lastI + sign, activeI + sign, sign).forEach(function(i){
        updateFunctions[i]()
      })
      lastI = activeI
      })
})()