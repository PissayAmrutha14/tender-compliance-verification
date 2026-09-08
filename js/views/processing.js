window.TCVS = window.TCVS || {};
TCVS.views = TCVS.views || {};

TCVS.views.processing = {
  running: false,

  show: async function () {
    if (this.running) {
      return;
    }

    if (!TCVS.canVerify()) {
      TCVS.toast(
        "Attach a tender PDF and at least one bidder PDF first."
      );
      TCVS.navigate("upload");
      return;
    }

    this.running = true;
    this.drawStepper(-1, 0);

    try {
      console.log("PROCESSING: sending documents to backend...");

      var apiData = await TCVS.api.screenDocuments();

      console.log("PROCESSING: backend response received:", apiData);

      var bidder =
        apiData.bidders &&
        apiData.bidders.length
          ? apiData.bidders[0]
          : null;

      if (!bidder || !bidder.compliance) {
        throw new Error(
          "No compliance result was returned by the backend."
        );
      }

      console.log(
        "PROCESSING: compliance received:",
        bidder.compliance
      );

      TCVS.state.result =
        TCVS.normalizeBackendResult(
          bidder.compliance,
          bidder
        );

      console.log(
        "PROCESSING: result stored:",
        TCVS.state.result
      );

      TCVS.state.job = {
        status: "completed",
        progress: 100,
        result: TCVS.state.result
      };

      console.log(
        "PROCESSING: navigating to results..."
      );

      TCVS.navigate("results");

    } catch (err) {
      console.error(
        "PROCESSING ERROR:",
        err
      );

      TCVS.toast(
        err.message ||
        "Could not analyze the documents."
      );

      TCVS.navigate("upload");

    } finally {
      this.running = false;
    }
  },

  pollUntilDone: async function (jobId) {
    var job;
    var guard = 0;

    while (guard < 120) {
      job = await TCVS.api.getJob(jobId);

      var index =
        TCVS.config.STAGES.indexOf(
          job.stage
        );

      this.drawStepper(
        index,
        job.progress || 0
      );

      if (
        job.status === "completed" ||
        job.status === "failed"
      ) {
        return job;
      }

      await new Promise(function (resolve) {
        setTimeout(resolve, 1000);
      });

      guard += 1;
    }

    return {
      status: "failed",
      error: "Timed out waiting for the backend."
    };
  },

  drawStepper: function (
    activeIndex,
    progress
  ) {
    var root =
      document.getElementById(
        "pipeline-stepper"
      );

    var fill =
      document.getElementById(
        "progress-fill"
      );

    var label =
      document.getElementById(
        "progress-label"
      );

    if (fill) {
      fill.style.width =
        Math.max(
          0,
          Math.min(
            100,
            progress || 0
          )
        ) + "%";
    }

    if (label) {
      label.textContent =
        activeIndex >= 0
          ? "Current processing stage: " +
            TCVS.config.STAGES[
              activeIndex
            ]
          : "Analyzing uploaded documents...";
    }

    if (!root) {
      return;
    }

    root.innerHTML = "";

    TCVS.config.STAGES.forEach(
      function (name, index) {
        var row =
          document.createElement(
            "div"
          );

        var state =
          index < activeIndex
            ? "done"
            : index === activeIndex
            ? "active"
            : "";

        row.className =
          "step " + state;

        row.innerHTML =
          '<span class="step-dot">' +
          (index + 1) +
          "</span><strong>" +
          name +
          "</strong><span>" +
          (
            index < activeIndex
              ? "Done"
              : index === activeIndex
              ? "Running"
              : "Waiting"
          ) +
          "</span>";

        root.appendChild(row);
      }
    );
  }
};