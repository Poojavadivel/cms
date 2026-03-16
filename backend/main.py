import os
from pathlib import Path

from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import FileResponse
from fastapi.staticfiles import StaticFiles

from backend.db import lifespan
from backend.routes.academics.attendance import router as attendance_router
from backend.routes.academics.exams import router as exams_router
from backend.routes.academics.facility import router as facility_router
from backend.routes.academics.placement import router as placement_router
from backend.routes.academics.timetable import router as timetable_router
from backend.routes.notifications_enhanced import router as notifications_enhanced_router
from backend.routes.payroll import router as payroll_router
from backend.routes.staff import router as staff_router
from backend.routes.students import router as students_router
from backend.routes.finance.fees import router as fees_router

PORT = int(os.getenv("PORT", 5000))

app = FastAPI(title="CMS API", lifespan=lifespan)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# -------------------------------
# Serve Vite Frontend
# -------------------------------

BASE_DIR = Path(__file__).resolve().parent.parent
DIST_DIR = BASE_DIR / "dist"
DIST_ASSETS_DIR = DIST_DIR / "assets"
DIST_INDEX_FILE = DIST_DIR / "index.html"

if DIST_ASSETS_DIR.exists():
    app.mount("/assets", StaticFiles(directory=str(DIST_ASSETS_DIR)), name="assets")


@app.get("/")
async def serve_frontend():
    if DIST_INDEX_FILE.exists():
        return FileResponse(str(DIST_INDEX_FILE))
    return {
        "message": "Frontend build not found. Run `npm run build` to serve static UI from FastAPI, or run Vite dev server for frontend development."
    }

app.include_router(staff_router)
app.include_router(payroll_router)
app.include_router(exams_router)
app.include_router(timetable_router)
app.include_router(attendance_router)
app.include_router(placement_router)
app.include_router(facility_router)
app.include_router(notifications_enhanced_router)
app.include_router(fees_router)
app.include_router(students_router)


@app.get("/{full_path:path}")
async def serve_react_app(full_path: str):
    if full_path.startswith("api") or full_path.startswith("docs"):
        raise HTTPException(status_code=404)
    if DIST_INDEX_FILE.exists():
        return FileResponse(str(DIST_INDEX_FILE))
    raise HTTPException(status_code=404, detail="Frontend build not found")


if __name__ == "__main__":
    import uvicorn

    uvicorn.run("backend.main:app", host="0.0.0.0", port=PORT)
