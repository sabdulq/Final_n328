// Set up dimensions and margins
const margin = { top: 50, right: 150, bottom: 50, left: 50 };
const width = 800 - margin.left - margin.right;
const height = 500 - margin.top - margin.bottom;

// Append the SVG element
const svg = d3
  .select("body")
  .append("svg")
  .attr("width", width + margin.left + margin.right)
  .attr("height", height + margin.top + margin.bottom)
  .append("g")
  .attr("transform", `translate(${margin.left},${margin.top})`);

// Load the data
d3.csv("IEA Global EV Data 2024.csv")
  .then(function (data) {
    // Parse and clean data
    const parsedData = data.map((d) => ({
      region: d.region,
      category: d.category,
      parameter: d.parameter,
      mode: d.mode,
      powertrain: d.powertrain,
      year: +d.year,
      unit: d.unit,
      value: +d.value,
    }));

    // Filter data for EV stock share trends
    const filteredData = parsedData.filter(
      (d) => d.parameter === "EV stock share" && d.unit === "percent"
    );

    // Group data by region
    const groupedData = d3.groups(filteredData, (d) => d.region);

    // Set up scales
    const xScale = d3
      .scaleLinear()
      .domain(d3.extent(filteredData, (d) => d.year))
      .range([0, width]);

    const yScale = d3
      .scaleLinear()
      .domain([0, d3.max(filteredData, (d) => d.value)])
      .range([height, 0]);

    // Set up axes
    const xAxis = d3.axisBottom(xScale).tickFormat(d3.format("d"));
    const yAxis = d3.axisLeft(yScale);

    svg.append("g").attr("transform", `translate(0,${height})`).call(xAxis);

    svg.append("g").call(yAxis);

    // Set up line generator
    const line = d3
      .line()
      .x((d) => xScale(d.year))
      .y((d) => yScale(d.value));

    // Add lines for each region
    const colors = d3.scaleOrdinal(d3.schemeCategory10);

    svg
      .selectAll(".line")
      .data(groupedData)
      .enter()
      .append("path")
      .attr("class", "line")
      .attr("d", (d) => line(d[1]))
      .attr("fill", "none")
      .attr("stroke", (d) => colors(d[0]))
      .attr("stroke-width", 2);

    // Add legend
    svg
      .selectAll(".legend")
      .data(groupedData)
      .enter()
      .append("text")
      .attr("x", width + 10)
      .attr("y", (d, i) => i * 20)
      .attr("fill", (d) => colors(d[0]))
      .text((d) => d[0]);
  })
  .catch(function (error) {
    console.error("Error loading the dataset:", error);
  });
