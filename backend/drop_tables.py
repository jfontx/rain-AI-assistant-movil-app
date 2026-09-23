import sys
import os
sys.path.insert(0, os.path.abspath(os.path.dirname(__file__)))

from app.db.session import engine
from app.db.models import SQLModel

def run():
    print("Dropping all tables from database...")
    SQLModel.metadata.drop_all(engine)
    print("Done dropping tables.")
    
if __name__ == "__main__":
    run()
