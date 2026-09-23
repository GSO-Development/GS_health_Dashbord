import os
from typing import Optional, Dict, Any
from fastapi import APIRouter, HTTPException, Depends, Body
from app.core.database import get_db_connection
from app.core.security import require_admin
from app.services.logger_service import log_system_activity
from app.services.auto_sync_scheduler import (
    get_setting, update_setting, run_sync_all_services, scheduler_state
)

router = APIRouter(prefix="/api/settings", tags=["System Settings"], dependencies=[Depends(require_admin)])

@router.get("")
def get_all_settings():
    """
    Returns all system configuration settings along with live background scheduler runtime state.
    """
    conn = get_db_connection()
    try:
        settings_dict = {}
        with conn.cursor() as cursor:
            cursor.execute("SELECT setting_key, setting_value, description, updated_at, updated_by FROM system_settings;")
            rows = cursor.fetchall()
            for r in rows:
                settings_dict[r["setting_key"]] = {
                    "value": r["setting_value"],
                    "description": r["description"],
                    "updated_at": str(r["updated_at"]) if r["updated_at"] else None,
                    "updated_by": r["updated_by"]
                }

        return {
            "settings": settings_dict,
            "scheduler_state": {
                "is_running": scheduler_state.get("is_running", True),
                "is_syncing_now": scheduler_state.get("is_syncing_now", False),
                "last_run": scheduler_state.get("last_run") or settings_dict.get("last_auto_sync_at", {}).get("value"),
                "last_status": scheduler_state.get("last_status") or settings_dict.get("last_auto_sync_status", {}).get("value", "IDLE"),
                "last_summary": scheduler_state.get("last_summary"),
                "next_run": scheduler_state.get("next_run", "Calculating...")
            }
        }
    finally:
        conn.close()

@router.put("")
def update_system_settings(
    payload: dict = Body(...)
):
    """
    Updates system configuration settings (e.g., auto_sync_interval, auto_sync_services).
    """
    allowed_intervals = ["10m", "30m", "1h", "disabled"]
    updated = {}

    if "auto_sync_interval" in payload:
        interval_val = str(payload["auto_sync_interval"]).strip().lower()
        if interval_val not in allowed_intervals:
            raise HTTPException(
                status_code=400,
                detail=f"Invalid interval '{interval_val}'. Allowed options: {', '.join(allowed_intervals)}"
            )
        update_setting("auto_sync_interval", interval_val, "ADMIN")
        updated["auto_sync_interval"] = interval_val

    if "auto_sync_services" in payload:
        services_val = str(payload["auto_sync_services"]).strip()
        update_setting("auto_sync_services", services_val, "ADMIN")
        updated["auto_sync_services"] = services_val

    if "auto_sync_mode" in payload:
        mode_val = str(payload["auto_sync_mode"]).strip()
        update_setting("auto_sync_mode", mode_val, "ADMIN")
        updated["auto_sync_mode"] = mode_val

    log_system_activity(
        action_type="SETTINGS_UPDATE",
        description=f"Updated system settings: {', '.join(updated.keys())}",
        username="ADMIN",
        details=updated,
        status="SUCCESS"
    )

    return {
        "status": "success",
        "message": "System settings updated successfully.",
        "updated": updated
    }

@router.post("/trigger-sync")
def trigger_instant_sync():
    """
    Manually triggers an immediate synchronization job for all enabled services without waiting for schedule.
    """
    if scheduler_state.get("is_syncing_now"):
        return {"status": "in_progress", "message": "A synchronization process is currently running."}

    result = run_sync_all_services(initiated_by="ADMIN_TRIGGER")
    return result
