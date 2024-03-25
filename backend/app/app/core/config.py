from pydantic import PostgresDsn, validator
from pydantic_settings import SettingsConfigDict, BaseSettings

from typing import Any, Optional, Dict
from urllib.parse import quote

class Settings(BaseSettings):
    PROJECT_NAME: str = 'Descriptor Libraries API'

    POSTGRES_SERVER: str
    POSTGRES_USER: str
    POSTGRES_PASSWD: str
    POSTGRES_DB: str
    SQLALCHEMY_DATABASE_URI: Optional[PostgresDsn] = None

    # TODO[pydantic]: We couldn't refactor the `validator`, please replace it by `field_validator` manually.
    # Check https://docs.pydantic.dev/dev-v2/migration/#changes-to-validators for more information.
    @validator("SQLALCHEMY_DATABASE_URI", pre=True)
    def assemble_db_connection(cls, v: Optional[str], values: Dict[str, Any]) -> Any:
        if isinstance(v, str):
            return v
        return PostgresDsn.build(
            scheme="postgresql",
            username=values.get("POSTGRES_USER"),
            password=quote(values.get("POSTGRES_PASSWD")),
            host=values.get("POSTGRES_SERVER"),
            path=f"{values.get('POSTGRES_DB') or ''}"
        )
    model_config = SettingsConfigDict(case_sensitive=True)


settings = Settings()
