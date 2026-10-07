"""SQLAlchemy engine + session factory for SQLite."""
import os
import shutil
import tempfile
from pathlib import Path
from sqlalchemy import create_engine
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker

BASE_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
ORIGINAL_DB_PATH = os.path.join(BASE_DIR, "prahari.db")

IS_VERCEL = bool(os.environ.get("VERCEL") or os.environ.get("AWS_LAMBDA_FUNCTION_NAME"))


def _is_writable_dir(path: str) -> bool:
    try:
        test_path = os.path.join(path, f".test_perm_{os.getpid()}")
        with open(test_path, "w") as f:
            f.write("ok")
        os.remove(test_path)
        return True
    except Exception:
        return False


def _resolve_db_path() -> str:
    # In Vercel or Lambda, or if BASE_DIR is read-only, copy prahari.db to /tmp
    if IS_VERCEL or not _is_writable_dir(BASE_DIR):
        tmp_dir = Path(tempfile.gettempdir())
        tmp_db = tmp_dir / "prahari.db"

        orig_file = Path(ORIGINAL_DB_PATH)
        if orig_file.exists():
            orig_size = orig_file.stat().st_size
            if not tmp_db.exists() or tmp_db.stat().st_size < orig_size:
                try:
                    shutil.copyfile(str(orig_file), str(tmp_db))
                    print(f"[database] Copied {orig_size} bytes to {tmp_db} for writable access")
                except Exception as e:
                    print(f"[database] Error copying DB to {tmp_db}: {e}")
        return str(tmp_db)

    return ORIGINAL_DB_PATH


DB_PATH = _resolve_db_path()
DATABASE_URL = f"sqlite:///{DB_PATH}"

engine = create_engine(
    DATABASE_URL,
    connect_args={"check_same_thread": False, "timeout": 30},
    echo=False,
)

SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
Base = declarative_base()


def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

