# asignaciones/serializers.py
from rest_framework import serializers
from .models import Vehiculo, Conductor, Asignacion, RegistroTurno
from django.utils import timezone

class VehiculoSerializer(serializers.ModelSerializer):
    foto_url = serializers.ImageField(source='foto', read_only=True) # Mantenemos source='foto'
    tipo_vehiculo_display = serializers.CharField(source='get_tipo_vehiculo_display', read_only=True)

    class Meta:
        model = Vehiculo
        fields = [
            'id',
            'marca',
            'modelo',
            'patente',
            'anio',
            'numero_chasis',
            'numero_motor',
            'capacidad_pasajeros',
            'estado',
            'foto', # Campo para escribir/subir
            'foto_url', # Campo para leer la URL
            'tipo_vehiculo',
            'tipo_vehiculo_display', 
            'ubicacion',
            'conductor_preferente',
            'kilometraje',  # NUEVO: Añadido campo 'kilometraje'
        ]
        extra_kwargs = { # NUEVO
            'foto': {'write_only': True, 'required': False}
        }


class ConductorSerializer(serializers.ModelSerializer):
    estado_disponibilidad_display = serializers.CharField(source='get_estado_disponibilidad_display', read_only=True)
    foto_url = serializers.ImageField(source='foto', read_only=True) # NUEVO: para leer la URL de la foto

    class Meta:
        model = Conductor
        fields = [
            'id',
            'nombre',
            'apellido',
            'numero_licencia',
            'fecha_vencimiento_licencia',
            'telefono',
            'email',
            'activo',
            'fecha_registro',
            'foto', # NUEVO: para escribir/subir la foto
            'foto_url', # NUEVO
            'tipos_vehiculo_habilitados',
            'estado_disponibilidad',
            'estado_disponibilidad_display',
        ]
        read_only_fields = ['fecha_registro']
        extra_kwargs = { # NUEVO
            'foto': {'write_only': True, 'required': False}
        }


class AsignacionSerializer(serializers.ModelSerializer):
    vehiculo = VehiculoSerializer(read_only=True)
    conductor = ConductorSerializer(read_only=True) # Ahora incluirá la foto del conductor

    vehiculo_id = serializers.PrimaryKeyRelatedField(
        queryset=Vehiculo.objects.all(),
        source='vehiculo',
        write_only=True,
        allow_null=True,
        required=False
    )
    conductor_id = serializers.PrimaryKeyRelatedField(
        queryset=Conductor.objects.filter(activo=True),
        source='conductor',
        write_only=True,
        allow_null=True,
        required=False
    )

    estado_display = serializers.CharField(source='get_estado_display', read_only=True)
    solicitante_jerarquia_display = serializers.CharField(source='get_solicitante_jerarquia_display', read_only=True)
    req_tipo_vehiculo_preferente_display = serializers.CharField(source='get_req_tipo_vehiculo_preferente_display', read_only=True)


    class Meta:
        model = Asignacion
        fields = [
            'id',
            'vehiculo',
            'vehiculo_id',
            'conductor',
            'conductor_id',
            'fecha_hora_requerida_inicio',
            'fecha_hora_fin_prevista',
            'fecha_hora_fin_real',
            'estado',
            'estado_display',
            'destino_descripcion',
            'origen_descripcion',
            'fecha_hora_solicitud',
            'req_pasajeros',
            'req_tipo_vehiculo_preferente',
            'req_tipo_vehiculo_preferente_display',
            'req_caracteristicas_especiales',
            'origen_lat',
            'origen_lon',
            'destino_lat',
            'destino_lon',
            'observaciones',
            'solicitante_jerarquia',
            'solicitante_jerarquia_display',
            'solicitante_nombre',
            'solicitante_telefono',
            'fecha_asignacion_funcionario',
            'distancia_recorrida_km',  # NUEVO: Añadido campo 'distancia_recorrida_km'
        ]
        read_only_fields = ['fecha_hora_solicitud']

    def validate(self, data):
        fecha_inicio = data.get('fecha_hora_requerida_inicio', getattr(self.instance, 'fecha_hora_requerida_inicio', None))
        fecha_fin_prevista = data.get('fecha_hora_fin_prevista', getattr(self.instance, 'fecha_hora_fin_prevista', None))

        if fecha_inicio and fecha_fin_prevista:
            if fecha_inicio >= fecha_fin_prevista:
                raise serializers.ValidationError({
                    "fecha_hora_fin_prevista": "La fecha de fin prevista debe ser posterior a la fecha de inicio requerida."
                })

        vehiculo_obj = data.get('vehiculo')

        if vehiculo_obj:
            if self.instance is None or (self.instance and self.instance.vehiculo != vehiculo_obj):
                if vehiculo_obj.estado not in ['disponible', 'reservado']:
                    raise serializers.ValidationError({
                        "vehiculo_id": f"El vehículo {vehiculo_obj.patente} no está disponible ('{vehiculo_obj.get_estado_display()}')."
                    })
        return data
    def create(self, validated_data):
        request = self.context.get('request')
        if request and request.user and request.user.groups.filter(name__istartswith='funcionario').exists():
            validated_data['fecha_asignacion_funcionario'] = timezone.now()
        return super().create(validated_data)
    def update(self, instance, validated_data):
        request = self.context.get('request')
        if request and request.user and request.user.groups.filter(name__istartswith='funcionario').exists():
            validated_data['fecha_asignacion_funcionario'] = timezone.now()
        return super().update(instance, validated_data)

class RegistroTurnoSerializer(serializers.ModelSerializer):
    """
    Serializer para el modelo RegistroTurno.
    """
    class Meta:
        model = RegistroTurno
        fields = '__all__'