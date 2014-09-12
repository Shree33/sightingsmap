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

    // Bird has many sightings
    var Bird = Backbone.Model.extend({
        defaults: function() {
            return {
                sightings: new Sightings
            }
        },
        addSighting: function(sighting) {
            this.get("sightings").add(sighting);
            return this;
        }
    })
    var Birds = Backbone.Collection.extend({
        model: Bird
    })

    var Sighting = Backbone.Model.extend({
        idAttribute: 'bandnumber',
        initialize: function(){
            var bird = birds._byId[this.get("bird_id")]
            if (_.isUndefined(bird)) {
                bird = new Bird({
                    bandnumber: this.get("bandnumber"),
                    bandstring: this.getBandString()
                })
                bird.id = this.get("bird_id");
                birds.add(bird)
                this.bird = bird;
            }
            bird.addSighting(this);
        },
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
            var bandnum = sanitized["gsx$bandnumber"]
            var date = moment(sanitized["gsx$sightingdate"])
            sanitized = _.invert(sanitized)
            // Strip gsx prefixes
            _.each(sanitized, function(val, key) {
                sanitized[key] = val.replace(p, "");
            })
            return _.extend(parseNums(_.invert(sanitized)), {sightingdate: date, bird_id: bandnum})
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

    var SingleBird = Backbone.View.extend({
        tagName: "li",
        template: $("#single-bird-listitem").html(),
        initialize: function() {
            var that = this;
            this.listenTo(this.model, "remove destroy", function() {
                this.$el.addClass("genie-hide")
                setTimeout(function() {
                    that.remove();
                }, 200)
            })
        },
        render: function() {
            this.$el.html(_.template(this.template, this.model.toJSON()))
            return this;
        },
        events: {
            "mouseenter": function() {
                console.log("enter")
            },
            "mouseleave": function() {
                console.log("exit")
            },
            "click .js-remove-bird": function() {
                this.model.collection.remove(this.model.cid)
            }
        }
    })

    var BirdList = Backbone.View.extend({
        el: "#active-bird-list",
        initialize: function() {
            var that = this;
            this.listenTo(messenger, "show:sightings", function(sightings) {
                sightings.each(function(sighting) {
                    var bird = sighting.bird;
                    that.collection.add(bird);

                })
            })
            this.listenTo(this.collection, {
                "add": this.addBird
            })
        },
        addBird: function(bird) {
            this.$el.append(new SingleBird({model: bird}).render().el)
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
    new BirdList({collection: new Birds()});
    sightings.fetch({
        parse: true
    }).success(function() {
        messenger.dispatch("loaded:sightings", sightings.models)
        console.log(sightings.at(0));
    }).fail(function() {
        console.log(arguments)
    })

    return {
        getBirds: function() {
            return birds;
        },
        getSightings: function() {
            return sightings;
        }
    }
})