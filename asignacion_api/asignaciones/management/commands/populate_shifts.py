import random
from django.core.management.base import BaseCommand
from django.utils import timezone
from faker import Faker
from asignaciones.models import Conductor, RegistroTurno

class Command(BaseCommand):
    help = 'Populate the database with synthetic shift records for drivers'

    def add_arguments(self, parser):
        parser.add_argument(
            '--days',
            type=int,
            default=90,
            help='Number of days back to generate shift records (default: 90)',
        )
        parser.add_argument(
            '--clear',
            action='store_true',
            help='Clear existing shift records before creating new ones',
        )
        parser.add_argument(
            '--conductor-id',
            type=int,
            help='Generate shift records only for a specific driver (by ID)',
        )

    def handle(self, *args, **kwargs):
        fake = Faker('es_ES')
        days = kwargs['days']
        clear_records = kwargs['clear']
        conductor_id = kwargs.get('conductor_id')
        
        if clear_records:
            self.stdout.write('Clearing existing shift records...')
            RegistroTurno.objects.all().delete()
            self.stdout.write(self.style.SUCCESS('Existing shift records cleared.'))

        # Obtener conductores
        if conductor_id:
            try:
                conductores = [Conductor.objects.get(id=conductor_id)]
                self.stdout.write(f'Generating shift records for driver: {conductores[0]}')
            except Conductor.DoesNotExist:
                self.stdout.write(self.style.ERROR(f'Driver with ID {conductor_id} not found.'))
                return
        else:
            conductores = list(Conductor.objects.all())
            self.stdout.write(f'Generating shift records for {len(conductores)} drivers')

        if not conductores:
            self.stdout.write(self.style.ERROR('No drivers found in the database. Please create some first.'))
            return

        registros_turno = []
        
        # Generar registros de turno para los últimos X días
        fecha_inicio_registros = timezone.now() - timezone.timedelta(days=days)
        fecha_fin_registros = timezone.now()
        
        self.stdout.write(f'Creating shift records from {fecha_inicio_registros.date()} to {fecha_fin_registros.date()}...')
        
        for conductor in conductores:
            conductor_registros = self._create_shift_records_for_driver(
                conductor, fecha_inicio_registros, fecha_fin_registros, fake
            )
            registros_turno.extend(conductor_registros)
            
            self.stdout.write(f'  {conductor}: {len(conductor_registros)} records created')
        
        self.stdout.write(self.style.SUCCESS(f'Successfully created {len(registros_turno)} shift records.'))

    def _create_shift_records_for_driver(self, conductor, fecha_inicio, fecha_fin, fake):
        """Crea registros de turno realistas para un conductor específico"""
        registros = []
        fecha_actual = fecha_inicio
        
        while fecha_actual < fecha_fin:
            # Determinar si el conductor trabaja este día
            # Lunes a Viernes: 85% probabilidad
            # Sábados: 60% probabilidad  
            # Domingos: 30% probabilidad
            dia_semana = fecha_actual.weekday()  # 0=Lunes, 6=Domingo
            
            if dia_semana < 5:  # Lunes a Viernes
                probabilidad_trabajo = 0.85
            elif dia_semana == 5:  # Sábado
                probabilidad_trabajo = 0.60
            else:  # Domingo
                probabilidad_trabajo = 0.30
            
            if random.random() < probabilidad_trabajo:
                registros_dia = self._create_daily_shift(conductor, fecha_actual, fake)
                registros.extend(registros_dia)
            
            # Avanzar al siguiente día
            fecha_actual += timezone.timedelta(days=1)
        
        return registros

    def _create_daily_shift(self, conductor, fecha, fake):
        """Crea los registros de entrada y salida para un día específico"""
        registros = []
        
        # Definir turnos típicos
        turnos_posibles = [
            {
                'nombre': 'mañana_temprano',
                'entrada': (6, 7),    # Entre 6:00 y 7:00
                'salida': (14, 15),   # Entre 14:00 y 15:00
                'peso': 20
            },
            {
                'nombre': 'mañana',
                'entrada': (7, 9),    # Entre 7:00 y 9:00
                'salida': (15, 17),   # Entre 15:00 y 17:00
                'peso': 40
            },
            {
                'nombre': 'tarde',
                'entrada': (13, 15),  # Entre 13:00 y 15:00
                'salida': (21, 23),   # Entre 21:00 y 23:00
                'peso': 25
            },
            {
                'nombre': 'noche',
                'entrada': (21, 23),  # Entre 21:00 y 23:00
                'salida': (5, 7),     # Entre 5:00 y 7:00 (día siguiente)
                'peso': 15
            }
        ]
        
        # Seleccionar turno basado en pesos
        turno = random.choices(
            turnos_posibles, 
            weights=[t['peso'] for t in turnos_posibles]
        )[0]
        
        # Generar hora de entrada
        hora_entrada_min, hora_entrada_max = turno['entrada']
        hora_entrada = random.uniform(hora_entrada_min, hora_entrada_max)
        
        # Añadir variación de minutos
        minutos_entrada = random.randint(0, 59)
        segundos_entrada = random.randint(0, 59)
        
        fecha_entrada = fecha.replace(
            hour=int(hora_entrada),
            minute=minutos_entrada,
            second=segundos_entrada,
            microsecond=0
        )
        
        # Generar hora de salida
        hora_salida_min, hora_salida_max = turno['salida']
        hora_salida = random.uniform(hora_salida_min, hora_salida_max)
        
        minutos_salida = random.randint(0, 59)
        segundos_salida = random.randint(0, 59)
        
        # Manejar turnos nocturnos que terminan al día siguiente
        if turno['nombre'] == 'noche':
            fecha_salida = (fecha + timezone.timedelta(days=1)).replace(
                hour=int(hora_salida),
                minute=minutos_salida,
                second=segundos_salida,
                microsecond=0
            )
        else:
            fecha_salida = fecha.replace(
                hour=int(hora_salida),
                minute=minutos_salida,
                second=segundos_salida,
                microsecond=0
            )
        
        # Generar notas ocasionales
        notas_entrada = self._generate_entry_notes() if random.random() < 0.15 else ""
        notas_salida = self._generate_exit_notes() if random.random() < 0.20 else ""
        
        # Crear registro de entrada
        registro_entrada = RegistroTurno.objects.create(
            conductor=conductor,
            fecha_hora=fecha_entrada,
            tipo='entrada',
            notas=notas_entrada
        )
        registros.append(registro_entrada)
        
        # Crear registro de salida (95% de probabilidad)
        if random.random() < 0.95:
            registro_salida = RegistroTurno.objects.create(
                conductor=conductor,
                fecha_hora=fecha_salida,
                tipo='salida',
                notas=notas_salida
            )
            registros.append(registro_salida)
        
        return registros

    def _generate_entry_notes(self):
        """Genera notas realistas para entrada de turno"""
        notas_posibles = [
            "Inicio de turno normal",
            "Vehículo revisado antes del turno",
            "Turno comenzado sin novedad",
            "Coordinación con turno anterior completada",
            "Documentación del vehículo verificada",
            "Revisión de combustible realizada",
            "Estado del vehículo: óptimo",
            "Turno iniciado puntualmente",
            "Vehículo limpio y en orden",
            "Documentos al día",
            "Revisión pre-operacional completada",
            "Sin novedades al inicio del turno"
        ]
        return random.choice(notas_posibles)

    def _generate_exit_notes(self):
        """Genera notas realistas para salida de turno"""
        notas_posibles = [
            "Turno completado sin novedad",
            "Vehículo entregado en buen estado",
            "Fin de turno normal",
            "Combustible verificado al finalizar",
            "Reporte de kilometraje actualizado",
            "Vehículo limpio y ordenado",
            "Documentación entregada completa",
            "Turno finalizado exitosamente",
            "Sin novedades durante el turno",
            "Vehículo lavado antes de entregar",
            "Nivel de combustible: adecuado",
            "Estado del vehículo: excelente",
            "Entrega de turno coordinada",
            "Reporte diario completado"
        ]
        return random.choice(notas_posibles)
