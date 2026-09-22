from typing import Optional, List, Dict
from fastapi import APIRouter, HTTPException, Query, Body, UploadFile, File, Form
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
                is_uploaded TINYINT(1) DEFAULT 0,
                updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
                UNIQUE KEY uk_sales_group_only (sales_group)
            ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
        """)

        try:
            cursor.execute("ALTER TABLE division_mappings ADD COLUMN is_uploaded TINYINT(1) DEFAULT 0;")
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


@router.put("/update-matching")
def update_matching_field(payload: dict = Body(...)):
    init_division_mappings_table()
    sales_group = str(payload.get("sales_group") or "").strip()
    range_name = str(payload.get("range_name") or "").strip()
    match_type = str(payload.get("match_type") or "CATALOG_GROUP").strip().upper()
    contract_code = payload.get("contract_code")
    if contract_code:
        contract_code = str(contract_code).strip().upper()
    else:
        contract_code = None

    if not sales_group:
        raise HTTPException(status_code=400, detail="Sales group cannot be empty.")

    if match_type not in ["CATALOG_GROUP", "CONTRACT", "CATALOG_NO"]:
        match_type = "CATALOG_GROUP"

    conn = get_db_connection()
    with conn.cursor() as cursor:
        if range_name:
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
        "contract_code": contract_code
    }


@router.get("/stats")
def get_mapping_stats():
    init_division_mappings_table()
    conn = get_db_connection()
    with conn.cursor() as cursor:
        # Total unique Sales Groups in total_budget and division_mappings
        cursor.execute("""
            SELECT COUNT(DISTINCT sg) as cnt FROM (
                SELECT TRIM(sales_group) as sg FROM total_budget WHERE sales_group IS NOT NULL AND TRIM(sales_group) != ''
                UNION
                SELECT TRIM(sales_group) as sg FROM division_mappings WHERE sales_group IS NOT NULL AND TRIM(sales_group) != ''
            ) t;
        """)
        tb_sg_count = cursor.fetchone()['cnt'] or 0

        # Total unique Ranges in division_mappings and total_budget
        cursor.execute("""
            SELECT COUNT(DISTINCT rn) as cnt FROM (
                SELECT TRIM(range_name) as rn FROM division_mappings WHERE range_name IS NOT NULL AND TRIM(range_name) != ''
                UNION
                SELECT TRIM(range_name) as rn FROM total_budget WHERE range_name IS NOT NULL AND TRIM(range_name) != ''
            ) t;
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

        # Total items count in total_budget
        cursor.execute("SELECT COUNT(*) as cnt FROM total_budget;")
        total_items_cnt = cursor.fetchone()['cnt'] or 0

        # Upload Not Included count (Sales Groups in division_mappings not in total_budget)
        cursor.execute("""
            SELECT COUNT(DISTINCT m.sales_group) as not_in_budget_cnt
            FROM division_mappings m
            WHERE LOWER(TRIM(m.sales_group)) NOT IN (
                SELECT DISTINCT LOWER(TRIM(sales_group)) 
                FROM total_budget 
                WHERE sales_group IS NOT NULL AND TRIM(sales_group) != ''
            ) AND m.sales_group != '(blank)';
        """)
        nib_row = cursor.fetchone()
        not_in_budget_cnt = nib_row['not_in_budget_cnt'] or 0

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
        "not_in_budget_count": not_in_budget_cnt,
        "total_items": total_items_cnt + not_in_budget_cnt,
        "unmapped_list": unmapped_list
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


@router.post("/upload-excel")
async def upload_excel_mappings(file: UploadFile = File(...)):
    import pandas as pd
    import io

    init_division_mappings_table()
    
    filename = file.filename or ""
    if not filename.lower().endswith(('.xlsx', '.xls', '.csv')):
        raise HTTPException(status_code=400, detail="Invalid file format. Please upload an Excel (.xlsx, .xls) or CSV file.")
        
    content = await file.read()
    try:
        if filename.lower().endswith('.csv'):
            df = pd.read_csv(io.BytesIO(content))
        else:
            df = pd.read_excel(io.BytesIO(content))
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"Failed to read file: {str(e)}")

    if df.empty:
        raise HTTPException(status_code=400, detail="The uploaded Excel file is empty.")

    # Detect Sales Group and Range columns
    sg_col = None
    range_col = None

    for col in df.columns:
        c_clean = str(col).strip().lower().replace('_', ' ').replace('-', ' ')
        if c_clean in ['sales group', 'salesgroup', 'group', 's grp', 'catalog group', 'cataloggroup']:
            sg_col = col
            break
    if not sg_col:
        for col in df.columns:
            c_clean = str(col).strip().lower()
            if 'sales' in c_clean or 'group' in c_clean:
                sg_col = col
                break

    for col in df.columns:
        c_clean = str(col).strip().lower().replace('_', ' ').replace('-', ' ')
        if c_clean in ['range', 'range name', 'rangename', 'division', 'division name', 'parent division', 'parent range']:
            range_col = col
            break
    if not range_col:
        for col in df.columns:
            c_clean = str(col).strip().lower()
            if 'range' in c_clean or 'div' in c_clean:
                range_col = col
                break

    if not sg_col or not range_col:
        if len(df.columns) >= 2:
            sg_col = df.columns[0]
            range_col = df.columns[1]
        else:
            raise HTTPException(status_code=400, detail=f"Could not identify 'Sales Group' and 'Range' columns. Detected columns: {list(df.columns)}")

    conn = get_db_connection()
    in_budget_count = 0
    not_in_budget_count = 0
    not_in_budget_items = []
    in_budget_items = []
    total_valid_rows = 0

    try:
        with conn.cursor() as cursor:
            # Fetch all distinct sales groups in total_budget
            cursor.execute("SELECT DISTINCT LOWER(TRIM(sales_group)) as sg FROM total_budget WHERE sales_group IS NOT NULL AND TRIM(sales_group) != '';")
            budget_sgs = {r['sg'] for r in cursor.fetchall() if r.get('sg')}

            for _, row in df.iterrows():
                val_sg = row[sg_col]
                val_rn = row[range_col]

                if pd.isna(val_sg) or pd.isna(val_rn):
                    continue

                sg_str = str(val_sg).strip()
                rn_str = str(val_rn).strip()

                if not sg_str or not rn_str or sg_str.lower() in ['nan', 'none', 'null', ''] or rn_str.lower() in ['nan', 'none', 'null', '']:
                    continue

                total_valid_rows += 1
                sg_key = sg_str.lower()

                if sg_key in budget_sgs:
                    in_budget_count += 1
                    in_budget_items.append({'sales_group': sg_str, 'range_name': rn_str})
                    cursor.execute("""
                        INSERT INTO division_mappings (sales_group, range_name, match_type, is_uploaded)
                        VALUES (%s, %s, 'CATALOG_GROUP', 0)
                        ON DUPLICATE KEY UPDATE range_name = VALUES(range_name);
                    """, (sg_str, rn_str))
                else:
                    not_in_budget_count += 1
                    not_in_budget_items.append({'sales_group': sg_str, 'range_name': rn_str})
                    cursor.execute("""
                        INSERT INTO division_mappings (sales_group, range_name, match_type, is_uploaded)
                        VALUES (%s, %s, 'CATALOG_GROUP', 1)
                        ON DUPLICATE KEY UPDATE range_name = VALUES(range_name), is_uploaded = 1;
                    """, (sg_str, rn_str))
        conn.commit()
    finally:
        conn.close()

    return {
        "status": "success",
        "message": f"Excel Upload Complete: {not_in_budget_count} unbudgeted groups added to mappings, {in_budget_count} existing budget groups recognized.",
        "total_rows": total_valid_rows,
        "in_budget_count": in_budget_count,
        "not_in_budget_count": not_in_budget_count,
        "not_in_budget_items": not_in_budget_items[:50],
        "in_budget_items": in_budget_items[:50]
    }


@router.get("")
def list_division_mappings(
    search: Optional[str] = Query(None),
    year: Optional[str] = Query(None),
    upload_status: Optional[str] = Query(None)
):
    init_division_mappings_table()
    conn = get_db_connection()

    with conn.cursor() as cursor:
        cursor.execute("""
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
                'Included' as upload_status,
                DATE_FORMAT(COALESCE(m.updated_at, NOW()), '%Y-%m-%d %H:%i') as updated_at
            FROM total_budget b
            LEFT JOIN division_mappings m ON LOWER(TRIM(b.sales_group)) = LOWER(TRIM(m.sales_group))
            
            UNION ALL
            
            SELECT 
                0 as budget_id,
                m.id + 1000000 as id,
                m.id as mapping_id,
                TRIM(m.sales_group) as sales_group,
                TRIM(m.range_name) as range_name,
                '-' as part_no,
                'Uploaded Mapping (Not in Budget)' as product_sku,
                COALESCE(m.match_type, 'CATALOG_GROUP') as match_type,
                m.contract_code as contract_code,
                'Not Included' as upload_status,
                DATE_FORMAT(COALESCE(m.updated_at, NOW()), '%Y-%m-%d %H:%i') as updated_at
            FROM division_mappings m
            WHERE LOWER(TRIM(m.sales_group)) NOT IN (
                SELECT DISTINCT LOWER(TRIM(sales_group)) 
                FROM total_budget 
                WHERE sales_group IS NOT NULL AND TRIM(sales_group) != ''
            ) AND m.sales_group != '(blank)'
            ORDER BY id ASC;
        """)
        all_rows = cursor.fetchall()
    conn.close()

    if upload_status:
        st_filter = upload_status.lower().strip()
        all_rows = [r for r in all_rows if (r.get('upload_status') or '').lower().strip() == st_filter]

    if search:
        st = search.lower().strip()
        all_rows = [
            r for r in all_rows if (
                st in (r.get('sales_group') or '').lower() or
                st in (r.get('range_name') or '').lower() or
                st in (r.get('part_no') or '').lower() or
                st in (r.get('product_sku') or '').lower() or
                st in (r.get('contract_code') or '').lower() or
                st in (r.get('upload_status') or '').lower() or
                st in str(r.get('id') or '')
            )
        ]

    return {"status": "success", "total": len(all_rows), "data": all_rows}


@router.post("")
def create_division_mapping(payload: dict = Body(...)):
    init_division_mappings_table()
    sales_group = str(payload.get("sales_group") or "").strip()
    range_name = str(payload.get("range_name") or "").strip()
    if not sales_group or not range_name:
        raise HTTPException(status_code=400, detail="Sales group and range name cannot be empty.")

    conn = get_db_connection()
    try:
        with conn.cursor() as cursor:
            cursor.execute("""
                INSERT INTO division_mappings (sales_group, range_name)
                VALUES (%s, %s)
                ON DUPLICATE KEY UPDATE range_name = VALUES(range_name);
            """, (sales_group, range_name))
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
        "message": f"Mapping created/updated for '{sales_group}' -> '{range_name}'."
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
    if not sales_group or not range_name:
        raise HTTPException(status_code=400, detail="Sales group and range name cannot be empty.")

    conn = get_db_connection()
    try:
        with conn.cursor() as cursor:
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
