"""
Seeder Module Wrapper (re-exports from app.services.seeder for backward compatibility)
"""
from app.services.seeder import run_seed

def main():
    total = run_seed()
    print(f"Database successfully seeded with {total} records!")

if __name__ == "__main__":
    main()
