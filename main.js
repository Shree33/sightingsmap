(function(){

    function parseInts(obj) {
        _.each(obj, function(val, key) {
            if (!_.isNaN(parseInt(val))) {
                obj[key] = parseInt(val)
            }    
        })
        return obj;
    }

    var Sighting = Backbone.Model.extend({
        parse: function(r) {
            var p = "gsx$";
            // Get only relevant properties
            var sanitized = _.pick(r, p+"lat", p+"lng", p+"ll", p+"lr", p+"ul", p+"ur", p+"locationbanded", p+"sightingdate", p+"bandnumber" )
            // Get values from sub-objects
            _.each(sanitized, function(val, key) {
                sanitized[key] = val.$t;
            })
            sanitized = _.invert(sanitized)
            // Strip gsx prefixes
            _.each(sanitized, function(val, key) {
                sanitized[key] = val.replace(p, "");
            })
            return parseInts(_.invert(sanitized))
        }
    });

    var Sightings = Backbone.Collection.extend({
        model: Bird,
        url: "https://spreadsheets.google.com/feeds/list/17fGFqzDS8uOQKmAXRjCscY_f4l85XjEtTsvlawUYwN0/o39yaik/public/values?alt=json",
        parse: function(response) {
            return response.feed.entry
        }
    });


    var sightings = new Sightings()
    sightings.fetch({
        parse: true,
        success: function(coll) {
            console.log(coll);
        }
    });

    new google.maps.Map(document.getElementById("map-canvas"), {
        center: { lat: 20.7, lng: -156.9601584},
        zoom: 8
    })

}).call(this);