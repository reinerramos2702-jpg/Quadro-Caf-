# AUTO-SAVE-REPO Skill

Protocolo para que NINGÚN archivo generado en sesión se pierda.

## Uso
1. Al inicio: `source ~/.claude/skills/auto-save-repo/auto-save.sh && init_repo`
2. Por cada archivo: `save_file "ruta/al/archivo"`
3. Al terminar: `final_commit "descripción"`

## Carpetas protegidas
- /src/assets/fonts/
- /public/models/
- /src/assets/icons/
- /src/assets/branding/
