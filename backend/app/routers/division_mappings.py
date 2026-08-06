from typing import Optional, List, Dict
from fastapi import APIRouter, HTTPException, Query, Body
from app.core.database import get_db_connection

router = APIRouter(prefix="/api/division-mappings", tags=["Division Mappings"])

DEFAULT_MAPPINGS = [
    ("ADCOCK", "OAKNET"),
    ("ADCOCK-LO", "OAKNET"),
    ("ALP", "ALPAYA"),
    ("PRYMAX SAL", "SURGICAL CONSUMABLES - divasa"),
    ("ROCKET SAL", "SUR CONSUMABLES"),
    ("ARR G (A)", "ARROWIL A1"),
    ("ARR U (A)", "ARROWIL A1"),
    ("ARRA4", "ARROWIL A4"),
    ("ARR C (A)", "ARROWIL A2"),
    ("ARRA2I", "ARROWIL A2"),
    ("ARRA2U", "ARROWIL A2"),
    ("ARRA2UGE", "ARROWIL A2"),
    ("ARRA3S", "ARROWIL A3"),
    ("ARR C (B1)", "ARROWIL B1"),
    ("ARR U (B)", "ARROWIL B1"),
    ("ARRB1S", "ARROWIL B1"),
    ("ARR C (B)", "ARROWIL B2"),
    ("ARR GE (B)", "ARROWIL B2"),
    ("ARR P (B)", "ARROWIL B2"),
    ("ARRB2S", "ARROWIL B2"),
    ("ARRB2U", "ARROWIL B2"),
    ("ARR U B7", "ARROWIL B7"),
    ("ACCESSORIE", "B BRAUN"),
    ("B BRAUNACC", "B BRAUN"),
    ("B.B.ANG &", "STENTS & CATHLAB"),
    ("CATHE.LAB", "STENTS & CATHLAB"),
    ("NBQ-BBSL", "B BRAUN SUTURES"),
    ("CENTAUR PH", "CENTAUR"),
    ("APPA FOR", "EYECARE"),
    ("APPA NOR", "EYECARE"),
    ("APP-PFS", "EYECARE"),
    ("FDN BL", "ALTIVON"),
    ("GENPHAMA", "LANMED"),
    ("GENPH-EYE", "LANMED"),
    ("FREDAN PHA", "FREDUN"),
    ("LACTO", "LACTONOVA"),
    ("SNZ", "LACTONOVA"),
    ("ARCADE", "LANMED"),
    ("IBN", "LANMED"),
    ("MARIO", "LANMED"),
    ("PULSE", "LANMED"),
    ("LEPU", "LEPU"),
    ("MEDOCHEM", "MEDOCHEMIE"),
    ("NABIQASIM", "NQ"),
    ("NBQ-IV", "NQ"),
    ("NBQNC", "NBQ - NEPROLOGY"),
    ("NQ BL", "ALTIVON"),
    ("NQDDP", "NQ"),
    ("CELL", "SPECIALTY- CELLTRION"),
    ("UNITED BIO", "SPECIALTY- UBPL"),
    ("VCHOW", "SPECIALTY- CELLTRION"),
    ("OTSUKA", "OTSUKA"),
    ("BL LOCAL", "BL"),
    ("BL SALE", "BL"),
    ("MEN - SALE", "BL"),
    ("DENTAIDS", "DENTAL"),
    ("ICPA - SAL", "DENTAL"),
    ("KATARA", "DENTAL"),
    ("SILMET", "DENTAL"),
    ("VERSAH", "DENTAL"),
    ("CARA", "AEROMED"),
    ("INGA", "AEROMED"),
    ("PLATINUM S", "AEROMED"),
    ("AR PRO (B)", "BBRAUN WOUND CARE"),
    ("ARR PR (B)", "PRECICION COATING"),
    ("UL CEN", "UL-CEN"),
    ("UL SALE", "UL"),
    ("UL-NBQ", "UL-CEN"),
    ("UL-SWISS", "UL-CEN"),
    ("VIRCW", "UL"),
    ("ELASTRO", "SPORTS MEDICINE"),
    ("MUELLER SA", "SPORTS MEDICINE"),
    ("SPOL SALES", "SPORTS MEDICINE"),
    ("STRECHIT", "SPORTS MEDICINE"),
    ("SURJAVY", "SPORTS MEDICINE"),
    ("BTL SALES", "MEDICAL EQUIP"),
    ("DSI", "MEDICAL EQUIP"),
    ("HEUSER", "MEDICAL EQUIP"),
    ("LIFE CARE", "MEDICAL EQUIP"),
    ("MULTI", "MEDICAL EQUIP"),
    ("OTTO", "MEDICAL EQUIP"),
    ("RUPS", "MEDICAL EQUIP"),
    ("SISSEL", "MEDICAL EQUIP"),
    ("TIL HEALTH", "TIL"),
    ("BIONOTE", "VETINERARY"),
    ("BRILLIANT", "VETINERARY"),
    ("VET F", "VETINERARY"),
    ("VET L", "VETINERARY"),
    ("VSY SALES", "EYECARE"),
    ("WYETH SALE", "WYETH"),
    ("HETERO", "HETERO"),
    ("UPL HETERO", "UPL HETERO"),
    ("(blank)", "B BRAUN 3PL"),
    ("(blank)", "COLLOMBO"),
    ("(blank)", "DIAGNOSTIC"),
    ("(blank)", "MADIWELA")
]

_db_initialized = False

def init_division_mappings_table():
    global _db_initialized
    if _db_initialized:
        return

    conn = get_db_connection()
    with conn.cursor() as cursor:
        cursor.execute("""
            CREATE TABLE IF NOT EXISTS division_mappings (
                id INT AUTO_INCREMENT PRIMARY KEY,
                sales_group VARCHAR(150) NOT NULL,
                range_name VARCHAR(150) NOT NULL,
                updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
                UNIQUE KEY uk_sales_group (sales_group, range_name)
            ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
        """)

        cursor.execute("SELECT COUNT(*) as cnt FROM division_mappings;")
        count = cursor.fetchone()["cnt"]

        if count == 0:
            cursor.executemany("""
                INSERT IGNORE INTO division_mappings (sales_group, range_name)
                VALUES (%s, %s);
            """, DEFAULT_MAPPINGS)
    conn.close()
    _db_initialized = True


@router.on_event("startup")
def on_startup():
    try:
        init_division_mappings_table()
    except Exception as e:
        print(f"Error initializing division_mappings table: {e}")


@router.get("/stats")
def get_mapping_stats():
    init_division_mappings_table()
    conn = get_db_connection()
    with conn.cursor() as cursor:
        # Total unique Sales Groups in total_budget
        cursor.execute("""
            SELECT COUNT(DISTINCT TRIM(sales_group)) as cnt 
            FROM total_budget 
            WHERE sales_group IS NOT NULL AND TRIM(sales_group) != '';
        """)
        tb_sg_count = cursor.fetchone()['cnt'] or 0

        # Total unique Ranges in division_mappings
        cursor.execute("""
            SELECT COUNT(DISTINCT TRIM(range_name)) as cnt 
            FROM division_mappings 
            WHERE range_name IS NOT NULL AND TRIM(range_name) != '';
        """)
        div_range_count = cursor.fetchone()['cnt'] or 0

        # Mapped count vs Unmapped count in total_budget
        cursor.execute("""
            SELECT 
                COUNT(DISTINCT CASE WHEN m.sales_group IS NOT NULL THEN b.sales_group END) as mapped_cnt,
                COUNT(DISTINCT CASE WHEN m.sales_group IS NULL THEN b.sales_group END) as unmapped_cnt
            FROM total_budget b
            LEFT JOIN division_mappings m ON LOWER(TRIM(b.sales_group)) = LOWER(TRIM(m.sales_group))
            WHERE b.sales_group IS NOT NULL AND TRIM(b.sales_group) != '';
        """)
        m_row = cursor.fetchone()
        mapped_cnt = m_row['mapped_cnt'] or 0
        unmapped_cnt = m_row['unmapped_cnt'] or 0

        # Unmapped Sales Groups list
        cursor.execute("""
            SELECT DISTINCT TRIM(b.sales_group) as unmapped_sg, TRIM(b.range_name) as target_range
            FROM total_budget b
            LEFT JOIN division_mappings m ON LOWER(TRIM(b.sales_group)) = LOWER(TRIM(m.sales_group))
            WHERE m.sales_group IS NULL AND b.sales_group IS NOT NULL AND TRIM(b.sales_group) != '';
        """)
        unmapped_list = cursor.fetchall()

    conn.close()
    return {
        "status": "success",
        "total_sales_groups": tb_sg_count,
        "total_ranges": div_range_count,
        "mapped_count": mapped_cnt,
        "unmapped_count": unmapped_cnt,
        "unmapped_list": unmapped_list
    }


@router.post("/sync-from-budget")
def sync_mappings_from_budget():
    init_division_mappings_table()
    conn = get_db_connection()
    synced_count = 0
    with conn.cursor() as cursor:
        # Fetch all distinct (sales_group, range_name) pairs from total_budget
        cursor.execute("""
            SELECT DISTINCT TRIM(sales_group) as s_grp, TRIM(range_name) as r_name
            FROM total_budget
            WHERE sales_group IS NOT NULL AND TRIM(sales_group) != ''
              AND range_name IS NOT NULL AND TRIM(range_name) != '';
        """)
        tb_pairs = cursor.fetchall()

        for p in tb_pairs:
            s_grp = p['s_grp']
            r_name = p['r_name']
            cursor.execute("""
                INSERT INTO division_mappings (sales_group, range_name)
                VALUES (%s, %s)
                ON DUPLICATE KEY UPDATE range_name = VALUES(range_name);
            """, (s_grp, r_name))
            synced_count += cursor.rowcount

    conn.close()
    return {
        "status": "success",
        "message": f"Successfully auto-synced {len(tb_pairs)} mappings from total_budget database table!",
        "total_synced": len(tb_pairs)
    }


@router.get("")
def list_division_mappings(
    search: Optional[str] = Query(None),
    year: Optional[str] = Query(None)
):
    init_division_mappings_table()
    conn = get_db_connection()
    where_clauses = []
    params = []

    if search:
        where_clauses.append("(b.sales_group LIKE %s OR b.range_name LIKE %s OR b.part_no LIKE %s OR b.product_sku LIKE %s)")
        like_str = f"%{search}%"
        params.extend([like_str, like_str, like_str, like_str])

    where_sql = (" WHERE " + " AND ".join(where_clauses)) if where_clauses else ""

    with conn.cursor() as cursor:
        cursor.execute(f"""
            SELECT 
                b.id as budget_id,
                COALESCE(m.id, b.id) as id,
                TRIM(b.sales_group) as sales_group,
                TRIM(b.range_name) as range_name,
                TRIM(COALESCE(b.part_no, '')) as part_no,
                TRIM(COALESCE(b.product_sku, '')) as product_sku,
                DATE_FORMAT(COALESCE(m.updated_at, NOW()), '%%Y-%%m-%%d %%H:%%i') as updated_at
            FROM total_budget b
            LEFT JOIN division_mappings m ON LOWER(TRIM(b.sales_group)) = LOWER(TRIM(m.sales_group))
            {where_sql}
            ORDER BY b.id ASC;
        """, params)
        rows = cursor.fetchall()
    conn.close()
    return {"status": "success", "total": len(rows), "data": rows}


@router.post("")
def create_division_mapping(
    sales_group: str = Body(..., embed=True),
    range_name: str = Body(..., embed=True)
):
    conn = get_db_connection()
    with conn.cursor() as cursor:
        cursor.execute("""
            INSERT INTO division_mappings (sales_group, range_name)
            VALUES (%s, %s);
        """, (sales_group, range_name))
        new_id = cursor.lastrowid
    conn.close()
    return {"status": "success", "id": new_id, "sales_group": sales_group, "range_name": range_name}


@router.put("/{mapping_id}")
def update_division_mapping(
    mapping_id: int,
    sales_group: str = Body(..., embed=True),
    range_name: str = Body(..., embed=True)
):
    conn = get_db_connection()
    with conn.cursor() as cursor:
        cursor.execute("""
            UPDATE division_mappings
            SET sales_group = %s, range_name = %s
            WHERE id = %s;
        """, (sales_group, range_name, mapping_id))
    conn.close()
    return {"status": "success", "id": mapping_id, "sales_group": sales_group, "range_name": range_name}


@router.delete("/{mapping_id}")
def delete_division_mapping(mapping_id: int):
    conn = get_db_connection()
    with conn.cursor() as cursor:
        cursor.execute("DELETE FROM division_mappings WHERE id = %s;", (mapping_id,))
    conn.close()
    return {"status": "success", "message": f"Mapping ID {mapping_id} deleted."}
