"use strict";

var coordinates = [];
var nameArray = [];
var markers = [];

function initMap() {
    var centerLocation = { lat: 2.92459, lng: 101.65626 }

    var map = new google.maps.Map(document.getElementById("map"), {
        zoom: 14,
        center: centerLocation
    });

    var elements = document.getElementsByClassName("coordinate");
    for (const element of elements) {
        var temp = element.textContent.trim().substring(6).slice(0, -1).split(" ");
        coordinates.push(temp);
    }

    var addressBox = document.getElementsByClassName("address-box");
    for (let i = 0; i < addressBox.length; i++) {
        addressBox[i].setAttribute("id", "address_" + i);
    }

    var names = document.getElementsByClassName("fb-name");
    for (const name of names) {
        nameArray.push(name.textContent);
    }

    if (coordinates.length > 0) {
        for (let i = 0; i < coordinates.length; i++) {
            let markerOption = {
                position: new google.maps.LatLng(parseFloat(coordinates[i][0]), parseFloat(coordinates[i][1])),
                title: nameArray[i],
                animation: google.maps.Animation.DROP
            }
            var marker = new google.maps.Marker(markerOption);
            marker.set("id", i);
            marker.setMap(map);
            marker.addListener('click', (googleMapsEvent) => {
                var elem = document.getElementById("address_" + i);
                elem.scrollIntoView({ behavior: 'smooth', block: 'center' });
            })
            markers.push(marker);
            console.log(Number(coordinates[i][0]), Number(coordinates[i][1])); //test
        }

        for (let j = 0; j < coordinates.length; j++) {
            document.getElementById("address_" + j).addEventListener('click', function() {
                var toMarker = document.getElementById("map");
                toMarker.scrollIntoView({ behavior: 'smooth', block: 'center' });

                for (const iterator of markers) {
                    if (iterator.id === j) {
                        map.panTo(iterator.getPosition());
                        map.setZoom(17);
                    }
                }

                console.log("added");
            })
        }
    }



}