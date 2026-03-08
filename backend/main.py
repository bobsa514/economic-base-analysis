"""EconBase API - Interactive Economic Base Analysis.

FastAPI application entry point. Manages the application lifecycle
(startup/shutdown), CORS middleware, and route registration.

Run with: uvicorn main:app --reload --port 8000
"""

import logging
from contextlib import asynccontextmanager
from collections.abc import AsyncIterator

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

import app.dependencies as deps
from app.config import settings
from app.census.client import CensusClient
from app.geography.fips import FIPSLookup
from app.geography.msa import MSALookup
from app.routes import geography, analysis, demographics, metadata

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s [%(levelname)s] %(name)s: %(message)s",
)
logger = logging.getLogger(__name__)


@asynccontextmanager
async def lifespan(app: FastAPI) -> AsyncIterator[None]:
    """Manage application startup and shutdown.

    On startup:
    - Initialize the async HTTP client for Census API calls
    - Download and cache the FIPS county lookup data
    - Download and cache the MSA name lookup data

    On shutdown:
    - Close the HTTP client cleanly
    """
    # --- Startup ---
    logger.info("Starting EconBase API...")

    # Initialize Census API client
    census_client = CensusClient()
    await census_client.startup()
    deps.census_client = census_client

    # Load FIPS data for county geography search
    fips_lookup = FIPSLookup()
    await fips_lookup.load()
    deps.fips_lookup = fips_lookup

    # Load MSA data for metro area geography search
    msa_lookup = MSALookup()
    await msa_lookup.load()
    deps.msa_lookup = msa_lookup

    logger.info("EconBase API ready")

    yield

    # --- Shutdown ---
    logger.info("Shutting down EconBase API...")
    await census_client.shutdown()
    logger.info("EconBase API stopped")


# Create FastAPI application
app = FastAPI(
    title="EconBase API",
    description=(
        "Interactive Economic Base Analysis API. "
        "Provides Location Quotient, Shift-Share, Diversification, "
        "and Economic Base Multiplier analyses using Census Bureau data."
    ),
    version="1.0.0",
    lifespan=lifespan,
    docs_url="/docs",
    redoc_url="/redoc",
)

# CORS middleware - allow all origins for development
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Register route modules
app.include_router(geography.router)
app.include_router(analysis.router)
app.include_router(demographics.router)
app.include_router(metadata.router)


@app.get("/", tags=["Health"])
async def root() -> dict[str, str]:
    """Health check / root endpoint."""
    return {
        "name": "EconBase API",
        "version": "1.0.0",
        "status": "running",
        "docs": "/docs",
    }


@app.get("/health", tags=["Health"])
async def health_check() -> dict[str, str]:
    """Detailed health check verifying dependencies are loaded."""
    fips_ok = deps.fips_lookup is not None and deps.fips_lookup.is_loaded
    msa_ok = deps.msa_lookup is not None and deps.msa_lookup.is_loaded
    census_ok = deps.census_client is not None

    return {
        "status": "healthy" if (fips_ok and census_ok) else "degraded",
        "fips_data": "loaded" if fips_ok else "not loaded",
        "msa_data": "loaded" if msa_ok else "not loaded",
        "census_client": "ready" if census_ok else "not ready",
    }
