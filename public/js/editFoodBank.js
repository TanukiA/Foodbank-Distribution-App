function wcqib_refresh_quantity_increments() {
    jQuery("div.quantity:not(.buttons_added), td.quantity:not(.buttons_added)").each(function(a, b) {
        var c = jQuery(b);
        c.addClass("buttons_added"), c.children().first().before('<input type="button" value="-" class="minus" />'), c.children().last().after('<input type="button" value="+" class="plus" />')
    })
}
String.prototype.getDecimals || (String.prototype.getDecimals = function() {
    var a = this,
        b = ("" + a).match(/(?:\.(\d+))?(?:[eE]([+-]?\d+))?$/);
    return b ? Math.max(0, (b[1] ? b[1].length : 0) - (b[2] ? +b[2] : 0)) : 0
}), jQuery(document).ready(function() {
    wcqib_refresh_quantity_increments()
}), jQuery(document).on("updated_wc_div", function() {
    wcqib_refresh_quantity_increments()
}), jQuery(document).on("click", ".plus, .minus", function() {
    var a = jQuery(this).closest(".quantity").find(".qty"),
        b = parseFloat(a.val()),
        c = parseFloat(a.attr("max")),
        d = parseFloat(a.attr("min")),
        e = a.attr("step");
    b && "" !== b && "NaN" !== b || (b = 0), "" !== c && "NaN" !== c || (c = ""), "" !== d && "NaN" !== d || (d = 0), "any" !== e && "" !== e && void 0 !== e && "NaN" !== parseFloat(e) || (e = 1), jQuery(this).is(".plus") ? c && b >= c ? a.val(c) : a.val((b + parseFloat(e)).toFixed(e.getDecimals())) : d && b <= d ? a.val(d) : b > 0 && a.val((b - parseFloat(e)).toFixed(e.getDecimals())), a.trigger("change")
});


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