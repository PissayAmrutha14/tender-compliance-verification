# Tender Compliance Verification System

Vanilla HTML, CSS, and JavaScript frontend for first-level bid screening. Stage 1 is a **demo**: uploaded PDFs are not analyzed. Sample results come from [`js/mock-data.js`](js/mock-data.js).

## Open locally

Because this is static files, you can open `index.html` directly. A local server is recommended once FastAPI is connected (`fetch` + CORS).

```bash
# Python 3
python -m http.server 5500
```

Then open `http://127.0.0.1:5500`.

## Demo mode

`js/config.js` sets `USE_MOCK: true`. While that flag is true, a banner is shown on every screen:

> DEMO MODE — Results shown are sample results and are not generated from the uploaded documents.

**Verify Bid** runs a simulated 7-stage pipeline, then loads the sample JSON. File bytes are not read.

Set `USE_MOCK` to `false` when the FastAPI service is running. The banner and sample-result copy will hide.

## Decision-support copy

The dashboard headline is **Preliminary Compliance Score**. It is a first-level screening indicator, not a final award, eligibility, or procurement decision.

## Optional bidder details

Only business/registration fields are sent later as `bidder_details` JSON:

- `company_name`
- `registration_cin`
- `tax_gstin`
- `entity_type`

No contact name, email, or phone.

## Future FastAPI contract

`API_BASE_URL` defaults to `http://127.0.0.1:8000`.

1. `POST /api/jobs` — `multipart/form-data`
   - `tender`: one PDF
   - `bidders`: repeated PDFs
   - `bidder_details`: JSON string
   - Response: `{ "job_id": "uuid", "status": "queued" }`
2. `GET /api/jobs/{job_id}` — `{ status, progress, stage, result | error }`
   - `status`: `queued | processing | completed | failed`
   - `stage`: Extract, Identify requirements, Find evidence, Compare, Classify, Explain, Assess risk
3. `GET /api/jobs/{job_id}/report` — PDF or HTML attachment

Enable CORS on FastAPI for the static origin. Do not send PDFs as base64 JSON.

Result `result` object shape matches [`js/mock-data.js`](js/mock-data.js): `overall`, `requirements` (with `evidence[]` of `document_name`, `page`, `quote`), `missing_documents`, `risks`. Status values: `compliant`, `non_compliant`, `needs_review`.

Frontend mapping for traceability (JSON unchanged):

| Chain step | Field |
| --- | --- |
| Requirement | `id` + `title` |
| Finding | first evidence `quote`, or “No evidence located” |
| Status | `status` |
| Reason | `reason` |
| Evidence | `evidence[]` |
| Document / Page | `document_name` + `page` |

The numeric score remains `overall.score` in JSON.
