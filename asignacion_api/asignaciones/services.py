from .models import Vehiculo, Asignacion
from math import radians, sin, cos, sqrt, atan2

# Pesos configurables
PESO_CARGO = 0.4
PESO_CAPACIDAD = 0.3
PESO_DISTANCIA = 0.3

CARGO_SCORE = {
    3: 1.0,  # Jefatura/Subdirección
    2: 0.8,  # Coordinación/Referente
    1: 0.5,  # Funcionario
    0: 0.2,  # Otro/No especificado
}

def calcular_distancia_km(origen_lat, origen_lon, destino_lat, destino_lon):
    if None in (origen_lat, origen_lon, destino_lat, destino_lon):
        return 0
    R = 6371
    dlat = radians(destino_lat - origen_lat)
    dlon = radians(destino_lon - origen_lon)
    a = sin(dlat/2)**2 + cos(radians(origen_lat)) * cos(radians(destino_lat)) * sin(dlon/2)**2
    c = 2 * atan2(sqrt(a), sqrt(1-a))
    return R * c

def calcular_score(asignacion, vehiculo):
    # Score por cargo
    cargo_score = CARGO_SCORE.get(asignacion.solicitante_jerarquia, 0.2)

    # Score por capacidad
    req_pasajeros = asignacion.req_pasajeros or 1
    capacidad = vehiculo.capacidad_pasajeros or 1
    if capacidad < req_pasajeros:
        capacidad_score = 0
    elif capacidad == req_pasajeros:
        capacidad_score = 1
    else:
        capacidad_score = max(0.5, 1 - (capacidad - req_pasajeros) * 0.1)

    # Score por distancia (más largo = más score, normalizado a 100km)
    distancia_km = calcular_distancia_km(
        asignacion.origen_lat, asignacion.origen_lon,
        asignacion.destino_lat, asignacion.destino_lon
    )
    distancia_score = min(1, distancia_km / 100)  # 100km o más = score 1

    # Score total
    score = (
        cargo_score * PESO_CARGO +
        capacidad_score * PESO_CAPACIDAD +
        distancia_score * PESO_DISTANCIA
    )
    return score

def asignar_vehiculos_automatico_lote():
    asignaciones = Asignacion.objects.filter(estado='pendiente_auto', vehiculo__isnull=True)
    resultados = []
    for asignacion in asignaciones:
        vehiculo = asignar_vehiculo_automatico(asignacion)
        if vehiculo:
            resultados.append({
                'asignacion_id': asignacion.id,
                'vehiculo_asignado': vehiculo.patente
            })
        else:
            asignacion.estado = 'fallo_auto'
            asignacion.save()
            resultados.append({
                'asignacion_id': asignacion.id,
                'vehiculo_asignado': None
            })
    return resultados

def asignar_vehiculo_automatico(asignacion):
    vehiculos = Vehiculo.objects.filter(estado='disponible')
    mejor_score = -1
    mejor_vehiculo = None
    for v in vehiculos:
        score = calcular_score(asignacion, v)
        if score > mejor_score:
            mejor_score = score
            mejor_vehiculo = v
    if mejor_vehiculo:
        asignacion.vehiculo = mejor_vehiculo
        asignacion.estado = 'programada'
        asignacion.save()
        mejor_vehiculo.estado = 'reservado'
        mejor_vehiculo.save()
    return mejor_vehiculo