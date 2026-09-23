from typing import Optional, List, Dict, Any
from fastapi import APIRouter, Query, HTTPException, Depends, Request
from app.core.database import get_db_connection
from app.core.security import require_admin
from app.services.logger_service import log_system_activity

router = APIRouter(prefix="/api/logs", tags=["System Logs"], dependencies=[Depends(require_admin)])

@router.get("")
def get_system_logs(
    page: int = Query(1, ge=1),
    page_size: int = Query(25, ge=5, le=100),
    action_type: Optional[str] = Query(None),
    status: Optional[str] = Query(None),
    search: Optional[str] = Query(None),
    start_date: Optional[str] = Query(None),
    end_date: Optional[str] = Query(None)
):
    """
    Returns paginated system and audit activity logs with optional multi-criteria filters.
    """
    conn = get_db_connection()
    try:
        where_clauses = ["1=1"]
        params = []

        if action_type and action_type.strip() and action_type != "all":
            where_clauses.append("action_type = %s")
            params.append(action_type.strip())

        if status and status.strip() and status != "all":
            where_clauses.append("status = %s")
            params.append(status.strip())

        if search and search.strip():
            term = f"%{search.strip()}%"
            where_clauses.append("(username LIKE %s OR description LIKE %s OR details LIKE %s OR ip_address LIKE %s)")
            params.extend([term, term, term, term])

        if start_date and start_date.strip():
            where_clauses.append("created_at >= %s")
            params.append(f"{start_date.strip()} 00:00:00")

        if end_date and end_date.strip():
            where_clauses.append("created_at <= %s")
            params.append(f"{end_date.strip()} 23:59:59")

        where_sql = " AND ".join(where_clauses)
        offset = (page - 1) * page_size

        with conn.cursor() as cursor:
            # Count total matching rows
            cursor.execute(f"SELECT COUNT(*) as total FROM system_logs WHERE {where_sql};", params)
            total_count = cursor.fetchone()["total"]

            # Fetch paginated rows
            cursor.execute(f"""
                SELECT id, user_id, username, action_type, description, details, ip_address, status,
                       DATE_FORMAT(created_at, '%%Y-%%m-%%d %%H:%%i:%%s') as created_at
                FROM system_logs
                WHERE {where_sql}
                ORDER BY id DESC
                LIMIT %s OFFSET %s;
            """, params + [page_size, offset])
            rows = cursor.fetchall()

        return {
            "total": total_count,
            "page": page,
            "page_size": page_size,
            "total_pages": (total_count + page_size - 1) // page_size if total_count > 0 else 1,
            "data": rows
        }
    finally:
        conn.close()

@router.get("/stats")
def get_log_statistics():
    """
    Returns summary statistics for system logs (today's logins, sync runs, error rates, etc.).
    """
    conn = get_db_connection()
    try:
        with conn.cursor() as cursor:
            cursor.execute("SELECT COUNT(*) as total FROM system_logs;")
            total_logs = cursor.fetchone()["total"]

            cursor.execute("""
                SELECT COUNT(*) as cnt FROM system_logs
                WHERE action_type = 'LOGIN' AND DATE(created_at) = CURDATE();
            """)
            logins_today = cursor.fetchone()["cnt"]

            cursor.execute("""
                SELECT COUNT(*) as cnt FROM system_logs
                WHERE action_type IN ('AUTO_SYNC', 'SYNC_IFS_INVOICE', 'SYNC_IFS_OUTSTANDING', 'SYNC_AXIENTA', 'MANUAL_SYNC')
                  AND DATE(created_at) = CURDATE();
            """)
            syncs_today = cursor.fetchone()["cnt"]

            cursor.execute("""
                SELECT COUNT(*) as cnt FROM system_logs
                WHERE status = 'FAILED' AND DATE(created_at) = CURDATE();
            """)
            errors_today = cursor.fetchone()["cnt"]

            cursor.execute("""
                SELECT action_type, COUNT(*) as count
                FROM system_logs
                GROUP BY action_type
                ORDER BY count DESC
                LIMIT 10;
            """)
            breakdown = cursor.fetchall()

        return {
            "total_logs": total_logs,
            "logins_today": logins_today,
            "syncs_today": syncs_today,
            "errors_today": errors_today,
            "action_breakdown": breakdown
        }
    finally:
        conn.close()

@router.delete("/clear")
def clear_old_logs(days: int = Query(30, ge=1)):
    """
    Prunes logs older than N days to maintain optimal database size.
    """
    conn = get_db_connection()
    try:
        with conn.cursor() as cursor:
            cursor.execute("DELETE FROM system_logs WHERE created_at < DATE_SUB(NOW(), INTERVAL %s DAY);", (days,))
            deleted = cursor.rowcount
        conn.commit()

        log_system_activity(
            action_type="LOG_PRUNE",
            description=f"Pruned {deleted} logs older than {days} days",
            username="ADMIN",
            status="SUCCESS"
        )
        return {"status": "success", "deleted": deleted, "message": f"Pruned {deleted} log records older than {days} days."}
    finally:
        conn.close()
