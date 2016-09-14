/**
 * map.js
 * Description: Defines and create map canvas. Displays
 */

define(["messenger"], function(messenger) {

    /**
     * Defines marker properties for each active marker
     */
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

            this.latLng = new google.maps.LatLng(sighting.get("lat"),
                                                 sighting.get("lng"));

        

        this.marker = new google.maps.Marker({
                position: this.latLng,
                title: sighting.getBandString() + " sighted here",
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

    /**
     * Creates map and active_sightings_models collection
     */
    function Map(el) {
        this.map = new google.maps.Map(el, {
            center: {lat: 43.08087, lng: -70.76028},
            zoom: 8
        });    

        var mapForCluster = this.map;
        MarkerCluster = new MarkerClusterer(mapForCluster);

        var that = this;
        this.active_sighting_models = new Backbone.Collection();
        this.active_sighting_models.comparator = function(model) {
            return model.get("date");
        }
        this.active_sighting_models.on("remove", function(model, collection) {
            /*if (collection.length > 2)
                messenger.dispatch("render:timeline");
            else { 
                messenger.dispatch("reset:timeline")
            }*/
            // that.fitToBounds();
        })

        messenger.when("show:markers add:sightings", function() {
            that.showMarkers.apply(that,arguments);
        });

        _.bindAll(this, "showMarkers");


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

    /**
     * Resizes map to fit all of the active marker locations on the map.
     */
    Map.prototype.fitToBounds = function() {
        var bounds = new google.maps.LatLngBounds();
        var len = this.active_sighting_models.length;
        if (len === 0) {
            this.map.setCenter({lat: 43.08087, lng: -70.76028})
            this.map.setZoom(8);
            return this;
        }
        for(i=0;i<len;i++) {
         bounds.extend(this.active_sighting_models.at(i).latLng);
        }
        this.map.setCenter(bounds.getCenter());
        this.map.fitBounds(bounds);
        this.map.setZoom(this.map.getZoom() - 1);
        return this;
    }

    /**
     * Creates and renders markers on the map with infowindows
     */
    Map.prototype.showMarkers = function(sightings, parent) {
        var that = this;
        var allMarkers = [];
        that.active_sighting_models.add(sightings.models);
        sightings.each(function(sighting) {
            sighting.allsightings = that.active_sighting_models;
            if (_.isUndefined(sighting.marker)) {
                var marker = new Marker({model: sighting, map: that.map});
                marker.render();
                sighting.marker = marker.marker;
                sighting.latLng = marker.latLng;
                sighting.marker.setIcon(parent.marker_url);
                allMarkers.push(sighting.marker);
                var infowindow = new google.maps.InfoWindow(
                  { 
                    // Change data shown in infowindow here
                    content: "<p> Bird ID: " + sighting.get("bird_id")+ "</p>" +
                             // "<p> Color: " + sighting.getBandString() + "</p>" + 
                             "<p> Date: " + 
                             sighting.get("date").format("M/D/YY") + "</p>",
                  });

        // Infowindow toggle for each marker
        infowindow.open(that.map, marker.marker);
                google.maps.event.addListener(marker.marker, 'click', 
                                              function() {
                    if (infowindow.getMap() !== null) {
                        infowindow.close()
                    }
                    else {
                        infowindow.open(that.map, marker.marker);
                    }
                    that.openInfoWindow = infowindow;
                });
            }
            else if (sighting.marker.getMap()) {
                if (sighting.bird) {
                    sighting.bird.trigger("bounce");
                }
            }
        });
    
    MarkerCluster.addMarkers(allMarkers);
        that.fitToBounds()
    }

    var activeSightings = new Backbone.Collection();
    activeSightings = this.active_sighting_models;
    return {
        getMapInstance: function(el) {
            return new Map(el);
        },
        getActiveSightings: function() {
            return activeSightings;
        },
    }
})
