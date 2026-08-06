from app.core.database import get_db_connection
import sys
sys.stdout.reconfigure(encoding='utf-8')

conn = get_db_connection()
with conn.cursor() as cursor:
    cursor.execute("SELECT COUNT(*) as cnt, SUM(primary_target) as tot_pri_tar, SUM(primary_actual) as tot_pri_act FROM dis_budget;")
    agg = cursor.fetchone()
    print("Dis Budget DB Import Verification:")
    print("  Total Rows in dis_budget:", agg['cnt'])
    print(f"  Total Primary Target: LKR {agg['tot_pri_tar']:,.2f}")
    print(f"  Total Primary Actual: LKR {agg['tot_pri_act']:,.2f}")

conn.close()
