from surrealdb import AsyncSurreal

from app.core.config import (
    SURREALDB_URL,
    SURREALDB_USERNAME,
    SURREALDB_PASSWORD,
    SURREALDB_NAMESPACE,
    SURREALDB_DATABASE,
)

# สร้าง Database Client
db = AsyncSurreal(SURREALDB_URL)


async def connect_db():
    await db.connect()

    await db.signin({
        "username": SURREALDB_USERNAME,
        "password": SURREALDB_PASSWORD,
    })

    await db.use(
        SURREALDB_NAMESPACE,
        SURREALDB_DATABASE,
    )

    print("========== DATABASE CONFIG ==========")
    print("Namespace:", SURREALDB_NAMESPACE)
    print("Database:", SURREALDB_DATABASE)
    print("=====================================")

    return db


async def close_db():
    await db.close()