require.config({
    urlArgs: "?bust=" + new Date().getTime(),
    paths: {
        "sightings": "sightings",
        "search": "search",
        "timeline": "timeline",
        "map": "map",
        "messenger": "messenger",
        "moment": "lib/moment.min",
        "typeahead": "lib/typeahead",
        "jqui": "lib/ui"
    }
})

define(["messenger", "moment", "map", "sightings", "search", "timeline", "typeahead", "jqui"], function(messenger, mom, map, sightings, search, timeline){
    var map, t;
    messenger.when("loaded:datum", function() {
        map = map.getMapInstance(document.getElementById("map-canvas"));
        sightings.initialize();
        // t = timeline.initialize({map: map.map, collection: map.getActiveSightings()});
        // t.render();
        messenger.when("show:sightings", function() {
            // t.setCollection(map.getActiveSightings());
        })
    })
    messenger.when("render:timeline", function() {
        // t.render();
    });
    messenger.when("reset:timeline", function() {
        // t.reset();
        // t.render();
        // t.updateHandles();
    })
    
})