# Configuración para Railway

## Variables de Entorno Requeridas

Para que la aplicación funcione correctamente en Railway, debes configurar las siguientes variables de entorno en tu proyecto de Railway:

### Variables Obligatorias:
```
USE_LOCAL_DB=True
DEBUG=False
SECRET_KEY=django-insecure-)i$w*5mx^2esaf$)+oarmvtbf@)-15q(#3#avi@zbw%bqewr5k
```

## Pasos para Configurar Railway:

1. **Conecta tu repositorio a Railway**
   - Ve a [railway.app](https://railway.app)
   - Crea un nuevo proyecto
   - Conecta tu repositorio de GitHub

2. **Configura las Variables de Entorno**
   - Ve a la sección "Variables" de tu proyecto
   - Agrega las variables mencionadas arriba

3. **Despliega la aplicación**
   - Railway detectará automáticamente el `railway.toml`
   - El deploy ejecutará:
     - Migraciones de base de datos
     - Creación automática del superusuario
     - Carga de datos sintéticos (vehículos, conductores, asignaciones)
   - Todo estará listo para usar inmediatamente

## Credenciales de Acceso:

Después del despliegue, podrás acceder con:
- **Usuario:** admin
- **Contraseña:** admin123
- **URL Admin:** https://tu-app.railway.app/admin/

## Datos Sintéticos Incluidos:

Al desplegar, la aplicación cargará automáticamente:
- ✅ **12 vehículos** de ejemplo con diferentes características
- ✅ **12 conductores** con datos realistas 
- ✅ **2000 asignaciones** sintéticas para pruebas
- ✅ **1724 registros de turnos** de los últimos 90 días
- ✅ **Usuario administrador** listo para usar

## Base de Datos:

La aplicación usará SQLite como base de datos local en el servidor de Railway. Esto significa:
- ✅ No necesitas configurar una base de datos externa
- ✅ Los datos se persistirán en el servidor
- ⚠️ Los datos se perderán si el contenedor se reinicia (Railway puede hacer esto ocasionalmente)

## Comandos Útiles:

Si necesitas ejecutar comandos manualmente en Railway:

```bash
# Crear superusuario
python manage.py create_superuser_production

# Poblar datos de ejemplo
python manage.py seed_vehicles
python manage.py seed_conductores
python manage.py populate_data
```
