from typing import Optional
from fastapi import APIRouter, Body
from app.services.oracle_sync import sync_oracle_live, sync_oracle_invoices, sync_oracle_outstanding, sync_status

router = APIRouter(prefix="/api/oracle-sync", tags=["Oracle Sync"])

@router.get("/status")
def get_oracle_sync_status():
    return sync_status

@router.post("/sync-invoices")
def trigger_invoice_sync(
    oracle_user: Optional[str] = Body(None, embed=True),
    oracle_password: Optional[str] = Body(None, embed=True)
):
    result = sync_oracle_invoices(oracle_user, oracle_password)
    return result

@router.post("/sync-outstanding")
def trigger_outstanding_sync(
    oracle_user: Optional[str] = Body(None, embed=True),
    oracle_password: Optional[str] = Body(None, embed=True)
):
    result = sync_oracle_outstanding(oracle_user, oracle_password)
    return result

@router.post("/sync")
def trigger_oracle_sync(
    oracle_user: Optional[str] = Body(None, embed=True),
    oracle_password: Optional[str] = Body(None, embed=True)
):
    result = sync_oracle_live(oracle_user, oracle_password)
    return result
