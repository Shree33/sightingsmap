// to dispatch something when the "show all" button is clicked
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

    var by_location = {};

    function getNextMarkerUrl() {
        var markers = [null,"greenpoi", "orange", "bluepoi", "sienna", "turquoise", "purplepoi"];
        var i = 0;

        return function() {
            // Index iterates over markers and going past length brings it back to 0
            var index = i++ % markers.length;
            if (index === 0) {
                return null;
            }
            else {
                return "images/" + markers[index] + ".png";
            }
        }
    }

    // Each Bird object has multiple sightings
    var Bird = Backbone.Model.extend({
        defaults: function() {
            return {
                sightings: new Sightings
            }
        },
        // When this is called the sighting in the arg is put into 
        // the sightings collection for the current bird
        addSighting: function(sighting) {
            // "This" in this case refers to Bird
            this.get("sightings").add(sighting);
            return this;
        }
    })
    // Collection of birds
    var Birds = Backbone.Collection.extend({
        // Look up how this "model" thing works in backbone
        model: function(m) {
            // Ditto on instanceof
            if (m instanceof Bird) {
                return Bird
            }
            else {
                return Location;
            }
        },
        // The title "initialize" is obvious but the things going on inside are not
        initialize: function() {
            // Calls "next" to get next marker with a rotating color
            var next = getNextMarkerUrl();
            // Confused about the next two lines, I get what they do but am confused on the specifics
            this.on("add", function(bird) {
                bird.marker_url = next();
            })
        }
    })

    // This function creates a new instance of a sighting from data given
    // If bird is new, new bird is created and added to the collection
    var Sighting = Backbone.Model.extend({
        initialize: function(){
            // Get a bird from the bird collection
            var bird = birds._byId[this.get("bird_id")]
            // If its undefined, create a new instance of bird
            if (_.isUndefined(bird)) {
                bird = new Bird({
                    bandnumber: this.get("bandnumber"),
                    bandstring: this.getBandString()
                })
                bird.id = this.get("bird_id");
                // add it to birds collection as a new bird
                birds.add(bird)
                this.bird = bird;
            }
            var lat = Number(this.get("lat"));
            var lng = Number(this.get("lng"));
            // Why is this randomized/ made askew a little? security/privacy?
            var dir = Math.random() > .5 ? 1 : -1;
            this.set({
                lat: lat + dir*Math.random()/1000,
                lng: lng + dir*Math.random()/1000
            });
            // Add this sighting to the bird's collection
            bird.addSighting(this);
            // Also add sighting to collection organized by location found?
            var loc = by_location[this.get("sightinglocation").toLowerCase().replace(" ", "")]
            if (typeof loc === "undefined") {
                by_location[this.get("sightinglocation").toLowerCase().replace(" ", "")] = new Sightings([this]);
            }
            else {
                by_location[this.get("sightinglocation").toLowerCase().replace(" ", "")].add(this);
            }
        },
        // Takes in and parses through r to grab all the info for a sighting
        parse: function(r) {
            var p = "gsx$";
            // Get only relevant properties
            var sanitized = _.pick(r, p+"lat", p+"lng", p + "bandcolor", p+"sightinglocation", p+"date", p+"bandnumber")
            // Parse location shortcuts
            _.each(sanitized, function(val, key) {
                sanitized[key.replace(p, "")] = val.$t;
                if (location_shortcuts[sanitized[key]]) {
                    sanitized[key.replace(p, "")] = location_shortcuts[sanitized[key]]
                }
            });
            var bandnum = sanitized["bandnumber"]
            var date = moment(sanitized["date"])

            var lat = sanitized["lat"];
            var lng = sanitized["lng"];


        return  _.omit(_.extend(sanitized, {date: date, bird_id: bandnum, lat: lat, lng: lng}), function(value, key) {
                key.indexOf(p) !== -1;
            });
        },
        getBandString: function() {
        var bandcolor = this.get("bandcolor") || "X";
            return bandcolor;
        },
        hasLocation: function() {
            return !_.isUndefined(this.get("lat")) && !_.isUndefined(this.get("lng"));
        },
        getBandsClassName: function(){
            var json = this.toJSON();
            return "bandcolor-" + json.bandcolor;
        }
    });
    // I don't know what the following does, 
    // possibly extend a collection of sightings with a 
    // new sighting? but that doesnt make sense
    var Sightings = Backbone.Collection.extend({
        model: Sighting,
        parse: function(response) {
            return response.feed.entry
        }
    });



    var SingleBird = Backbone.View.extend({
        tagName: "li",
        template: $("#single-bird-listitem").html(),
        initialize: function() {
            var that = this;
            this.listenTo(this.model, {
                "remove destroy": function() {
                    this.model.get("sightings").each(function(sighting) {
                        sighting.allsightings.remove(sighting);
                        if (sighting.marker) {
                            sighting.marker.setMap(null);
                        }
                    })
                    this.$el.addClass("genie-hide")
                    setTimeout(function() {
                        that.remove();
                    }, 200)
                },
                "bounce": function() {
                    var $el = this.$el;
                    $el.addClass("already-selected");
                    setTimeout(function() {
                        $el.removeClass("already-selected");
                    }, 3000)
                }
            })
        },
        toggleBirdInfo: function() { 
            var tooltip = this.$(".info-tooltip")
            $(".info-tooltip").not("[data-bandnum=" + this.model.get("bandnumber") + "]").hide()
            if (!tooltip.html()) {
                tooltip.html(_.template($("#bird-info").html(), _.extend(
                    this.model.toJSON(), {
                        numsightings: this.model.get("sightings").length,
                        taggedat: this.model.get("sightings").at(0).get("sightinglocation")
                    }
                )
                )).fadeIn("fast")
            }
            else {
                tooltip.fadeToggle("fast");
            }
        },
        render: function() {
            this.$el.html(_.template(this.template, this.model.toJSON()))
            this.$el.addClass("color " + new String(this.model.marker_url).replace(".png", "").replace("images/", ""));
            return this;
        },
        events: {
            "mouseenter": function() {
                var that = this;
                this.model.get("sightings").each(function(sighting) {
                    if (sighting.marker) {
                        that.mouseentertime = new Date().getTime();
                        sighting.marker.setZIndex(9);
                        sighting.marker.setAnimation(google.maps.Animation.BOUNCE)
                    }
                    if (sighting.mouseleavetimeout) {
                        clearTimeout(sighting.mouseleavetimeout);
                    }
                })
            },
            "mouseleave": function() {
                var that = this;
                var now = new Date().getTime();
                this.model.get("sightings").each(function(sighting) {
                    if (sighting.marker) {
                        var bounce_diff = (now - that.mouseentertime) % 700;
                        sighting.marker.setZIndex(1);
                        sighting.mouseleavetimeout = setTimeout(function() {
                            if (sighting.marker) {
                                sighting.marker.setAnimation(null)
                            }
                        }, 700 - bounce_diff)
                    }
                })
            },
            "click": function() { 
                this.toggleBirdInfo()
            },
            "click .js-remove-bird": function(e) {
                messenger.dispatch("remove:filter", this.model.get("bandnumber"));
                this.model.birdlist_collection.remove(this.model.cid);
                var that = this;
                this.model.get("sightings").each(function(sighting) {
                    sighting.allsightings.remove(sighting);
                    sighting.marker = void 0
                    if (sighting.marker) {
                        sighting.marker.setMap(null);
                    }
                })
                this.$el.addClass("genie-hide")
                setTimeout(function() {
                    that.remove();
                }, 200)
                e.stopPropagation();
            },
            "click .info-tooltip": function(e) {
                e.stopPropagation();
            }
        }
    });

    var Location = Backbone.Model.extend({
        idAttribute: 'val'
    });

    var SingleLocation = SingleBird.extend({
        template: "<%= val %> (<span class='num-sightings'><%= numsightings %></span>) <i class='js-remove-loc icon-close'></i>",
        initialize: function() {
            SingleBird.prototype.initialize.apply(this, arguments);
            this.events = _.extend(this.events, { 
                "click .js-remove-loc": function(){
                    messenger.dispatch("remove:filter", this.model.get("val"));
                    this.model.collection.remove(this.model.cid);
                },
                "click": function() {
                    console.log(this.model)
                }
            })
            this.delegateEvents();
        }
    });

    var BirdList = Backbone.View.extend({
        el: "#active-bird-list",
        initialize: function() {
            var that = this;
            this.listenTo(this.collection, {
                "add": this.addBird
            })
        },
        addBird: function(bird) {
            if (bird instanceof Bird){
                this.$el.append(new SingleBird({model: bird}).render().el)
            }
            else {
                this.$el.append(new SingleLocation({model: bird}).render().el)   
            }
            return this;
        },
        render: function() {
            var that = this;
            this.collection.each(function(bird){ 
                that.addBird(bird)
            })
        }
    })

    var birds = new Birds()
    var sightings = new Sightings()
    var ActiveBirdList = new BirdList({collection: new Birds()});
    ActiveBirdList.listenTo(messenger, "add:sightings", function(sightings, bird, opts) {
        opts = _.extend({}, opts);
        sightings.each(function(sighting) {
            var bird = sighting.bird;
            if (bird) {
                bird.birdlist_collection = ActiveBirdList.collection
                ActiveBirdList.collection.add(bird, opts);    
            }
            
        })
    });
    ActiveBirdList.listenTo(messenger, "show:location", function(location, sightings) {
        location = new Location({val: location});
        location.set("numsightings", sightings.length);
        location.set("sightings", sightings);
        this.collection.add(location, {from_route: true, location: true});
        messenger.dispatch("show:markers", sightings, location);
    })
    function initialize() {
        sightings.fetch({
            parse: true,
            cache: false,
            sort: false
        }).success(function() {
            messenger.dispatch("loaded:sightings", birds)
        }).fail(function() {
            console.log(arguments)
        })
    }

    function getKey(done) {
        done = done || function(){};
        $.ajax({
            url: "obfuscation.txt",
            type: "GET",
            cache: false,
            success: function(datum) {
                Sightings.prototype.url = datum;
                messenger.dispatch("loaded:datum");
                done();
            }
        });
    }

    return {
        getKey: function(done) {
            getKey(done);
        },
        getBirds: function() {
            return birds;
        },
        getSightings: function() {
            return sightings;
        },
        initialize: function() {
            return initialize();
        },
        getActiveBirds: function() {
            return ActiveBirdList.collection;
        },
        getByLocation: function() {
            return by_location;
        }
    }
})

