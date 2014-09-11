require.config({
    urlArgs: "?bust=" + new Date().getTime(),
    paths: {
        "sightings": "sightings",
        "search": "search",
        "messenger": "messenger",
        "moment": "lib/moment.min",
    }
})

define(["moment", "sightings", "search"], function(){})