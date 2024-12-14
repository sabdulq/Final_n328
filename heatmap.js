/* 
*************************************************
Author:  Saif Abdul Qadeer
Date: 12-13-2024
Page Description: 
This script generates an interactive heatmap visualization using D3.js. 
It dynamically displays EV stock share data by region and year, and includes 
interactive features such as tooltips and a dropdown filter for regional selection.
*************************************************
*/

// Seting up dimensions and margins for the heatmap
const margin = { top: 60, right: 20, bottom: 50, left: 100 };
const width = 800 - margin.left - margin.right;
const height = 400 - margin.top - margin.bottom;

// Appending the SVG element for the heatmap
const svg = d3
  .select("#heatmap")
  .attr("width", width + margin.left + margin.right)
  .attr("height", height + margin.top + margin.bottom)
  .append("g")
  .attr("transform", `translate(${margin.left},${margin.top})`);

// Adding title to the heatmap
svg
  .append("text")
  .attr("x", width / 2)
  .attr("y", -20)
  .attr("text-anchor", "middle")
  .style("font-size", "18px")
  .style("font-family", "Arial, sans-serif")
  .style("fill", "#0056b3")
  .text("Heatmap of EV Stock Share by Region and Year");

// Loading the dataset from a CSV file
d3.csv("IEA Global EV Data 2024.csv").then((data) => {
  // Parsing and structuring the data
  const parsedData = data.map((d) => ({
    region: d.region, // Extracting region
    parameter: d.parameter, // Extracting parameter type
    year: +d.year, // Converting year to number
    value: +d.value, // Converting value to number
  }));

  // Filtering data to include only EV stock share
  const filteredData = parsedData.filter(
    (d) => d.parameter === "EV stock share"
  );

  // Geting unique regions and years for the axes
  const regions = Array.from(new Set(filteredData.map((d) => d.region)));
  const years = Array.from(new Set(filteredData.map((d) => d.year))).sort(
    (a, b) => a - b
  ); // Unique years sorted in ascending order

  // Creating scales for x-axis (years), y-axis (regions), and colors
  const xScale = d3.scaleBand().domain(years).range([0, width]).padding(0.05); // X-axis
  const yScale = d3
    .scaleBand()
    .domain(regions)
    .range([0, height])
    .padding(0.05); // Y-axis
  const colorScale = d3
    .scaleSequential(d3.interpolateBlues) // Blue color gradient
    .domain([0, d3.max(filteredData, (d) => d.value)]); // Scale domain based on max value

  // Adding axes to the heatmap
  svg
    .append("g")
    .attr("transform", `translate(0,${height})`) // Positioning x-axis at the bottom
    .call(d3.axisBottom(xScale).tickFormat(d3.format("d"))); // Formating years as integers

  svg.append("g").call(d3.axisLeft(yScale)); // Adding y-axis

  // Tooltip for displaying detailed information
  const tooltip = d3
    .select("body")
    .append("div")
    .style("position", "absolute")
    .style("background-color", "white")
    .style("border", "1px solid #ccc")
    .style("padding", "5px")
    .style("border-radius", "5px")
    .style("display", "none"); // Hiding tooltip by default

  // Adding rectangles to the heatmap
  svg
    .selectAll()
    .data(filteredData) // Bind data to rectangles
    .enter()
    .append("rect")
    .attr("x", (d) => xScale(d.year)) // Maping year to x-position
    .attr("y", (d) => yScale(d.region)) // Mapingg region to y-position
    .attr("width", xScale.bandwidth()) // Seting rectangle width
    .attr("height", yScale.bandwidth()) // Seting rectangle height
    .style("fill", (d) => colorScale(d.value)) // Seting color based on value
    .style("stroke", "#ccc") // Adding border to rectangles
    .on("mouseover", function (event, d) {
      // Showing tooltip on hover
      d3.select(this).style("stroke", "black").style("stroke-width", 2); // Highlights rectangle
      tooltip
        .style("display", "block")
        .html(
          `<strong>Region:</strong> ${d.region}<br><strong>Year:</strong> ${d.year}<br><strong>EV Stock Share:</strong> ${d.value}%`
        ); // Tooltip content
    })
    .on("mousemove", function (event) {
      // Position tooltip near cursor
      tooltip
        .style("top", event.pageY + 10 + "px")
        .style("left", event.pageX + 10 + "px");
    })
    .on("mouseout", function () {
      // Hide tooltip on mouseout
      d3.select(this).style("stroke", "#ccc").style("stroke-width", 1); // Reseting border
      tooltip.style("display", "none");
    });

  // Dropdown for filtering heatmap by region
  const dropdown = d3.select("#heatmap-filter").style("margin", "10px");

  // Populating dropdown with region options
  dropdown
    .selectAll("option")
    .data(["All", ...regions]) // Adding "All" option for default view
    .enter()
    .append("option")
    .text((d) => d) // Displaying region name in dropdown
    .attr("value", (d) => d); // Seting value for each option

  // Handling dropdown selection change
  dropdown.on("change", function () {
    const selectedRegion = this.value; // Get selected region
    const updatedData =
      selectedRegion === "All"
        ? filteredData // Showing all data if "All" is selected
        : filteredData.filter((d) => d.region === selectedRegion); // Filters data by selected region

    // Updating heatmap rectangles with filtered data
    const rects = svg
      .selectAll("rect")
      .data(updatedData, (d) => d.region + d.year);

    // Exit: Remove rectangles for regions not in filtered data
    rects.exit().remove();

    // Enter: Adding new rectangles for filtered data
    rects
      .enter()
      .append("rect")
      .merge(rects) // Merges with update selection
      .attr("x", (d) => xScale(d.year)) // Updates x-position
      .attr("y", (d) => yScale(d.region)) // Updates y-position
      .attr("width", xScale.bandwidth()) // Updates width
      .attr("height", yScale.bandwidth()) // Updates height
      .style("fill", (d) => colorScale(d.value)) // Updates color
      .style("stroke", "#ccc") // Updates border
      .on("mouseover", function (event, d) {
        d3.select(this).style("stroke", "black").style("stroke-width", 2); // Highlights rectangle
        tooltip
          .style("display", "block")
          .html(
            `<strong>Region:</strong> ${d.region}<br><strong>Year:</strong> ${d.year}<br><strong>EV Stock Share:</strong> ${d.value}%`
          ); // Tooltip content
      })
      .on("mousemove", function (event) {
        tooltip
          .style("top", event.pageY + 10 + "px")
          .style("left", event.pageX + 10 + "px");
      })
      .on("mouseout", function () {
        d3.select(this).style("stroke", "#ccc").style("stroke-width", 1); // Reset border
        tooltip.style("display", "none");
      });
  });
});
