from app.db.session import engine
from sqlmodel import Session
from app.db.models import Usuario
from app.core.security import get_password_hash, create_access_token

try:
    with Session(engine) as session:
        print("Intentando hacer hash...")
        hashed = get_password_hash("123456")
        print("Hash:", hashed)
        
        print("Intentando generar token...")
        token = create_access_token(1)
        print("Token:", token)
except Exception as e:
    import traceback
    traceback.print_exc()
