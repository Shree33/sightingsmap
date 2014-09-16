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
            this.latLng = new google.maps.LatLng(sighting.get("lat"), sighting.get("lng"));
            this.marker = new google.maps.Marker({
                position: this.latLng,
                title: sighting.get("bandnumber") + " sighted here",
                animation: google.maps.Animation.DROP
            })
        },
        render: function() {
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
        this.active_sighting_models = new Backbone.Collection();
        this.active_sighting_models.comparator = function(model) {
            return model.get("date");
        }
        this.active_sighting_models.on("remove", function(model, collection) {
            if (collection.length > 2)
                messenger.dispatch("render:timeline");
            else { 
                messenger.dispatch("reset:timeline")
            }
            that.fitToBounds();
        })

        messenger.when("show:sightings", function(sightings, bird) {
            that.active_sighting_models.add(sightings.models);
            sightings.each(function(sighting) {
                sighting.allsightings = that.active_sighting_models;
                if (_.isUndefined(sighting.marker)) {
                    var marker = new Marker({model: sighting, map: that.map});
                    marker.render();
                    sighting.marker = marker.marker;
                    sighting.latLng = marker.latLng;
                    sighting.marker.setIcon(bird.marker_url);
                    var infowindow = new google.maps.InfoWindow(
                      { 
                        content: sighting.get("date").fromNow(),
                      });
                    google.maps.event.addListener(marker.marker, 'click', function() {
                        if (that.openInfoWindow) {
                            that.openInfoWindow.close()
                        }
                        infowindow.open(that.map, marker.marker);
                        that.openInfoWindow = infowindow;
                    });
                }
                else {
                    if (sighting.bird) {
                        sighting.bird.trigger("bounce");
                    }
                }
            });
            that.fitToBounds()
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
        return this.active_sighting_models;
    }

    Map.prototype.fitToBounds = function() {
        var bounds = new google.maps.LatLngBounds();
        for(i=0;i<this.active_sighting_models.length;i++) {
         bounds.extend(this.active_sighting_models.at(i).latLng);
        }
        this.map.setCenter(bounds.getCenter());
        this.map.fitBounds(bounds);
        this.map.setZoom(this.map.getZoom() - 1);
    }

    return {
        getMapInstance: function(el) {
            return new Map(el);
        }
    }
})