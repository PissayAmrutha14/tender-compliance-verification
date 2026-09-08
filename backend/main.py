from fastapi import FastAPI, UploadFile, File
from fastapi.openapi.utils import get_openapi
from fastapi.middleware.cors import CORSMiddleware
from pypdf import PdfReader
import re

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=False,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.get("/")
def home():
    return {
        "message": "Tender Compliance Verification Backend is running!"
    }


@app.post("/extract-pdf")
async def extract_pdf(file: UploadFile = File(...)):
    reader = PdfReader(file.file)

    text = ""

    for page in reader.pages:
        page_text = page.extract_text()

        if page_text:
            text += page_text + "\n"

    return {
        "filename": file.filename,
        "text": text
    }


def extract_requirements(tender_text):
    tender_lower = tender_text.lower()

    requirements = []

    if "24-port" in tender_lower or "24 port" in tender_lower:
        requirements.append({
            "requirement": "24-port managed Gigabit switches",
            "type": "technical"
        })

    if "wi-fi 6" in tender_lower or "wifi 6" in tender_lower:
        requirements.append({
            "requirement": "Dual-band Wi-Fi 6 access points",
            "type": "technical"
        })

    warranty_match = re.search(
        r"minimum\s+(\d+)\s*years?",
        tender_lower
    )

    if warranty_match and "warranty" in tender_lower:
        years = int(warranty_match.group(1))

        requirements.append({
            "requirement": f"Minimum {years} years warranty",
            "type": "warranty",
            "minimum_years": years
        })

    if (
        "on-site technical support" in tender_lower
        or "onsite technical support" in tender_lower
        or "on site technical support" in tender_lower
    ):
        requirements.append({
            "requirement": "On-site technical support",
            "type": "support"
        })

    return requirements


def check_compliance(
    tender_text,
    bidder_text,
    requirements,
    bidder_pages
):
    bidder_lower = bidder_text.lower()

    results = []

    for requirement in requirements:
        requirement_text = requirement["requirement"].lower()
        requirement_type = requirement["type"]

        # ---------------------------------
        # Technical requirements
        # ---------------------------------
        if requirement_type == "technical":

            normalized_requirement = (
                requirement_text.replace("-", " ")
            )

            normalized_bidder = (
                bidder_lower.replace("-", " ")
            )

            if (
                normalized_requirement in normalized_bidder
                or (
                    "wi fi 6" in normalized_requirement
                    and "802.11ax" in normalized_bidder
                )
            ):
                status = "COMPLIANT"
                reason = (
                    "Required technical specification was found."
                )
            else:
                status = "NON-COMPLIANT"
                reason = (
                    "Required technical specification was not found."
                )

        # ---------------------------------
        # Warranty requirement
        # ---------------------------------
        elif requirement_type == "warranty":

            required_years = requirement["minimum_years"]

            bidder_match = re.search(
                r"(\d+)\s*years?",
                bidder_lower
            )

            if bidder_match:
                bidder_years = int(
                    bidder_match.group(1)
                )

                if bidder_years >= required_years:
                    status = "COMPLIANT"
                    reason = (
                        f"Bidder provides {bidder_years} years warranty."
                    )
                else:
                    status = "NON-COMPLIANT"
                    reason = (
                        "Bidder warranty is below the required minimum."
                    )

            else:
                status = "NON-COMPLIANT"
                reason = (
                    "Warranty period was not found."
                )

        # ---------------------------------
        # Support requirement
        # ---------------------------------
        elif requirement_type == "support":

            support_keywords = [
                "on-site technical support",
                "onsite technical support",
                "on site technical support",
                "technical assistance",
                "field support"
            ]

            if any(
                keyword in bidder_lower
                for keyword in support_keywords
            ):
                status = "COMPLIANT"
                reason = (
                    "Technical support was found."
                )
            else:
                status = "NON-COMPLIANT"
                reason = (
                    "Required technical support was not found."
                )

        # ---------------------------------
        # Unknown requirement
        # ---------------------------------
        else:
            status = "NEEDS REVIEW"
            reason = (
                "Requirement needs manual verification."
            )

        # ---------------------------------
        # Find evidence page
        # ---------------------------------
        evidence_page = None
        evidence_text = None

        for page in bidder_pages:

            page_text_lower = (
                page["text"].lower()
            )

            if requirement_type == "warranty":

                required_years = str(
                    requirement["minimum_years"]
                )

                if (
                    required_years + " years"
                    in page_text_lower
                    or
                    required_years + " year"
                    in page_text_lower
                ):
                    evidence_page = page["page"]
                    evidence_text = (
                        page["text"].strip()
                    )
                    break

            elif requirement_type == "technical":

                normalized_page = (
                    page_text_lower.replace("-", " ")
                )

                normalized_requirement = (
                    requirement_text.replace("-", " ")
                )

                if (
                    normalized_requirement
                    in normalized_page
                    or (
                        "wi fi 6"
                        in normalized_requirement
                        and "802.11ax"
                        in normalized_page
                    )
                ):
                    evidence_page = page["page"]
                    evidence_text = (
                        page["text"].strip()
                    )
                    break

            elif requirement_type == "support":

                support_keywords = [
                    "on-site technical support",
                    "onsite technical support",
                    "on site technical support",
                    "technical assistance",
                    "field support"
                ]

                if any(
                    keyword in page_text_lower
                    for keyword in support_keywords
                ):
                    evidence_page = page["page"]
                    evidence_text = (
                        page["text"].strip()
                    )
                    break

        # ---------------------------------
        # Store result
        # ---------------------------------
        results.append({
            "requirement": requirement["requirement"],
            "status": status,
            "reason": reason,
            "evidence_page": evidence_page,
            "evidence": evidence_text
        })

    # ---------------------------------
    # Calculate compliance score
    # ---------------------------------
    compliant_count = sum(
        1
        for result in results
        if result["status"] == "COMPLIANT"
    )

    total_count = len(results)

    if total_count == 0:
        overall_status = "NO REQUIREMENTS FOUND"

    elif compliant_count == total_count:
        overall_status = "COMPLIANT"

    elif compliant_count > 0:
        overall_status = "PARTIALLY COMPLIANT"

    else:
        overall_status = "NON-COMPLIANT"

    score = 0

    if total_count > 0:
        score = round(
            (compliant_count / total_count) * 100,
            2
        )

    # ---------------------------------
    # Missing-document detection
    # ---------------------------------
    missing_documents = []

    for result in results:
        if result["status"] == "NON-COMPLIANT":
            if result["evidence_page"] is None:
                missing_documents.append(
                    result["requirement"]
                )

    # ---------------------------------
    # Risk assignment
    # ---------------------------------
    risks = []

    for result in results:

        if result["status"] == "NON-COMPLIANT":

            risks.append({
                "requirement": result["requirement"],
                "risk_level": "HIGH",
                "reason": result["reason"]
            })

        elif result["status"] == "NEEDS REVIEW":

            risks.append({
                "requirement": result["requirement"],
                "risk_level": "MEDIUM",
                "reason": result["reason"]
            })

    # ---------------------------------
    # Final result
    # ---------------------------------
    return {
        "overall_status": overall_status,
        "compliance_score": (
            f"{compliant_count}/{total_count}"
        ),
        "compliance_percentage": score,
        "checks": results,
        "missing_documents": missing_documents,
        "risks": risks
    }


@app.post("/extract-requirements")
async def extract_tender_requirements(
    tender: UploadFile = File(...)
):
    reader = PdfReader(tender.file)

    tender_text = ""

    for page in reader.pages:

        page_text = page.extract_text()

        if page_text:
            tender_text += page_text + "\n"

    requirements = extract_requirements(
        tender_text
    )

    return {
        "filename": tender.filename,
        "requirements": requirements
    }


@app.post("/upload-tender-and-bidders")
async def upload_tender_and_bidders(
    tender: UploadFile = File(...),
    bidders: list[UploadFile] = File(...)
):
    # ---------------------------------
    # Read tender PDF
    # ---------------------------------
    tender_reader = PdfReader(
        tender.file
    )

    tender_text = ""

    for page in tender_reader.pages:

        page_text = page.extract_text()

        if page_text:
            tender_text += page_text + "\n"

    # ---------------------------------
    # Extract tender requirements
    # ---------------------------------
    requirements = extract_requirements(
        tender_text
    )

    bidder_data = []

    # ---------------------------------
    # Process each bidder
    # ---------------------------------
    for bidder in bidders:

        bidder_reader = PdfReader(
            bidder.file
        )

        bidder_text = ""
        bidder_pages = []

        for page_number, page in enumerate(
            bidder_reader.pages,
            start=1
        ):

            page_text = page.extract_text()

            if page_text:

                bidder_text += (
                    page_text + "\n"
                )

                bidder_pages.append({
                    "page": page_number,
                    "text": page_text
                })

        compliance_result = check_compliance(
            tender_text,
            bidder_text,
            requirements,
            bidder_pages
        )

        bidder_data.append({
            "filename": bidder.filename,
            "text": bidder_text,
            "compliance": compliance_result
        })

    # ---------------------------------
    # Final API response
    # ---------------------------------
    return {
        "tender": {
            "filename": tender.filename,
            "text": tender_text
        },
        "bidders": bidder_data
    }


def custom_openapi():

    if app.openapi_schema:
        return app.openapi_schema

    schema = get_openapi(
        title=app.title,
        version="1.0.0",
        routes=app.routes,
    )

    schema["openapi"] = "3.0.3"

    components = (
        schema
        .get("components", {})
        .get("schemas", {})
    )

    for schema_item in components.values():

        properties = schema_item.get(
            "properties",
            {}
        )

        for prop in properties.values():

            if prop.get("type") == "array":

                items = prop.get(
                    "items",
                    {}
                )

                if (
                    items.get(
                        "contentMediaType"
                    )
                    == "application/octet-stream"
                ):

                    items.pop(
                        "contentMediaType",
                        None
                    )

                    items["format"] = "binary"
                    items["type"] = "string"

            elif (
                prop.get(
                    "contentMediaType"
                )
                == "application/octet-stream"
            ):

                prop.pop(
                    "contentMediaType",
                    None
                )

                prop["format"] = "binary"

    app.openapi_schema = schema

    return app.openapi_schema


app.openapi = custom_openapi