import re

with open('screens/CalendarioScreen.tsx', 'r') as f:
    c = f.read()

# Replace est. with styles.
c = c.replace("est.", "styles.")

# Replace const est = StyleSheet.create with const createStyles = (theme: any) => StyleSheet.create
c = c.replace("const styles = StyleSheet.create({", "const createStyles = (theme: any) => StyleSheet.create({")

# Inject const styles = createStyles(theme);
c = re.sub(r"export default function CalendarioScreen\(\) \{", 
           "export default function CalendarioScreen() {\n  const { theme } = useTheme();\n  const styles = createStyles(theme);", c)

with open('screens/CalendarioScreen.tsx', 'w') as f:
    f.write(c)

