#!/usr/bin/env python3
"""
Propagação em massa da paleta corporativa para todas as abas do relatório TOTVS.
Remove cores customizadas (purple-600, green-500, amber-500, etc) e aplica variant='default/secondary/outline'.
"""

import re
from pathlib import Path

# Cores a remover/substituir
COLOR_REPLACEMENTS = [
    # Backgrounds vibrantes → variant ou muted
    (r'bg-purple-\d+', 'bg-muted'),
    (r'bg-indigo-\d+', 'bg-muted'),
    (r'bg-green-\d+', 'bg-muted'),
    (r'bg-emerald-\d+', 'bg-muted'),
    (r'bg-amber-\d+', 'bg-muted'),
    (r'bg-rose-\d+', 'bg-muted'),
    (r'bg-red-\d+', 'bg-muted'),
    (r'bg-blue-\d+', 'bg-muted'),
    (r'bg-cyan-\d+', 'bg-muted'),
    
    # Text colors vibrantes → muted-foreground
    (r'text-purple-\d+', 'text-muted-foreground'),
    (r'text-indigo-\d+', 'text-muted-foreground'),
    (r'text-green-\d+', 'text-muted-foreground'),
    (r'text-emerald-\d+', 'text-muted-foreground'),
    (r'text-amber-\d+', 'text-muted-foreground'),
    (r'text-rose-\d+', 'text-muted-foreground'),
    (r'text-red-\d+', 'text-muted-foreground'),
    (r'text-blue-\d+', 'text-muted-foreground'),
    (r'text-cyan-\d+', 'text-muted-foreground'),
    
    # Border colors vibrantes → border
    (r'border-purple-\d+', 'border-border'),
    (r'border-indigo-\d+', 'border-border'),
    (r'border-green-\d+', 'border-border'),
    (r'border-emerald-\d+', 'border-border'),
    (r'border-amber-\d+', 'border-border'),
    (r'border-rose-\d+', 'border-border'),
    (r'border-red-\d+', 'border-border'),
    (r'border-blue-\d+', 'border-border'),
    
    # Hover vibrantes → hover:bg-muted
    (r'hover:bg-purple-\d+', 'hover:bg-muted'),
    (r'hover:bg-indigo-\d+', 'hover:bg-muted'),
    (r'hover:bg-green-\d+', 'hover:bg-muted'),
    (r'hover:bg-emerald-\d+', 'hover:bg-muted'),
]

# Buttons com className customizado → variant
BUTTON_PATTERNS = [
    # Button com bg-purple/indigo/green → variant="default"
    (
        r'<Button\s+([^>]*)className="[^"]*bg-(purple|indigo|green|emerald|blue)-\d+[^"]*"',
        r'<Button \1variant="default"',
    ),
    # Button com bg-amber/yellow → variant="secondary"
    (
        r'<Button\s+([^>]*)className="[^"]*bg-(amber|yellow)-\d+[^"]*"',
        r'<Button \1variant="secondary"',
    ),
    # Button com bg-red/rose → variant="destructive"
    (
        r'<Button\s+([^>]*)className="[^"]*bg-(red|rose)-\d+[^"]*"',
        r'<Button \1variant="destructive"',
    ),
]

# Badge patterns
BADGE_PATTERNS = [
    # Badge com bg customizado → variant
    (
        r'<Badge\s+([^>]*)className="[^"]*bg-(purple|indigo|green|emerald|blue)-\d+[^"]*"',
        r'<Badge \1variant="default"',
    ),
    (
        r'<Badge\s+([^>]*)className="[^"]*bg-slate-\d+[^"]*"',
        r'<Badge \1variant="outline"',
    ),
]

def process_file(filepath: Path) -> int:
    """Processa um arquivo, retorna número de alterações."""
    content = filepath.read_text(encoding='utf-8')
    original = content
    changes = 0
    
    # 1) Cores customizadas
    for pattern, replacement in COLOR_REPLACEMENTS:
        new_content = re.sub(pattern, replacement, content)
        if new_content != content:
            changes += content.count(re.findall(pattern, content)[0]) if re.findall(pattern, content) else 0
            content = new_content
    
    # 2) Buttons
    for pattern, replacement in BUTTON_PATTERNS:
        new_content = re.sub(pattern, replacement, content)
        if new_content != content:
            changes += 1
            content = new_content
    
    # 3) Badges
    for pattern, replacement in BADGE_PATTERNS:
        new_content = re.sub(pattern, replacement, content)
        if new_content != content:
            changes += 1
            content = new_content
    
    if content != original:
        filepath.write_text(content, encoding='utf-8')
    
    return changes

def main():
    tabs_dir = Path('src/components/icp/tabs')
    files = list(tabs_dir.glob('*.tsx')) + list(tabs_dir.glob('**/*.tsx'))
    
    total_changes = 0
    for file in files:
        if file.name.startswith('Tab') or file.name.endswith('Tab.tsx'):
            changes = process_file(file)
            if changes > 0:
                print(f'[OK] {file.name}: {changes} changes')
                total_changes += changes
    
    print(f'\n[DONE] Total: {total_changes} changes in {len(files)} files')

if __name__ == '__main__':
    main()

