from rest_framework import viewsets, permissions
from django.contrib.auth.models import Group
from .models import Vehiculo, Conductor, Asignacion
from .serializers import VehiculoSerializer, ConductorSerializer, AsignacionSerializer

# --- NUEVA Clase de Permiso Personalizado ---
class IsSolicitanteOrAdmin(permissions.BasePermission):
    SOLICITANTE_GROUP_NAME = 'Solicitantes de Traslados'

    def _is_in_solicitante_group(self, user):
        if not user or not user.is_authenticated:
            return False
        try:
            solicitante_group = Group.objects.get(name=self.SOLICITANTE_GROUP_NAME)
            return solicitante_group in user.groups.all()
        except Group.DoesNotExist:
            return False

    def has_permission(self, request, view):
        if not request.user or not request.user.is_authenticated:
            return False

        # Admins (superuser o staff) tienen todos los permisos a nivel de vista
        if request.user.is_superuser or request.user.is_staff:
            return True

        is_solicitante = self._is_in_solicitante_group(request.user)

        if view.action == 'create': # POST para crear nuevas asignaciones
            return is_solicitante
        if view.action in ['list', 'retrieve']: # GET para listar o ver una asignación
            # Solicitantes pueden listar (verán solo las suyas por get_queryset) y ver detalle
            return is_solicitante
        
        # Solicitantes no pueden actualizar o borrar por defecto a nivel de vista general
        # Esto se refinará en has_object_permission si se permite para objetos específicos.
        # Por ahora, un solicitante no puede editar ni borrar una vez creada.
        if view.action in ['update', 'partial_update', 'destroy']:
            return False # Solo admins/staff pueden modificar/borrar por defecto
            
        return False # Denegar otras acciones no contempladas

    def has_object_permission(self, request, view, obj):
        if not request.user or not request.user.is_authenticated:
            return False

        # Admins (superuser o staff) pueden operar sobre cualquier objeto
        if request.user.is_superuser or request.user.is_staff:
            return True

        is_solicitante = self._is_in_solicitante_group(request.user)

        if is_solicitante and isinstance(obj, Asignacion):
            # Solicitantes solo pueden ver (retrieve) sus propias asignaciones.
            # No pueden editar (update/partial_update) ni borrar (destroy) sus asignaciones.
            if view.action == 'retrieve':
                return obj.solicitante_usuario == request.user
            return False # No tienen permiso para otras acciones sobre el objeto
        
        return False

# --- MODIFICADO: AsignacionViewSet ---
class AsignacionViewSet(viewsets.ModelViewSet):
    queryset = Asignacion.objects.all().order_by('-fecha_hora_solicitud')
    serializer_class = AsignacionSerializer
    permission_classes = [IsSolicitanteOrAdmin] # Aplicar el permiso personalizado

    def get_queryset(self):
        user = self.request.user
        if not user or not user.is_authenticated:
            return Asignacion.objects.none()

        # Admins (superuser o staff) ven todas las asignaciones
        if user.is_superuser or user.is_staff:
            return Asignacion.objects.all().order_by('-fecha_hora_solicitud')

        # Solicitantes solo ven sus propias asignaciones
        try:
            solicitante_group = Group.objects.get(name=IsSolicitanteOrAdmin.SOLICITANTE_GROUP_NAME)
            if solicitante_group in user.groups.all():
                return Asignacion.objects.filter(solicitante_usuario=user).order_by('-fecha_hora_solicitud')
        except Group.DoesNotExist:
            pass # Si el grupo no existe, no se filtra nada extra aquí

        return Asignacion.objects.none() # Por defecto, no mostrar nada si no es admin ni solicitante

    def perform_create(self, serializer):
        user = self.request.user
        
        # El estado por defecto es 'pendiente_auto' según el modelo Asignacion
        # No se asigna vehículo ni conductor al ser creado por un solicitante
        serializer.save(
            solicitante_usuario=user,
            solicitante_nombre=user.get_full_name() or user.username
            # Los campos 'solicitante_telefono' y 'solicitante_jerarquia'
            # vendrán en serializer.validated_data del formulario.
        )

# --- Vistas existentes para Vehiculo y Conductor (solo para Admins) ---
class VehiculoViewSet(viewsets.ModelViewSet): #
    queryset = Vehiculo.objects.all() #
    serializer_class = VehiculoSerializer #
    permission_classes = [permissions.IsAdminUser] # Solo Admins pueden acceder

class ConductorViewSet(viewsets.ModelViewSet): #
    queryset = Conductor.objects.all() #
    serializer_class = ConductorSerializer #
    permission_classes = [permissions.IsAdminUser] # Solo Admins pueden acceder