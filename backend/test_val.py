from pydantic import BaseModel
from app.db.models import TipoTransaccion
class TCreate(BaseModel):
    tipo: TipoTransaccion
try:
    TCreate(tipo="INVALIDO")
except Exception as e:
    print(e)
