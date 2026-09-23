import re

file_path = "/Users/jfontalvor/Documents/Universidad/semestre3/movil/rain/backend/app/agents/email_reader.py"

with open(file_path, "r") as f:
    content = f.read()

content = content.replace("def leer_correos_no_leidos(limite: int = 10) -> List[dict]:", "async def leer_correos_no_leidos(usuario_id: int, limite: int = 10) -> List[dict]:")
# Wait, it's already async. Let's just do regex.
content = re.sub(r"async def ([a-zA-Z0-9_]+)\(\n?", r"async def \1(usuario_id: int, ", content)

content = content.replace("Correo(", "Correo(usuario_id=usuario_id, ")
content = content.replace("select(Correo)", "select(Correo).where(Correo.usuario_id == usuario_id)")

with open(file_path, "w") as f:
    f.write(content)
print("Patched email_reader.py")
