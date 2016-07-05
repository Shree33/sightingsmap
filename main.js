require.config({
    urlArgs: "?bust=" + new Date().getTime(),
    // I think these are paths to each of the js files
    paths: {
        "sightings": "sightings",
        "search": "search",
        "router": "router",
        "timeline": "timeline",
        "map": "map",
        "messenger": "messenger",
        "moment": "lib/moment.min",
        "typeahead": "lib/typeahead",
        "jqui": "lib/ui"
    }
})
// Connecting the paths to files
define(["moment", "map", "sightings", "search", "timeline", "router","typeahead", "jqui"], function(mom, map, sightings, search, timeline, router){
    require(["messenger"], function(messenger){
        sightings.getKey(function() {
            // Creating an instance of the map
            map.getMapInstance(document.getElementById("map-canvas"));
            // Initialize Sightings
            sightings.initialize();
                // t = timeline.initialize({map: map.map, collection: map.getActiveSightings()});
                // t.render();
                // messenger.when("show:sightings", function() {
                    // t.setCollection(map.getActiveSightings());
                // })
        });
        // Is this supposed to run when render timeline is clicked?
        messenger.when("render:timeline", function() {
            // t.render();
        });
        // Is this supposed to run when reset timeline is clicked?
        messenger.when("reset:timeline", function() {
            // t.reset();
            // t.render();
            // t.updateHandles();
        })
    })
    // This works but the button is misaligned, and you have to click the button to close it
    $("#launch-help-modal").on("click", function() {
        $("#help-modal").fadeToggle("fast");
    });

    // When this is clicked, the markers are supposed to appear? (Nothing happens right now)
    $(".js-show-all").on("click", function() {
        messenger.dispatch("navigate","all", true);
    });
})