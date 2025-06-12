@echo off
REM Iniciar backend Django
start cmd /k "cd asignacion_api && python manage.py runserver"

REM Iniciar frontend React/Vue/Next (ajusta si es necesario)
start cmd /k "cd asignacion && npm run dev"