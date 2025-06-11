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

    if hasattr(vehiculo, 'anio') and vehiculo.anio:
        novedad_score = min(1, max(0, (vehiculo.anio - 2010) / 15))  # Normaliza entre 2010 y 2025
    else:
        novedad_score = 0.5  # Valor por defecto

    # Peso de novedad depende de la distancia (más lejos, más peso)
    peso_novedad = min(0.3, 0.1 + 0.2 * distancia_score)  # Hasta 0.3 si distancia >= 100km

    # Ajusta los pesos de los otros factores para que sumen 1
    peso_cargo = PESO_CARGO - peso_novedad * 0.5
    peso_capacidad = PESO_CAPACIDAD - peso_novedad * 0.3
    peso_distancia = PESO_DISTANCIA - peso_novedad * 0.2

    # Score total
    score = (
        cargo_score * peso_cargo +
        capacidad_score * peso_capacidad +
        distancia_score * peso_distancia +
        novedad_score * peso_novedad
    )
    return score

def asignar_vehiculo_automatico(asignacion):
    vehiculos = Vehiculo.objects.filter(
        estado='disponible',
        capacidad_pasajeros__gte=asignacion.req_pasajeros or 1
    )
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