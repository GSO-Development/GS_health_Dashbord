from fastapi import APIRouter
from app.services.seeder import run_seed

router = APIRouter(prefix="/api", tags=["Seeding"])

@router.post("/seed")
def seed_db_endpoint():
    try:
        total = run_seed()
        return {"status": "success", "message": f"Database successfully re-seeded ({total} records)!"}
    except Exception as e:
        return {"status": "error", "message": str(e)}
