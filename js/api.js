window.TCVS = window.TCVS || {};

(function () {
  var jobs = {};

  function sleep(ms) {
    return new Promise(function (resolve) {
      setTimeout(resolve, ms);
    });
  }

  function detailsFromState() {
    return {
      company_name:
        TCVS.state.bidderDetails.company_name || "",

      registration_cin:
        TCVS.state.bidderDetails.registration_cin || "",

      tax_gstin:
        TCVS.state.bidderDetails.tax_gstin || "",

      entity_type:
        TCVS.state.bidderDetails.entity_type || "",
    };
  }

  TCVS.buildFormData = function () {
    var fd = new FormData();

    if (TCVS.state.tenderFile) {
      fd.append(
        "tender",
        TCVS.state.tenderFile
      );
    }

    TCVS.state.bidderFiles.forEach(
      function (file) {
        fd.append(
          "bidders",
          file
        );
      }
    );

    fd.append(
      "bidder_details",
      JSON.stringify(
        detailsFromState()
      )
    );

    return fd;
  };

  TCVS.api = {
    screenDocuments: async function () {
      var res = await fetch(
        TCVS.config.API_BASE_URL +
          "/upload-tender-and-bidders",
        {
          method: "POST",
          body: TCVS.buildFormData(),
        }
      );

      if (!res.ok) {
        throw new Error(
          "Could not analyze documents (" +
            res.status +
            ")"
        );
      }

      return res.json();
    },

    createJob: async function () {
      if (TCVS.config.USE_MOCK) {
        var jobId = "demo-001";

        jobs[jobId] = {
          status: "queued",
          progress: 0,
          stage:
            TCVS.config.STAGES[0],
          result: null,
          error: null,
        };

        return {
          job_id: jobId,
          status: "queued",
        };
      }

      var res = await fetch(
        TCVS.config.API_BASE_URL +
          "/api/jobs",
        {
          method: "POST",
          body: TCVS.buildFormData(),
        }
      );

      if (!res.ok) {
        throw new Error(
          "Could not create screening job (" +
            res.status +
            ")"
        );
      }

      return res.json();
    },

    getJob: async function (jobId) {
      if (TCVS.config.USE_MOCK) {
        return (
          jobs[jobId] || {
            status: "failed",
            error: "Unknown job",
          }
        );
      }

      var res = await fetch(
        TCVS.config.API_BASE_URL +
          "/api/jobs/" +
          encodeURIComponent(
            jobId
          )
      );

      if (!res.ok) {
        throw new Error(
          "Could not load job status (" +
            res.status +
            ")"
        );
      }

      return res.json();
    },

    simulateMockJob: async function (
      jobId,
      onTick
    ) {
      var stages =
        TCVS.config.STAGES;

      var i;

      for (
        i = 0;
        i < stages.length;
        i += 1
      ) {
        jobs[jobId] = {
          status: "processing",

          progress: Math.round(
            ((i + 1) /
              stages.length) *
              100
          ),

          stage: stages[i],

          result: null,

          error: null,
        };

        if (onTick) {
          onTick(
            jobs[jobId],
            i
          );
        }

        await sleep(900);
      }

      jobs[jobId] = {
        status: "completed",

        progress: 100,

        stage:
          stages[
            stages.length - 1
          ],

        result:
          TCVS.mockResult,

        error: null,
      };

      return jobs[jobId];
    },

    downloadReport: async function (
      jobId
    ) {
      if (TCVS.config.USE_MOCK) {
        return null;
      }

      var res = await fetch(
        TCVS.config.API_BASE_URL +
          "/api/jobs/" +
          encodeURIComponent(
            jobId
          ) +
          "/report"
      );

      if (!res.ok) {
        throw new Error(
          "Could not download report (" +
            res.status +
            ")"
        );
      }

      return res.blob();
    },
  };

  TCVS.normalizeBackendResult =
    function (
      compliance,
      bidder
    ) {
      return {
        overall: {
          score:
            compliance.compliance_percentage +
            "%",

          status:
            compliance.overall_status ===
            "COMPLIANT"
              ? "compliant"
              : compliance.overall_status ===
                "PARTIALLY COMPLIANT"
              ? "needs_review"
              : "non_compliant",

          summary:
            "Compliance score: " +
            compliance.compliance_score +
            " requirements.",
        },

        requirements:
          compliance.checks.map(
            function (
              check,
              index
            ) {
              return {
                id:
                  "REQ-" +
                  String(
                    index + 1
                  ).padStart(
                    3,
                    "0"
                  ),

                title:
                  check.requirement,

                status:
                  check.status ===
                  "COMPLIANT"
                    ? "compliant"
                    : "non_compliant",

                reason:
                  check.reason,

                evidence:
                  check.evidence
                    ? [
                        {
                          quote:
                            check.evidence,

                          document_name:
                            bidder.filename,

                          page:
                            check.evidence_page ||
                            1,
                        },
                      ]
                    : [],
              };
            }
          ),

        missing_documents:
          compliance.missing_documents ||
          [],

        risks:
          compliance.risks ||
          [],
      };
    };
})();