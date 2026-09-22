import io
import pandas as pd
from typing import Optional, List, Dict
from fastapi import APIRouter, HTTPException, Query, Body, File, UploadFile
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
                match_type VARCHAR(50) DEFAULT 'CATALOG_GROUP',
                contract_code VARCHAR(50) DEFAULT NULL,
                visibility VARCHAR(50) DEFAULT 'both',
                updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
                UNIQUE KEY uk_sales_group_only (sales_group)
            ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
        """)

        try:
            cursor.execute("ALTER TABLE division_mappings ADD COLUMN visibility VARCHAR(50) DEFAULT 'both';")
        except Exception:
            pass

        try:
            cursor.execute("ALTER TABLE division_mappings ADD COLUMN match_type VARCHAR(50) DEFAULT 'CATALOG_GROUP';")
        except Exception:
            pass

        try:
            cursor.execute("ALTER TABLE division_mappings ADD COLUMN contract_code VARCHAR(50) DEFAULT NULL;")
        except Exception:
            pass

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


@router.get("/contracts")
def get_available_contracts():
    init_division_mappings_table()
    conn = get_db_connection()
    contracts = set()
    with conn.cursor() as cursor:
        cursor.execute("SELECT DISTINCT TRIM(contract) as c FROM invoice_output WHERE contract IS NOT NULL AND TRIM(contract) != '';")
        for r in cursor.fetchall():
            if r.get('c'):
                contracts.add(r['c'])
        cursor.execute("SELECT DISTINCT TRIM(contract) as c FROM outstanding_output WHERE contract IS NOT NULL AND TRIM(contract) != '';")
        for r in cursor.fetchall():
            if r.get('c'):
                contracts.add(r['c'])
    conn.close()
    return {"status": "success", "contracts": sorted(list(contracts))}


@router.put("/update-visibility")
def update_mapping_visibility(payload: dict = Body(...)):
    init_division_mappings_table()
    sales_group = str(payload.get("sales_group") or "").strip()
    range_name = str(payload.get("range_name") or "").strip()
    visibility = str(payload.get("visibility") or "both").strip().lower()

    if visibility not in ["both", "total_range", "distri_range"]:
        visibility = "both"

    if not sales_group:
        raise HTTPException(status_code=400, detail="Sales Group cannot be empty.")

    conn = get_db_connection()
    with conn.cursor() as cursor:
        if range_name:
            cursor.execute("""
                INSERT INTO division_mappings (sales_group, range_name, visibility)
                VALUES (%s, %s, %s)
                ON DUPLICATE KEY UPDATE 
                    range_name = VALUES(range_name),
                    visibility = VALUES(visibility);
            """, (sales_group, range_name, visibility))
        else:
            cursor.execute("""
                INSERT INTO division_mappings (sales_group, range_name, visibility)
                VALUES (%s, %s, %s)
                ON DUPLICATE KEY UPDATE 
                    visibility = VALUES(visibility);
            """, (sales_group, sales_group, visibility))
    conn.commit()
    conn.close()
    return {
        "status": "success",
        "sales_group": sales_group,
        "visibility": visibility,
        "message": f"Visibility for '{sales_group}' updated to '{visibility}'."
    }


@router.put("/update-matching")
def update_matching_field(payload: dict = Body(...)):
    init_division_mappings_table()
    sales_group = str(payload.get("sales_group") or "").strip()
    range_name = str(payload.get("range_name") or "").strip()
    match_type = str(payload.get("match_type") or "CATALOG_GROUP").strip().upper()
    contract_code = payload.get("contract_code")
    visibility = payload.get("visibility")
    if contract_code:
        contract_code = str(contract_code).strip().upper()
    else:
        contract_code = None

    if visibility:
        visibility = str(visibility).strip().lower()
        if visibility not in ["both", "total_range", "distri_range"]:
            visibility = "both"

    if not sales_group:
        raise HTTPException(status_code=400, detail="Sales group cannot be empty.")

    if match_type not in ["CATALOG_GROUP", "CONTRACT", "CATALOG_NO"]:
        match_type = "CATALOG_GROUP"

    conn = get_db_connection()
    with conn.cursor() as cursor:
        if visibility:
            cursor.execute("""
                INSERT INTO division_mappings (sales_group, range_name, match_type, contract_code, visibility)
                VALUES (%s, %s, %s, %s, %s)
                ON DUPLICATE KEY UPDATE 
                    range_name = COALESCE(VALUES(range_name), range_name),
                    match_type = VALUES(match_type),
                    contract_code = VALUES(contract_code),
                    visibility = VALUES(visibility);
            """, (sales_group, range_name or sales_group, match_type, contract_code, visibility))
        elif range_name:
            cursor.execute("""
                INSERT INTO division_mappings (sales_group, range_name, match_type, contract_code)
                VALUES (%s, %s, %s, %s)
                ON DUPLICATE KEY UPDATE 
                    range_name = VALUES(range_name),
                    match_type = VALUES(match_type),
                    contract_code = VALUES(contract_code);
            """, (sales_group, range_name, match_type, contract_code))
        else:
            cursor.execute("""
                UPDATE division_mappings
                SET match_type = %s, contract_code = %s
                WHERE LOWER(TRIM(sales_group)) = LOWER(TRIM(%s));
            """, (match_type, contract_code, sales_group))
    conn.commit()
    conn.close()
    return {
        "status": "success",
        "message": f"Matching field updated for '{sales_group}' -> {match_type} {('(' + contract_code + ')') if contract_code else ''}",
        "sales_group": sales_group,
        "match_type": match_type,
        "contract_code": contract_code,
        "visibility": visibility
    }


@router.get("/stats")
def get_mapping_stats(year: Optional[str] = Query(None)):
    init_division_mappings_table()
    conn = get_db_connection()
    with conn.cursor() as cursor:
        year_filter_tb = ""
        params_tb = []
        if year and year.strip().lower() not in ["all fiscal years", "all", ""]:
            year_filter_tb = "WHERE (fiscal_year = %s OR fiscal_year IS NULL OR fiscal_year = '')"
            params_tb.append(year.strip())

        # Total unique Sales Groups in total_budget and division_mappings
        cursor.execute(f"""
            SELECT COUNT(DISTINCT sg) as cnt FROM (
                SELECT TRIM(sales_group) as sg FROM total_budget {year_filter_tb}
                UNION
                SELECT TRIM(sales_group) as sg FROM division_mappings WHERE sales_group IS NOT NULL AND TRIM(sales_group) != ''
            ) t;
        """, params_tb)
        tb_sg_count = cursor.fetchone()['cnt'] or 0

        # Total unique Ranges in division_mappings and total_budget
        cursor.execute(f"""
            SELECT COUNT(DISTINCT rn) as cnt FROM (
                SELECT TRIM(range_name) as rn FROM division_mappings WHERE range_name IS NOT NULL AND TRIM(range_name) != ''
                UNION
                SELECT TRIM(range_name) as rn FROM total_budget {year_filter_tb}
            ) t;
        """, params_tb)
        div_range_count = cursor.fetchone()['cnt'] or 0

        # Mapped count vs Unmapped count in total_budget
        cursor.execute(f"""
            SELECT 
                COUNT(DISTINCT CASE WHEN m.sales_group IS NOT NULL THEN b.sales_group END) as mapped_cnt,
                COUNT(DISTINCT CASE WHEN m.sales_group IS NULL THEN b.sales_group END) as unmapped_cnt,
                COUNT(DISTINCT CASE WHEN (COALESCE(b.total, 0) = 0 OR b.product_sku = 'Unbudgeted (Excel)') THEN b.sales_group END) as not_in_budget_cnt
            FROM total_budget b
            LEFT JOIN division_mappings m ON LOWER(TRIM(b.sales_group)) = LOWER(TRIM(m.sales_group))
            {year_filter_tb.replace('fiscal_year', 'b.fiscal_year')};
        """, params_tb)
        m_row = cursor.fetchone()
        mapped_cnt = m_row['mapped_cnt'] or 0
        unmapped_cnt = m_row['unmapped_cnt'] or 0
        not_in_budget_cnt = m_row['not_in_budget_cnt'] or 0

        # Total items count in total_budget
        cursor.execute(f"SELECT COUNT(*) as cnt FROM total_budget {year_filter_tb};", params_tb)
        total_items_cnt = cursor.fetchone()['cnt'] or 0

        # List of items not in budget
        cursor.execute(f"""
            SELECT DISTINCT TRIM(b.sales_group) as sales_group, TRIM(b.range_name) as range_name
            FROM total_budget b
            WHERE (COALESCE(b.total, 0) = 0 OR b.product_sku = 'Unbudgeted (Excel)')
              {"AND " + year_filter_tb.replace("WHERE ", "") if year_filter_tb else ""};
        """, params_tb)
        not_in_budget_list = cursor.fetchall()

    conn.close()
    return {
        "status": "success",
        "total_sales_groups": tb_sg_count,
        "total_ranges": div_range_count,
        "mapped_count": mapped_cnt,
        "unmapped_count": unmapped_cnt,
        "not_in_budget_count": not_in_budget_cnt,
        "total_items": total_items_cnt,
        "not_in_budget_list": not_in_budget_list
    }


@router.post("/sync-from-budget")
def sync_mappings_from_budget():
    init_division_mappings_table()
    conn = get_db_connection()
    synced_count = 0
    with conn.cursor() as cursor:
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
    year: Optional[str] = Query(None),
    visibility: Optional[str] = Query(None)
):
    init_division_mappings_table()
    conn = get_db_connection()
    where_clauses = []
    params = []

    if year and year.strip().lower() not in ["all fiscal years", "all", ""]:
        where_clauses.append("(b.fiscal_year = %s OR b.fiscal_year IS NULL OR b.fiscal_year = '')")
        params.append(year.strip())

    if visibility and visibility.strip().lower() not in ["all", ""]:
        v_clean = visibility.strip().lower()
        if v_clean == 'both':
            where_clauses.append("(m.visibility = 'both' OR m.visibility IS NULL OR m.visibility = '')")
        else:
            where_clauses.append("m.visibility = %s")
            params.append(v_clean)

    if search:
        where_clauses.append("(b.sales_group LIKE %s OR b.range_name LIKE %s OR b.part_no LIKE %s OR b.product_sku LIKE %s OR m.range_name LIKE %s OR m.contract_code LIKE %s)")
        like_str = f"%{search}%"
        params.extend([like_str, like_str, like_str, like_str, like_str, like_str])

    where_sql = (" WHERE " + " AND ".join(where_clauses)) if where_clauses else ""

    with conn.cursor() as cursor:
        cursor.execute(f"""
            SELECT 
                b.id as budget_id,
                b.id as id,
                COALESCE(m.id, 0) as mapping_id,
                TRIM(b.sales_group) as sales_group,
                TRIM(COALESCE(m.range_name, b.range_name)) as range_name,
                TRIM(COALESCE(b.part_no, '')) as part_no,
                TRIM(COALESCE(b.product_sku, '')) as product_sku,
                COALESCE(m.match_type, 'CATALOG_GROUP') as match_type,
                m.contract_code as contract_code,
                COALESCE(m.visibility, 'both') as visibility,
                b.fiscal_year as fiscal_year,
                CASE 
                    WHEN COALESCE(b.total, 0) > 0 OR (b.part_no IS NOT NULL AND b.part_no != '-' AND b.part_no != '' AND b.product_sku != 'Unbudgeted (Excel)') THEN 'Budget'
                    ELSE 'Not in Budget'
                END as upload_status,
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
def create_division_mapping(payload: dict = Body(...)):
    init_division_mappings_table()
    sales_group = str(payload.get("sales_group") or "").strip()
    range_name = str(payload.get("range_name") or "").strip()
    visibility = str(payload.get("visibility") or "both").strip().lower()
    if visibility not in ["both", "total_range", "distri_range"]:
        visibility = "both"

    if not sales_group or not range_name:
        raise HTTPException(status_code=400, detail="Sales group and range name cannot be empty.")

    conn = get_db_connection()
    try:
        with conn.cursor() as cursor:
            cursor.execute("""
                INSERT INTO division_mappings (sales_group, range_name, visibility)
                VALUES (%s, %s, %s)
                ON DUPLICATE KEY UPDATE 
                    range_name = VALUES(range_name),
                    visibility = VALUES(visibility);
            """, (sales_group, range_name, visibility))
            new_id = cursor.lastrowid

            # Also sync total_budget
            try:
                cursor.execute("""
                    UPDATE total_budget
                    SET range_name = %s
                    WHERE LOWER(TRIM(sales_group)) = LOWER(TRIM(%s));
                """, (range_name, sales_group))
            except Exception:
                pass
    finally:
        conn.close()

    return {
        "status": "success",
        "id": new_id,
        "sales_group": sales_group,
        "range_name": range_name,
        "visibility": visibility,
        "message": f"Mapping created/updated for '{sales_group}' -> '{range_name}' (Visibility: {visibility})."
    }


@router.post("/add-sales-group")
def add_new_sales_group(payload: dict = Body(...)):
    init_division_mappings_table()
    sales_group = str(payload.get("sales_group") or "").strip()
    default_range = str(payload.get("default_range") or "Unassigned").strip()
    if not sales_group:
        raise HTTPException(status_code=400, detail="Sales Group name cannot be empty.")

    conn = get_db_connection()
    try:
        with conn.cursor() as cursor:
            cursor.execute("""
                INSERT INTO division_mappings (sales_group, range_name)
                VALUES (%s, %s)
                ON DUPLICATE KEY UPDATE sales_group = VALUES(sales_group);
            """, (sales_group, default_range))
            new_id = cursor.lastrowid
    finally:
        conn.close()

    return {
        "status": "success",
        "id": new_id,
        "sales_group": sales_group,
        "range_name": default_range,
        "message": f"New Sales Group '{sales_group}' added successfully!"
    }


@router.post("/add-range")
def add_new_range(payload: dict = Body(...)):
    init_division_mappings_table()
    range_name = str(payload.get("range_name") or "").strip()
    if not range_name:
        raise HTTPException(status_code=400, detail="Range name cannot be empty.")

    conn = get_db_connection()
    try:
        with conn.cursor() as cursor:
            cursor.execute("""
                INSERT INTO division_mappings (sales_group, range_name)
                VALUES (%s, %s)
                ON DUPLICATE KEY UPDATE range_name = VALUES(range_name);
            """, ("(blank)", range_name))
            new_id = cursor.lastrowid
    finally:
        conn.close()

    return {
        "status": "success",
        "id": new_id,
        "range_name": range_name,
        "message": f"New Range '{range_name}' category registered successfully!"
    }


@router.put("/{mapping_id}")
def update_division_mapping(mapping_id: int, payload: dict = Body(...)):
    sales_group = str(payload.get("sales_group") or "").strip()
    range_name = str(payload.get("range_name") or "").strip()
    visibility = payload.get("visibility")
    if not sales_group or not range_name:
        raise HTTPException(status_code=400, detail="Sales group and range name cannot be empty.")

    conn = get_db_connection()
    try:
        with conn.cursor() as cursor:
            if visibility:
                v_clean = str(visibility).strip().lower()
                cursor.execute("""
                    INSERT INTO division_mappings (sales_group, range_name, visibility)
                    VALUES (%s, %s, %s)
                    ON DUPLICATE KEY UPDATE 
                        range_name = VALUES(range_name),
                        visibility = VALUES(visibility);
                """, (sales_group, range_name, v_clean))
            else:
                # Upsert in division_mappings
                cursor.execute("""
                    INSERT INTO division_mappings (sales_group, range_name)
                    VALUES (%s, %s)
                    ON DUPLICATE KEY UPDATE range_name = VALUES(range_name);
                """, (sales_group, range_name))

            # Update all matching rows in total_budget
            try:
                cursor.execute("""
                    UPDATE total_budget
                    SET range_name = %s
                    WHERE LOWER(TRIM(sales_group)) = LOWER(TRIM(%s));
                """, (range_name, sales_group))
            except Exception:
                pass
    finally:
        conn.close()

    return {
        "status": "success",
        "id": mapping_id,
        "sales_group": sales_group,
        "range_name": range_name,
        "visibility": visibility,
        "message": f"Updated Sales Group '{sales_group}' mapped Range to '{range_name}'."
    }


@router.get("/catalog-groups")
def get_catalog_groups():
    conn = get_db_connection()
    catalog_groups = set()
    with conn.cursor() as cursor:
        try:
            cursor.execute("SELECT DISTINCT TRIM(catalog_group) as cg FROM invoice_output WHERE catalog_group IS NOT NULL AND TRIM(catalog_group) != '';")
            for r in cursor.fetchall():
                if r.get('cg'):
                    catalog_groups.add(r['cg'])
        except Exception:
            pass
        try:
            cursor.execute("SELECT DISTINCT TRIM(catalog_group) as cg FROM outstanding_output WHERE catalog_group IS NOT NULL AND TRIM(catalog_group) != '';")
            for r in cursor.fetchall():
                if r.get('cg'):
                    catalog_groups.add(r['cg'])
        except Exception:
            pass
    conn.close()
    return {"status": "success", "catalog_groups": sorted(list(catalog_groups))}


@router.get("/ranges")
def get_ranges():
    conn = get_db_connection()
    ranges = set()
    with conn.cursor() as cursor:
        try:
            cursor.execute("SELECT DISTINCT TRIM(range_name) as rn FROM division_mappings WHERE range_name IS NOT NULL AND TRIM(range_name) != '' AND range_name != 'Range';")
            for r in cursor.fetchall():
                if r.get('rn'):
                    ranges.add(r['rn'])
        except Exception:
            pass
        try:
            cursor.execute("SELECT DISTINCT TRIM(range_name) as rn FROM total_budget WHERE range_name IS NOT NULL AND TRIM(range_name) != '' AND range_name != 'Range';")
            for r in cursor.fetchall():
                if r.get('rn'):
                    ranges.add(r['rn'])
        except Exception:
            pass
    conn.close()
    return {"status": "success", "ranges": sorted(list(ranges))}


@router.get("/sales-groups")
def get_sales_groups():
    conn = get_db_connection()
    sales_groups = set()
    with conn.cursor() as cursor:
        try:
            cursor.execute("SELECT DISTINCT TRIM(sales_group) as sg FROM total_budget WHERE sales_group IS NOT NULL AND TRIM(sales_group) != '';")
            for r in cursor.fetchall():
                if r.get('sg'):
                    sales_groups.add(r['sg'])
        except Exception:
            pass
        try:
            cursor.execute("SELECT DISTINCT TRIM(sales_group) as sg FROM division_mappings WHERE sales_group IS NOT NULL AND TRIM(sales_group) != '';")
            for r in cursor.fetchall():
                if r.get('sg'):
                    sales_groups.add(r['sg'])
        except Exception:
            pass
    conn.close()
    return {"status": "success", "sales_groups": sorted(list(sales_groups))}


@router.post("/batch-catalog-map")
def batch_catalog_map(payload: dict = Body(...)):
    init_division_mappings_table()
    mappings = payload.get("mappings", [])
    if not mappings or not isinstance(mappings, list):
        raise HTTPException(status_code=400, detail="No mapping records provided.")

    conn = get_db_connection()
    updated_count = 0
    try:
        with conn.cursor() as cursor:
            for item in mappings:
                current_sg = str(item.get("sales_group") or item.get("current_sales_group") or "").strip()
                cat_group = str(item.get("catalog_group") or item.get("new_catalog_group") or "").strip()
                range_name = str(item.get("range_name") or "").strip()
                year = str(item.get("year") or "").strip()

                if not range_name:
                    continue

                # 1. Update / Insert in division_mappings table
                # Ensure the catalog_group maps to range_name
                if cat_group:
                    cursor.execute("""
                        INSERT INTO division_mappings (sales_group, range_name)
                        VALUES (%s, %s)
                        ON DUPLICATE KEY UPDATE range_name = VALUES(range_name);
                    """, (cat_group, range_name))
                    updated_count += 1

                # If current_sg is provided, ensure it maps to range_name as well
                if current_sg:
                    cursor.execute("""
                        INSERT INTO division_mappings (sales_group, range_name)
                        VALUES (%s, %s)
                        ON DUPLICATE KEY UPDATE range_name = VALUES(range_name);
                    """, (current_sg, range_name))
                    updated_count += 1

                # 2. Update total_budget table (Master data for Annual Budget & Map Divisions)
                # When current_sg and cat_group are both provided, update the Sales Group to Catalog Group and set range_name!
                if current_sg and cat_group:
                    if year and year.lower() not in ["all fiscal years", "all", ""]:
                        cursor.execute("""
                            UPDATE total_budget
                            SET sales_group = %s, range_name = %s
                            WHERE LOWER(TRIM(sales_group)) = LOWER(TRIM(%s))
                              AND (fiscal_year = %s OR fiscal_year IS NULL OR fiscal_year = '');
                        """, (cat_group, range_name, current_sg, year))
                    else:
                        cursor.execute("""
                            UPDATE total_budget
                            SET sales_group = %s, range_name = %s
                            WHERE LOWER(TRIM(sales_group)) = LOWER(TRIM(%s));
                        """, (cat_group, range_name, current_sg))
                elif current_sg:
                    # Update range_name for current_sg
                    if year and year.lower() not in ["all fiscal years", "all", ""]:
                        cursor.execute("""
                            UPDATE total_budget
                            SET range_name = %s
                            WHERE LOWER(TRIM(sales_group)) = LOWER(TRIM(%s))
                              AND (fiscal_year = %s OR fiscal_year IS NULL OR fiscal_year = '');
                        """, (range_name, current_sg, year))
                    else:
                        cursor.execute("""
                            UPDATE total_budget
                            SET range_name = %s
                            WHERE LOWER(TRIM(sales_group)) = LOWER(TRIM(%s));
                        """, (range_name, current_sg))
                elif cat_group:
                    # Update range_name for cat_group if it already exists as sales_group in total_budget
                    if year and year.lower() not in ["all fiscal years", "all", ""]:
                        cursor.execute("""
                            UPDATE total_budget
                            SET range_name = %s
                            WHERE LOWER(TRIM(sales_group)) = LOWER(TRIM(%s))
                              AND (fiscal_year = %s OR fiscal_year IS NULL OR fiscal_year = '');
                        """, (range_name, cat_group, year))
                    else:
                        cursor.execute("""
                            UPDATE total_budget
                            SET range_name = %s
                            WHERE LOWER(TRIM(sales_group)) = LOWER(TRIM(%s));
                        """, (range_name, cat_group))
    finally:
        conn.close()

    return {
        "status": "success",
        "message": f"Successfully updated division_mappings & total_budget table with {updated_count} mappings!",
        "updated_count": updated_count
    }


@router.delete("/{mapping_id}")
def delete_division_mapping(mapping_id: int):
    conn = get_db_connection()
    with conn.cursor() as cursor:
        cursor.execute("DELETE FROM division_mappings WHERE id = %s;", (mapping_id,))
    conn.close()
    return {"status": "success", "message": f"Mapping ID {mapping_id} deleted."}


@router.post("/compare-excel")
async def compare_excel_mappings(
    file: UploadFile = File(...),
    year: Optional[str] = Query(None),
    fiscal_year: Optional[str] = Query(None)
):
    """
    Accepts an Excel file with 2 columns: Sales Group and Range.
    Compares the uploaded Sales Groups and Ranges against existing annual budget for the selected Fiscal Year.
    Inserts / Updates division_mappings and adds any unbudgeted rows into total_budget (total = 0).
    Classifies each uploaded record as 'Budget' (in annual budget) or 'Not in Budget' (unbudgeted).
    """
    selected_fy = fiscal_year or year or "FY 2026/27"

    if not file.filename.lower().endswith(('.xlsx', '.xls')):
        raise HTTPException(status_code=400, detail="Invalid file type. Please upload an Excel (.xlsx or .xls) file.")

    try:
        contents = await file.read()
        df = pd.read_excel(io.BytesIO(contents))
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"Failed to read Excel file: {str(e)}")

    if df.empty:
        raise HTTPException(status_code=400, detail="The uploaded Excel file is empty.")

    # Identify columns
    cols = [str(c).strip() for c in df.columns]
    sg_col_idx = None
    rn_col_idx = None

    sg_candidates = ['sales group', 'sales_group', 'salesgroup', 'catalog group', 'catalog_group', 'cataloggroup', 'group', 'sg', 'sales grp']
    rn_candidates = ['range', 'range name', 'range_name', 'rangename', 'division', 'division name', 'division_name', 'parent division', 'parent range']

    for idx, col_name in enumerate(cols):
        clean_name = col_name.lower().replace('_', ' ').strip()
        if any(c == clean_name or c == col_name.lower() for c in sg_candidates) and sg_col_idx is None:
            sg_col_idx = idx
        elif any(c == clean_name or c == col_name.lower() for c in rn_candidates) and rn_col_idx is None:
            rn_col_idx = idx

    # If not identified by name, default to col 0 = Sales Group, col 1 = Range
    if sg_col_idx is None:
        sg_col_idx = 0
    if rn_col_idx is None:
        rn_col_idx = 1 if len(cols) > 1 else 0

    uploaded_rows = []
    seen_pairs = set()

    for row_idx, row in df.iterrows():
        sg_val = str(row.iloc[sg_col_idx]).strip() if pd.notna(row.iloc[sg_col_idx]) else ""
        rn_val = str(row.iloc[rn_col_idx]).strip() if pd.notna(row.iloc[rn_col_idx]) else ""
        
        # Clean string "nan", "None", etc.
        if sg_val.lower() in ["nan", "none", "null", ""]:
            sg_val = ""
        if rn_val.lower() in ["nan", "none", "null", ""]:
            rn_val = ""

        if not sg_val and not rn_val:
            continue

        pair_key = (sg_val.lower(), rn_val.lower())
        if pair_key in seen_pairs:
            continue
        seen_pairs.add(pair_key)

        uploaded_rows.append({
            "row_num": row_idx + 2,
            "sales_group": sg_val,
            "range_name": rn_val
        })

    if not uploaded_rows:
        raise HTTPException(status_code=400, detail="No valid Sales Group or Range rows found in the uploaded file.")

    init_division_mappings_table()
    conn = get_db_connection()
    try:
        with conn.cursor() as cursor:
            # 1. Fetch existing budgeted sales groups for this fiscal year
            cursor.execute("""
                SELECT DISTINCT LOWER(TRIM(sales_group)) as sg, LOWER(TRIM(range_name)) as rn, 
                                COALESCE(SUM(total), 0) as total_amt
                FROM total_budget 
                WHERE sales_group IS NOT NULL AND TRIM(sales_group) != '' 
                  AND (fiscal_year = %s OR fiscal_year IS NULL OR fiscal_year = '')
                  AND product_sku != 'Unbudgeted (Excel)'
                GROUP BY LOWER(TRIM(sales_group)), LOWER(TRIM(range_name));
            """, (selected_fy,))
            budget_rows = cursor.fetchall()
            budgeted_sgs = set(r['sg'] for r in budget_rows if r.get('sg') and float(r.get('total_amt') or 0) > 0)

            # 2. Process each uploaded pair into database
            included_items = []
            not_included_items = []
            all_compared = []

            for item in uploaded_rows:
                sg = item["sales_group"]
                rn = item["range_name"]
                sg_l = sg.lower()

                # Always update division_mappings table
                cursor.execute("""
                    INSERT INTO division_mappings (sales_group, range_name)
                    VALUES (%s, %s)
                    ON DUPLICATE KEY UPDATE range_name = VALUES(range_name);
                """, (sg, rn))

                if sg_l in budgeted_sgs:
                    # Exists with budget > 0 in total_budget
                    cursor.execute("""
                        UPDATE total_budget 
                        SET range_name = %s 
                        WHERE LOWER(TRIM(sales_group)) = LOWER(TRIM(%s)) 
                          AND (fiscal_year = %s OR fiscal_year IS NULL OR fiscal_year = '');
                    """, (rn, sg, selected_fy))

                    record = {
                        "sales_group": sg,
                        "range_name": rn,
                        "status": "Budget",
                        "in_budget": True,
                        "reason": "Found in Annual Budget Master"
                    }
                    included_items.append(record)
                    all_compared.append(record)
                else:
                    # Not in budget -> Insert unbudgeted row into total_budget if not already present
                    cursor.execute("""
                        SELECT id FROM total_budget 
                        WHERE LOWER(TRIM(sales_group)) = LOWER(TRIM(%s))
                          AND (fiscal_year = %s OR fiscal_year IS NULL OR fiscal_year = '')
                        LIMIT 1;
                    """, (sg, selected_fy))
                    existing_row = cursor.fetchone()

                    if existing_row:
                        cursor.execute("""
                            UPDATE total_budget 
                            SET range_name = %s 
                            WHERE id = %s;
                        """, (rn, existing_row['id']))
                    else:
                        cursor.execute("""
                            INSERT INTO total_budget (
                                fiscal_year, sales_group, range_name, part_no, product_sku, 
                                april, may, june, july, august, september, october, november, december, january, february, march, total
                            ) VALUES (
                                %s, %s, %s, '-', 'Unbudgeted (Excel)',
                                0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0
                            );
                        """, (selected_fy, sg, rn))

                    record = {
                        "sales_group": sg,
                        "range_name": rn,
                        "status": "Not in Budget",
                        "in_budget": False,
                        "reason": "Not in Annual Budget (Excel Upload)"
                    }
                    not_included_items.append(record)
                    all_compared.append(record)

        conn.commit()
    finally:
        conn.close()

    return {
        "status": "success",
        "file_name": file.filename,
        "fiscal_year": selected_fy,
        "total_uploaded_rows": len(uploaded_rows),
        "included_count": len(included_items),
        "not_included_count": len(not_included_items),
        "not_included_items": not_included_items,
        "included_items": included_items,
        "all_compared_items": all_compared,
        "message": f"Successfully processed {len(uploaded_rows)} mappings for {selected_fy}! ({len(included_items)} in Budget, {len(not_included_items)} Unbudgeted added to Master)."
    }


@router.post("/bulk-save-unmapped")
def bulk_save_unmapped_mappings(payload: dict = Body(...)):
    """
    Optional helper to save uploaded unmapped/not included items into division_mappings table.
    """
    items = payload.get("items", [])
    fiscal_year = payload.get("fiscal_year") or "FY 2026/27"
    if not items:
        raise HTTPException(status_code=400, detail="No items provided to save.")

    init_division_mappings_table()
    conn = get_db_connection()
    saved_count = 0
    try:
        with conn.cursor() as cursor:
            for item in items:
                sg = str(item.get("sales_group") or "").strip()
                rn = str(item.get("range_name") or "").strip()
                if sg and rn:
                    cursor.execute("""
                        INSERT INTO division_mappings (sales_group, range_name, match_type, contract_code)
                        VALUES (%s, %s, 'CATALOG_GROUP', NULL)
                        ON DUPLICATE KEY UPDATE range_name = VALUES(range_name);
                    """, (sg, rn))

                    cursor.execute("""
                        INSERT INTO total_budget (
                            fiscal_year, sales_group, range_name, part_no, product_sku, 
                            april, may, june, july, august, september, october, november, december, january, february, march, total
                        ) VALUES (
                            %s, %s, %s, '-', 'Unbudgeted (Excel)',
                            0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0
                        )
                        ON DUPLICATE KEY UPDATE range_name = VALUES(range_name);
                    """, (fiscal_year, sg, rn))
                    saved_count += 1
        conn.commit()
    finally:
        conn.close()

    return {
        "status": "success",
        "message": f"Successfully saved {saved_count} unmapped items to Division Mappings & Budget Master!",
        "saved_count": saved_count
    }

