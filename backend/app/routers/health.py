from fastapi import APIRouter
from app.core.database import get_db_connection

router = APIRouter(prefix="/api", tags=["Health"])

@router.get("/health")
def health_check():
    try:
        conn = get_db_connection()
        counts = {}
        tables = [
            "invoice_output",
            "outstanding_output"
        ]
        with conn.cursor() as cursor:
            for table in tables:
                cursor.execute(f"SELECT COUNT(*) as count FROM `{table}`;")
                res = cursor.fetchone()
                counts[table] = res['count'] if isinstance(res, dict) else res[0]
        conn.close()
        return {
            "status": "connected",
            "database": "gsh_dashboard",
            "db_type": "MySQL / XAMPP",
            "table_count": len(counts),
            "total_records": sum(counts.values()),
            "table_records": counts
        }
    except Exception as e:
        return {"status": "error", "message": str(e)}

@router.get("/sync-status")
def get_sync_status():
    """Returns the latest database sync time and status."""
    try:
        from app.services.auto_sync_scheduler import scheduler_state, get_setting
        last_sync = scheduler_state.get("last_run") or get_setting("last_auto_sync_at", "")
        last_status = scheduler_state.get("last_status") or get_setting("last_auto_sync_status", "IDLE")
        is_syncing = scheduler_state.get("is_syncing_now", False)
        
        if not last_sync:
            conn = get_db_connection()
            try:
                with conn.cursor() as cursor:
                    cursor.execute("SELECT setting_value FROM system_settings WHERE setting_key = 'last_auto_sync_at' LIMIT 1;")
                    r = cursor.fetchone()
                    if r and r.get('setting_value'):
                        last_sync = r['setting_value']
            finally:
                conn.close()

        return {
            "status": "success",
            "last_sync": last_sync or None,
            "last_status": last_status,
            "is_syncing": is_syncing
        }
    except Exception as e:
        return {"status": "error", "last_sync": None, "message": str(e)}

