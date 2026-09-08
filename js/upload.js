window.TCVS = window.TCVS || {};

TCVS.escapeHtml = function (value) {
  return String(value)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
};

TCVS.formatBytes = function (bytes) {
  if (bytes < 1024) {
    return bytes + " B";
  }

  if (bytes < 1024 * 1024) {
    return (bytes / 1024).toFixed(1) + " KB";
  }

  return (bytes / (1024 * 1024)).toFixed(1) + " MB";
};

TCVS.validatePdf = function (file) {
  var name = (file.name || "").toLowerCase();

  var typeOk =
    file.type === "application/pdf" ||
    name.endsWith(".pdf");

  if (!typeOk) {
    return "Only PDF files are accepted.";
  }

  if (file.size > TCVS.config.MAX_FILE_BYTES) {
    return file.name + " exceeds the 25 MB limit.";
  }

  return null;
};

TCVS.canVerify = function () {
  return Boolean(
    TCVS.state.tenderFile &&
    TCVS.state.bidderFiles.length
  );
};