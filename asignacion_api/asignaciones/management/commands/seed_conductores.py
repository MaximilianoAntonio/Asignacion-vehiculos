# asignaciones/management/commands/seed_conductores.py
import datetime
from django.core.management.base import BaseCommand
from django.utils import timezone
from asignaciones.models import Conductor # Asegúrate que la ruta al modelo Conductor sea correcta

class Command(BaseCommand):
    help = 'Carga una lista de conductores de prueba en la base de datos desde la imagen image_b93b5d.png'

    def handle(self, *args, **options):
        full_names_conductores = [
            "Luis Teodoro Báez Cisternas",
            "Patricio Ignacio Espinoza Celis",
            "Juan Patricio Fuentes Palominos",
            "Manuel Jesús González Aguayo",
            "Jaime Laborde Toledo",
            "Nilton Mauro Llanos Arruez",
            "Rita Andrea Otárola Araya",
            "Aldo Rodríguez Arancibia",
            "José Johnson Alvarez",
            "Alexis Alfonso Torres López",
            "José Escorza Palma",
            "Arnoldo Andrés Bello Rios",
        ]

        created_count = 0
        updated_count = 0

        for index, full_name in enumerate(full_names_conductores):
            parts = full_name.split()
            nombre = ""
            apellido = ""

            # Lógica para dividir nombres y apellidos (ajustar según necesidad)
            if len(parts) >= 4: # Ej: Luis Teodoro Báez Cisternas
                nombre = " ".join(parts[0:2])
                apellido = " ".join(parts[2:])
            elif len(parts) == 3: # Ej: Jaime Laborde Toledo
                nombre = parts[0]
                apellido = " ".join(parts[1:])
            elif len(parts) == 2: # Ej: Juan Perez
                nombre = parts[0]
                apellido = parts[1]
            elif len(parts) == 1: # Nombre único
                nombre = parts[0]
                apellido = "(Sin Apellido)" # O manejar como error/omitir
            else:
                self.stdout.write(self.style.WARNING(f"Formato de nombre inválido u omitido: '{full_name}'"))
                continue

            # Generar número de licencia único (para datos de prueba)
            # Este es un ejemplo simple, asegúrate que sea único si tienes datos existentes.
            numero_licencia_val = f"LIC-TEST-{1001 + index}"

            # Generar fecha de vencimiento de licencia (ej: 5 años desde hoy)
            fecha_vencimiento = timezone.localdate() + datetime.timedelta(days=5*365)
            
            # Tipos de vehículo habilitados por defecto (ejemplo, usa claves válidas de tu modelo Vehiculo)
            # Estos deben ser las claves (ej: 'automovil', 'camioneta') de tus TIPO_VEHICULO_CHOICES
            tipos_habilitados_default = "N/A" # Ajusta según los tipos que definiste

            defaults_conductor = {
                'nombre': nombre,
                'apellido': apellido,
                'fecha_vencimiento_licencia': fecha_vencimiento,
                'activo': True,
                'estado_disponibilidad': 'dia_libre', # Estado por defecto
                'tipos_vehiculo_habilitados': tipos_habilitados_default,
            }

            try:
                conductor, created = Conductor.objects.update_or_create(
                    numero_licencia=numero_licencia_val,
                    defaults=defaults_conductor
                )
                if created:
                    created_count += 1
                    self.stdout.write(self.style.SUCCESS(f"Conductor creado: {conductor.nombre} {conductor.apellido} (Licencia: {numero_licencia_val})"))
                else:
                    updated_count += 1
                    self.stdout.write(self.style.NOTICE(f"Conductor actualizado: {conductor.nombre} {conductor.apellido} (Licencia: {numero_licencia_val})"))
            except Exception as e:
                self.stdout.write(self.style.ERROR(f"Error procesando conductor {nombre} {apellido} con licencia {numero_licencia_val}: {e}"))
                self.stdout.write(self.style.ERROR(f"Datos que causaron error: {defaults_conductor}"))

        self.stdout.write(self.style.SUCCESS(f"Carga de conductores completada. Creados: {created_count}, Actualizados: {updated_count}"))