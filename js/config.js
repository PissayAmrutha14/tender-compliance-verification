window.TCVS = window.TCVS || {};

TCVS.config = {
  API_BASE_URL: "http://127.0.0.1:8000",
  USE_MOCK: false,
  MAX_FILE_BYTES: 25 * 1024 * 1024,
  STAGES: [
    "Extract",
    "Identify requirements",
    "Find evidence",
    "Compare",
    "Classify",
    "Explain",
    "Assess risk",
  ],
  DEMO_BANNER:
    "DEMO MODE — Results shown are sample results and are not generated from the uploaded documents.",
};
