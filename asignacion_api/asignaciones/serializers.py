from rest_framework import serializers
from django.contrib.auth import get_user_model # Para obtener el modelo User activo
from django.contrib.auth.models import Group    # Para obtener los nombres de los grupos
from .models import Vehiculo, Conductor, Asignacion

User = get_user_model()

class VehiculoSerializer(serializers.ModelSerializer):
    class Meta:
        model = Vehiculo
        fields = '__all__'

class ConductorSerializer(serializers.ModelSerializer):
    class Meta:
        model = Conductor
        fields = '__all__'

# --- NUEVO Serializer para detalles del Usuario ---
class UserDetailSerializer(serializers.ModelSerializer):
    groups = serializers.SerializerMethodField()
    full_name = serializers.SerializerMethodField()

    class Meta:
        model = User
        fields = (
            'id', 'username', 'email', 'first_name', 'last_name', 'full_name',
            'is_staff', 'is_superuser',
            'groups'
        )
        read_only_fields = ('is_staff', 'is_superuser', 'groups', 'full_name')

    def get_groups(self, user):
        return [group.name for group in user.groups.all()]

    def get_full_name(self, user):
        name = user.get_full_name()
        return name if name else user.username

# --- MODIFICADO AsignacionSerializer ---
class AsignacionSerializer(serializers.ModelSerializer):
    solicitante_usuario_details = UserDetailSerializer(source='solicitante_usuario', read_only=True, allow_null=True)
    vehiculo_details = VehiculoSerializer(source='vehiculo', read_only=True, allow_null=True)
    conductor_details = ConductorSerializer(source='conductor', read_only=True, allow_null=True)
    solicitante_jerarquia_display = serializers.CharField(source='get_solicitante_jerarquia_display', read_only=True)
    estado_display = serializers.CharField(source='get_estado_display', read_only=True)
    req_tipo_vehiculo_preferente_display = serializers.CharField(source='get_req_tipo_vehiculo_preferente_display', read_only=True, allow_null=True)

    class Meta:
        model = Asignacion
        fields = [
            'id',
            'vehiculo', 
            'conductor', 
            'destino_descripcion',
            'origen_descripcion',
            'fecha_hora_solicitud',
            'fecha_hora_requerida_inicio',
            'req_pasajeros',
            'req_tipo_vehiculo_preferente',
            'req_caracteristicas_especiales',
            'origen_lat',
            'origen_lon',
            'destino_lat',
            'destino_lon',
            'fecha_hora_fin_prevista',
            'fecha_hora_fin_real',
            'estado',
            'observaciones',
            'solicitante_jerarquia',
            'solicitante_nombre',
            'solicitante_telefono',
            'solicitante_usuario', # THIS IS THE FIELD IN QUESTION
            # Campos para display/lectura detallada
            'solicitante_usuario_details',
            'vehiculo_details',
            'conductor_details',
            'solicitante_jerarquia_display',
            'estado_display',
            'req_tipo_vehiculo_preferente_display',
        ]
        read_only_fields = (
            'fecha_hora_solicitud',
            'solicitante_usuario', # Marked as read_only because it's set by the view
            'solicitante_usuario_details',
            'vehiculo_details',
            'conductor_details',
            'solicitante_jerarquia_display',
            'estado_display',
            'req_tipo_vehiculo_preferente_display',
        )
        extra_kwargs = {
            'vehiculo': {'allow_null': True, 'required': False},
            'conductor': {'allow_null': True, 'required': False},
            'origen_descripcion': {'allow_blank': True, 'required': False},
            'req_tipo_vehiculo_preferente': {'allow_blank': True, 'allow_null': True, 'required': False},
            'req_caracteristicas_especiales': {'allow_blank': True, 'required': False},
            'origen_lat': {'allow_null': True, 'required': False},
            'origen_lon': {'allow_null': True, 'required': False},
            'destino_lat': {'allow_null': True, 'required': False},
            'destino_lon': {'allow_null': True, 'required': False},
            'fecha_hora_fin_prevista': {'allow_null': True, 'required': False},
            'fecha_hora_fin_real': {'allow_null': True, 'required': False},
            'observaciones': {'allow_blank': True, 'allow_null': True, 'required': False},
            'solicitante_nombre': {'allow_blank': True, 'required': False},
        }