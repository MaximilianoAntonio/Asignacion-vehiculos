# asignaciones/management/commands/seed_vehicles.py
from django.core.management.base import BaseCommand
from asignaciones.models import Vehiculo # Asegúrate que la ruta al modelo Vehiculo sea correcta

class Command(BaseCommand):
    help = 'Carga una lista de vehículos de prueba en la base de datos desde los datos de la imagen image_b942a4.png'

    def handle(self, *args, **options):
        vehicle_data = [
            {"patente": "SYSR-57", "tipo_vehiculo_display": "Minibus", "marca": "M. Benz", "modelo": "Sprinter 417 CDI", "anio": "2024", "numero_chasis": "654920W01628071", "numero_motor": "8AC907645RE242325", "pasajeros": "16"},
            {"patente": "LXSP-84", "tipo_vehiculo_display": "Station Wagon", "marca": "Hyundai", "modelo": "Santa Fe 4x4 2.4 AT", "anio": "2020", "numero_chasis": "G4KEKD041695", "numero_motor": "KMHS381EDLU194393", "pasajeros": "4"},
            {"patente": "TLVS-40", "tipo_vehiculo_display": "Minibus", "marca": "Citroen", "modelo": "Spacetourer XL Blue HDI 150", "anio": "2024", "numero_chasis": "10VRAF4053805", "numero_motor": "VF7VEEHTMR2002195", "pasajeros": "8"},
            {"patente": "LBPX-69", "tipo_vehiculo_display": "Station Wagon", "marca": "Hyundai", "modelo": "Tucson TL CRDI E6 2.0", "anio": "2019", "numero_chasis": "D4HAJU804069", "numero_motor": "KMHJ281AAKU796459", "pasajeros": "4"},
            {"patente": "TLSB-17", "tipo_vehiculo_display": "Camioneta", "marca": "Toyota", "modelo": "Doble Cabina Hilux 2.4 TM 4X2", "anio": "2019", "numero_chasis": "2GDG444821", "numero_motor": "8AJCB3DD6R3918576", "pasajeros": "4"},
            {"patente": "LBDC-22", "tipo_vehiculo_display": "Automóvil", "marca": "Toyota", "modelo": "Yaris 1.5", "anio": "2019", "numero_chasis": "2NR5270034", "numero_motor": "MR2B29F33K1147508", "pasajeros": "4"},
            {"patente": "KZXL-86", "tipo_vehiculo_display": "Minibus", "marca": "Hyundai", "modelo": "H1 2.5", "anio": "2019", "numero_chasis": "D4CBJ680340", "numero_motor": ">", "pasajeros": "9"}, # Motor problemático
            {"patente": "JSHD-66", "tipo_vehiculo_display": "Camioneta", "marca": "Toyota", "modelo": "Doble Cabina New Hilux 4x2 2GD", "anio": "2017", "numero_chasis": "", "numero_motor": "", "pasajeros": "4"}, # Chasis y motor vacíos
            {"patente": "HWGR-93", "tipo_vehiculo_display": "Automóvil", "marca": "Hyundai", "modelo": "Accent RB 5DR", "anio": "2016", "numero_chasis": "G4FCFU346196", "numero_motor": "KMHCU41DAGU976643", "pasajeros": "4"},
            {"patente": "TWPK-32", "tipo_vehiculo_display": "Station Wagon", "marca": "Hyundai", "modelo": "Suv Tucson NX4 2.0 AUT", "anio": "2025", "numero_chasis": "G4NLRH056629", "numero_motor": "KMHJB81DBSU385945", "pasajeros": "4"},
            {"patente": "FTVC-24", "tipo_vehiculo_display": "Automóvil", "marca": "Hyundai", "modelo": "Sonata YFGL 2.0", "anio": "2013", "numero_chasis": "G4NACA192785", "numero_motor": "KMHEB41AADA535977", "pasajeros": "4"},
            {"patente": "TVXY-28", "tipo_vehiculo_display": "Minibus", "marca": "Hyundai", "modelo": "Staria US4 CRDI 2.2", "anio": "2025", "numero_chasis": "D4HBR031865", "numero_motor": "KMJYA371ASU210231", "pasajeros": "8"},
        ]

        # Mapeo de los nombres mostrados en la imagen a las claves del modelo
        # Asegúrate que estas claves coincidan con las definidas en Vehiculo.TIPO_VEHICULO_CHOICES
        tipo_vehiculo_map = {
            "Minibus": "minibus",
            "Station Wagon": "station_wagon",
            "Camioneta": "camioneta",
            "Automóvil": "automovil",
        }

        created_count = 0
        updated_count = 0

        for data_dict in vehicle_data:
            patente = data_dict.get("patente")
            if not patente:
                self.stdout.write(self.style.WARNING(f"Registro omitido por falta de patente: {data_dict}"))
                continue

            tipo_display = data_dict.get("tipo_vehiculo_display")
            tipo_key = tipo_vehiculo_map.get(tipo_display)

            if not tipo_key:
                self.stdout.write(self.style.WARNING(f"Patente {patente} omitida: Tipo de vehículo '{tipo_display}' desconocido."))
                continue
            
            # Manejo de valores potencialmente problemáticos o vacíos
            numero_motor_val = data_dict.get("numero_motor")
            if patente == "KZXL-86" and numero_motor_val == ">":
                numero_motor_val = None # O un identificador único si no puede ser nulo y debe ser único. Dado que es nullable, None está bien.
            
            numero_chasis_val = data_dict.get("numero_chasis") if data_dict.get("numero_chasis") else None
            if patente == "JSHD-66" and not data_dict.get("numero_motor"): # Si es una cadena vacía
                 numero_motor_val = None


            defaults = {
                'tipo_vehiculo': tipo_key,
                'marca': data_dict.get("marca"),
                'modelo': data_dict.get("modelo"),
                'anio': int(data_dict.get("anio")) if data_dict.get("anio") else None,
                'numero_chasis': numero_chasis_val,
                'numero_motor': numero_motor_val, # Ya procesado arriba
                'capacidad_pasajeros': int(data_dict.get("pasajeros")) if data_dict.get("pasajeros") else None,
                'estado': 'disponible', # Estado por defecto para los vehículos nuevos
            }
            
            # Eliminar claves con valor None si el campo del modelo no acepta null (no es el caso aquí para chasis/motor)
            # defaults = {k: v for k, v in defaults.items() if v is not None} 

            try:
                obj, created = Vehiculo.objects.update_or_create(
                    patente=patente,
                    defaults=defaults
                )
                if created:
                    created_count += 1
                    self.stdout.write(self.style.SUCCESS(f"Vehículo creado exitosamente: {patente}"))
                else:
                    updated_count += 1
                    self.stdout.write(self.style.NOTICE(f"Vehículo actualizado exitosamente: {patente}"))
            except Exception as e:
                self.stdout.write(self.style.ERROR(f"Error procesando vehículo {patente}: {e}"))
                self.stdout.write(self.style.ERROR(f"Datos que causaron el error: {defaults}"))

        self.stdout.write(self.style.SUCCESS(f"Carga de vehículos completada. Creados: {created_count}, Actualizados: {updated_count}"))