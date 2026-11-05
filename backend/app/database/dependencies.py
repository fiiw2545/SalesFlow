from surrealdb import AsyncSurreal

from app.database.connection import db


def get_db() -> AsyncSurreal:
    return db