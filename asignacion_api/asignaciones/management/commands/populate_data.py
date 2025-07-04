import random
import math
from django.core.management.base import BaseCommand
from django.utils import timezone
from faker import Faker
from asignaciones.models import Vehiculo, Conductor, Asignacion

class Command(BaseCommand):
    help = 'Populate the database with synthetic data'

    def handle(self, *args, **kwargs):
        fake = Faker('es_ES')
        self.stdout.write('Cleaning old assignment data...')
        Asignacion.objects.all().delete()

        self.stdout.write('Loading existing vehicles and drivers...')
        vehiculos = list(Vehiculo.objects.all())
        conductores = list(Conductor.objects.all())

        if not vehiculos or not conductores:
            self.stdout.write(self.style.ERROR('No vehicles or drivers found in the database. Please create some first.'))
            return

        self.stdout.write(self.style.SUCCESS(f'{len(vehiculos)} vehicles and {len(conductores)} drivers loaded.'))

        self.stdout.write('Creating synthetic assignments...')

        locations_valparaiso = [
            {'name': 'Viña del Mar', 'lat': -33.0246, 'lon': -71.5522},
            {'name': 'Quillota', 'lat': -32.8823, 'lon': -71.2489},
        ]

        streets_by_city = {
            'Viña del Mar': [
                'Avenida Libertad', 'Avenida San Martín', 'Calle Valparaíso', 'Avenida Borgoño',
                'Avenida 1 Norte', 'Avenida Álvarez', 'Calle Von Schroeders', 'Avenida La Marina',
                'Avenida Jorge Montt', 'Calle 5 Oriente'
            ],
            'Quillota': [
                'Calle Condell', 'Calle Chacabuco', 'Avenida Valparaíso', 'Calle O\'Higgins',
                'Calle La Concepción', 'Avenida 21 de Mayo', 'Calle Freire', 'Calle Maipú',
                'Calle San Martín', 'Avenida Ariztía'
            ]
        }

        # Crear Asignaciones
        asignaciones = []
        for _ in range(2000):
            fecha_inicio = fake.date_time_between(start_date='-30d', end_date='-1d', tzinfo=timezone.get_current_timezone())
            fecha_fin = fecha_inicio + timezone.timedelta(hours=random.randint(1, 5))

            origen_info = random.choice(locations_valparaiso)
            destino_info = random.choice(locations_valparaiso)

            origen_street = random.choice(streets_by_city[origen_info['name']])
            destino_street = random.choice(streets_by_city[destino_info['name']])

            origen_descripcion = f"{origen_street} {fake.building_number()}, {origen_info['name']}"
            destino_descripcion = f"{destino_street} {fake.building_number()}, {destino_info['name']}"

            origen_lat = origen_info['lat'] + random.uniform(-0.02, 0.02)
            origen_lon = origen_info['lon'] + random.uniform(-0.02, 0.02)
            destino_lat = destino_info['lat'] + random.uniform(-0.02, 0.02)
            destino_lon = destino_info['lon'] + random.uniform(-0.02, 0.02)

            # Calcular distancia haversine
            R = 6371  # Radio de la Tierra en km
            lat1_rad = math.radians(origen_lat)
            lon1_rad = math.radians(origen_lon)
            lat2_rad = math.radians(destino_lat)
            lon2_rad = math.radians(destino_lon)

            dlon = lon2_rad - lon1_rad
            dlat = lat2_rad - lat1_rad

            a = math.sin(dlat / 2)**2 + math.cos(lat1_rad) * math.cos(lat2_rad) * math.sin(dlon / 2)**2
            c = 2 * math.atan2(math.sqrt(a), math.sqrt(1 - a))

            distancia_viaje = round(R * c, 2)

            vehiculo_asignado = random.choice(vehiculos)
            vehiculo_asignado.kilometraje += distancia_viaje
            vehiculo_asignado.save()

            asignacion = Asignacion.objects.create(
                vehiculo=vehiculo_asignado,
                conductor=random.choice(conductores),
                destino_descripcion=destino_descripcion,
                origen_descripcion=origen_descripcion,
                origen_lat=origen_lat,
                origen_lon=origen_lon,
                destino_lat=destino_lat,
                destino_lon=destino_lon,
                fecha_hora_requerida_inicio=fecha_inicio,
                fecha_hora_fin_prevista=fecha_fin,
                fecha_hora_fin_real=fecha_fin,
                req_pasajeros=random.randint(1, 10),
                solicitante_nombre=fake.name(),
                responsable_nombre=fake.name(),
                responsable_telefono=fake.phone_number(),
                estado='completada',
                distancia_recorrida_km=distancia_viaje
            )
            asignaciones.append(asignacion)
        self.stdout.write(self.style.SUCCESS(f'{len(asignaciones)} assignments created.'))

        self.stdout.write(self.style.SUCCESS('Successfully populated the database with synthetic assignments.'))
