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

const markerStyle = (color, scale) => `
    background-color: ${color};
    width: ${scale}rem;
    height: ${scale}rem;
    display: block;
    left: -${scale/2}rem;
    top: -${scale/2}rem;
    position: relative;
    border-radius: ${scale}rem ${scale}rem 0;
    transform: rotate(45deg);
    border: 1px solid #FFFFFF`

const createMarker = ({lat, long, color, tooltip, name, scale = 1}) => {
    const icon = L.divIcon({
        className: "my-custom-pin",
        iconAnchor: [0, 24],
        labelAnchor: [-6, 0],
        popupAnchor: [0, -36],
        html: `<span style="${markerStyle(color, scale)}" />`
    })
    const marker = L.marker([lat, long], {icon, name})
    marker.bindPopup(tooltip)
    return marker
}

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


// Locations of studies
const studiesLayer = studies_data.map(x => {
    const colors = {
        PAWSINTERCEPT: "purple",
        AirShepherd: "red",
        RGBTIR: "orange"
    }
    return createMarker({
        lat: x.lat,
        long: x.long,
        color: colors[x.study],
        tooltip: x.name,
        name: "studies"
    });
})

const railwayLayer = L.tileLayer('https://{s}.tiles.openrailwaymap.org/standard/{z}/{x}/{y}.png', {
	name: 'railway',
    maxZoom: 7,
	attribution: 'Map data: &copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors | Map style: &copy; <a href="https://www.OpenRailwayMap.org">OpenRailwayMap</a> (<a href="https://creativecommons.org/licenses/by-sa/3.0/">CC-BY-SA</a>)'
});


// the Great Elephant Census
const gecLayer = L.geoJSON(countries, 
    {name: "gec", 
    attribution: '<a href="http://www.greatelephantcensus.com/final-report">GEC Final report</a>',
    style: feature => {
        const colors = {
            up: "green",
            stable: "blue",
            down: "red"
        }
        const country = feature.properties.name;

        // country not in gec data
        if (gec_data.map(d => d.country).indexOf(country) == -1) return {color: "transparent"};

        const trend = gec_data.filter(d => d.country == country)[0].trend
        return {color: colors[trend], weight: 0.8, opacity: 0.6}
    },
    onEachFeature: (feature, layer) => {
        const country = feature.properties.name;

        // add tooltip for each country in gec
        const countryInGEC = gec_data.map(d => d.country).indexOf(country) != -1
        if (countryInGEC) {
            layer.bindPopup("Elephant count: " + gec_data.filter(d => d.country == country)[0].count)
        }
    }
})


// these two layers are used simultaneously
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

// national parks
const parksLayer = parks_data.map(x => {
    return createMarker({
        lat: x.lat,
        long: x.long,
        color: "steelblue",
        tooltip: x.name,
        name: "parks",
        scale: 0.75
    });
})


// onclick layer toggle
function toggleLayer(layer, cb){

    const allLayers = [
        {name: "studies", layer: studiesLayer},
        {name: "railway", layer: railwayLayer},
        {name: "gec", layer: gecLayer},
        {name: "water", layer: waterLayer},
        {name: "nature", layer: natureLayer},
        {name: "parks", layer: parksLayer}
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
        const isMarkersLayer = ["studies", "parks"].indexOf(layer) != -1
        if (isMarkersLayer){
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