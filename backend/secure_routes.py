import os
import glob
import re

routes_dir = "/Users/jfontalvor/Documents/Universidad/semestre3/movil/rain/backend/app/routes"
files = glob.glob(f"{routes_dir}/*.py")

for file in files:
    if "auth.py" in file or "webhook.py" in file or "webhooks.py" in file or "asistente.py" in file or "__init__.py" in file:
        continue
        
    with open(file, "r") as f:
        content = f.read()

    # Find the model name being used. Look for `class ModelCreate(SQLModel):` or `session.exec(select(Model))`
    match = re.search(r"select\(([A-Z][a-zA-Z]+)\)", content)
    if not match:
        continue
    model_name = match.group(1)
    
    # 1. Update GET all: select(Model) -> select(Model).where(Model.usuario_id == current_user.id)
    content = re.sub(
        r"select\(" + model_name + r"\)(?!.where)",
        f"select({model_name}).where({model_name}.usuario_id == current_user.id)",
        content
    )
    
    # 2. Update GET by ID, PUT, DELETE: session.get(Model, id) -> session.exec(select(Model).where(Model.id == id, Model.usuario_id == current_user.id)).first()
    # Or simply check after get:
    # item = session.get(Model, id)
    # if not item or item.usuario_id != current_user.id:
    #     raise HTTPException(404)
    content = re.sub(
        r"(\w+)\s*=\s*session\.get\(" + model_name + r",\s*(\w+)\)\n\s*if not \1:",
        r"\1 = session.get(" + model_name + r", \2)\n    if not \1 or \1.usuario_id != current_user.id:",
        content
    )

    # 3. Update POST: Model(**datos.model_dump()) -> Model(**datos.model_dump(), usuario_id=current_user.id)
    content = re.sub(
        r"" + model_name + r"\(\*\*datos\.model_dump\(\)\)",
        f"{model_name}(**datos.model_dump(), usuario_id=current_user.id)",
        content
    )

    with open(file, "w") as f:
        f.write(content)
        
    print(f"Secured {file} with model {model_name}")
