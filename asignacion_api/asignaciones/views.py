# asignaciones/views.py
from django.shortcuts import render
from rest_framework import viewsets, permissions, status
from rest_framework.response import Response
from rest_framework.decorators import action
from django.utils import timezone
from django_filters.rest_framework import DjangoFilterBackend
from rest_framework.filters import SearchFilter, OrderingFilter
import requests
from django.http import JsonResponse
from django.views.decorators.csrf import csrf_exempt


from .models import Vehiculo, Conductor, Asignacion
from .serializers import (
    VehiculoSerializer,
    ConductorSerializer,
    AsignacionSerializer
)

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


class AsignacionViewSet(viewsets.ModelViewSet):
    queryset = Asignacion.objects.all().select_related('vehiculo', 'conductor').order_by('-fecha_hora_solicitud')
    serializer_class = AsignacionSerializer
    permission_classes = [permissions.IsAuthenticated] # Cambiado para requerir autenticación para todas las acciones

    filter_backends = [DjangoFilterBackend, SearchFilter, OrderingFilter]
    filterset_fields = {
        'estado': ['exact'],
        # 'tipo_servicio': ['exact'], # ELIMINADA ESTA LÍNEA
        'vehiculo__patente': ['exact', 'icontains'], # Ajustado para buscar por patente
        'conductor__apellido': ['exact', 'icontains'],
        'fecha_hora_requerida_inicio': ['exact', 'gte', 'lte', 'date'],
        'solicitante_nombre': ['icontains'], # Para buscar por nombre del solicitante
        'solicitante_jerarquia': ['exact'], # Para filtrar por jerarquía
    }
    search_fields = ['destino_descripcion', 'vehiculo__patente', 'observaciones', 'solicitante_nombre']
    ordering_fields = ['fecha_hora_requerida_inicio', 'fecha_hora_fin_prevista', 'estado', 'solicitante_jerarquia'] # 'tipo_servicio' ELIMINADO

    @action(detail=True, methods=['post'], url_path='completar')
    def completar_asignacion(self, request, pk=None):
        asignacion = self.get_object()
        if asignacion.estado == 'activa':
            asignacion.estado = 'completada'
            asignacion.fecha_hora_fin_real = timezone.now()
            if asignacion.vehiculo:
                asignacion.vehiculo.estado = 'disponible'
                asignacion.vehiculo.save()
            if asignacion.conductor:
                asignacion.conductor.estado_disponibilidad = 'disponible'
                asignacion.conductor.save()
            asignacion.save()
            return Response({'status': 'asignación completada', 'asignacion': self.get_serializer(asignacion).data}, status=status.HTTP_200_OK)
        else:
            return Response({'error': 'La asignación no está activa o ya está completada/cancelada.'}, status=status.HTTP_400_BAD_REQUEST)

    @action(detail=True, methods=['post'], url_path='iniciar')
    def iniciar_asignacion(self, request, pk=None):
        asignacion = self.get_object()
        if asignacion.estado == 'programada':
            if not asignacion.vehiculo or not asignacion.conductor:
                return Response({'error': 'La asignación debe tener un vehículo y un conductor asignados para poder iniciarla.'}, status=status.HTTP_400_BAD_REQUEST)

            if asignacion.vehiculo.estado not in ['disponible', 'reservado']:
                return Response({'error': f'El vehículo {asignacion.vehiculo.patente} no está disponible.'}, status=status.HTTP_400_BAD_REQUEST)

            if asignacion.conductor.estado_disponibilidad != 'disponible' or not asignacion.conductor.activo :
                return Response({'error': f'El conductor {asignacion.conductor} no está disponible o no está activo.'}, status=status.HTTP_400_BAD_REQUEST)

            asignacion.vehiculo.estado = 'en_uso'
            asignacion.vehiculo.save()
            asignacion.conductor.estado_disponibilidad = 'en_ruta'
            asignacion.conductor.save()

            asignacion.estado = 'activa'
            asignacion.save()
            return Response({'status': 'asignación iniciada', 'asignacion': self.get_serializer(asignacion).data}, status=status.HTTP_200_OK)
        else:
            return Response({'error': 'La asignación no está programada o ya está en otro estado.'}, status=status.HTTP_400_BAD_REQUEST)

    def perform_create(self, serializer):
        # Aquí podrías añadir lógica futura si es necesario, por ejemplo,
        # para llamar al servicio de asignación automática.
        # Por ahora, solo guarda la instancia.
        # asignacion_obj = serializer.save()
        # if asignacion_obj.estado == 'pendiente_auto':
        #     from .services import intentar_asignacion_automatica # Suponiendo que lo crearás
        #     intentar_asignacion_automatica(asignacion_obj)
        serializer.save()
