var map = window.api.map;
var features = window.api.data.get('map').features;
var default_radius = 100; //radius in meters
var gtype = "";

var detectionZones = new L.LayerGroup();
var entranceLines  = new L.LayerGroup();
var exitLines = new L.LayerGroup();

function Update_Layers () {
	
	//delete old content
	detectionZones.clearLayers();
	entranceLines.clearLayers(); 
	exitLines.clearLayers();
	

	features = window.api.data.get('map').features; //refetch data
	// body...
	for (index = 0, len = features.length; index < len; ++index) { 
	//optional to set a property in jsson	
	

		gtype = features[index].geometry.type;
		if (gtype == "Point"){
			var radius = features[index].properties["radius"]; 
			var id = features[index].properties["id"]; 
			if ( isNaN(radius) ){
				radius = default_radius;
			}
			var latlng = L.latLng(features[index].geometry.coordinates[1], features[index].geometry.coordinates[0]);	
			L.circle(latlng,radius).addTo(detectionZones);		
		}

		//create Line layers for entrance (point 1 and point 2) and exit (point 3, and 4 of polygon)
		if (gtype == "Polygon"){
			var id = features[index].properties["id"]; 
			var latlng1 = L.latLng(features[index].geometry.coordinates[0][0][1], features[index].geometry.coordinates[0][0][0]);
			var latlng2 = L.latLng(features[index].geometry.coordinates[0][1][1], features[index].geometry.coordinates[0][1][0]);
			L.polyline([latlng1,latlng2], {color: 'red'}).addTo(entranceLines);
			
			latlng1 = L.latLng(features[index].geometry.coordinates[0][2][1], features[index].geometry.coordinates[0][2][0]);
			latlng2 = L.latLng(features[index].geometry.coordinates[0][3][1], features[index].geometry.coordinates[0][3][0]);
			L.polyline([latlng1,latlng2], {color: 'green'}).addTo(exitLines);

		}
		
	}
}

Update_Layers();

var overlayMaps = {
    "Detection Zones": detectionZones,
    "Entrance": entranceLines,
    "Exit": exitLines
};

L.control.layers(null, overlayMaps).addTo(window.api.map);


map.on('draw:edited', function (e) {
    console.log("my draw edited hook");
    Update_Layers();
    var layers = e.layers;
    layers.eachLayer(function (layer) {
        console.log(layer);
        //do whatever you want, most likely save back to db
    });
});

map.on('draw:created', function (e) {
    var type = e.layerType,
        layer = e.layer;

    console.log("my Created  hook");
   
    if (type === 'marker') {
        // Do marker specific actions
    }
    console.log("Number of features");
    feature_length = window.api.data.get('map').features.length;
    console.log(feature_length);

    if (type === 'polygon') {
    	//fetch last created polygon feature and set some attributes
    	feature = window.api.data.get('map').features[feature_length-1]

    	feature.properties["event"] = "EntranceExit"
    	feature.properties["id"] = feature_length ; 
    	feature.properties["name"] = "Zone " + feature_length;
    	feature.properties["bothdirections"] = 0;

    	//Create a Point for the created polygon
    	console.log("Polygon was created..");
        // Do marker specific actions
        var coordinates = layer.getLatLngs();
        console.log(coordinates);
        var bounds = layer.getBounds();
        console.log(bounds);
        center = bounds.getCenter();
        console.log(center);
        //get the center of the marker and create the a marker (with radius x) automatically

        //draw the marker and add it to the map 
        window.api.data.mergeFeatures([{ type: "Feature", properties: {radius:default_radius, event:"EntranceExit", id: feature_length +1, name:"Zone " +feature_length }, geometry: { type: "Point", coordinates: [center.lng, center.lat] } }]);
        
    }

    Update_Layers();
    // Do whatever else you need to. (save to db, add to map etc)
    //map.addLayer(layer);
});



//listens to attribute changes in the popup boxes
/* - does not work
	document.getElementsByClassName("save")[0].addEventListener("click", function(){
		Update_Layers();
	});
*/

// zu überwachende Zielnode (target) auswählen
var target = document.querySelector('.leaflet-popup-pane');
 
// eine Instanz des Observers erzeugen
var observer = new MutationObserver(function(mutations) {
  mutations.forEach(function(mutation) {
    console.log(mutation.type);
    	Update_Layers();//very ineficent but works
  });    
});
 
// Konfiguration des Observers: alles melden - Änderungen an Daten, Kindelementen und Attributen
var config = { attributes: true, childList: true, characterData: true };
 
// eigentliche Observierung starten und Zielnode und Konfiguration übergeben
observer.observe(target, config);



/*

//loads a external extension of leaflet  script element
var script = document.createElement('script');
script.type = 'text/javascript';
script.src = 'https://api.tiles.mapbox.com/mapbox.js/plugins/leaflet-label/v0.2.1/leaflet.label.js';
document.head.appendChild(script);

var script = document.createElement('link');
script.type = 'text/css';
script.rel = 'stylesheet'
script.href = 'https://api.tiles.mapbox.com/mapbox.js/plugins/leaflet-label/v0.2.1/leaflet.label.css';
document.head.appendChild(script);
*/
