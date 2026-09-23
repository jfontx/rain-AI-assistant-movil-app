import re

files = [
    "/Users/jfontalvor/Documents/Universidad/semestre3/movil/rain/backend/app/agents/financial.py",
    "/Users/jfontalvor/Documents/Universidad/semestre3/movil/rain/backend/app/agents/secretary.py"
]

for file_path in files:
    with open(file_path, "r") as f:
        content = f.read()

    # Replace duplicate multi-line params
    content = re.sub(
        r"def ([a-zA-Z0-9_]+)\(usuario_id: int, \n    usuario_id: int,", 
        r"def \1(usuario_id: int,", 
        content
    )
    
    # Also fix empty params like `def foo(usuario_id: int, ) -> dict:`
    content = content.replace("usuario_id: int, )", "usuario_id: int)")

    with open(file_path, "w") as f:
        f.write(content)
print("Fixed duplicates")
