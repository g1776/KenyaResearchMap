// initialize
const mymap = L.map('map').setView([0.7832,20.5085], 3);
L.Control.Watermark = L.Control.extend({
    onAdd: function(map) {
        var img = L.DomUtil.create('img');

        img.src = './img/psu.png';
        img.style.width = '130px';

        return img;
    }
});

L.control.watermark = function(opts) {
    return new L.Control.Watermark(opts);
}
L.control.watermark({ position: 'bottomleft' }).addTo(mymap);

var CartoDB_Voyager = L.tileLayer('https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png', {
	attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>',
	subdomains: 'abcd',
	maxZoom: 7,
    minZoom: 3
});

CartoDB_Voyager.addTo(mymap);


///// layers

const studiesLayer = studies_data.map(x => {
    const colors = {
        PAWSINTERCEPT: "purple",
        AirShepherd: "red",
        RGBTIR: "orange"
    }
    const circle = L.circle([x.lat, x.long], {
        color: colors[x.study],
        fillColor: colors[x.study],
        fillOpacity: 0.5,
        weight: 0.8,
        radius: 50000,
        name: "studies"
    })
    circle.bindPopup(x.name);
    return circle
})

const railwayLayer = L.tileLayer('https://{s}.tiles.openrailwaymap.org/standard/{z}/{x}/{y}.png', {
	name: 'railway',
    maxZoom: 7,
	attribution: 'Map data: &copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors | Map style: &copy; <a href="https://www.OpenRailwayMap.org">OpenRailwayMap</a> (<a href="https://creativecommons.org/licenses/by-sa/3.0/">CC-BY-SA</a>)'
});

const topographyLayer = L.tileLayer('https://{s}.tile.opentopomap.org/{z}/{x}/{y}.png', {
    name: 'topography',
	maxZoom: 7,
	attribution: 'Map data: &copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors, <a href="http://viewfinderpanoramas.org">SRTM</a> | Map style: &copy; <a href="https://opentopomap.org">OpenTopoMap</a> (<a href="https://creativecommons.org/licenses/by-sa/3.0/">CC-BY-SA</a>)'
});

const gecLayer = L.geoJSON(countries, 
    {name: "gec", 
    attribution: '<a href="http://www.greatelephantcensus.com/final-report">GEC Final report</a>',
    style: feature => {
        if (gec_down.indexOf(feature.properties.name) != -1) return {color: "red", weight: .5}
        else if (gec_up.indexOf(feature.properties.name) != -1) return {color: "green", weight: .5}
        else if (gec_stable.indexOf(feature.properties.name) != -1) return {color: "blue", weight: .5}
        else return {color: "transparent"}
    }
})


// these two layers are combined
nature_data.features = nature_data.features.filter(feature => feature.properties.type != "park")
const natureLayer = L.geoJSON(nature_data, {
    name: "nature",
    style: feature => {
        const type = feature.properties.type;
        if (type == "riverbank") return {color: "tan", weight: 1.3}
        else if (type =="water") return {color: "blue", weight: 1.3}
        else if (type == "forest") return {color: "green", weight: 1.3}
    },
    onEachFeature: (feature, layer) => layer.bindPopup(feature.properties.name || "No info")
})
const waterLayer = L.geoJSON(water_data, {
    name: "water", 
    style: {weight: 0.9, color: "blue", opacity: 0.4},
    onEachFeature: (feature, layer) => layer.bindPopup(feature.properties.name || "No info")
})


// onclick layer toggle
function toggleLayer(layer, cb){

    const allLayers = [
        {name: "studies", layer: studiesLayer},
        {name: "railway", layer: railwayLayer},
        {name: "topography", layer: topographyLayer},
        {name: "gec", layer: gecLayer},
        {name: "water", layer: waterLayer},
        {name: "nature", layer: natureLayer}
    ]

    const legendContainer = document.getElementById("legend-container")
    const legend = legends[layer] == undefined ? "" : legends[layer]

    if (cb.checked) {
        if ($("#legend-studies").length != 0 && layer == "studies") {
            console.log("Layer already exists (this should never get called)")
            return;
        }
        console.log(`adding layer for ${layer}`)

        // add layer
        const layerToAdd = allLayers.filter(x => x.name == layer)[0].layer;
        if (layer == "studies"){
            layerToAdd.forEach(circle => circle.addTo(mymap))
        } else {
            layerToAdd.addTo(mymap)
        }

        // add legend
        if (legend != ""){
            legendContainer.innerHTML = legendContainer.innerHTML.replace (/^/, legend);
        }
        
    } else {
        console.log(`Removing layer for ${layer}`)

        // remove layer
        console.log("TARGET NAME:", layer)
        mymap.eachLayer(existingLayer => {
            console.log("NAME:", existingLayer.options.name)
            if (existingLayer.options.name == layer){
                mymap.removeLayer(existingLayer)
            }
        })
        
        // remove legend
        if (legend != ""){
            const sublegend = document.getElementById(`legend-${layer}`);
            sublegend.parentNode.removeChild(sublegend);
        }
        
    }
}