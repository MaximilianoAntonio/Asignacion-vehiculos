# asignaciones/views.py
from django.shortcuts import render
from django.contrib.auth.models import Group
from django.utils import timezone
from rest_framework import viewsets, status, permissions
from rest_framework.decorators import action
from rest_framework.response import Response
from django_filters.rest_framework import DjangoFilterBackend
from rest_framework.permissions import IsAdminUser, AllowAny, IsAuthenticated
from django.views.decorators.csrf import csrf_exempt
import requests
from django.http import JsonResponse

from .models import Vehiculo, Conductor, Asignacion, RegistroTurno
from .serializers import (
    VehiculoSerializer,
    ConductorSerializer,
    AsignacionSerializer,
    RegistroTurnoSerializer
)

from rest_framework.authtoken.views import ObtainAuthToken
from rest_framework.authtoken.models import Token
from .services import asignar_vehiculos_automatico_lote

from rest_framework.views import APIView
from rest_framework.filters import SearchFilter, OrderingFilter

class UserGroupView(APIView):
    permission_classes = [IsAuthenticated]
    def get(self, request):
        groups = list(request.user.groups.values_list('name', flat=True))
        return Response({'groups': groups})

class CustomAuthToken(ObtainAuthToken):
    def post(self, request, *args, **kwargs):
        serializer = self.serializer_class(data=request.data, context={'request': request})
        serializer.is_valid(raise_exception=True)
        user = serializer.validated_data['user']
        token, created = Token.objects.get_or_create(user=user)
        groups = list(user.groups.values_list('name', flat=True))
        return Response({
            'token': token.key,
            'user_id': user.pk,
            'username': user.username,
            'groups': groups,  # <-- Esto es lo importante
        })

@csrf_exempt
def nominatim_proxy(request):
    q = request.GET.get('q', '')
    # Agrega la región al texto de búsqueda para limitar resultados
    full_query = f"{q}, Región de Valparaíso, Chile"
    url = (
        "https://nominatim.openstreetmap.org/search"
        f"?format=json&countrycodes=cl&addressdetails=1&limit=20&q={full_query}"
    )
    r = requests.get(url, headers={'User-Agent': 'asignacion-app'})
    return JsonResponse(r.json(), safe=False)

class VehiculoViewSet(viewsets.ModelViewSet):
    queryset = Vehiculo.objects.all().order_by('marca', 'modelo')
    serializer_class = VehiculoSerializer
    permission_classes = [permissions.IsAuthenticatedOrReadOnly]

    filter_backends = [DjangoFilterBackend, SearchFilter, OrderingFilter]
    # Asegúrate que estos campos coincidan con tu modelo Vehiculo actual
    filterset_fields = ['estado', 'marca', 'tipo_vehiculo', 'capacidad_pasajeros']
    search_fields = ['patente', 'modelo', 'marca', 'anio', 'numero_chasis', 'numero_motor'] # Añadidos campos buscables
    ordering_fields = ['marca', 'modelo', 'capacidad_pasajeros', 'estado', 'tipo_vehiculo', 'anio'] # Añadido anio


class ConductorViewSet(viewsets.ModelViewSet):
    queryset = Conductor.objects.all().order_by('apellido', 'nombre')
    serializer_class = ConductorSerializer
    permission_classes = [permissions.IsAuthenticatedOrReadOnly]

    filter_backends = [DjangoFilterBackend, SearchFilter, OrderingFilter]
    filterset_fields = ['activo', 'estado_disponibilidad']
    search_fields = ['nombre', 'apellido', 'numero_licencia']
    ordering_fields = ['apellido', 'nombre', 'activo', 'estado_disponibilidad']

    @action(detail=True, methods=['post'], url_path='iniciar-turno')
    def iniciar_turno(self, request, pk=None):
        conductor = self.get_object()
        
        # Si el conductor ya está en un turno, no permitir iniciar otro.
        if conductor.estado_disponibilidad in ['disponible', 'en_ruta']:
            return Response({'error': 'El conductor ya tiene un turno iniciado.'}, status=status.HTTP_400_BAD_REQUEST)

        RegistroTurno.objects.create(conductor=conductor, tipo='entrada', fecha_hora=timezone.now())
        conductor.estado_disponibilidad = 'disponible'
        conductor.save()
        serializer = self.get_serializer(conductor)
        return Response(serializer.data)

    @action(detail=True, methods=['post'], url_path='finalizar-turno')
    def finalizar_turno(self, request, pk=None):
        conductor = self.get_object()

        # Si el conductor no está en un turno activo, no se puede finalizar.
        if conductor.estado_disponibilidad in ['dia_libre', 'no_disponible']:
            return Response({'error': 'El conductor no tiene un turno activo para finalizar.'}, status=status.HTTP_400_BAD_REQUEST)
        
        if conductor.estado_disponibilidad == 'en_ruta':
            return Response({'error': 'No se puede finalizar el turno de un conductor que está en ruta.'}, status=status.HTTP_400_BAD_REQUEST)

        # Si el estado es 'disponible', se puede finalizar el turno.
        RegistroTurno.objects.create(conductor=conductor, tipo='salida', fecha_hora=timezone.now())
        conductor.estado_disponibilidad = 'dia_libre'
        conductor.save()
        serializer = self.get_serializer(conductor)
        return Response(serializer.data)


class RegistroTurnoViewSet(viewsets.ModelViewSet):
    """
    API endpoint para ver y editar registros de turno.
    """
    queryset = RegistroTurno.objects.all().order_by('-fecha_hora')
    serializer_class = RegistroTurnoSerializer
    permission_classes = [permissions.IsAuthenticated]
    filter_backends = [DjangoFilterBackend]
    filterset_fields = {
        'conductor': ['exact'],
        'fecha_hora': ['gte', 'lte', 'date'],
    }


class AsignacionViewSet(viewsets.ModelViewSet):
    queryset = Asignacion.objects.all().select_related('vehiculo', 'conductor').order_by('-fecha_hora_solicitud')
    serializer_class = AsignacionSerializer
    permission_classes = [permissions.IsAuthenticated] # Cambiado para requerir autenticación para todas las acciones

    filter_backends = [DjangoFilterBackend, SearchFilter, OrderingFilter]
    filterset_fields = {
        'estado': ['exact'],
        'vehiculo__patente': ['exact', 'icontains'], # Ajustado para buscar por patente
        'conductor__apellido': ['exact', 'icontains'],
        'fecha_hora_requerida_inicio': ['exact', 'gte', 'lte', 'date'],
        'solicitante_nombre': ['icontains'], # Para buscar por nombre del solicitante
        'solicitante_jerarquia': ['exact'], # Para filtrar por jerarquía
    }
    search_fields = ['destino_descripcion', 'vehiculo__patente', 'observaciones', 'solicitante_nombre']
    ordering_fields = ['fecha_hora_requerida_inicio', 'fecha_hora_fin_prevista', 'estado', 'solicitante_jerarquia'] # 'tipo_servicio' ELIMINADO

    @action(detail=False, methods=['post'], url_path='asignar-vehiculos-auto-lote', permission_classes=[AllowAny])
    def asignar_vehiculos_auto_lote(self, request):
        resultados = asignar_vehiculos_automatico_lote()
        return Response({'resultados': resultados})
    @action(detail=False, methods=['get'], url_path='estado-disponibilidad-conductores')
    def estado_disponibilidad_conductores(self, request):
        """
        Devuelve el estado de disponibilidad de todos los conductores.
        """
        conductores = Conductor.objects.all().order_by('apellido', 'nombre')
        serializer = ConductorSerializer(conductores, many=True)
        return Response(serializer.data)

    
    search_fields = ['destino_descripcion', 'vehiculo__patente', 'observaciones', 'solicitante_nombre']
    ordering_fields = ['fecha_hora_requerida_inicio', 'fecha_hora_fin_prevista', 'estado', 'solicitante_jerarquia'] # 'tipo_servicio' ELIMINADO

    @action(detail=False, methods=['post'], url_path='asignar-vehiculos-auto-lote', permission_classes=[AllowAny])
    def asignar_vehiculos_auto_lote(self, request):
        resultados = asignar_vehiculos_automatico_lote()
        return Response({'resultados': resultados})
    @action(detail=False, methods=['get'], url_path='estado-disponibilidad-conductores')
    def estado_disponibilidad_conductores(self, request):
        """
        Devuelve el estado de disponibilidad de todos los conductores.
        """
        conductores = Conductor.objects.all().order_by('apellido', 'nombre')
        serializer = ConductorSerializer(conductores, many=True)
        return Response(serializer.data)



