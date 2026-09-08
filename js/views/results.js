window.TCVS = window.TCVS || {};
TCVS.views = TCVS.views || {};

(function () {
  var STATUS_LABEL = {
    compliant: "Compliant",
    non_compliant: "Non-Compliant",
    needs_review: "Needs Review"
  };

  function escapeHtml(value) {
    return String(value)
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;");
  }

  function badge(status) {
    var label =
      STATUS_LABEL[status] ||
      status ||
      "Unknown";

    return (
      '<span class="status-badge status-' +
      (status || "unknown") +
      '">' +
      label +
      "</span>"
    );
  }

  function filteredRequirements(result) {
    var requirements =
      result.requirements || [];

    var filter =
      TCVS.state.filter || "all";

    var search =
      TCVS.state.search || "";

    return requirements.filter(function (item) {
      if (
        filter !== "all" &&
        item.status !== filter
      ) {
        return false;
      }

      if (
        search &&
        !(item.title || "")
          .toLowerCase()
          .includes(search.toLowerCase())
      ) {
        return false;
      }

      return true;
    });
  }

  function findingFor(requirement) {
    return (
      requirement.reason ||
      "No additional explanation provided."
    );
  }

  TCVS.views.results = {
    show: function () {
      var result = TCVS.state.result;

      if (!result) {
        console.error(
          "No result found in application state."
        );
        return;
      }

      var overall =
        result.overall || {};

      var scoreElement =
        document.getElementById("score-value");

      var statusElement =
        document.getElementById("overall-status");

      var summaryElement =
        document.getElementById("overall-summary");

      if (scoreElement) {
        scoreElement.textContent =
          overall.score || "0%";
      }

      if (statusElement) {
        statusElement.innerHTML =
          badge(
            overall.status || "unknown"
          );
      }

      if (summaryElement) {
        summaryElement.textContent =
          overall.summary ||
          "Compliance analysis completed.";
      }

      renderTable(result);
      renderMissing(result);
      renderRisks(result);
      renderTraceability(result);

      console.log(
        "Results loaded:",
        result
      );

      console.log(
        "Overall status:",
        overall.status
      );

      console.log(
        "Overall score:",
        overall.score
      );

      console.log(
        "Requirements:",
        (result.requirements || []).length
      );

      console.log(
        "Missing documents:",
        result.missing_documents || []
      );

      console.log(
        "Risks:",
        result.risks || []
      );
    },

    bind: function () {
      var self = this;

      document
        .querySelectorAll(".filter-chip")
        .forEach(function (button) {
          button.addEventListener(
            "click",
            function () {
              document
                .querySelectorAll(".filter-chip")
                .forEach(function (item) {
                  item.classList.remove(
                    "active"
                  );
                });

              button.classList.add("active");

              TCVS.state.filter =
                button.getAttribute(
                  "data-filter"
                ) || "all";

              self.show();
            }
          );
        });

      var search =
        document.getElementById("req-search");

      if (search) {
        search.addEventListener(
          "input",
          function () {
            TCVS.state.search =
              search.value;

            self.show();
          }
        );
      }
    }
  };

  function renderTable(result) {
    var body =
      document.getElementById(
        "req-table-body"
      );

    var cards =
      document.getElementById(
        "req-cards"
      );

    if (!body) {
      console.warn(
        "Requirement table body not found."
      );
      return;
    }

    var requirements =
      filteredRequirements(result);

    body.innerHTML = "";

    if (cards) {
      cards.innerHTML = "";
    }

    if (!requirements.length) {
      body.innerHTML =
        '<tr><td colspan="5">' +
        "No matching requirements found." +
        "</td></tr>";

      return;
    }

    requirements.forEach(function (item, index) {
      var row =
        document.createElement("tr");

      var evidence =
        item.evidence || [];

      var evidenceText =
        evidence.length
          ? evidence
              .map(function (ev) {
                return (
                  (ev.document_name ||
                    "Document") +
                  " — Page " +
                  (ev.page || 1)
                );
              })
              .join("<br>")
          : "No evidence available.";

      row.innerHTML =
        "<td>REQ-" +
        String(index + 1).padStart(3, "0") +
        "</td>" +

        "<td><strong>" +
        escapeHtml(
          item.title || "Requirement"
        ) +
        "</strong></td>" +

        "<td>" +
        badge(item.status) +
        "</td>" +

        "<td>" +
        escapeHtml(
          findingFor(item)
        ) +
        "</td>" +

        "<td>" +
        evidenceText +
        "</td>";

      body.appendChild(row);
    });

    if (cards) {
      requirements.forEach(function (item) {
        var card =
          document.createElement("div");

        card.className =
          "card req-card";

        card.innerHTML =
          "<strong>" +
          escapeHtml(
            item.title || "Requirement"
          ) +
          "</strong>" +

          "<p>" +
          badge(item.status) +
          "</p>" +

          "<p>" +
          escapeHtml(
            findingFor(item)
          ) +
          "</p>";

        cards.appendChild(card);
      });
    }
  }

  function renderMissing(result) {
    var container =
      document.getElementById(
        "missing-docs"
      );

    if (!container) {
      return;
    }

    var missing =
      result.missing_documents || [];

    if (!missing.length) {
      container.innerHTML =
        "<h2>Missing documents</h2>" +
        '<p class="muted-note">' +
        "No missing-document alerts." +
        "</p>";

      return;
    }

    container.innerHTML =
      "<h2>Missing documents</h2>" +
      '<p class="muted-note">' +
      "The following requirements need attention:" +
      "</p>" +

      missing
        .map(function (item) {
          return (
            '<div style="margin-top:0.6rem">' +
            "⚠️ " +
            escapeHtml(item) +
            "</div>"
          );
        })
        .join("");
  }

  function renderRisks(result) {
    var container =
      document.getElementById(
        "risk-summary"
      );

    if (!container) {
      return;
    }

    var risks =
      result.risks || [];

    if (!risks.length) {
      container.innerHTML =
        "<h2>Risk summary</h2>" +
        '<p class="muted-note">' +
        "No risk alerts returned by the backend." +
        "</p>";

      return;
    }

    container.innerHTML =
      "<h2>Risk summary</h2>" +
      '<p class="muted-note">' +
      "Potential compliance risks identified:" +
      "</p>" +

      risks
        .map(function (risk) {
          if (typeof risk === "string") {
            return (
              '<div style="margin-top:0.8rem">' +
              "⚠️ " +
              escapeHtml(risk) +
              "</div>"
            );
          }

          var level =
            risk.risk_level ||
            "UNKNOWN";

          var requirement =
            risk.requirement ||
            "Requirement";

          var reason =
            risk.reason ||
            "No risk explanation provided.";

          return (
            '<div style="margin-top:0.9rem">' +

            "<strong>" +
            "⚠️ " +
            escapeHtml(level) +
            "</strong>" +

            "<p>" +
            "<strong>Requirement:</strong> " +
            escapeHtml(requirement) +
            "</p>" +

            '<p class="muted-note">' +
            escapeHtml(reason) +
            "</p>" +

            "</div>"
          );
        })
        .join("");
  }

  function renderTraceability(result) {
    var container =
      document.getElementById(
        "traceability-panel"
      );

    if (!container) {
      return;
    }

    var requirements =
      filteredRequirements(result);

    var html =
      "<h2>Evidence traceability</h2>" +
      '<p class="muted-note">' +
      "Requirement → Finding → Status → Reason → Evidence → Document/Page." +
      "</p>";

    if (!requirements.length) {
      html +=
        '<p class="muted-note">' +
        "No evidence available." +
        "</p>";

      container.innerHTML = html;

      return;
    }

    requirements.forEach(function (item) {
      var evidence =
        item.evidence || [];

      html +=
        '<div style="margin-top:1rem">' +

        "<strong>" +
        escapeHtml(
          item.title || "Requirement"
        ) +
        "</strong>" +

        "<p>" +
        badge(item.status) +
        "</p>" +

        '<p class="muted-note">' +
        escapeHtml(
          findingFor(item)
        ) +
        "</p>";

      if (evidence.length) {
        evidence.forEach(function (ev) {
          html +=
            "<p>" +
            escapeHtml(
              ev.document_name ||
              "Document"
            ) +
            " — Page " +
            (ev.page || 1) +
            "</p>";
        });
      } else {
        html +=
          '<p class="muted-note">' +
          "No evidence available." +
          "</p>";
      }

      html += "</div>";
    });

    container.innerHTML = html;
  }
})();