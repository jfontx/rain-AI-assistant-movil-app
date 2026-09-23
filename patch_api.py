import re

file_path = "/Users/jfontalvor/Documents/Universidad/semestre3/movil/rain/services/api.ts"

with open(file_path, "r") as f:
    content = f.read()

# Replace all occurrences of `{ 'Content-Type': 'application/json' }` with `getHeaders()`
content = content.replace("{ 'Content-Type': 'application/json' }", "getHeaders()")

# For GET requests that don't have headers yet:
# const resp = await fetch(`${BASE_URL}/api/transacciones/`); -> const resp = await fetch(`${BASE_URL}/api/transacciones/`, { headers: getHeaders() });
content = re.sub(
    r"await fetch\((`\$\{BASE_URL\}[^`]+`)\);",
    r"await fetch(\1, { headers: getHeaders() });",
    content
)

# Also fix the one without template literals if any (e.g. url variable)
content = re.sub(
    r"await fetch\((url)\);",
    r"await fetch(\1, { headers: getHeaders() });",
    content
)

# And DELETE requests
content = re.sub(
    r"\{ method: 'DELETE' \}",
    r"{ method: 'DELETE', headers: getHeaders() }",
    content
)

with open(file_path, "w") as f:
    f.write(content)
print("Patched api.ts")
