function startTime() {
    var today = new Date();
    var h = today.getHours();
    var m = today.getMinutes();
    var s = today.getSeconds();
    h = checkTime(h);
    h = fun(h);
    m = checkTime(m);
    s = checkTime(s);
    var am_pm = today.getHours() >= 12 ? "PM" : "AM";
    document.getElementById("clock").innerHTML =
        h + ":" + m + ":" + s + " " + am_pm;
    var t = setTimeout(startTime, 500);
}
// add zero in front of numbers < 10
function checkTime(i) {
    if (i < 10) {
        i = "0" + i;
    }
    return i;
}
function fun(h) {
    if (h > 12) {
        h = h - 12;
    }
    return h;
}