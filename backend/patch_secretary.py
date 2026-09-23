import re

file_path = "/Users/jfontalvor/Documents/Universidad/semestre3/movil/rain/backend/app/agents/secretary.py"

with open(file_path, "r") as f:
    content = f.read()

content = re.sub(r"def ([a-zA-Z0-9_]+)\(\n", r"def \1(\n    usuario_id: int,\n", content)
content = re.sub(r"def ([a-zA-Z0-9_]+)\((?!usuario_id)", r"def \1(usuario_id: int, ", content)

content = content.replace("Evento(", "Evento(usuario_id=usuario_id, ")
content = content.replace("Correo(", "Correo(usuario_id=usuario_id, ")

content = content.replace("select(Evento)", "select(Evento).where(Evento.usuario_id == usuario_id)")
content = content.replace("select(Correo)", "select(Correo).where(Correo.usuario_id == usuario_id)")

with open(file_path, "w") as f:
    f.write(content)
print("Patched secretary.py")
