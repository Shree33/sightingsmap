define(["messenger", "sightings"], function(messenger, bird_data) {

    $searchbar = $("#searchbar");

    (function (_) {
        'use strict';

        _.compile = function (templ) {
            var compiled = this.template(templ);
            compiled.render = function (ctx) {
                return this(ctx);
            }
            return compiled;
        }
    })(window._);

    function parse(sightings) {
        var addedPlaces = {};
        var by_band = []
        var by_place = []

        _.each(sightings, function(sighting) {
            var tokens = [sighting.get("ul"), sighting.get("ur"), sighting.get("lr"), sighting.get("ll")];
            var bandstring = sighting.getBandString();
            var bandnumber = sighting.get("bandnumber");
            var loc = sighting.get("sightinglocation");
            by_band.push({
                tokens: tokens,
                val: bandstring,
                type: "bandstring",
                bandnumber: bandnumber,
                model: sighting
            });
            by_band.push({
                tokens: tokens,
                val: new String(bandnumber),
                type: 'bandnumber',
                bandnumber: bandnumber,
                model: sighting
            });
            if (_.isUndefined(addedPlaces[loc])) {
                addedPlaces[loc] = true;
                by_place.push({
                    tokens: [loc],
                    val: loc,
                    type: "location"
                })
            }
        })
        return {
            by_band: by_band,
            by_place: by_place
        }
    }
    messenger.when("loaded:sightings", function(sightings) {
        var tokens = parse(sightings);
        var band_engine = new Bloodhound({
            local: tokens.by_band,
            datumTokenizer: function(d) {
                return Bloodhound.tokenizers.whitespace(d.val);
            },
            queryTokenizer: Bloodhound.tokenizers.whitespace,
            limit: 10
        });
        band_engine.initialize()

        var place_engine = new Bloodhound({
            local: tokens.by_place,
            datumTokenizer: function(d) {
                return Bloodhound.tokenizers.whitespace(d.val);
            },
            queryTokenizer: Bloodhound.tokenizers.whitespace,
            limit: 10
        });
        place_engine.initialize()



        $searchbar.typeahead(
            {
                hint: true,
                minLength: 1,
                highlight: true
            }, 
            {
                displayKey: "val",
                source: band_engine.ttAdapter(),
                templates: {
                    empty: "<div class='tt-empty-results'>No results found.</div>",
                    suggestion: _.compile($("#suggestion-template").html()),
                    header: "<h2>By Bands</h2>"
                }
            },
            {
                displayKey: "val",
                source: place_engine.ttAdapter(),
                templates: {
                    empty: "<div class='tt-empty-results'>No results found.</div>",
                    suggestion: _.compile($("#suggestion-template").html()),
                    header: "<h2>By Location</h2>"
            },
        }).on("typeahead:selected", function(e, suggestion) {
            var bird = bird_data.getBirds()._byId[suggestion.bandnumber]
            switch(suggestion.type) {
                case "bandnumber": 
                case "bandstring":
                    console.log(bird);
                    if (bird) {
                        messenger.dispatch("show:sightings", bird.get("sightings"), bird);
                    }
                break;
            }
            $searchbar.typeahead("val", "")
        })
    })
})