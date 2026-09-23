with open('screens/CalendarioScreen.tsx', 'r') as f:
    c = f.read()

# Fix staticTheme (which was reverted)
c = c.replace("completado: theme.colors.secondary,", "completado: staticTheme.colors.secondary,")

with open('screens/CalendarioScreen.tsx', 'w') as f:
    f.write(c)

