import random
import math
from django.core.management.base import BaseCommand
from django.utils import timezone
from faker import Faker
from asignaciones.models import Vehiculo, Conductor, Asignacion, RegistroTurno

class Command(BaseCommand):
    help = 'Populate the database with synthetic data'

    def add_arguments(self, parser):
        parser.add_argument(
            '--shifts-only',
            action='store_true',
            help='Generate only shift records (not assignments)',
        )
        parser.add_argument(
            '--days',
            type=int,
            default=90,
            help='Number of days back to generate shift records (default: 90)',
        )

    def handle(self, *args, **kwargs):
        fake = Faker('es_ES')
        shifts_only = kwargs['shifts_only']
        days = kwargs['days']
        
        if not shifts_only:
            self.stdout.write('Cleaning old assignment data...')
            Asignacion.objects.all().delete()
        
        self.stdout.write('Cleaning old shift records...')
        RegistroTurno.objects.all().delete()

        self.stdout.write('Loading existing vehicles and drivers...')
        vehiculos = list(Vehiculo.objects.all())
        conductores = list(Conductor.objects.all())

        if not conductores:
            self.stdout.write(self.style.ERROR('No drivers found in the database. Please create some first.'))
            return
            
        if not shifts_only and not vehiculos:
            self.stdout.write(self.style.ERROR('No vehicles found in the database. Please create some first.'))
            return

        self.stdout.write(self.style.SUCCESS(f'{len(vehiculos)} vehicles and {len(conductores)} drivers loaded.'))

        if not shifts_only:
            self._create_assignments(fake, vehiculos, conductores)
        
        self._create_shift_records(fake, conductores, days)

    def _create_assignments(self, fake, vehiculos, conductores):
        self.stdout.write('Creating synthetic assignments...')

        locations_valparaiso = [
            {'name': 'Viña del Mar', 'lat': -33.0246, 'lon': -71.5522},
            {'name': 'Quillota', 'lat': -32.8823, 'lon': -71.2489},
            {'name': 'Quilpué', 'lat': -33.0472, 'lon': -71.4425},
            {'name': 'Villa Alemana', 'lat': -33.0422, 'lon': -71.3736},
            {'name': 'Concón', 'lat': -32.9366, 'lon': -71.5265},
            {'name': 'Limache', 'lat': -33.0117, 'lon': -71.2669},
        ]

        streets_by_city = {
            'Viña del Mar': [
            'Avenida Libertad', 'Avenida San Martín', 'Calle Valparaíso', 'Avenida Borgoño',
            'Avenida 1 Norte', 'Avenida Álvarez', 'Calle Von Schroeders', 'Avenida La Marina',
            'Avenida Jorge Montt', 'Calle 5 Oriente'
            ],
            'Quillota': [
            'Calle Condell', 'Calle Chacabuco', 'Avenida Valparaíso', "Calle O'Higgins",
            'Calle La Concepción', 'Avenida 21 de Mayo', 'Calle Freire', 'Calle Maipú',
            'Calle San Martín', 'Avenida Ariztía'
            ],
            'Quilpué': [
            'Avenida Los Carrera', 'Avenida Freire', 'Calle Blanco', 'Calle Baquedano',
            'Calle Covadonga', 'Calle Vicuña Mackenna', 'Calle Aníbal Pinto', 'Avenida Centenario',
            'Calle Ramón Freire', 'Calle Diego Portales'
            ],
            'Villa Alemana': [
            'Avenida Valparaíso', 'Calle Buenos Aires', 'Calle Santiago', 'Calle Victoria',
            'Calle Maturana', 'Calle Manuel Montt', 'Calle Baquedano', "Calle O'Higgins",
            'Calle San Martín', 'Calle Prat'
            ],
            'Concón': [
            'Avenida Concón Reñaca', 'Avenida Blanca Estela', 'Calle Magallanes', 'Calle Vergara',
            'Calle Los Pinos', 'Calle San Agustín', 'Calle Las Petras', 'Calle Las Encinas',
            'Calle Los Abedules', 'Calle Los Lirios'
            ],
            'Limache': [
            'Avenida Urmeneta', 'Calle República', 'Calle Prat', 'Calle Serrano',
            'Calle Baquedano', 'Calle Independencia', "Calle O'Higgins", 'Calle San Martín',
            'Calle Bulnes', 'Calle Echaurren'
            ]
        }

        # Crear Asignaciones
        asignaciones = []
        for _ in range(2000):
            fecha_inicio = fake.date_time_between(start_date='-365d', end_date='-1d', tzinfo=timezone.get_current_timezone()) - timezone.timedelta(days=1)
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
                req_pasajeros=random.randint(1, 10),
                solicitante_nombre=fake.name(),
                responsable_nombre=fake.name(),
                responsable_telefono=fake.phone_number(),
                estado='completada',
                distancia_recorrida_km=distancia_viaje
            )
            asignaciones.append(asignacion)
        self.stdout.write(self.style.SUCCESS(f'{len(asignaciones)} assignments created.'))

    def _create_shift_records(self, fake, conductores, days):
        # Crear Registros de Turno
        self.stdout.write(f'Creating synthetic shift records for the last {days} days...')
        registros_turno = []
        
        # Generar registros de turno para los últimos X días
        fecha_inicio_registros = timezone.now() - timezone.timedelta(days=days)
        fecha_fin_registros = timezone.now()
        
        for conductor in conductores:
            # Para cada conductor, generar registros de turno realistas
            fecha_actual = fecha_inicio_registros
            
            while fecha_actual < fecha_fin_registros:
                # Determinar si el conductor trabaja este día (80% de probabilidad)
                if random.random() < 0.8:
                    # Horarios de trabajo típicos
                    horarios_trabajo = [
                        ('mañana', 8, 16),  # 8:00 AM - 4:00 PM
                        ('tarde', 14, 22),  # 2:00 PM - 10:00 PM
                        ('noche', 22, 6),   # 10:00 PM - 6:00 AM (día siguiente)
                    ]
                    
                    turno_tipo, hora_entrada, hora_salida = random.choice(horarios_trabajo)
                    
                    # Hora de entrada con variación de ±30 minutos
                    variacion_entrada = random.randint(-30, 30)
                    hora_entrada_real = hora_entrada + (variacion_entrada / 60)
                    
                    # Hora de salida con variación de ±45 minutos
                    variacion_salida = random.randint(-45, 45)
                    hora_salida_real = hora_salida + (variacion_salida / 60)
                    
                    # Crear fecha y hora de entrada
                    fecha_entrada = fecha_actual.replace(
                        hour=int(hora_entrada_real),
                        minute=int((hora_entrada_real % 1) * 60),
                        second=random.randint(0, 59)
                    )
                    
                    # Crear fecha y hora de salida
                    if turno_tipo == 'noche' and hora_salida < hora_entrada:
                        # Turno nocturno que termina al día siguiente
                        fecha_salida = (fecha_actual + timezone.timedelta(days=1)).replace(
                            hour=int(hora_salida_real),
                            minute=int((hora_salida_real % 1) * 60),
                            second=random.randint(0, 59)
                        )
                    else:
                        fecha_salida = fecha_actual.replace(
                            hour=int(hora_salida_real),
                            minute=int((hora_salida_real % 1) * 60),
                            second=random.randint(0, 59)
                        )
                    
                    # Generar notas ocasionales (20% de probabilidad)
                    notas_entrada = ""
                    notas_salida = ""
                    
                    if random.random() < 0.2:
                        notas_posibles_entrada = [
                            "Inicio de turno normal",
                            "Vehículo revisado antes del turno",
                            "Turno comenzado sin novedad",
                            "Coordinación con turno anterior completada",
                            "Documentación del vehículo verificada",
                        ]
                        notas_entrada = random.choice(notas_posibles_entrada)
                    
                    if random.random() < 0.2:
                        notas_posibles_salida = [
                            "Turno completado sin novedad",
                            "Vehículo entregado en buen estado",
                            "Fin de turno normal",
                            "Combustible verificado al finalizar",
                            "Reporte de kilometraje actualizado",
                            "Vehículo limpio y ordenado",
                        ]
                        notas_salida = random.choice(notas_posibles_salida)
                    
                    # Crear registro de entrada
                    registro_entrada = RegistroTurno.objects.create(
                        conductor=conductor,
                        fecha_hora=fecha_entrada,
                        tipo='entrada',
                        notas=notas_entrada
                    )
                    registros_turno.append(registro_entrada)
                    
                    # Crear registro de salida (95% de probabilidad - a veces olvidan marcar salida)
                    if random.random() < 0.95:
                        registro_salida = RegistroTurno.objects.create(
                            conductor=conductor,
                            fecha_hora=fecha_salida,
                            tipo='salida',
                            notas=notas_salida
                        )
                        registros_turno.append(registro_salida)
                
                # Avanzar al siguiente día
                fecha_actual += timezone.timedelta(days=1)
        
        self.stdout.write(self.style.SUCCESS(f'{len(registros_turno)} shift records created.'))
        self.stdout.write(self.style.SUCCESS('Successfully populated the database with synthetic shift records.'))
