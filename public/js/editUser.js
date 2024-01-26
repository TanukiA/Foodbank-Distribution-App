window.onload = function() {

    document.getElementById('searchMapButton').onclick = function() {
        document.querySelector('.blur-background').style.display = 'flex';
    }

    document.querySelector('.close').addEventListener('click', function() {
        document.querySelector('.blur-background').style.display = 'none';
    })

    document.getElementById("confirm-button").addEventListener("click", doAction);

    function doAction() {
        var fullAddress = document.getElementById('location').value + ", " + document.getElementById('locality').value + ", " + document.getElementById('administrative_area_level_1').value + ", " + document.getElementById('postal_code').value + ", " + document.getElementById('country').value + ".";
        console.log("In edit js full address is " + fullAddress);
        document.getElementById('newAddress').value = fullAddress.trim();
        document.getElementById('newLat').value = document.getElementById('lat').value;
        document.getElementById('newLong').value = document.getElementById('long').value;
        document.getElementById('address').value = "Address Updated";
        document.querySelector('.blur-background').style.display = 'none';
    }
}