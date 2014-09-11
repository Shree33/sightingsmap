define(["messenger"], function(messenger){
    function parseNums(obj) {
        _.each(obj, function(val, key) {
            if (!_.isNaN(parseFloat(val))) {
                obj[key] = parseFloat(val)
            }    
            else if (!_.isNaN(parseInt(val))) {
                obj[key] = parseInt(val)
            }    
        })
        return obj;
    }

    var location_shortcuts = {
        "JCNWR": "James Campebell National Wildlife Refuge"
    }

    var Sighting = Backbone.Model.extend({
        parse: function(r) {
            var p = "gsx$";
            // Get only relevant properties
            var sanitized = _.pick(r, p+"lat", p+"lng", p+"ll", p+"lr", p+"ul", p+"ur", p+"locationbanded", p+"sightingdate", p+"bandnumber" )
            // Get values from sub-objects
            _.each(sanitized, function(val, key) {
                sanitized[key] = val.$t;
                if (location_shortcuts[sanitized[key]]) {
                    sanitized[key] = location_shortcuts[sanitized[key]]
                }
            })
            var date = moment(sanitized["gsx$sightingdate"])
            sanitized = _.invert(sanitized)
            // Strip gsx prefixes
            _.each(sanitized, function(val, key) {
                sanitized[key] = val.replace(p, "");
            })
            return _.extend(parseNums(_.invert(sanitized)), {sightingdate: date})
        },
        getBandString: function() {
            var ul = this.get("ul") || "_";
            var ur = this.get("ur") || "_";
            var lr = this.get("lr") || "_";
            var ll = this.get("ll") || "_";
            return ul + ll + ur + lr;
        }
    });

    var Sightings = Backbone.Collection.extend({
        model: Sighting,
        url: "https://spreadsheets.google.com/feeds/list/17fGFqzDS8uOQKmAXRjCscY_f4l85XjEtTsvlawUYwN0/o39yaik/public/values?alt=json",
        parse: function(response) {
            return response.feed.entry
        }
    });


    var sightings = new Sightings()
    sightings.fetch({
        parse: true,
        success: function(coll) {
            messenger.dispatch("loaded:sightings", coll.models)
            console.log(coll);
        }
    });

    new google.maps.Map(document.getElementById("map-canvas"), {
        center: { lat: 20.7, lng: -156.9601584},
        zoom: 8
    })
})