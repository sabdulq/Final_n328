/* 
*************************************************
Author:  Saif Abdul Qadeer
Date: 12-13-2024
Page Description: 
This script creates an interactive bar chart visualization for EV sales 
by region. It dynamically updates the chart based on user 
selection from a dropdown menu, using D3.js to manage data binding, 
scaling, and interactivity.
*************************************************
*/
// Seting up dimensions and margins for the stacked bar chart
const stackedMargin = { top: 60, right: 150, bottom: 100, left: 60 };
const stackedWidth = 900 - stackedMargin.left - stackedMargin.right;
const stackedHeight = 400 - stackedMargin.top - stackedMargin.bottom;

// Appending the SVG element
const stackedSvg = d3
  .select("#Stacked-barchart-chart")
  .attr("width", stackedWidth + stackedMargin.left + stackedMargin.right)
  .attr("height", stackedHeight + stackedMargin.top + stackedMargin.bottom)
  .append("g")
  .attr("transform", `translate(${stackedMargin.left},${stackedMargin.top})`);

// Adding title
stackedSvg
  .append("text")
  .attr("x", stackedWidth / 2)
  .attr("y", -20)
  .attr("text-anchor", "middle")
  .style("font-size", "18px")
  .style("font-family", "Arial, sans-serif")
  .style("fill", "#0056b3")
  .text("EV Sales Trends by Region Over the Years");

// Loading the dataset
d3.csv("IEA Global EV Data 2024.csv").then((data) => {
  const parsedData = data.map((d) => ({
    region: d.region,
    parameter: d.parameter,
    year: +d.year,
    value: +d.value,
  }));

  // Filtering data for EV sales
  const salesData = parsedData.filter((d) => d.parameter === "EV sales");

  // Grouping data by year and region
  const groupedData = d3.rollups(
    salesData,
    (v) => d3.sum(v, (d) => d.value),
    (d) => d.year,
    (d) => d.region
  );

  // Creatimg a stacked dataset
  const years = Array.from(new Set(salesData.map((d) => d.year))).sort(
    (a, b) => a - b
  );
  const regions = Array.from(new Set(salesData.map((d) => d.region)));

  const stackedData = years.map((year) => {
    const yearData = groupedData.find((g) => +g[0] === year);
    const regionValues = yearData ? yearData[1] : [];
    const entry = { year: year };
    regions.forEach((region) => {
      entry[region] = regionValues.find((rv) => rv[0] === region)?.[1] || 0;
    });
    return entry;
  });

  // Stacking
  const stack = d3.stack().keys(regions);

  // Scales
  const xScale = d3
    .scaleBand()
    .domain(years)
    .range([0, stackedWidth])
    .padding(0.2);

  const yScale = d3
    .scaleLinear()
    .domain([0, d3.max(stackedData, (d) => d3.sum(Object.values(d).slice(1)))])
    .range([stackedHeight, 0]);

  const colorScale = d3.scaleOrdinal(d3.schemeCategory10).domain(regions);

  // Axes
  stackedSvg
    .append("g")
    .attr("transform", `translate(0,${stackedHeight})`)
    .call(d3.axisBottom(xScale).tickFormat(d3.format("d")));

  stackedSvg.append("g").call(d3.axisLeft(yScale));

  // Tooltip
  const stackedTooltip = d3
    .select("body")
    .append("div")
    .style("position", "absolute")
    .style("background-color", "white")
    .style("border", "1px solid #ccc")
    .style("padding", "5px")
    .style("border-radius", "5px")
    .style("display", "none");

  // Adding bars
  const barsGroup = stackedSvg
    .selectAll("g.layer")
    .data(stack(stackedData))
    .enter()
    .append("g")
    .attr("class", "layer")
    .attr("fill", (d) => colorScale(d.key));

  const bars = barsGroup
    .selectAll("rect")
    .data((d) => d)
    .enter()
    .append("rect")
    .attr("x", (d) => xScale(d.data.year))
    .attr("y", (d) => yScale(d[1]))
    .attr("height", (d) => yScale(d[0]) - yScale(d[1]))
    .attr("width", xScale.bandwidth())
    .on("mouseover", function (event, d) {
      d3.select(this).style("opacity", 0.8);
      const region = d3.select(this.parentNode).datum().key;
      stackedTooltip
        .style("display", "block")
        .html(
          `<strong>Region:</strong> ${region}<br><strong>Year:</strong> ${
            d.data.year
          }<br><strong>Sales:</strong> ${d[1] - d[0]}`
        );
    })
    .on("mousemove", function (event) {
      stackedTooltip
        .style("top", event.pageY + 10 + "px")
        .style("left", event.pageX + 10 + "px");
    })
    .on("mouseout", function () {
      d3.select(this).style("opacity", 1);
      stackedTooltip.style("display", "none");
    });

  // Adding legend for regions
  const legendGroup = stackedSvg
    .append("g")
    .attr("transform", `translate(0, ${stackedHeight + 30})`); // Position below the chart

  // Seting legend item size and spacing
  const legendItemWidth = 90; // Adjusts width for each legend item
  const legendItemHeight = 10; // Height for each row of legends
  const legendFontSize = "10px"; // Font size for legend text

  legendGroup
    .selectAll(".legend-item")
    .data(regions) // All region names
    .enter()
    .append("g")
    .attr("class", "legend-item")
    .attr("transform", (d, i) => {
      const x = (i % 8) * legendItemWidth; // seting the number of columns (8 per row)
      const y = Math.floor(i / 8) * legendItemHeight; // moves to the next row after 8 items
      return `translate(${x}, ${y})`;
    })
    .each(function (d) {
      // Adding color box
      d3.select(this)
        .append("rect")
        .attr("x", 0)
        .attr("y", 0)
        .attr("width", 10)
        .attr("height", 10)
        .attr("fill", colorScale(d));

      // Adding text
      d3.select(this)
        .append("text")
        .attr("x", 15) // Positioning text to the right of the color box
        .attr("y", 10) // Aligning text vertically with the box
        .text(d) // Displaying the full region name
        .style("font-size", legendFontSize)
        .style("font-family", "Arial, sans-serif")
        .attr("fill", "#333");
    });

  // Adding dropdown for filtering by region
  const dropdown = d3
    .select("#Stacked-barchart-chart-filter")
    .style("margin", "10px");

  dropdown
    .selectAll("option")
    .data(["All", ...regions])
    .enter()
    .append("option")
    .text((d) => d)
    .attr("value", (d) => d);

  dropdown.on("change", function () {
    const selectedRegion = this.value;

    // Filter data based on the selected region
    const filteredStackedData =
      selectedRegion === "All"
        ? stack(stackedData) // Usees full dataset if "All" is selected
        : stack(
            stackedData.map((d) => {
              const entry = { year: d.year };
              entry[selectedRegion] = d[selectedRegion] || 0;
              return entry;
            })
          );

    // Updating bars with filtered data
    barsGroup
      .data(filteredStackedData)
      .selectAll("rect")
      .data((d) => d)
      .join("rect")
      .attr("x", (d) => xScale(d.data.year))
      .attr("y", (d) => yScale(d[1]))
      .attr("height", (d) => yScale(d[0]) - yScale(d[1]))
      .attr("width", xScale.bandwidth())
      .attr("fill", (d) => {
        // Applyiing color based on the region
        const region = d3.select(this.parentNode).datum().key;
        return selectedRegion === "All"
          ? colorScale(region)
          : colorScale(selectedRegion);
      });
  });
});
