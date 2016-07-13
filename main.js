/**
 * Main.js
 * Description: this file links all of the javascript files 
 * and initalizes the map.
 * It also creates event triggers for buttons
 */

// RequireJS is a JavaScript file and module loader. 
require.config({
    urlArgs: "?bust=" + new Date().getTime(),
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


define(["moment", "map", "sightings", "search", "timeline", "router","typeahead"
        , "jqui"], function(mom, map, sightings, search, timeline, router){
    require(["messenger"], function(messenger){
        sightings.getKey(function() {
            // Create an instance of the map
            map.getMapInstance(document.getElementById("map-canvas"));

            sightings.initialize();
            // TODO: Timeline is still buggy but it needs to be initialized for 
            // the map to render properly
            t = timeline.initialize({map: map.map, 
                                    collection: map.getActiveSightings()});
            t.render();
            messenger.when("show:sightings", function() {
                t.setCollection(map.getActiveSightings());
            })
        });

        // Currently inactive as timeline.js still needs ot be fixed
        /*messenger.when("render:timeline", function() {
            t.render();
        });

        messenger.when("reset:timeline", function() {
            t.reset();
            t.render();
            t.updateHandles();
        })*/
    })
    /**
     * Event Trigger: Clicking "?" makes an info window appear
     * TODO: Make it so that clicking anywhere will close help window
     */
    $("#launch-help-modal").on("click", function() {
        $("#help-modal").fadeToggle("fast");
    });

    // Event trigger: Clicking "Show all" makes all Gull Sightings appear
    $(".js-show-all").on("click", function() {
        messenger.dispatch("navigate","all", true);
    });
})