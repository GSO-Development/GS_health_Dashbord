import os
import time
import asyncio
import logging
from datetime import datetime
from typing import Dict, Any

from app.core.database import get_db_connection
from app.services.logger_service import log_system_activity
from app.services.oracle_sync import sync_oracle_invoices, sync_oracle_outstanding

logger = logging.getLogger("auto_sync_scheduler")

# Track in-memory execution status
scheduler_state = {
    "is_running": False,
    "last_run": None,
    "last_status": "IDLE",
    "last_summary": None,
    "next_run": None,
    "is_syncing_now": False
}

def get_setting(key: str, default: str = "") -> str:
    """Helper to fetch a setting value from system_settings table."""
    try:
        conn = get_db_connection()
        try:
            with conn.cursor() as cursor:
                cursor.execute("SELECT setting_value FROM system_settings WHERE setting_key = %s LIMIT 1;", (key,))
                row = cursor.fetchone()
                if row and row.get("setting_value") is not None:
                    return str(row["setting_value"])
        finally:
            conn.close()
    except Exception as e:
        logger.error(f"Error reading setting '{key}': {e}")
    return default

def update_setting(key: str, value: str, updated_by: str = "SYSTEM"):
    """Helper to update a setting value in system_settings table."""
    try:
        conn = get_db_connection()
        try:
            with conn.cursor() as cursor:
                cursor.execute("""
                    INSERT INTO system_settings (setting_key, setting_value, updated_by)
                    VALUES (%s, %s, %s)
                    ON DUPLICATE KEY UPDATE setting_value = VALUES(setting_value), updated_by = VALUES(updated_by), updated_at = CURRENT_TIMESTAMP;
                """, (key, value, updated_by))
        finally:
            conn.close()
    except Exception as e:
        logger.error(f"Error updating setting '{key}': {e}")

def run_sync_all_services(initiated_by: str = "AUTO_SCHEDULER") -> Dict[str, Any]:
    """
    Executes automated data synchronization for all enabled services for the current month.
    """
    if scheduler_state["is_syncing_now"]:
        return {"status": "skipped", "message": "A sync job is already in progress."}

    scheduler_state["is_syncing_now"] = True
    now_dt = datetime.now()
    cur_year = now_dt.year
    cur_month = now_dt.month
    results = {}
    total_records = 0
    errors = []

    services_str = get_setting("auto_sync_services", "ifs_invoices,ifs_outstanding,axienta")
    enabled_services = [s.strip().lower() for s in services_str.split(",") if s.strip()]

    try:
        # 1. Sync IFS Invoices (Current Month Delta)
        if "ifs_invoices" in enabled_services:
            try:
                res_inv = sync_oracle_invoices(year=cur_year, month=cur_month)
                inserted = res_inv.get("inserted", 0) if isinstance(res_inv, dict) else 0
                results["ifs_invoices"] = {"status": "success", "inserted": inserted}
                total_records += inserted
            except Exception as e:
                err_msg = f"IFS Invoices sync failed: {e}"
                logger.error(err_msg)
                results["ifs_invoices"] = {"status": "error", "error": str(e)}
                errors.append(err_msg)

        # 2. Sync IFS Outstanding Orders (Current Month Delta)
        if "ifs_outstanding" in enabled_services:
            try:
                res_out = sync_oracle_outstanding(year=cur_year, month=cur_month)
                inserted = res_out.get("inserted", 0) if isinstance(res_out, dict) else 0
                results["ifs_outstanding"] = {"status": "success", "inserted": inserted}
                total_records += inserted
            except Exception as e:
                err_msg = f"IFS Outstanding sync failed: {e}"
                logger.error(err_msg)
                results["ifs_outstanding"] = {"status": "error", "error": str(e)}
                errors.append(err_msg)

        # 3. Sync Axienta SFA Secondary Sales (Current Month)
        if "axienta" in enabled_services:
            try:
                from app.routers.axienta import sync_axienta_live_month
                res_ax = sync_axienta_live_month(cur_year, cur_month)
                inserted = res_ax.get("synced_records", 0) if isinstance(res_ax, dict) else 0
                results["axienta"] = {"status": "success", "inserted": inserted}
                total_records += inserted
            except Exception as e:
                # If specific month helper doesn't exist, record gracefully
                err_msg = f"Axienta sync notice: {e}"
                results["axienta"] = {"status": "info", "message": str(e)}

        overall_status = "SUCCESS" if not errors else ("PARTIAL" if total_records > 0 else "FAILED")
        now_str = datetime.now().strftime("%Y-%m-%d %H:%M:%S")

        update_setting("last_auto_sync_at", now_str, initiated_by)
        update_setting("last_auto_sync_status", overall_status, initiated_by)

        scheduler_state["last_run"] = now_str
        scheduler_state["last_status"] = overall_status
        scheduler_state["last_summary"] = f"Synced {total_records} records across {len(results)} services."

        log_system_activity(
            action_type="AUTO_SYNC" if initiated_by == "AUTO_SCHEDULER" else "MANUAL_SYNC",
            description=f"{initiated_by}: Synced {total_records} records for {now_dt.strftime('%B %Y')}",
            username=initiated_by,
            details=results,
            status="SUCCESS" if overall_status in ("SUCCESS", "PARTIAL") else "FAILED"
        )

        return {
            "status": "success",
            "overall_status": overall_status,
            "timestamp": now_str,
            "total_records": total_records,
            "details": results,
            "errors": errors
        }
    finally:
        scheduler_state["is_syncing_now"] = False

async def start_auto_sync_loop():
    """
    Continuous async background loop checking the auto_sync_interval setting.
    Intervals:
      - '10m': 600s
      - '30m': 1800s
      - '1h': 3600s
      - 'disabled': sleep and check periodically
    """
    scheduler_state["is_running"] = True
    logger.info("Starting background Auto-Sync Scheduler Loop...")

    # Wait 30 seconds after server startup before initial sync check
    await asyncio.sleep(30)

    while True:
        try:
            interval_setting = get_setting("auto_sync_interval", "30m").strip().lower()

            interval_seconds = None
            if interval_setting in ("10m", "10 min", "10mins", "10_minutes"):
                interval_seconds = 600
            elif interval_setting in ("30m", "30 min", "30mins", "30_minutes"):
                interval_seconds = 1800
            elif interval_setting in ("1h", "1 hour", "60m", "hourly"):
                interval_seconds = 3600
            elif interval_setting in ("disabled", "off", "none", "0"):
                interval_seconds = None

            if interval_seconds:
                next_ts = time.time() + interval_seconds
                scheduler_state["next_run"] = datetime.fromtimestamp(next_ts).strftime("%Y-%m-%d %H:%M:%S")
                
                # Execute Sync
                logger.info(f"Auto-Sync Scheduler triggering scheduled sync (Interval: {interval_setting})...")
                # Run sync in threadpool to keep asyncio event loop responsive
                loop = asyncio.get_running_loop()
                await loop.run_in_executor(None, run_sync_all_services, "AUTO_SCHEDULER")
                
                # Wait for interval
                await asyncio.sleep(interval_seconds)
            else:
                scheduler_state["next_run"] = "Disabled"
                # Check setting again in 60 seconds
                await asyncio.sleep(60)
        except asyncio.CancelledError:
            logger.info("Auto-sync scheduler loop cancelled.")
            break
        except Exception as e:
            logger.error(f"Error in auto-sync scheduler loop: {e}")
            await asyncio.sleep(60)
