// Bar Chart Dimensions and SVG
const barMargin = { top: 60, right: 20, bottom: 100, left: 60 };
const barWidth = 800 - barMargin.left - barMargin.right;
const barHeight = 400 - barMargin.top - barMargin.bottom;

const barSvg = d3
  .select("#bar-chart")
  .attr("width", barWidth + barMargin.left + barMargin.right)
  .attr("height", barHeight + barMargin.top + barMargin.bottom)
  .append("g")
  .attr("transform", `translate(${barMargin.left},${barMargin.top})`);

const barFilter = d3.select("#bar-chart-filter").style("margin", "10px");

// Load the Bar Chart Data
d3.csv("IEA Global EV Data 2024.csv").then((data) => {
  const parsedData = data.map((d) => ({
    region: d.region,
    parameter: d.parameter,
    value: +d.value,
  }));

  const salesData = Array.from(
    d3.rollup(
      parsedData.filter((d) => d.parameter === "EV sales"),
      (v) => d3.sum(v, (d) => d.value),
      (d) => d.region
    ),
    ([region, value]) => ({ region, value })
  );

  const stockData = Array.from(
    d3.rollup(
      parsedData.filter((d) => d.parameter === "EV stock"),
      (v) => d3.sum(v, (d) => d.value),
      (d) => d.region
    ),
    ([region, value]) => ({ region, value })
  );

  let currentData = salesData;

  const xScale = d3
    .scaleBand()
    .domain(currentData.map((d) => d.region))
    .range([0, barWidth])
    .padding(0.2);
  const yScale = d3
    .scaleLinear()
    .domain([0, d3.max(currentData, (d) => d.value)])
    .range([barHeight, 0]);

  barSvg
    .append("g")
    .attr("transform", `translate(0,${barHeight})`)
    .call(
      d3
        .axisBottom(xScale)
        .tickFormat((d) => d)
        .tickSizeOuter(0)
    )
    .selectAll("text")
    .attr("transform", "rotate(-45)")
    .style("text-anchor", "end");

  barSvg.append("g").call(d3.axisLeft(yScale));

  const bars = barSvg
    .selectAll(".bar")
    .data(currentData)
    .enter()
    .append("rect")
    .attr("class", "bar")
    .attr("x", (d) => xScale(d.region))
    .attr("y", (d) => yScale(d.value))
    .attr("width", xScale.bandwidth())
    .attr("height", (d) => barHeight - yScale(d.value))
    .attr("fill", "#69b3a2");

  // Filter
  barFilter
    .selectAll("option")
    .data(["EV sales", "EV stock"])
    .enter()
    .append("option")
    .text((d) => d);

  barFilter.on("change", function () {
    const selected = this.value;
    currentData = selected === "EV sales" ? salesData : stockData;

    yScale.domain([0, d3.max(currentData, (d) => d.value)]);

    bars
      .data(currentData)
      .transition()
      .attr("x", (d) => xScale(d.region))
      .attr("y", (d) => yScale(d.value))
      .attr("height", (d) => barHeight - yScale(d.value));
  });
});
