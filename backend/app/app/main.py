
import os

from fastapi import FastAPI

import api.v1.api
import api.v2.api

import core.config

name = os.getenv("API_PREFIX") 

app = FastAPI(
    title=core.config.settings.PROJECT_NAME + " " + name,
    openapi_url=f"/api/{name}/openapi.json",
    docs_url=f"/api/{name}/docs",
    redoc=None
)

# default API endpoints
app.include_router(api.v2.api.router, prefix=f"/api/{name}", tags=["current"])

# versioned API endpoints
app.include_router(api.v2.api.router, prefix=f"/api/{name}/v2", tags=["v2"])
app.include_router(api.v1.api.router, prefix=f"/api/{name}/v1", tags=["v1"])



