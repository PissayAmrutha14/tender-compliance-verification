window.TCVS = window.TCVS || {};

TCVS.toast = function (message) {
  var el = document.getElementById("toast");
  el.textContent = message;
  el.hidden = false;
  clearTimeout(TCVS._toastTimer);
  TCVS._toastTimer = setTimeout(function () {
    el.hidden = true;
  }, 4200);
};

TCVS.navigate = function (view) {
  var hashMap = {
    home: "#/",
    upload: "#/upload",
    processing: "#/processing",
    results: "#/results",
  };
  if (location.hash !== hashMap[view]) {
    location.hash = hashMap[view];
    return;
  }
  TCVS.showView(view);
};

TCVS.viewFromHash = function () {
  var hash = (location.hash || "#/").replace(/^#/, "");
  if (hash === "/upload") {
    return "upload";
  }
  if (hash === "/processing") {
    return "processing";
  }
  if (hash === "/results") {
    return "results";
  }
  return "home";
};

TCVS.showView = function (view) {
  TCVS.state.view = view;
  document.querySelectorAll(".view").forEach(function (el) {
    el.hidden = el.getAttribute("data-view") !== view;
  });
  if (TCVS.views[view] && TCVS.views[view].show) {
    TCVS.views[view].show();
  }
};

TCVS.applyDemoBanner = function () {
  var banner = document.getElementById("demo-banner");
  banner.hidden = !TCVS.config.USE_MOCK;
  banner.textContent = TCVS.config.DEMO_BANNER;
};

document.addEventListener("DOMContentLoaded", function () {
  TCVS.applyDemoBanner();
  TCVS.views.upload.bind();
  TCVS.views.results.bind();
  function startNewScreening() {
    TCVS.resetRun();
    TCVS.views.upload.render();
    TCVS.navigate("upload");
  }

  document.getElementById("new-screening-btn").addEventListener("click", startNewScreening);
  document.querySelectorAll('a[href="#/upload"]').forEach(function (link) {
    if (link.classList.contains("btn-secondary")) {
      link.addEventListener("click", function (event) {
        event.preventDefault();
        startNewScreening();
      });
    }
  });
  window.addEventListener("hashchange", function () {
    TCVS.showView(TCVS.viewFromHash());
  });
  TCVS.showView(TCVS.viewFromHash());
});
