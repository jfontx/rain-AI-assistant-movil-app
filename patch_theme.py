import os
import glob
import re

files = glob.glob("screens/*.tsx") + glob.glob("components/*.tsx")

for file in files:
    with open(file, 'r') as f:
        content = f.read()
    
    if "useTheme" in content:
        continue
        
    # 1. Replace import { theme } from '../theme'
    # Wait, some components might use '../../theme' or just './theme'
    content = re.sub(
        r"import \{ theme \} from '[\./]+theme';",
        "import { useTheme } from '../context/ThemeContext';",
        content
    )
    
    # 2. Add hook inside the main component
    # Usually it's export default function ScreenName
    content = re.sub(
        r"(export default function \w+\(.*?\)\s*\{)",
        r"\1\n  const { theme } = useTheme();\n  const styles = createStyles(theme);",
        content
    )
    
    # Some components might use const Component = () => {}
    content = re.sub(
        r"(export const \w+\s*=\s*\(.*?\)\s*=>\s*\{)",
        r"\1\n  const { theme } = useTheme();\n  const styles = createStyles(theme);",
        content
    )
    
    # 3. Change const styles = StyleSheet.create
    content = re.sub(
        r"const (styles|est|stylesTabs) = StyleSheet\.create\(",
        r"const createStyles = (theme: any) => StyleSheet.create(",
        content
    )

    # Note: 'est' is used in ObligacionesScreen!
    # If the original used 'const est', then 'const styles = createStyles(theme)' will conflict if it uses 'est'.
    # Let's fix 'est' to 'styles' in ObligacionesScreen first to be consistent.
    
    with open(file, 'w') as f:
        f.write(content)
        
    print(f"Patched {file}")
