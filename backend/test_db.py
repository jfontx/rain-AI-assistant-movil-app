from sqlmodel import Session, select
from app.db.session import engine
from app.db.models import TarjetaCredito

try:
    with Session(engine) as session:
        result = session.exec(select(TarjetaCredito)).all()
        print("Success:", result)
except Exception as e:
    print("Database error:", e)
