window.TCVS = window.TCVS || {};
TCVS.views = TCVS.views || {};

TCVS.views.upload = {
  bind: function () {
    this.setupDropzone(
      "tender-drop",
      "tender-input",
      "tender"
    );

    this.setupDropzone(
      "bidder-drop",
      "bidder-input",
      "bidders"
    );

    var form = document.getElementById(
      "bidder-details-form"
    );

    if (form) {
      form.addEventListener("input", function () {
        TCVS.state.bidderDetails = {
          company_name:
            document
              .getElementById("company-name")
              .value.trim(),

          registration_cin:
            document
              .getElementById("registration-cin")
              .value.trim(),

          tax_gstin:
            document
              .getElementById("tax-gstin")
              .value.trim(),

          entity_type:
            document.getElementById("entity-type").value
        };
      });
    }

    var verifyButton =
      document.getElementById("verify-btn");

    if (verifyButton) {
      verifyButton.addEventListener(
        "click",
        function () {
          if (!TCVS.canVerify()) {
            TCVS.toast(
              "Attach a tender PDF and at least one bidder PDF."
            );
            return;
          }

          TCVS.navigate("processing");
        }
      );
    }
  },

  setupDropzone: function (
    zoneId,
    inputId,
    kind
  ) {
    var zone =
      document.getElementById(zoneId);

    var input =
      document.getElementById(inputId);

    var self = this;

    if (!zone || !input) {
      console.error(
        "Upload elements not found:",
        zoneId,
        inputId
      );
      return;
    }

    zone.addEventListener(
      "click",
      function () {
        input.click();
      }
    );

    zone.addEventListener(
      "keydown",
      function (event) {
        if (
          event.key === "Enter" ||
          event.key === " "
        ) {
          event.preventDefault();
          input.click();
        }
      }
    );

    zone.addEventListener(
      "dragover",
      function (event) {
        event.preventDefault();
        zone.classList.add("dragover");
      }
    );

    zone.addEventListener(
      "dragleave",
      function () {
        zone.classList.remove("dragover");
      }
    );

    zone.addEventListener(
      "drop",
      function (event) {
        event.preventDefault();

        zone.classList.remove(
          "dragover"
        );

        self.ingest(
          kind,
          event.dataTransfer.files
        );
      }
    );

    input.addEventListener(
      "change",
      function (event) {
        self.ingest(
          kind,
          event.target.files
        );
      }
    );
  },

  ingest: function (
    kind,
    fileList
  ) {
    var files =
      Array.prototype.slice.call(
        fileList || []
      );

    if (!files.length) {
      return;
    }

    var i;
    var err;

    for (
      i = 0;
      i < files.length;
      i += 1
    ) {
      err =
        TCVS.validatePdf(files[i]);

      if (err) {
        TCVS.toast(err);
        return;
      }
    }

    if (kind === "tender") {
      TCVS.state.tenderFile =
        files[0];
    } else {
      files.forEach(function (file) {
        var exists =
          TCVS.state.bidderFiles.some(
            function (existing) {
              return (
                existing.name ===
                  file.name &&
                existing.size ===
                  file.size
              );
            }
          );

        if (!exists) {
          TCVS.state.bidderFiles.push(
            file
          );
        }
      });
    }

    console.log(
      "Tender file:",
      TCVS.state.tenderFile
    );

    console.log(
      "Bidder files:",
      TCVS.state.bidderFiles
    );

    this.render();
  },

  removeTender: function () {
    TCVS.state.tenderFile = null;
    this.render();
  },

  removeBidder: function (index) {
    TCVS.state.bidderFiles.splice(
      index,
      1
    );

    this.render();
  },

  render: function () {
    var tenderList =
      document.getElementById(
        "tender-files"
      );

    var bidderList =
      document.getElementById(
        "bidder-files"
      );

    var summary =
      document.getElementById(
        "upload-summary"
      );

    var btn =
      document.getElementById(
        "verify-btn"
      );

    var hint =
      document.getElementById(
        "verify-hint"
      );

    var self = this;

    if (!tenderList || !bidderList) {
      return;
    }

    tenderList.innerHTML = "";

    if (TCVS.state.tenderFile) {
      tenderList.appendChild(
        this.chip(
          TCVS.state.tenderFile,
          function () {
            self.removeTender();
          }
        )
      );
    }

    bidderList.innerHTML = "";

    TCVS.state.bidderFiles.forEach(
      function (file, index) {
        bidderList.appendChild(
          self.chip(
            file,
            function () {
              self.removeBidder(
                index
              );
            }
          )
        );
      }
    );

    var companyName =
      document.getElementById(
        "company-name"
      );

    var registrationCin =
      document.getElementById(
        "registration-cin"
      );

    var taxGstin =
      document.getElementById(
        "tax-gstin"
      );

    var entityType =
      document.getElementById(
        "entity-type"
      );

    if (companyName) {
      companyName.value =
        TCVS.state.bidderDetails
          .company_name;
    }

    if (registrationCin) {
      registrationCin.value =
        TCVS.state.bidderDetails
          .registration_cin;
    }

    if (taxGstin) {
      taxGstin.value =
        TCVS.state.bidderDetails
          .tax_gstin;
    }

    if (entityType) {
      entityType.value =
        TCVS.state.bidderDetails
          .entity_type;
    }

    var ready =
      TCVS.canVerify();

    if (btn) {
      btn.disabled = !ready;
    }

    if (hint) {
      hint.textContent = ready
        ? "Ready to verify the uploaded documents."
        : "Attach a tender PDF and at least one bidder PDF to enable Verify Bid.";
    }

    if (summary) {
      summary.innerHTML =
        "<span>Tender: " +
        (
          TCVS.state.tenderFile
            ? TCVS.escapeHtml(
                TCVS.state.tenderFile.name
              )
            : "not attached"
        ) +
        "</span>" +
        "<span>Bidder files: " +
        TCVS.state.bidderFiles.length +
        "</span>";
    }
  },

  chip: function (
    file,
    onRemove
  ) {
    var li =
      document.createElement("li");

    li.className =
      "file-chip";

    li.innerHTML =
      "<span>" +
      TCVS.escapeHtml(
        file.name
      ) +
      " · " +
      TCVS.formatBytes(
        file.size
      ) +
      "</span>";

    var btn =
      document.createElement(
        "button"
      );

    btn.type = "button";
    btn.textContent = "Remove";

    btn.addEventListener(
      "click",
      function (event) {
        event.stopPropagation();
        onRemove();
      }
    );

    li.appendChild(btn);

    return li;
  },

  show: function () {
    this.render();
  }
};