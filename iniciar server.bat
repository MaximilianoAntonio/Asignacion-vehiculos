@echo off
REM Iniciar backend Django
start cmd /k "cd asignacion_api && python manage.py runserver 0.0.0.0:8000"

REM Iniciar frontend React/Vue/Next (ajusta si es necesario)
start cmd /k "cd asignacion && serve -s build -l 5000"