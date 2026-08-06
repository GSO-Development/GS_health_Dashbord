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
