import os
import glob
import re

routes_dir = "/Users/jfontalvor/Documents/Universidad/semestre3/movil/rain/backend/app/routes"
files = glob.glob(f"{routes_dir}/*.py")

for file in files:
    # Skip auth.py and webhook.py (webhooks are not authenticated by the user)
    if "auth.py" in file or "webhook.py" in file or "asistente.py" in file:
        continue
        
    with open(file, "r") as f:
        content = f.read()
        
    # Check if already patched
    if "get_current_user" in content:
        continue

    # Add imports
    import_block = "from app.core.deps import get_current_user\nfrom app.db.models import Usuario\n"
    content = content.replace("from app.db.session import get_session\n", f"from app.db.session import get_session\n{import_block}")
    
    # Replace function signatures
    # Look for def func_name(..., session: Session = Depends(get_session)):
    content = re.sub(
        r"(def \w+\(.*?)session:\s*Session\s*=\s*Depends\(get_session\)(.*?\):)", 
        r"\1session: Session = Depends(get_session), current_user: Usuario = Depends(get_current_user)\2", 
        content,
        flags=re.DOTALL
    )
    
    # For GET all:
    # return session.exec(select(Model)).all() -> return session.exec(select(Model).where(Model.usuario_id == current_user.id)).all()
    # Let's do it manually since models vary:
    
    with open(file, "w") as f:
        f.write(content)
        
    print(f"Patched {file}")
