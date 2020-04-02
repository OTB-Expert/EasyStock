var Ajuro = Ajuro || {};

Ajuro.Utils = {
};

$(function() {
    $progressBars = $(".progress-bar");
    for (let i = 0; i < $progressBars.length; i++) {
        let $el = $($progressBars[i]);
        $el.css("width", $el.data("fill") + "%");
    }
});
