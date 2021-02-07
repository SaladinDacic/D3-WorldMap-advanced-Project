d3.queue()
    .defer(d3.json, "./geoMapTopo.json")
    .defer(d3.csv, "./country_data.csv", (row)=>{
        return {
            country: row.country,
            countryCode: row.countryCode,
            population: +row.population,
            medianAge: +row.medianAge,
            fertilityRate: +row.fertilityRate,
            populationDensity: +row.population / +row.landArea,
        }
    })
    .await((error, mapData, populationData)=>{
        if(error) throw error;
        var geoData = topojson.feature(mapData, mapData.objects.countries).features;

        geoData.map(geoObj=>{
            geoObj.properties = populationData.filter(d=>d.countryCode == geoObj.id)
        })
        console.log(geoData, populationData);

        var width = 1000;
        var height = 1500;
        var tooltip = d3.select("body")
                        .append("div")
                        .classed("tooltip", true)


        var projection = d3.geoMercator()
                        .scale(100)
                        .translate([width / 2, height / 5]);

        var path = d3.geoPath()
                     .projection(projection);

        d3.select("svg")
            .attr("width", width)
            .attr("height", height)
            .selectAll(".country")
            .data(geoData)
            .enter()
            .append("path")
                .classed("country", true)
                .attr("d", path)


        d3.selectAll(".country")
            .on("mousemove", (d)=>{
                showTooltip(d)
            } )
            .on("touchStart", (d)=>{showTooltip(d)})
            .on("mouseout", ()=>{
                tooltip
                    .style("opacity", 0)
            })
            .on("touchEnd", ()=>{
                tooltip
                    .style("opacity", 0)
            })
    


        var select = d3.select("select");

        setColor(select.property("value"));


        select.on("change",(d)=>{
            return setColor(d3.event.target.value);
        })


        function setColor(val){

            var colorRange={
                population: ["#c46abd", "#8a007f"],
                populationDensity : ["#ed6868", "#800000"],
                medianAge: ["white", "black"],
                fertilityRate: ["black", "orange"]
            }

            var colorScale = d3.scaleLinear()
                                .domain([0, d3.max(populationData, d=>d[val])])
                                .range(colorRange[val])


            d3.selectAll(".country")
                .transition()
                .duration(800)
                .ease(d3.easeBackIn)
                .attr("fill", d=>{
                    var data = d.properties[0];
                    if(data === undefined){
                        return "#ccc"
                    }else{
                        return colorScale(data[val]);
                    }
                })
                
                
        }
        function showTooltip(d){
            var moveTooltip = tooltip.node().offsetWidth / 2
            // console.log(d.properties[0]);
            tooltip
                .style("opacity", 1)
                .style("left", d3.event.pageX - moveTooltip +"px")
                .style("top",  d3.event.pageY + 15 +"px")
                .html(`
                    <p>Country: ${d.properties[0].country}</p>
                    <p>Population: ${d.properties[0].population.toLocaleString()}</p>
                    <p>Median age: ${d.properties[0].medianAge.toLocaleString()}</p>
                    <p>Population Density: ${d.properties[0].populationDensity.toLocaleString()}</p>
                `)
        }           
    })