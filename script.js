// Heatmap Dimensions and SVG
const heatmapMargin = { top: 60, right: 20, bottom: 50, left: 100 };
const heatmapWidth = 800 - heatmapMargin.left - heatmapMargin.right;
const heatmapHeight = 400 - heatmapMargin.top - heatmapMargin.bottom;

const heatmapSvg = d3
  .select("#heatmap")
  .attr("width", heatmapWidth + heatmapMargin.left + heatmapMargin.right)
  .attr("height", heatmapHeight + heatmapMargin.top + heatmapMargin.bottom)
  .append("g")
  .attr("transform", `translate(${heatmapMargin.left},${heatmapMargin.top})`);

const heatmapFilter = d3.select("#heatmap-filter").style("margin", "10px");

// Load the Heatmap Data
d3.csv("IEA Global EV Data 2024.csv").then((data) => {
  const parsedData = data.map((d) => ({
    region: d.region,
    parameter: d.parameter,
    year: +d.year,
    value: +d.value,
  }));

  const filteredData = parsedData.filter(
    (d) => d.parameter === "EV stock share"
  );

  const regions = Array.from(new Set(filteredData.map((d) => d.region)));
  const years = Array.from(new Set(filteredData.map((d) => d.year))).sort(
    (a, b) => a - b
  );

  const xScale = d3
    .scaleBand()
    .domain(years)
    .range([0, heatmapWidth])
    .padding(0.05);
  const yScale = d3
    .scaleBand()
    .domain(regions)
    .range([0, heatmapHeight])
    .padding(0.05);

  const colorScale = d3
    .scaleSequential(d3.interpolateBlues)
    .domain([0, d3.max(filteredData, (d) => d.value)]);

  // Add Axes
  heatmapSvg
    .append("g")
    .attr("transform", `translate(0,${heatmapHeight})`)
    .call(d3.axisBottom(xScale).tickFormat(d3.format("d")));

  heatmapSvg.append("g").call(d3.axisLeft(yScale));

  // Add Rectangles
  const heatmapRects = heatmapSvg
    .selectAll("rect")
    .data(filteredData)
    .enter()
    .append("rect")
    .attr("x", (d) => xScale(d.year))
    .attr("y", (d) => yScale(d.region))
    .attr("width", xScale.bandwidth())
    .attr("height", yScale.bandwidth())
    .style("fill", (d) => colorScale(d.value))
    .style("stroke", "#ccc");

  // Tooltip
  const heatmapTooltip = d3
    .select("body")
    .append("div")
    .style("position", "absolute")
    .style("background-color", "white")
    .style("border", "1px solid #ccc")
    .style("padding", "5px")
    .style("border-radius", "5px")
    .style("display", "none");

  heatmapRects
    .on("mouseover", function (event, d) {
      d3.select(this).style("stroke", "black");
      heatmapTooltip
        .style("display", "block")
        .html(`Region: ${d.region}<br>Year: ${d.year}<br>Value: ${d.value}`);
    })
    .on("mousemove", (event) => {
      heatmapTooltip
        .style("top", event.pageY + 10 + "px")
        .style("left", event.pageX + 10 + "px");
    })
    .on("mouseout", function () {
      d3.select(this).style("stroke", "#ccc");
      heatmapTooltip.style("display", "none");
    });

  // Filter
  heatmapFilter
    .selectAll("option")
    .data(["All", ...regions])
    .enter()
    .append("option")
    .text((d) => d);

  heatmapFilter.on("change", function () {
    const selectedRegion = this.value;
    const updatedData =
      selectedRegion === "All"
        ? filteredData
        : filteredData.filter((d) => d.region === selectedRegion);

    heatmapRects
      .data(updatedData)
      .transition()
      .attr("y", (d) => yScale(d.region))
      .attr("x", (d) => xScale(d.year))
      .style("fill", (d) => colorScale(d.value));
  });
});
