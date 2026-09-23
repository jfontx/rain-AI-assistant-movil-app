import re

# Fix TareasScreen
with open('screens/TareasScreen.tsx', 'r') as f:
    c = f.read()
# Add staticTheme import
c = re.sub(r"import \{ useTheme \} from '\.\./context/ThemeContext';", "import { useTheme } from '../context/ThemeContext';\nimport { theme as staticTheme } from '../theme';", c)
# Fix PRIORIDAD_COLOR
c = c.replace('theme.colors.error', 'staticTheme.colors.error')
c = c.replace('theme.colors.tertiary', 'staticTheme.colors.tertiary')
c = c.replace('theme.colors.primary', 'staticTheme.colors.primary')
with open('screens/TareasScreen.tsx', 'w') as f:
    f.write(c)


# Fix FinanzasScreen
with open('screens/FinanzasScreen.tsx', 'r') as f:
    c = f.read()
c = re.sub(r"import \{ useTheme \} from '\.\./context/ThemeContext';", "import { useTheme } from '../context/ThemeContext';\nimport { theme as staticTheme } from '../theme';", c)
c = c.replace('otro: theme.colors.outline', 'otro: staticTheme.colors.outline')
# Fix est. to styles. (only the ones missed)
c = c.replace('est.inputModal', 'styles.inputModal')
c = c.replace('est.filaBotones', 'styles.filaBotones')
c = c.replace('est.btnCancelar', 'styles.btnCancelar')
c = c.replace('est.textoCancelar', 'styles.textoCancelar')
c = c.replace('est.btnGuardar', 'styles.btnGuardar')
c = c.replace('est.textoGuardar', 'styles.textoGuardar')
with open('screens/FinanzasScreen.tsx', 'w') as f:
    f.write(c)


# Fix CalendarioScreen
with open('screens/CalendarioScreen.tsx', 'r') as f:
    c = f.read()
c = re.sub(r"import \{ useTheme \} from '\.\./context/ThemeContext';", "import { useTheme } from '../context/ThemeContext';\nimport { theme as staticTheme } from '../theme';", c)
c = c.replace('theme.colors.outline', 'staticTheme.colors.outline')
c = c.replace('theme.colors.primary', 'staticTheme.colors.primary')
c = c.replace('theme.colors.tertiary', 'staticTheme.colors.tertiary')
c = c.replace('theme.colors.error', 'staticTheme.colors.error')
# Wait, inside the component we want theme.colors.outline, but globally staticTheme.
# Let's be careful: ESTADO_COLOR is global.
with open('screens/CalendarioScreen.tsx', 'w') as f:
    f.write(c)


# Fix ChatScreen
with open('screens/ChatScreen.tsx', 'r') as f:
    c = f.read()
# Replace const estilos = StyleSheet.create with createStyles
c = c.replace("const estilos = StyleSheet.create({", "const createStyles = (theme: any) => StyleSheet.create({")
# In component: const styles = createStyles(theme); -> const estilos = createStyles(theme);
c = c.replace("const styles = createStyles(theme);", "const estilos = createStyles(theme);")
with open('screens/ChatScreen.tsx', 'w') as f:
    f.write(c)

print("Fixed files")
