window.TCVS = window.TCVS || {};

TCVS.mockResult = {
  job_id: "demo-001",
  overall: {
    score: 72,
    status: "needs_review",
    summary:
      "Most mandatory clauses matched; financials incomplete. Sample result for demonstration only.",
  },
  requirements: [
    {
      id: "R-001",
      title: "Tender fee / EMD instrument enclosed",
      status: "compliant",
      reason: "EMD bank guarantee reference located in the bid covering letter.",
      evidence: [
        {
          document_name: "bid-covering-letter.pdf",
          page: 2,
          quote: "EMD BG No. SBI/EMD/2026/4418 dated 12 Aug 2026 for INR 5,00,000.",
        },
      ],
    },
    {
      id: "R-004",
      title: "Power of attorney for bid signatory",
      status: "compliant",
      reason: "Notarised power of attorney names the signatory used on Form 1.",
      evidence: [
        {
          document_name: "power-of-attorney.pdf",
          page: 1,
          quote: "Mr. A. Rahman is authorised to sign all bid documents on behalf of the company.",
        },
      ],
    },
    {
      id: "R-014",
      title: "Valid GST registration",
      status: "compliant",
      reason: "GSTIN found on certificate matching bidder registration details format.",
      evidence: [
        {
          document_name: "gst-certificate.pdf",
          page: 1,
          quote: "GSTIN: 22AAAAA0000A1Z5",
        },
      ],
    },
    {
      id: "R-015",
      title: "PAN of the bidding entity",
      status: "compliant",
      reason: "PAN card copy is present and entity name is consistent with the GST certificate.",
      evidence: [
        {
          document_name: "pan-card.pdf",
          page: 1,
          quote: "Permanent Account Number AAAAA0000A",
        },
      ],
    },
    {
      id: "R-018",
      title: "ISO 9001 certification valid through bid due date",
      status: "non_compliant",
      reason: "ISO 9001 certificate expired before the stated bid due date.",
      evidence: [
        {
          document_name: "iso-9001-certificate.pdf",
          page: 1,
          quote: "Valid until 01 March 2025",
        },
      ],
    },
    {
      id: "R-022",
      title: "Audited financial statements for last three FYs",
      status: "non_compliant",
      reason: "Only two financial years were located; FY 2024-25 packet is missing.",
      evidence: [
        {
          document_name: "financials-fy23.pdf",
          page: 4,
          quote: "Independent auditor's report for the year ended 31 March 2023",
        },
      ],
    },
    {
      id: "R-027",
      title: "Minimum average annual turnover INR 25 crore",
      status: "needs_review",
      reason:
        "Turnover figures appear in a CA certificate but the computation period is ambiguous.",
      evidence: [
        {
          document_name: "ca-turnover-certificate.pdf",
          page: 1,
          quote: "Average annual turnover certified as INR 28.4 crore (period not specified).",
        },
      ],
    },
    {
      id: "R-031",
      title: "Similar work experience — two projects of comparable scope",
      status: "needs_review",
      reason: "Two completion certificates found; contract values need human confirmation against RFP thresholds.",
      evidence: [
        {
          document_name: "work-experience.pdf",
          page: 3,
          quote: "Project A completed 2022 — value INR 18.2 crore.",
        },
        {
          document_name: "work-experience.pdf",
          page: 7,
          quote: "Project B completed 2024 — value INR 21.0 crore.",
        },
      ],
    },
    {
      id: "R-036",
      title: "No blacklisting affidavit",
      status: "compliant",
      reason: "Affidavit on non-judicial stamp paper states the bidder is not blacklisted.",
      evidence: [
        {
          document_name: "non-blacklisting-affidavit.pdf",
          page: 1,
          quote: "The bidder has not been blacklisted by any Central or State Government entity.",
        },
      ],
    },
    {
      id: "R-041",
      title: "Technical staffing plan with key CVs",
      status: "needs_review",
      reason: "Team list is present; two key CVs referenced in the RFP were not located.",
      evidence: [
        {
          document_name: "technical-proposal.pdf",
          page: 14,
          quote: "Proposed project manager: K. Iyer — CV enclosed as Annex C.",
        },
      ],
    },
    {
      id: "R-048",
      title: "Integrity pact signed by authorised signatory",
      status: "non_compliant",
      reason: "Integrity pact template is included but signature block is blank.",
      evidence: [
        {
          document_name: "integrity-pact.pdf",
          page: 4,
          quote: "Authorised signatory: ______________________  Date: __________",
        },
      ],
    },
  ],
  missing_documents: [
    {
      name: "Audited financial statements FY 2024-25",
      related_requirement_ids: ["R-022"],
    },
    {
      name: "Curriculum vitae — proposed contract specialist",
      related_requirement_ids: ["R-041"],
    },
    {
      name: "Signed integrity pact (executed original)",
      related_requirement_ids: ["R-048"],
    },
  ],
  risks: [
    {
      severity: "high",
      title: "Expired ISO certificate",
      detail: "ISO 9001 expired 2025-03-01, which is before the sample bid due date.",
    },
    {
      severity: "high",
      title: "Incomplete financial packet",
      detail: "Latest audited year appears absent; turnover claims cannot be fully corroborated.",
    },
    {
      severity: "medium",
      title: "Unsigned integrity pact",
      detail: "A blank signature block is a common first-level rejection trigger in this tender class.",
    },
  ],
};
