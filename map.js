define(["messenger"], function(messenger) {

    var Marker = Backbone.View.extend({
        initialize: function(attrs) {
            this.map = attrs.map;
            var sighting = attrs.model;
            this.listenTo(this.model, {
                "show": function() {
                    if (!this.isShowing()) {
                        this.showing = true;
                        this.marker.setMap(this.map);
                    }
                },
                "hide": function() {
                    if (this.isShowing()) {
                        this.marker.setMap(null);
                        this.showing = false;
                    }
                } 
            });
            this.marker = new google.maps.Marker({
                position: new google.maps.LatLng(sighting.get("lat"), sighting.get("lng")),
                title: sighting.get("bandnumber") + " sighted here",
                animation: google.maps.Animation.DROP
            })
        },
        render: function() {
            console.log(this.map)
            this.marker.setMap(this.map);
        },
        isShowing: function() {
            return this.showing;
        }
    })

    function Map(el) {
        this.map = new google.maps.Map(el, {
            center: {lat: 20.7, lng: -156.9601584},
            zoom: 8
        });    

        var that = this;
        this.active_markers = [];
        this.active_sighting_models = new Backbone.Collection();
        this.active_sighting_models.comparator = function(model) {
            return model.get("date");
        }

        messenger.when("show:sightings", function(sightings) {
            that.active_sighting_models.add(sightings.models);
            sightings.each(function(sighting) {
                if (_.isUndefined(sighting.marker)) {
                    var marker = new Marker({model: sighting, map: that.map});
                    marker.render();
                    sighting.marker = marker.marker;
                    that.active_markers.push(marker.marker);
                }
            });
        });

        messenger.when("toggle:markers", function(lowerbound, upperbound) {
            that.active_sighting_models.each(function(model) {
                var date = model.get("date").unix() * 1000;
                if (date < lowerbound || date > upperbound) {
                    model.trigger("hide");
                }
                else {
                    model.trigger("show");
                }
            })
        })
    }
    
    Map.prototype.getActiveSightings = function() {
        this.active_sighting_models.sort();
        console.log(this.active_sighting_models);
        return this.active_sighting_models;
    }

    return {
        getMapInstance: function(el) {
            return new Map(el);
        }
    }
})