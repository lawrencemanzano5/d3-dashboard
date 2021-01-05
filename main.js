/**
 * Lawrence Manzano
 * UCID: 10170563
 *
 * References:
 * https://www.d3-graph-gallery.com/graph/parallel_basic.html
 * https://yangdanny97.github.io/blog/2019/03/01/D3-Spider-Chart
 * https://www.d3-graph-gallery.com/graph/heatmap_basic.html
 */

//Call our functions on window load event
window.onload = function(){
    setup();
};

//global variables
var svg_list = [];          // the svg containers where we will draw our visualizations
var svg_width_list = [];    // the widths of the svg containers
var svg_height_list = [];   // the heights of the svg containers

var base_data;              // the unmodified dataset extracted from the CSV file

var left_margin = 70;       // the left margin for charts (i.e. the left boundary of the visual within the container)
var bottom_margin = 30;     // the bottom margin for the charts (i.e. the bottom boundary of the visual within the container)
var top_margin = 50;        // the top margin for the charts (i.e. the upper boundary of the visual within the container)

/**
 * Function setup: sets up our visualization environment.
 */
function setup(){
    // String IDs of the 3 SVG containers
    var svgIdList = ["vis1", "vis2", "vis3"];

    // Foreach SVG container in the HTML page, save their references and dimensions into the appropriate global list variables
    for (i = 0; i < 3; i++) {
        var svgTuple = grabSvgDimensions(svgIdList[i]);
        svg_list.push(svgTuple[0]);
        svg_width_list.push(svgTuple[1]);
        svg_height_list.push(svgTuple[2]);
    }

    loadData("Pokemon-Dataset.csv");
}

/**
 * Function grabSvgDimensions: Retrieves and saves the heights and widths of an SVG element
 * @param svgID string HTML ID of the desired SVG element
 */
function grabSvgDimensions(svgID) {
    var svg = d3.select("#" + svgID);

    //grab the specified SVG container's dimensions (width and height)
    var svg_width = svg.node().getBoundingClientRect().width;
    var svg_height = svg.node().getBoundingClientRect().height;

    return [svg, svg_width, svg_height];
}

/**
 * Function loadData: loads data from a given CSV file path/url
 * @param path string location of the CSV data file
 */
function loadData(path){
    d3.csv(path).then(function(data){
        base_data = data;

        // Load the star plot, heat map and parallel coordinates chart in the first, second and third SVG container grid cells respectively
        loadStarPlot(0);
        loadHeatMap(1);
        loadParallelCoordinates(2);
    });
}

/**
 * Function loadParallelCoordinates: Renders the parallel coordinates chart into a specified SVG container
 * @param gridCellIdx int The SVG grid cell index where the chart will be rendered
 */
function loadParallelCoordinates(gridCellIdx) {
    var svg = svg_list[gridCellIdx];
    var height = svg_height_list[gridCellIdx];
    var width = svg_width_list[gridCellIdx];

    dimensions = ["HP", "Attack",  "Speed", "Defense"];

    // For each dimension, I build a linear scale. I store all in a y object
    var y = {}
    for (i in dimensions) {
        var name = dimensions[i]
        y[name] = d3.scaleLinear()
            .domain( d3.extent(base_data, function(d) { return +d[name]; }) )
            .range([height - bottom_margin, top_margin]);
    }

    // Build the X scale -> it find the best position for each Y axis
    var x = d3.scalePoint()
        .range([0, width])
        .padding(0.5)
        .domain(dimensions);

    // The path function take a row of the csv as input, and return x and y coordinates of the line to draw for this raw.
    var path = (d) => {
        return d3.line()(dimensions.map(function(p) { return [x(p), y[p](d[p])]; }));
    }

    // Draw the lines
    svg.selectAll("path")
        .data(base_data)
        .enter().append("path")
        .attr("d",  path)
        .style("fill", "none")
        .style("stroke", "#69b3a2")
        .style("opacity", 0.5)

    // Draw the axis:
    svg.selectAll("g")
    // For each dimension of the dataset I add a 'g' element:
        .data(dimensions).enter()
        .append("g")
        // I translate this element to its right position on the x axis
        .attr("transform", function(d) { return "translate(" + x(d) + ")"; })
        // And I build the axis with the call function
        .each(function(d) {
            d3.select(this).call(d !== "Evolution" ? d3.axisLeft(y[d]) : d3.axisLeft(y[d]).ticks(4));
        })
        // Add axis title
        .append("text")
        .style("text-anchor", "middle")
        .attr("y", top_margin - 20)
        .text(function(d) { return d; })
        .style("fill", "black")
}

/**
 * Function loadStarPlot: Renders the star plot into a specified SVG container
 * @param gridCellIdx int The SVG grid cell index where the chart will be rendered
 */
function loadStarPlot(gridCellIdx) {
    var svg = svg_list[gridCellIdx];
    var height = svg_height_list[gridCellIdx];
    var width = svg_width_list[gridCellIdx];

    var x_center_start = width * 0.6;
    var y_center_start = height * 0.45;

    let features = ["HP", "Attack", "Defense", "Sp. Atk", "Sp. Def", "Speed"];

    var data = avgDataByColumn(base_data, features, "Evolution");
    data.sort((a, b) => (a["Evolution"] > b["Evolution"]) ? 1 : -1)

    let radialScale = d3.scaleLinear().domain([0, 100])
        .range([0, height * 0.35]);

    let ticks = [20, 40, 60, 80, 100];
    // Draw grid lines (circles)
    ticks.forEach(t =>
        svg.append("circle")
            .attr("cx", x_center_start)
            .attr("cy", y_center_start)
            .attr("fill", "none")
            .attr("stroke", "gray")
            .attr("r", radialScale(t))
    );
    // Draw tick labels
    ticks.forEach(t =>
        svg.append("text")
            .attr("x", x_center_start + 5)
            .attr("y", y_center_start - radialScale(t))
            .text(t.toString())
    );
    // Draw axis for each feature
    var angleToCoordinate = (angle, value) => {
        let x = Math.cos(angle) * radialScale(value);
        let y = Math.sin(angle) * radialScale(value);
        return {"x": x_center_start + x, "y": y_center_start - y};
    }

    for (var i = 0; i < features.length; i++) {
        let ft_name = features[i];
        let angle = (Math.PI / 2) + (2 * Math.PI * i / features.length);
        let line_coordinate = angleToCoordinate(angle, 100);
        let label_coordinate = angleToCoordinate(angle, 120);
        svg.append("line")
            .attr("x1", x_center_start)
            .attr("y1", y_center_start)
            .attr("x2", line_coordinate.x)
            .attr("y2", line_coordinate.y)
            .attr("stroke","black")
        svg.append("text")
            .attr("x", label_coordinate.x)
            .attr("y", label_coordinate.y + 5)
            .style("text-anchor", "middle")
            .text(ft_name);
    }
    // Drawing the line for the spider chart
    let line = d3.line().x(d => d.x).y(d => d.y);
    let colors = ["darkgreen", "deeppink", "darkorange", "navy"];

    // Get coordinates for a data point
    var getPathCoordinates = (d) => {
        let coordinates = [];
        for (var i = 0; i < features.length; i++){
            let ft_name = features[i];
            let angle = (Math.PI / 2) + (2 * Math.PI * i / features.length);
            coordinates.push(angleToCoordinate(angle, d[ft_name]));
        }
        return coordinates;
    }

    for (var i = 0; i < data.length; i ++){
        let d = data[i];
        let color = colors[i];
        d["Color"] = color;
        let coordinates = getPathCoordinates(d);

        // Draw the path element
        svg.append("path")
            .datum(coordinates)
            .attr("d",line)
            .attr("stroke-width", 3)
            .attr("stroke", color)
            .attr("fill", color)
            .attr("stroke-opacity", 1)
            .attr("opacity", 0.35);
    }

    // Initialize the element containers for the legend items
    var legend = svg.selectAll("g.sp_legend")
        .data(data)
        .enter().append("g")
        .attr("class", "sp_legend")
        .attr("transform", function(d, i) { return "translate(50," + i * 25 + ")"; });

    // Initialize the color box of the legend items
    legend.append("rect")
        .attr("x", 0)
        .attr("y", top_margin)
        .attr("width", 18)
        .attr("height", 18)
        .style("fill", function(d, i) {return d["Color"];});

    // Initialize the text label of the legend items
    legend.append("text")
        .attr("x", 22)
        .attr("y", top_margin + 9)
        .attr("dy", ".35em")
        .style("text-anchor", "start")
        .text(function(d, i) {
            let evol = d["Evolution"];
            let evolCategories = ["Does Not Evolve", "1st Evolution", "2nd Evolution", "3rd Evolution"];
            return evolCategories[evol];
        });
}

/**
 * Function avgDataByColumn: Calculates the averages for a set of columns by the unique values of one column in the dataset
 * @param data Object[] The list of objects representing the read CSV file
 * @param colsToAvg string[] The columns whose averages will be calculated by grouping of the unique values of the byCol column
 * @param byCol string The column whose unique values will be the groups for the colsToAvg column averages
 *
 * @return Object[] list of objects containing each unique byCol value with their corresponding colsToAvg column averages
 */
function avgDataByColumn(data, colsToAvg, byCol) {
    var uniqueByColVals = [];   // Saves the unique byCol column values as they are discovered
    var sumObjs = [];           // List of summation objects for each unique byCol column value

    // Loop through each row of the provided dataset argument
    data.forEach((data_item, data_idx) => {
        var byColVal = +data_item[byCol];
        if (!uniqueByColVals.includes(byColVal)) {
            // If found a new byCol column value, initialize object for summation
            let obj = new Object();
            obj[byCol + "_val"] = byColVal;
            obj["count"] = 0;

            // Initialize sum properties for the colsToAvg columns
            colsToAvg.forEach((item, index) => {
                obj[item + "_sum"] = 0;
            })

            // Push the summation object and the new byCol column value into their appropriate list variables for future checking
            sumObjs.push(obj);
            uniqueByColVals.push(byColVal);
        }

        // Retrieve the summation object for the current byCol column value
        var sumObj = sumObjs.find(x => {
            return x[byCol + "_val"] == byColVal;
        })

        // Foreach of the colsToAvg columns in the dataset, add their value to the corresponding sum properties in the summation object
        colsToAvg.forEach((col_item, col_idx) => {
            sumObj[col_item + "_sum"] += +data_item[col_item];
        })

        // Increase the counter for this specific summation object (ie. summation object for the current byCol value)
        sumObj["count"] += 1;
    })

    var avgObjs = [];   // List of objects with the desired averages for each unique byCol column value

    // Loop through each of the summation objects
    sumObjs.forEach((sum_item, sum_idx) => {

        // Create new object that will contained the desired averages for the current summation object + byCol column value
        var avgObj = new Object();
        avgObj[byCol] = sum_item[byCol + "_val"];

        // Divide each of the sum properties corresponding to the colsToAvg columns by the counter of the summation object to get the desired averages
        colsToAvg.forEach((col_item, col_idx) => {
            avgObj[col_item] = Math.round((sum_item[col_item + "_sum"] / sum_item["count"]) * 100) / 100;
        })

        // push the above object to the appropriate list
        avgObjs.push(avgObj);
    })

    // return the list of objects containing the desired averages for the colsToAvg columns grouped by each unique byCol column value
    return avgObjs;
}

/**
 * Function loadHeatMap: Renders the heat map into a specified SVG container
 * @param gridCellIdx int The SVG grid cell index where the chart will be rendered
 */
function loadHeatMap(gridCellIdx) {
    var extra_bottom_margin = 50;
    var excess_top_margin = 30;

    var svg = svg_list[gridCellIdx];
    var height = svg_height_list[gridCellIdx];
    var width = svg_width_list[gridCellIdx];

    var onlyUnique = (value, index, self) => {
        return self.indexOf(value) === index;
    }

    var type1 = base_data.map(a => a["Type 1"]);
    var type2 = base_data.map(a => a["Type 2"]);

    var allTypes = type1.concat(type2);
    allTypes = allTypes.filter(onlyUnique);
    allTypes = allTypes.sort((a, b) => {
        if (a < b)
            return -1;

        if (b > a)
            return 1;

        return 0;
    });

    // Build X scales and axis:
    var x = d3.scaleBand()
        .range([ left_margin, width * 0.95 ])
        .domain(allTypes)
        .padding(0.01);
    svg.append("g")
        .attr("transform", "translate(0," + (height - (bottom_margin + extra_bottom_margin)) + ")")
        .call(d3.axisBottom(x))
        .selectAll("text")
        .attr("y", 12)
        .attr("x", 5)
        .attr("dy", ".35em")
        .attr("transform", "rotate(-30)")
        .style("text-anchor", "end")
        .text(function(d, i) {
            if (d === "")
                return "None";
            else
                return d;
        });

    // Build Y scales and axis:
    var y = d3.scaleBand()
        .range([ height - (bottom_margin + extra_bottom_margin), top_margin - excess_top_margin ])
        .domain(allTypes)
        .padding(0.01);
    svg.append("g")
        .attr("transform", "translate(" + left_margin + ", 0)")
        .call(d3.axisLeft(y))
        .selectAll("text")
        .text(function(d, i) {
            if (d === "")
                return "None";
            else
                return d;
        });

    var data = setupHeatMapData(allTypes, base_data);

    var avgList = data.map(a => +a["Special Stats Avg"]);
    var maxAvg = Math.max.apply(null, avgList);
    maxAvg = Math.ceil(maxAvg);

    // Build color scale
    var myColor = d3.scaleLinear()
        .range(["black", "orange"])
        .domain([0, maxAvg])

    // Add the squares
    svg.selectAll()
        .data(data, function(d) {return d["Type 1"]+':'+d["Type 2"];})
        .enter()
        .append("rect")
        .attr("x", function(d) { return x(d["Type 1"]) })
        .attr("y", function(d) { return y(d["Type 2"]) })
        .attr("width", x.bandwidth() )
        .attr("height", y.bandwidth() )
        .style("fill", function(d) { return myColor(d["Special Stats Avg"])} )

    // Append a defs (for definition) element to the SVG
    var defs = svg.append("defs");

    // Append a linearGradient element to the defs
    var linearGradient = defs.append("linearGradient")
        .attr("id", "linear-gradient")
        .attr("x1", "0%")
        .attr("y1", "0%")
        .attr("x2", "100%")
        .attr("y2", "0%");

    // Set the color for the start (0%)
    linearGradient.append("stop")
        .attr("offset", "0%")
        .attr("stop-color", "black");

    // Set the color for the end (100%)
    linearGradient.append("stop")
        .attr("offset", "100%")
        .attr("stop-color", "orange");

    var center_point = (width/2);

    // Draw the rectangle and fill with gradient
    svg.append("rect")
        .attr("width", 300)
        .attr("height", 20)
        .style("fill", "url(#linear-gradient)")
        .attr("transform", "translate(" + (center_point-150) + "," + (height - bottom_margin - 10) + ")");

    // Gradient legend minimum value label
    svg.append("text")
        .attr("transform", "translate(" + ((center_point-150)-10) + " ," + (height - bottom_margin + 5) + ")")
        .attr("font-weight", "bold")
        .style("text-anchor", "end")
        .text("0");

    // Gradient legend maximum value label
    svg.append("text")
        .attr("transform", "translate(" + ((center_point+150)+10) + " ," + (height - bottom_margin + 5) + ")")
        .attr("font-weight", "bold")
        .style("text-anchor", "start")
        .text(maxAvg);
}

/**
 * Function setupHeatMapData: Sets up and returns the appropriate data needed for the heat map
 * @param types string[] The different Pokemon types that will be both the x and y axis
 * @param data Object[] The list of objects representing the read CSV file
 *
 * @return Object[] the list of different Pokemon type pairings with their respective special stats total and averages
 */
function setupHeatMapData(types, data) {
    var retArr = [];    // the return list/array

    // Push all possible type pairings as objects into the return array, each with special stats total and counter properties initialized to 0
    types.forEach((type_item1, type_idx1) => {
        types.forEach((type_item2, type_idx2) => {
            let obj = new Object();
            obj["Type 1"] = type_item1;
            obj["Type 2"] = type_item2;
            obj["Special Stats Total"] = 0;
            obj["Count"] = 0;
            retArr.push(obj);
        })
    })

    // Loop through each row of the provided dataset argument
    data.forEach((data_item, data_idx) => {
        // Grab the two pairings for the current data row (ie. current Pokemon)
        let type1 = data_item["Type 1"];
        let type2 = data_item["Type 2"];

        // Retrieve the symmetric pairings (from the return array) that matches the current data row's two types
        let matches = retArr.filter(x => {
            return (x["Type 1"] == type1 && x["Type 2"] == type2)||(x["Type 1"] == type2 && x["Type 2"] == type1);
        })

        // Add the sum of the special defense and special attack columns of the current data row to the symmetric pairings special stats total property,
        // then increment their counters by 1
        matches.forEach((match_item, match_idx) => {
            match_item["Special Stats Total"] += (+data_item["Sp. Atk"] + +data_item["Sp. Def"]);
            match_item["Count"] += 1;
        })
    })

    // Loop through the return array
    retArr.forEach((ra_item, ra_idx) => {
        // If the current pairing was found from the dataset, obtain the average by dividing the special stats total by the counter
        // and save this to a new special stats average property
        if (ra_item["Count"] > 0) {
            ra_item["Special Stats Avg"] = Math.round((ra_item["Special Stats Total"] / ra_item["Count"]) * 100) / 100;
        }
        // Otherwise, if the pairing was not found from the dataset, initialize its special stats average property to 0
        else {
            ra_item["Special Stats Avg"] = 0;
        }
    })

    return retArr;
}