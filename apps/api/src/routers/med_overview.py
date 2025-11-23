# apps/api/src/routers/med_overview.py

from typing import List, Dict, Any
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from ..db.session import get_db
from ..db import models
from ..schemas.med_overview import MedListOverviewResponse, MedOverviewCitation
from ..services.llm.explainer import explain_med_list_with_llm
from ..services.retrieval.retrieve import retrieve_with_citations
from ..dependencies.users import get_current_user  

router = APIRouter(prefix="/me/medications", tags=["medications"])


@router.get("/overview", response_model=MedListOverviewResponse)
def get_med_list_overview(
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user),
) -> MedListOverviewResponse:
    user_meds: List[models.UserMedication] = (
        db.query(models.UserMedication)
        .filter(models.UserMedication.user_id == current_user.id)
        .all()
    )

    if not user_meds:
        return MedListOverviewResponse(
            overviewBullets=[
                "We couldn't find any medications on your profile yet.",
                "Add medications to your tracker to see an overview here.",
            ],
            perDrug=[],
            citations=[],
            usedCitationIds=[],
        )

    med_list: List[Dict[str, Any]] = []
    all_citations: List[Dict[str, Any]] = []
    citation_id_counter = 1

    for med in user_meds:
        med_entry = {
            "id": med.id,
            "name": med.display_name or med.rx_cui,
            "rx_cui": med.rx_cui,
        }
        med_list.append(med_entry)

        retrieval = retrieve_with_citations(med_entry["name"], k=3)
        for c in retrieval.get("citations", []):
            c_copy = {
                "id": citation_id_counter,
                "rx_cui": c.get("rx_cui"),
                "section": c.get("section"),
                "source_url": c.get("source_url"),
                "snippet": c.get("snippet") or "",
                "drug_name": med_entry["name"],
            }
            all_citations.append(c_copy)
            citation_id_counter += 1

    llm_result = explain_med_list_with_llm(med_list, all_citations)

    overview_bullets = llm_result.get("overview_bullets") or []
    per_drug_raw = llm_result.get("per_drug") or []
    used_ids = set(llm_result.get("used_citation_ids") or [])

    per_drug = []
    for entry in per_drug_raw:
        med_id = entry.get("medication_id")
        name = entry.get("name")

        if not med_id and name:
            for m in med_list:
                if m["name"].lower() == name.lower():
                    med_id = m["id"]
                    break

        if not med_id:
            continue

        rx_cui = None
        for m in med_list:
            if m["id"] == med_id:
                rx_cui = m.get("rx_cui")
                if not name:
                    name = m["name"]
                break

        per_drug.append(
            {
                "medication_id": med_id,
                "name": name or f"Medication {med_id}",
                "rx_cui": rx_cui,
                "summary": entry.get("summary") or "",
                "used_citation_ids": entry.get("used_citation_ids") or [],
            }
        )

    citations_for_response: List[MedOverviewCitation] = []
    for c in all_citations:
        citations_for_response.append(
            MedOverviewCitation(
                id=c["id"],
                rxCui=c.get("rx_cui"),
                section=c.get("section"),
                sourceUrl=c.get("source_url"),
                snippet=c.get("snippet") or "",
                used=(c["id"] in used_ids),
            )
        )

    return MedListOverviewResponse(
        overviewBullets=overview_bullets,
        perDrug=per_drug,
        citations=citations_for_response,
        usedCitationIds=list(used_ids),
    )
