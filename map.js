define(["messenger"], function(messenger) {
    function Map(el) {
        this.map = new google.maps.Map(el, {
            center: {lat: 20.7, lng: -156.9601584},
            zoom: 8
        });    

        var that = this;
        this.active_markers = [];

        messenger.when("show:sightings", function(sightings) {
            sightings.each(function(sighting) {
                var marker = new google.maps.Marker({
                    position: new google.maps.LatLng(sighting.get("lat"), sighting.get("lng")),
                    title: "Hello",
                    animation: google.maps.Animation.DROP
                })
                marker.setMap(that.map);
                sighting.marker = marker;
                that.active_markers.push(marker);
            });
        })
    }
    
    return Map
})