/* 
*************************************************
Author: My name
Date: 2024-06-22
Page Description: 
This script creates an interactive bar chart visualization for EV sales 
and stock data by region. It dynamically updates the chart based on user 
selection from a dropdown menu, using D3.js to manage data binding, 
scaling, and interactivity.
*************************************************
*/

// Set up dimensions and margins for the bar chart
const barMargin = { top: 60, right: 20, bottom: 100, left: 60 };
const barWidth = 800 - barMargin.left - barMargin.right;
const barHeight = 400 - barMargin.top - barMargin.bottom;

// Append the SVG element for the bar chart
const barSvg = d3
  .select("#bar-chart")
  .attr("width", barWidth + barMargin.left + barMargin.right)
  .attr("height", barHeight + barMargin.top + barMargin.bottom)
  .append("g")
  .attr("transform", `translate(${barMargin.left},${barMargin.top})`);

// Add title to the bar chart
barSvg
  .append("text")
  .attr("x", barWidth / 2)
  .attr("y", -20)
  .attr("text-anchor", "middle")
  .style("font-size", "18px")
  .style("font-family", "Arial, sans-serif")
  .style("fill", "#333")
  .text("Regional Leaders in EV Sales and Stock");

// Load the dataset from a CSV file
d3.csv("IEA Global EV Data 2024.csv").then((data) => {
  // Parse the data: Convert values to numeric and organize fields
  const parsedData = data.map((d) => ({
    region: d.region,
    parameter: d.parameter,
    value: +d.value,
  }));

  // Function to aggregate data manually for a specific parameter (e.g., EV sales or EV stock)
  function aggregateData(parameter) {
    const result = [];
    parsedData
      .filter((d) => d.parameter === parameter)
      .forEach((d) => {
        const region = result.find((r) => r.region === d.region);
        if (region) {
          region.value += d.value; // Sum values for the same region
        } else {
          result.push({ region: d.region, value: d.value }); // Add new region
        }
      });
    return result;
  }

  // Prepare data for EV sales and EV stock
  const salesData = aggregateData("EV sales");
  const stockData = aggregateData("EV stock");

  // Set the default data to "sales"
  let currentData = salesData;

  // Create scales for the x-axis (regions) and y-axis (values)
  const xScale = d3.scaleBand().range([0, barWidth]).padding(0.2);
  const yScale = d3.scaleLinear().range([barHeight, 0]);

  // Add axis groups to the SVG
  const xAxisGroup = barSvg
    .append("g")
    .attr("class", "x-axis")
    .attr("transform", `translate(0,${barHeight})`);
  const yAxisGroup = barSvg.append("g").attr("class", "y-axis");

  // Tooltip for displaying region and value on hover
  const barTooltip = d3
    .select("body")
    .append("div")
    .style("position", "absolute")
    .style("background-color", "white")
    .style("border", "1px solid #ccc")
    .style("padding", "5px")
    .style("border-radius", "5px")
    .style("display", "none");

  // Function to update the bar chart with new data
  function updateChart(data) {
    // Update scales with new data
    xScale.domain(data.map((d) => d.region));
    yScale.domain([0, d3.max(data, (d) => d.value)]);

    // Update the axes with the new scales
    xAxisGroup
      .call(d3.axisBottom(xScale))
      .selectAll("text")
      .attr("transform", "rotate(-45)")
      .style("text-anchor", "end")
      .style("font-family", "Arial, sans-serif")
      .style("font-size", "10px");
    yAxisGroup.call(d3.axisLeft(yScale));

    // Bind the new data to the bar elements
    const bars = barSvg.selectAll(".bar").data(data, (d) => d.region); // Use key function for proper binding

    // Exit selection: Remove bars that are no longer needed
    bars.exit().remove();

    // Enter selection: Add new bars for new data points
    bars
      .enter()
      .append("rect")
      .attr("class", "bar")
      .attr("x", (d) => xScale(d.region))
      .attr("y", barHeight) // Start from the bottom for animation
      .attr("width", xScale.bandwidth())
      .attr("height", 0) // Start with height 0 for animation
      .attr("fill", "#69b3a2")
      .on("mouseover", function (event, d) {
        d3.select(this).style("fill", "#377eb8"); // Highlight bar
        barTooltip
          .style("display", "block")
          .html(
            `<strong>Region:</strong> ${d.region}<br><strong>Value:</strong> ${d.value}`
          );
      })
      .on("mousemove", function (event) {
        barTooltip
          .style("top", event.pageY + 10 + "px")
          .style("left", event.pageX + 10 + "px");
      })
      .on("mouseout", function () {
        d3.select(this).style("fill", "#69b3a2"); // Reset bar color
        barTooltip.style("display", "none");
      })
      .merge(bars) // Merge enter and update selections
      .transition()
      .duration(500)
      .attr("x", (d) => xScale(d.region))
      .attr("y", (d) => yScale(d.value))
      .attr("height", (d) => barHeight - yScale(d.value)); // Animate to final height
  }

  // Render the initial chart with sales data
  updateChart(currentData);

  // Add a dropdown menu for toggling between sales and stock
  const barDropdown = d3.select("#bar-chart-filter").style("margin", "10px");

  // Populate the dropdown menu with options
  barDropdown
    .selectAll("option")
    .data(["EV sales", "EV stock"])
    .enter()
    .append("option")
    .text((d) => d)
    .attr("value", (d) => d);

  // Update the chart when the dropdown value changes
  barDropdown.on("change", function () {
    currentData = this.value === "EV sales" ? salesData : stockData;
    updateChart(currentData); // Update the chart with the selected data
  });
});
