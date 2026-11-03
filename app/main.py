from contextlib import asynccontextmanager
from fastapi import FastAPI, Depends
from surrealdb import AsyncSurreal

from app.database.connection import connect_db, close_db
from app.database.dependencies import get_db
from app.modules.contacts.router import router as contact_router
from app.modules.auth.router import router as auth_router


@asynccontextmanager
async def lifespan(app: FastAPI):
    await connect_db()
    print("SurrealDB connected!")
    yield
    await close_db()
    print("SurrealDB disconnected!")


app = FastAPI(
    title="SalesFlow CRM API",
    description="REST API for SalesFlow CRM",
    version="1.0.0",
    lifespan=lifespan
)

app.include_router(contact_router)
app.include_router(auth_router)

@app.get("/db-version", tags=["Database"])
async def get_db_version(
    db: AsyncSurreal = Depends(get_db)
):
    info = await db.query("INFO FOR DB;")
    version = await db.version()

    return {
        "message": "Database connection successful",
        "version": version,
        "database_info": info
    }

@app.get("/db-info", tags=["Database"])
async def get_db_info(
    db: AsyncSurreal = Depends(get_db)
):
    database_info = await db.query(
        "INFO FOR DB"
    )

    contacts = await db.query(
        "SELECT * FROM contacts"
    )

    return {
        "database_info": database_info,
        "contacts": contacts
    }