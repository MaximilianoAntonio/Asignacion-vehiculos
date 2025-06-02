# asignaciones/services.py
from django.utils import timezone
from django.db.models import Q
from .models import Asignacion, Vehiculo, Conductor
from datetime import timedelta
from math import radians, sin, cos, sqrt, atan2 # Para Haversine manual si no usas geopy

# O, si instalaste geopy:
from geopy.distance import geodesic

# --- Definir tu punto de referencia (Base de Operaciones) ---
# Reemplaza estas coordenadas con las de tu base real.
# Ejemplo: Coordenadas de Plaza de Armas, Santiago, Chile (aproximadas)
# LATITUD_BASE = -33.4372
# LONGITUD_BASE = -70.6506
# Ejemplo: Coordenadas de Quilpué (aproximadas para el ejemplo)
LATITUD_BASE = -33.0500 
LONGITUD_BASE = -71.4333

# --- Funciones de Puntuación ---

def calcular_distancia_haversine(lat1, lon1, lat2, lon2):
    """
    Calcula la distancia entre dos puntos en la Tierra usando la fórmula de Haversine.
    Retorna la distancia en kilómetros.
    """
    R = 6371  # Radio de la Tierra en kilómetros

    lat1_rad = radians(lat1)
    lon1_rad = radians(lon1)
    lat2_rad = radians(lat2)
    lon2_rad = radians(lon2)

    dlon = lon2_rad - lon1_rad
    dlat = lat2_rad - lat1_rad

    a = sin(dlat / 2)**2 + cos(lat1_rad) * cos(lat2_rad) * sin(dlon / 2)**2
    c = 2 * atan2(sqrt(a), sqrt(1 - a))

    distancia = R * c
    return distancia

def calcular_puntaje_lejana(asignacion):
    if asignacion.destino_lat is None or asignacion.destino_lon is None:
        return 1 # Puntuación baja si no hay coordenadas de destino

    # Usando geopy (preferido si está instalado)
    try:
        punto_base = (LATITUD_BASE, LONGITUD_BASE)
        punto_destino = (asignacion.destino_lat, asignacion.destino_lon)
        distancia_km = geodesic(punto_base, punto_destino).km
    except NameError: # Si geopy.distance.geodesic no está definido (geopy no importado o instalado)
        # Usando Haversine manual
        distancia_km = calcular_distancia_haversine(
            LATITUD_BASE, LONGITUD_BASE,
            asignacion.destino_lat, asignacion.destino_lon
        )
    
    print(f"  [Lejanía] Solicitud ID {asignacion.id}: Destino ({asignacion.destino_lat}, {asignacion.destino_lon}), Distancia: {distancia_km:.2f} km")

    # Define umbrales para puntuar la distancia. Estos son ejemplos, ajústalos.
    # La idea es que a mayor distancia, mayor puntaje.
    if distancia_km > 100: # Muy lejano
        return 15
    elif distancia_km > 50: # Lejano
        return 10
    elif distancia_km > 20: # Intermedio
        return 5
    elif distancia_km > 5: # Cercano
        return 2
    else: # Muy cercano
        return 1

def calcular_puntaje_pasajeros(asignacion):
    return asignacion.req_pasajeros

def calcular_puntaje_jerarquia(asignacion):
    return asignacion.solicitante_jerarquia

def calcular_puntaje_total(asignacion, peso_lejana=5, peso_pasajeros=3, peso_jerarquia=10):
    s_lejana = calcular_puntaje_lejana(asignacion)
    s_pasajeros = calcular_puntaje_pasajeros(asignacion)
    s_jerarquia = calcular_puntaje_jerarquia(asignacion)
    
    puntaje = (peso_lejana * s_lejana) + \
              (peso_pasajeros * s_pasajeros) + \
              (peso_jerarquia * s_jerarquia)
    return puntaje

# --- Funciones de Búsqueda de Recursos (sin cambios respecto a la versión anterior) ---
def encontrar_vehiculo_compatible(asignacion):
    filtros_vehiculo = Q(estado='disponible')
    if asignacion.req_tipo_vehiculo_preferente:
        filtros_vehiculo &= Q(tipo_vehiculo=asignacion.req_tipo_vehiculo_preferente)
    if asignacion.req_pasajeros > 0:
        filtros_vehiculo &= Q(capacidad_pasajeros__gte=asignacion.req_pasajeros)
    if asignacion.req_caracteristicas_especiales:
        filtros_vehiculo &= Q(caracteristicas_adicionales__icontains=asignacion.req_caracteristicas_especiales)
    vehiculos_compatibles = Vehiculo.objects.filter(filtros_vehiculo)
    return vehiculos_compatibles.first()


def encontrar_conductor_compatible(vehiculo_asignado, asignacion):
    if not vehiculo_asignado:
        return None
    filtros_conductor = Q(activo=True) & Q(estado_disponibilidad='disponible')
    filtros_conductor &= Q(tipos_vehiculo_habilitados__icontains=vehiculo_asignado.tipo_vehiculo)
    conductores_compatibles = Conductor.objects.filter(filtros_conductor)
    if vehiculo_asignado.conductor_preferente and vehiculo_asignado.conductor_preferente in conductores_compatibles:
        return vehiculo_asignado.conductor_preferente
    return conductores_compatibles.first()


def estimar_fin_servicio(fecha_inicio, duracion_horas=2):
    return fecha_inicio + timedelta(hours=duracion_horas)

# --- Función Principal del Servicio de Asignación (sin cambios respecto a la versión anterior) ---
def procesar_asignaciones_automaticas_dia(fecha_procesamiento):
    print(f"Procesando asignaciones para el {fecha_procesamiento.strftime('%Y-%m-%d')}...")
    inicio_dia = timezone.make_aware(timezone.datetime.combine(fecha_procesamiento, timezone.datetime.min.time()))
    fin_dia = timezone.make_aware(timezone.datetime.combine(fecha_procesamiento, timezone.datetime.max.time()))

    solicitudes_pendientes = Asignacion.objects.filter(
        estado='pendiente_auto',
        fecha_hora_requerida_inicio__gte=inicio_dia,
        fecha_hora_requerida_inicio__lte=fin_dia
    ).select_related('vehiculo', 'conductor')

    if not solicitudes_pendientes.exists():
        print("No hay solicitudes pendientes para procesar.")
        return {"procesadas": 0, "exitosas": 0, "fallidas": 0, "mensajes": ["No hay solicitudes pendientes."]}

    solicitudes_con_puntaje = []
    for solicitud in solicitudes_pendientes:
        puntaje = calcular_puntaje_total(solicitud)
        solicitudes_con_puntaje.append({'solicitud': solicitud, 'puntaje': puntaje})
    
    solicitudes_ordenadas = sorted(solicitudes_con_puntaje, key=lambda x: x['puntaje'], reverse=True)

    asignaciones_exitosas = 0
    asignaciones_fallidas = 0
    mensajes_proceso = []

    for item in solicitudes_ordenadas:
        solicitud = item['solicitud']
        print(f"\nIntentando asignar Solicitud ID: {solicitud.id}, Puntaje: {item['puntaje']}")
        print(f"  Destino: {solicitud.destino_descripcion}, Pasajeros: {solicitud.req_pasajeros}, Jerarquía: {solicitud.get_solicitante_jerarquia_display()}")

        vehiculo_encontrado = encontrar_vehiculo_compatible(solicitud)
        if not vehiculo_encontrado:
            solicitud.estado = 'fallo_auto'
            solicitud.observaciones = (solicitud.observaciones or "") + f"\nFallo auto ({timezone.now().strftime('%Y-%m-%d %H:%M')}): No se encontró vehículo compatible."
            solicitud.save()
            asignaciones_fallidas += 1
            msg = f"Solicitud ID {solicitud.id}: Falló. No se encontró vehículo compatible."
            print(f"  {msg}")
            mensajes_proceso.append(msg)
            continue

        print(f"  Vehículo encontrado: {vehiculo_encontrado} (Estado: {vehiculo_encontrado.get_estado_display()})")

        conductor_encontrado = encontrar_conductor_compatible(vehiculo_encontrado, solicitud)
        if not conductor_encontrado:
            solicitud.estado = 'fallo_auto'
            solicitud.observaciones = (solicitud.observaciones or "") + f"\nFallo auto ({timezone.now().strftime('%Y-%m-%d %H:%M')}): No se encontró conductor compatible para {vehiculo_encontrado.patente}."
            solicitud.save()
            asignaciones_fallidas += 1
            msg = f"Solicitud ID {solicitud.id}: Falló. No se encontró conductor compatible para {vehiculo_encontrado.patente}."
            print(f"  {msg}")
            mensajes_proceso.append(msg)
            continue
        
        print(f"  Conductor encontrado: {conductor_encontrado} (Estado: {conductor_encontrado.get_estado_disponibilidad_display()})")
        
        if not solicitud.fecha_hora_fin_prevista:
            solicitud.fecha_hora_fin_prevista = estimar_fin_servicio(solicitud.fecha_hora_requerida_inicio)

        solicitud.vehiculo = vehiculo_encontrado
        solicitud.conductor = conductor_encontrado
        solicitud.estado = 'programada'
        solicitud.observaciones = (solicitud.observaciones or "") + f"\nAsignado automáticamente el {timezone.now().strftime('%Y-%m-%d %H:%M')}."
        solicitud.save()

        vehiculo_encontrado.estado = 'reservado'
        vehiculo_encontrado.save()

        conductor_encontrado.estado_disponibilidad = 'en_ruta'
        conductor_encontrado.save()
        
        asignaciones_exitosas += 1
        msg = f"Solicitud ID {solicitud.id}: Asignada a {conductor_encontrado} con {vehiculo_encontrado.patente}."
        print(f"  {msg}")
        mensajes_proceso.append(msg)

    resumen = {
        "procesadas": len(solicitudes_ordenadas),
        "exitosas": asignaciones_exitosas,
        "fallidas": asignaciones_fallidas,
        "mensajes": mensajes_proceso
    }
    print(f"\nResumen del proceso: {resumen}")
    return resumen