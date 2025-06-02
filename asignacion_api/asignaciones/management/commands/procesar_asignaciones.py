# asignaciones/management/commands/procesar_asignaciones.py
from django.core.management.base import BaseCommand, CommandError
from django.utils import timezone
from asignaciones.services import procesar_asignaciones_automaticas_dia # Asegúrate que la ruta de importación sea correcta
import datetime

class Command(BaseCommand):
    help = 'Procesa las asignaciones automáticas pendientes para una fecha específica (o para hoy por defecto).'

    def add_arguments(self, parser):
        parser.add_argument(
            '--fecha',
            type=str,
            help='Fecha para procesar las asignaciones en formato YYYY-MM-DD. Por defecto es hoy.',
        )

    def handle(self, *args, **options):
        fecha_str = options['fecha']
        
        if fecha_str:
            try:
                fecha_procesamiento = datetime.datetime.strptime(fecha_str, '%Y-%m-%d').date()
            except ValueError:
                raise CommandError('Formato de fecha inválido. Use YYYY-MM-DD.')
        else:
            fecha_procesamiento = timezone.localdate() # Hoy

        self.stdout.write(self.style.SUCCESS(f'Iniciando procesamiento de asignaciones para: {fecha_procesamiento.strftime("%Y-%m-%d")}'))
        
        resultado = procesar_asignaciones_automaticas_dia(fecha_procesamiento)
        
        self.stdout.write(self.style.SUCCESS('--- Resumen del Procesamiento ---'))
        self.stdout.write(f"Total de solicitudes consideradas: {resultado['procesadas']}")
        self.stdout.write(self.style.SUCCESS(f"Asignaciones exitosas: {resultado['exitosas']}"))
        self.stdout.write(self.style.WARNING(f"Asignaciones fallidas: {resultado['fallidas']}"))
        
        if resultado['mensajes']:
            self.stdout.write(self.style.NOTICE('--- Detalles ---'))
            for msg in resultado['mensajes']:
                if "Falló" in msg:
                    self.stdout.write(self.style.WARNING(msg))
                else:
                    self.stdout.write(msg)
        
        self.stdout.write(self.style.SUCCESS('Procesamiento completado.'))