from typing import Optional
from fastapi import APIRouter, Body, HTTPException, Depends
from app.core.security import require_admin
from app.services.oracle_sync import sync_oracle_live, sync_oracle_invoices, sync_oracle_outstanding, sync_status

router = APIRouter(prefix="/api/oracle-sync", tags=["Oracle Sync"], dependencies=[Depends(require_admin)])

@router.get("/status")
def get_oracle_sync_status():
    return sync_status

@router.post("/sync-invoices")
def trigger_invoice_sync(
    payload: dict = Body(default={})
):
    try:
        oracle_user = payload.get("oracle_user")
        oracle_password = payload.get("oracle_password")
        year = payload.get("year")
        month = payload.get("month")
        start_date = payload.get("start_date")
        end_date = payload.get("end_date")
        contract = payload.get("contract")
        result = sync_oracle_invoices(oracle_user, oracle_password, year, month, start_date, end_date, contract)
        return result
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/sync-outstanding")
def trigger_outstanding_sync(
    payload: dict = Body(default={})
):
    try:
        oracle_user = payload.get("oracle_user")
        oracle_password = payload.get("oracle_password")
        year = payload.get("year")
        month = payload.get("month")
        start_date = payload.get("start_date")
        end_date = payload.get("end_date")
        contract = payload.get("contract")
        result = sync_oracle_outstanding(oracle_user, oracle_password, year, month, start_date, end_date, contract)
        return result
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/sync")
def trigger_oracle_sync(
    payload: dict = Body(default={})
):
    try:
        oracle_user = payload.get("oracle_user")
        oracle_password = payload.get("oracle_password")
        result = sync_oracle_live(oracle_user, oracle_password)
        return result
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
