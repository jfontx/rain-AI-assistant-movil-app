import re

file_path = "/Users/jfontalvor/Documents/Universidad/semestre3/movil/rain/backend/app/agents/financial.py"

with open(file_path, "r") as f:
    content = f.read()

# For every function definition `def function_name(..., kwargs):`
# we will inject `usuario_id: int, ` as the first parameter.
# But actually, order matters. Let's just put it as the first parameter to be safe.
# def func_name(
# -> def func_name(usuario_id: int, 

# For single line: def func_name(...) -> dict:
# -> def func_name(usuario_id: int, ...) -> dict:
content = re.sub(r"def ([a-zA-Z0-9_]+)\(\n", r"def \1(\n    usuario_id: int,\n", content)
content = re.sub(r"def ([a-zA-Z0-9_]+)\((?!usuario_id)", r"def \1(usuario_id: int, ", content)

# Then fix the queries and insertions.
# Transaccion( -> Transaccion(usuario_id=usuario_id, 
content = content.replace("Transaccion(", "Transaccion(usuario_id=usuario_id, ")
content = content.replace("MetaAhorro(", "MetaAhorro(usuario_id=usuario_id, ")
content = content.replace("TarjetaCredito(", "TarjetaCredito(usuario_id=usuario_id, ")
content = content.replace("Prestamo(", "Prestamo(usuario_id=usuario_id, ")
content = content.replace("GastoFijo(", "GastoFijo(usuario_id=usuario_id, ")

# Queries
# select(Model) -> select(Model).where(Model.usuario_id == usuario_id)
# This is tricky because we have `select(Transaccion)`, `select(MetaAhorro)`.
content = content.replace("select(Transaccion)", "select(Transaccion).where(Transaccion.usuario_id == usuario_id)")
content = content.replace("select(MetaAhorro)", "select(MetaAhorro).where(MetaAhorro.usuario_id == usuario_id)")
content = content.replace("select(TarjetaCredito)", "select(TarjetaCredito).where(TarjetaCredito.usuario_id == usuario_id)")
content = content.replace("select(Prestamo)", "select(Prestamo).where(Prestamo.usuario_id == usuario_id)")
content = content.replace("select(GastoFijo)", "select(GastoFijo).where(GastoFijo.usuario_id == usuario_id)")

with open(file_path, "w") as f:
    f.write(content)
print("Patched financial.py")
