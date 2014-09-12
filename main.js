require.config({
    urlArgs: "?bust=" + new Date().getTime(),
    paths: {
        "sightings": "sightings",
        "search": "search",
        "map": "map",
        "messenger": "messenger",
        "moment": "lib/moment.min",
    }
})

define(["moment", "map", "sightings", "search"], function(mom, Map, sightings){
    new Map(document.getElementById("map-canvas"));
    sightings.initialize();
})