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
    # เปิดการเชื่อมต่อ
    await db.connect()

    # Login ด้วย Root Credentials
    await db.signin({
        "username": SURREALDB_USERNAME,
        "password": SURREALDB_PASSWORD,
    })

    # เลือก Namespace และ Database
    await db.use(
        SURREALDB_NAMESPACE,
        SURREALDB_DATABASE,
    )

    return db


async def close_db():
    await db.close()