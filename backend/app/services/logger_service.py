import json
import logging
from typing import Optional, Any
from app.core.database import get_db_connection

logger = logging.getLogger("system_logger")

def log_system_activity(
    action_type: str,
    description: str,
    username: Optional[str] = "SYSTEM",
    user_id: Optional[int] = None,
    details: Optional[Any] = None,
    ip_address: Optional[str] = None,
    status: str = "SUCCESS"
):
    """
    Records a system activity/audit log entry into the MySQL `system_logs` table.
    Safe and resilient: catches all database exceptions so logging never crashes business logic.
    """
    try:
        details_str = None
        if details is not None:
            if isinstance(details, (dict, list)):
                details_str = json.dumps(details, default=str)
            else:
                details_str = str(details)

        conn = get_db_connection()
        try:
            with conn.cursor() as cursor:
                cursor.execute("""
                    INSERT INTO system_logs (user_id, username, action_type, description, details, ip_address, status)
                    VALUES (%s, %s, %s, %s, %s, %s, %s);
                """, (user_id, username or "SYSTEM", action_type, description[:250], details_str, ip_address, status))
        finally:
            conn.close()
    except Exception as e:
        logger.error(f"Failed to write system log: {e}")
