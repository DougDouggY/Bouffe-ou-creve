// Portrait and landscape are equally supported. Starting a game never locks orientation
// or requests fullscreen; fullscreen remains an explicit choice in Options.
const panel = document.querySelector("#phone-rotate");
if (panel) panel.hidden = true;
document.body.classList.remove("phone-awaiting-landscape");
