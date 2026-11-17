
import boto3

from botocore.config import Config
from botocore.exceptions import BotoCoreError, ClientError

from app.core.config import (
    FILEBASE_ENDPOINT,
    FILEBASE_REGION,
    FILEBASE_BUCKET,
    FILEBASE_ACCESS_KEY,
    FILEBASE_SECRET_KEY,
)


class StorageError(Exception):
    pass


def get_s3_client():
    if not all([
        FILEBASE_BUCKET,
        FILEBASE_ACCESS_KEY,
        FILEBASE_SECRET_KEY,
    ]):
        raise StorageError("Filebase credentials are not configured")

    return boto3.client(
        "s3",
        endpoint_url=FILEBASE_ENDPOINT,
        region_name=FILEBASE_REGION,
        aws_access_key_id=FILEBASE_ACCESS_KEY,
        aws_secret_access_key=FILEBASE_SECRET_KEY,
        config=Config(
            signature_version="s3v4",
        ),
    )


def upload_object(
    storage_key: str,
    content: bytes,
    content_type: str,
):
    try:
        client = get_s3_client()

        client.put_object(
            Bucket=FILEBASE_BUCKET,
            Key=storage_key,
            Body=content,
            ContentType=content_type,
        )

    except (ClientError, BotoCoreError, StorageError) as exc:
        raise StorageError(str(exc)) from exc


def download_object(storage_key: str) -> bytes:
    try:
        client = get_s3_client()

        response = client.get_object(
            Bucket=FILEBASE_BUCKET,
            Key=storage_key,
        )

        return response["Body"].read()

    except (ClientError, BotoCoreError, StorageError) as exc:
        raise StorageError(str(exc)) from exc


def delete_object(storage_key: str):
    try:
        client = get_s3_client()

        client.delete_object(
            Bucket=FILEBASE_BUCKET,
            Key=storage_key,
        )

    except (ClientError, BotoCoreError, StorageError) as exc:
        raise StorageError(str(exc)) from exc
