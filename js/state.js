window.TCVS = window.TCVS || {};

TCVS.state = {
  view: "home",
  tenderFile: null,
  bidderFiles: [],
  bidderDetails: {
    company_name: "",
    registration_cin: "",
    tax_gstin: "",
    entity_type: "",
  },
  jobId: null,
  job: null,
  result: null,
  selectedRequirementId: null,
  filter: "all",
  search: "",
  processingIndex: 0,
};

TCVS.resetRun = function () {
  TCVS.state.tenderFile = null;
  TCVS.state.bidderFiles = [];
  TCVS.state.bidderDetails = {
    company_name: "",
    registration_cin: "",
    tax_gstin: "",
    entity_type: "",
  };
  TCVS.state.jobId = null;
  TCVS.state.job = null;
  TCVS.state.result = null;
  TCVS.state.selectedRequirementId = null;
  TCVS.state.filter = "all";
  TCVS.state.search = "";
  TCVS.state.processingIndex = 0;
};
