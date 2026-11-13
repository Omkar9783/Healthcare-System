import os
from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from app.config import PORT, HOST, AI_SERVICE_API_KEY
from app.api.routes import router as api_router

app = FastAPI(
    title="MediSecure AI Document Verification Service",
    description="AI-powered identity verification service using YOLO11, OCR, and UIDAI/RCMS compliance pipelines.",
    version="1.0.0"
)

# Enable CORS for MediSecure client and server
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Global Exception Handler
@app.exception_handler(Exception)
async def global_exception_handler(request: Request, exc: Exception):
    print(f"❌ AI Service Error on {request.url.path}: {exc}")
    return JSONResponse(
        status_code=500,
        content={
            "success": False,
            "error": "Internal AI Service Error",
            "message": str(exc)
        }
    )

app.include_router(api_router)

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("app.main:app", host=HOST, port=PORT, reload=True)
