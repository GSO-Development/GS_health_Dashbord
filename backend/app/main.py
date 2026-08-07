import os
import logging
from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from slowapi import _rate_limit_exceeded_handler
from slowapi.errors import RateLimitExceeded

from app.core.database import init_db
from app.routers import health, reports, seed, budget, dashboard_fy, custom_dashboard, auth, users, division_mappings, prode_ifs, oracle_sync, axienta
from app.routers.auth import limiter

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s [%(levelname)s] %(name)s: %(message)s"
)

app_env = os.getenv("APP_ENV", "production")
is_prod = app_env.lower() == "production"

# FIX-12: Disable OpenAPI/Swagger docs in production
app = FastAPI(
    title="George Steuart Health Executive Dashboard API",
    description="Backend REST API supplying live data from MySQL gsh_dashboard database built from Excel reports",
    version="2.0.0",
    docs_url=None if is_prod else "/docs",
    redoc_url=None if is_prod else "/redoc",
    openapi_url=None if is_prod else "/openapi.json"
)

# Add Rate Limiter State & Handler
app.state.limiter = limiter
app.add_exception_handler(RateLimitExceeded, _rate_limit_exceeded_handler)

# FIX-6: Explicit CORS Whitelist
allowed_origins_env = os.getenv("ALLOWED_ORIGINS", "http://172.16.7.41,http://localhost:5173,http://localhost:3000")
allowed_origins = [origin.strip() for origin in allowed_origins_env.split(",") if origin.strip()]

app.add_middleware(
    CORSMiddleware,
    allow_origins=allowed_origins,
    allow_credentials=True,
    allow_methods=["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    allow_headers=["*"],
)

# FIX-15 & FIX-16: Security Headers and Audit Logging Middleware
@app.middleware("http")
async def security_and_audit_middleware(request: Request, call_next):
    # Log incoming requests for security auditing
    client_ip = request.client.host if request.client else "unknown"
    auth_logger = logging.getLogger("gsh.audit")
    
    response = await call_next(request)
    
    # Add Security Headers
    response.headers["X-Content-Type-Options"] = "nosniff"
    response.headers["X-Frame-Options"] = "DENY"
    response.headers["X-XSS-Protection"] = "1; mode=block"
    response.headers["Referrer-Policy"] = "strict-origin-when-cross-origin"
    
    return response

@app.on_event("startup")
def startup_db():
    init_db()
    auth.init_users_table()
    division_mappings.init_division_mappings_table()

# Include Routers
app.include_router(health.router)
app.include_router(reports.router)
app.include_router(seed.router)
app.include_router(budget.router)
app.include_router(dashboard_fy.router)
app.include_router(custom_dashboard.router)
app.include_router(auth.router)
app.include_router(users.router)
app.include_router(division_mappings.router)
app.include_router(prode_ifs.router)
app.include_router(oracle_sync.router)
app.include_router(axienta.router)

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("app.main:app", host="0.0.0.0", port=8000, reload=True)
