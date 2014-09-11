define(["messenger"], function(messenger) {
    function Map(el) {
        this.map = new google.maps.Map(el, {
            center: {lat: 20.7, lng: -156.9601584},
            zoom: 8
        });    

        var that = this;

        messenger.when("show:sightings", function(sightings) {
            sightings.each(function(sighting) {
                var marker = new google.maps.Marker({
                    position: new google.maps.LatLng(sighting.get("lat"), sighting.get("lng")),
                    title: "Hello",
                })
                marker.setMap(that.map);
            });
        })
    }
    
    return Map
})