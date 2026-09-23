import glob

files = glob.glob("screens/*.tsx")

replacements = {
    "stylesado": "estado",
    "stylesa": "esta",
    "dstylesructive": "destructive",
    "stylesilos": "estilos",
    "timstylesamp": "timestamp",
    "respustylesa": "respuesta",
    "Prstylesamo": "Prestamo",
    "prstylesamo": "prestamo",
    "stylese": "este"
}

for file in files:
    with open(file, "r") as f:
        content = f.read()
        
    original = content
    for old, new in replacements.items():
        content = content.replace(old, new)
        
    if original != content:
        with open(file, "w") as f:
            f.write(content)
        print(f"Fixed {file}")
