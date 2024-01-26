"use strict";

function initMap() {
    const componentForm = [
        'location',
        'locality',
        'administrative_area_level_1',
        'country',
        'postal_code',
    ];
    const map = new google.maps.Map(document.getElementById("map"), {
        zoom: 15,
        center: {
            lat: 2.9279,
            lng: 101.6416
        },
        mapTypeControl: false,
        fullscreenControl: true,
        zoomControl: true,
        streetViewControl: true
    });
    const marker = new google.maps.Marker({
        map: map,
        draggable: false
    });
    const autocompleteInput = document.getElementById('location');
    const autocomplete = new google.maps.places.Autocomplete(autocompleteInput, {
        fields: ["address_components", "geometry", "name"],
        types: ["address"],
    });
    autocomplete.addListener('place_changed', function() {
        marker.setVisible(false);
        const place = autocomplete.getPlace();
        if (!place.geometry) {
            // User entered the name of a Place that was not suggested and
            // pressed the Enter key, or the Place Details request failed.
            window.alert('No details available for input: \'' + place.name + '\'');
            document.getElementById('confirm-button').disabled = true;
            document.getElementById('tick').style.visibility = "hidden";
            return;
        }
        renderAddress(place);
        fillInAddress(place);
        document.getElementById('confirm-button').disabled = false;
        document.getElementById('tick').style.visibility = "visible";
        document.getElementById("lat").value = place.geometry.location.lat();
        document.getElementById("long").value = place.geometry.location.lng();
    });

    function fillInAddress(place) { // optional parameter
        const addressNameFormat = {
            'street_number': 'short_name',
            'route': 'long_name',
            'locality': 'long_name',
            'administrative_area_level_1': 'short_name',
            'country': 'long_name',
            'postal_code': 'short_name',
        };
        const getAddressComp = function(type) {
            for (const component of place.address_components) {
                if (component.types[0] === type) {
                    return component[addressNameFormat[type]];
                }
            }
            return '';
        };
        document.getElementById('location').value = getAddressComp('street_number') + ' ' +
            getAddressComp('route');
        for (const component of componentForm) {
            // Location field is handled separately above as it has different logic.
            if (component !== 'location') {
                document.getElementById(component).value = getAddressComp(component);
            }
        }
        console.log(place); //test
        console.log(place.geometry.location.lat()); //test
        console.log(place.geometry.location.lng()); //test
        console.log(place.address_components); //test
    }

    function renderAddress(place) {
        map.setCenter(place.geometry.location);
        marker.setPosition(place.geometry.location);
        marker.setVisible(true);
    }
}

/*
    Copyright 2021 Google LLC

    Licensed under the Apache License, Version 2.0 (the "License");
    you may not use this file except in compliance with the License.
    You may obtain a copy of the License at

        https://www.apache.org/licenses/LICENSE-2.0

    Unless required by applicable law or agreed to in writing, software
    distributed under the License is distributed on an "AS IS" BASIS,
    WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
    See the License for the specific language governing permissions and
    limitations under the License.
*/