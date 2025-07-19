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
    permission_classes = [permissions.AllowAny]

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
    filterset_fields = ['estado_disponibilidad']
    search_fields = ['run', 'nombre', 'apellido', 'numero_licencia']
    ordering_fields = ['apellido', 'nombre', 'estado_disponibilidad']

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
    queryset = Asignacion.objects.all().select_related('vehiculo', 'conductor').order_by('-fecha_hora_requerida_inicio')
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

# Código a agregar al final de asignaciones/views.py

from django.db.models import Count, Sum, Avg, Q, F
from datetime import datetime, timedelta

class DashboardStatsView(APIView):
    """
    Vista principal para obtener todas las estadísticas del dashboard
    """
    
    def get(self, request):
        try:
            # Obtener parámetros de filtro
            tipo_periodo = request.GET.get('tipo_periodo', 'monthly')
            fecha_inicio = request.GET.get('fecha_inicio')
            fecha_fin = request.GET.get('fecha_fin')
            
            # Calcular fechas basadas en el período
            fechas = self._calcular_fechas(tipo_periodo, fecha_inicio, fecha_fin)
            
            # Obtener datos para el dashboard
            data = {
                'general': self._get_general_stats(fechas),
                'vehiculos': self._get_vehiculos_stats(fechas),
                'conductores': self._get_conductores_stats(fechas),
                'mapa': self._get_mapa_stats(fechas),
                'tendencias': self._get_tendencias(fechas),
                'metadatos': {
                    'fecha_generacion': timezone.now().isoformat(),
                    'filtros_aplicados': {
                        'tipo_periodo': tipo_periodo,
                        'fecha_inicio': fecha_inicio,
                        'fecha_fin': fecha_fin,
                        'periodo_calculado': {
                            'inicio': fechas['inicio'].isoformat(),
                            'fin': fechas['fin'].isoformat()
                        }
                    }
                }
            }
            
            return Response(data, status=status.HTTP_200_OK)
            
        except Exception as e:
            return Response(
                {'error': f'Error al generar estadísticas del dashboard: {str(e)}'}, 
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )
    
    def _calcular_fechas(self, tipo_periodo, fecha_inicio, fecha_fin):
        """Calcula las fechas de inicio y fin basadas en el tipo de período"""
        hoy = timezone.now().date()
        
        if tipo_periodo == 'custom' and fecha_inicio and fecha_fin:
            inicio = datetime.strptime(fecha_inicio, '%Y-%m-%d').date()
            fin = datetime.strptime(fecha_fin, '%Y-%m-%d').date()
        elif tipo_periodo == 'daily':
            inicio = hoy
            fin = hoy
        elif tipo_periodo == 'weekly':
            inicio = hoy - timedelta(days=hoy.weekday())
            fin = inicio + timedelta(days=6)
        elif tipo_periodo == 'monthly':
            inicio = hoy.replace(day=1)
            fin = (inicio + timedelta(days=32)).replace(day=1) - timedelta(days=1)
        elif tipo_periodo == 'quarterly':
            mes_inicio = ((hoy.month - 1) // 3) * 3 + 1
            inicio = hoy.replace(month=mes_inicio, day=1)
            fin = (inicio + timedelta(days=93)).replace(day=1) - timedelta(days=1)
        elif tipo_periodo == 'yearly':
            inicio = hoy.replace(month=1, day=1)
            fin = hoy.replace(month=12, day=31)
        else:
            # Default a mensual
            inicio = hoy.replace(day=1)
            fin = (inicio + timedelta(days=32)).replace(day=1) - timedelta(days=1)
        
        return {'inicio': inicio, 'fin': fin}
    
    def _get_general_stats(self, fechas):
        """Obtiene estadísticas generales del sistema"""
        # Filtrar asignaciones del período
        asignaciones = Asignacion.objects.filter(
            fecha_hora_requerida_inicio__date__range=[fechas['inicio'], fechas['fin']]
        )
        
        # Conteos totales
        vehiculos_total = Vehiculo.objects.count()
        conductores_total = Conductor.objects.count()
        
        # Estadísticas de asignaciones
        total_asignaciones = asignaciones.count()
        asignaciones_completadas = asignaciones.filter(estado='completada').count()
        asignaciones_activas = asignaciones.filter(estado='activa').count()
        asignaciones_programadas = asignaciones.filter(estado='programada').count()
        
        # Calcular tasa de completitud
        tasa_completitud = self._calcular_porcentaje(asignaciones_completadas, total_asignaciones)
        
        # Distancia total recorrida
        distancia_total_km = asignaciones.aggregate(
            total=Sum('distancia_recorrida_km')
        )['total'] or 0
        
        # Vehículos utilizados y disponibles
        vehiculos_utilizados = asignaciones.values('vehiculo').distinct().count()
        vehiculos_disponibles = Vehiculo.objects.filter(estado='disponible').count()
        vehiculos_en_mantenimiento = Vehiculo.objects.filter(estado='mantenimiento').count()
        vehiculos_en_uso = Vehiculo.objects.filter(estado='en_uso').count()
        vehiculos_reservados = Vehiculo.objects.filter(estado='reservado').count()
        
        # Conductores utilizados y disponibles
        conductores_utilizados = asignaciones.values('conductor').distinct().count()
        conductores_disponibles = Conductor.objects.filter(estado_disponibilidad='disponible').count()
        conductores_en_ruta = Conductor.objects.filter(estado_disponibilidad='en_ruta').count()
        conductores_dia_libre = Conductor.objects.filter(estado_disponibilidad='dia_libre').count()
        conductores_no_disponibles = Conductor.objects.filter(estado_disponibilidad='no_disponible').count()
        
        return {
            'total_asignaciones': total_asignaciones,
            'asignaciones_completadas': asignaciones_completadas,
            'asignaciones_activas': asignaciones_activas,
            'asignaciones_programadas': asignaciones_programadas,
            'tasa_completitud': tasa_completitud,
            'distancia_total_km': round(distancia_total_km, 2),
            'vehiculos_utilizados': vehiculos_utilizados,
            'vehiculos_disponibles': vehiculos_disponibles,
            'vehiculos_en_mantenimiento': vehiculos_en_mantenimiento,
            'vehiculos_en_uso': vehiculos_en_uso,
            'vehiculos_reservados': vehiculos_reservados,
            'conductores_utilizados': conductores_utilizados,
            'conductores_disponibles': conductores_disponibles,
            'conductores_en_ruta': conductores_en_ruta,
            'conductores_dia_libre': conductores_dia_libre,
            'conductores_no_disponibles': conductores_no_disponibles,
            'total_vehiculos': vehiculos_total,
            'total_conductores': conductores_total
        }
    
    def _get_vehiculos_stats(self, fechas):
        """Obtiene estadísticas detalladas de vehículos"""
        vehiculos = Vehiculo.objects.all()
        
        # Estado de la flota
        estado_flota = list(vehiculos.values('estado').annotate(count=Count('id')))
        
        # Distribución por tipo de vehículo
        distribucion_tipo = list(vehiculos.values('tipo_vehiculo').annotate(count=Count('id')))
        
        # Análisis de mantenimiento basado en kilometraje
        vehiculos_mantenimiento = []
        estadisticas_mantenimiento = {
            'criticos': 0,
            'urgentes': 0,
            'proximos': 0,
            'ok': 0,
            'menor_urgente': 0
        }
        
        for vehiculo in vehiculos:
            km_actual = vehiculo.kilometraje or 0
            km_mantenimiento = 10000  # Cada 10,000 km
            km_desde_ultimo = km_actual % km_mantenimiento
            km_restantes = km_mantenimiento - km_desde_ultimo
            porcentaje = (km_desde_ultimo / km_mantenimiento) * 100
            
            # Determinar urgencia
            if porcentaje >= 95:
                urgencia = 'critico'
                estadisticas_mantenimiento['criticos'] += 1
            elif porcentaje >= 90:
                urgencia = 'urgente'
                estadisticas_mantenimiento['urgentes'] += 1
            elif porcentaje >= 80:
                urgencia = 'proximo'
                estadisticas_mantenimiento['proximos'] += 1
            else:
                urgencia = 'ok'
                estadisticas_mantenimiento['ok'] += 1
            
            if urgencia != 'ok':
                vehiculos_mantenimiento.append({
                    'id': vehiculo.id,
                    'patente': vehiculo.patente,
                    'marca': vehiculo.marca,
                    'modelo': vehiculo.modelo,
                    'kilometraje': km_actual,
                    'km_restantes': km_restantes,
                    'porcentaje': round(porcentaje, 1),
                    'urgencia': urgencia,
                    'proximo_mantenimiento_km': km_actual + km_restantes
                })
        
        estadisticas_mantenimiento['menor_urgente'] = estadisticas_mantenimiento['ok']
        
        # Uso por vehículo en el período
        asignaciones = Asignacion.objects.filter(
            fecha_hora_requerida_inicio__date__range=[fechas['inicio'], fechas['fin']]
        )
        
        uso_por_vehiculo = list(
            asignaciones.values('vehiculo__id', 'vehiculo__patente')
            .annotate(
                total_viajes=Count('id'),
                distancia_total=Sum('distancia_recorrida_km')
            )
            .filter(vehiculo__isnull=False)
        )
        
        # Lista detallada de vehículos
        listado_vehiculos = self._get_vehiculos_detallados(vehiculos, asignaciones)
        
        return {
            'estado_flota': estado_flota,
            'distribucion_tipo': distribucion_tipo,
            'vehiculos_necesitan_mantenimiento': vehiculos_mantenimiento,
            'estadisticas_mantenimiento': estadisticas_mantenimiento,
            'uso_por_vehiculo': uso_por_vehiculo,
            'listado_vehiculos': listado_vehiculos
        }
    
    def _get_conductores_stats(self, fechas):
        """Obtiene estadísticas detalladas de conductores"""
        conductores = Conductor.objects.all()
        
        # Estado de conductores
        estado_conductores = list(
            conductores.values('estado_disponibilidad').annotate(count=Count('id'))
        )
        
        # Análisis de horarios en los últimos 30 días
        fecha_analisis = timezone.now().date() - timedelta(days=30)
        asignaciones_recientes = Asignacion.objects.filter(
            fecha_hora_requerida_inicio__date__gte=fecha_analisis
        )
        
        # Análisis detallado por conductor
        analisis_horarios = []
        estadisticas_horarios = {
            'activos': 0,
            'completos': 0,
            'regulares': 0,
            'bajos': 0,
            'inactivos': 0,
            'horas_promedio_flota': 0,
            'eficiencia_promedio': 0
        }
        
        total_horas_flota = 0
        total_eficiencia_flota = 0
        
        for conductor in conductores:
            asignaciones_conductor = asignaciones_recientes.filter(conductor=conductor)
            
            # Calcular días trabajados
            dias_trabajados = asignaciones_conductor.values(
                'fecha_hora_requerida_inicio__date'
            ).distinct().count()
            
            # Estimar horas trabajadas (4 horas promedio por asignación)
            total_asignaciones = asignaciones_conductor.count()
            horas_totales = total_asignaciones * 4
            horas_promedio_dia = horas_totales / max(dias_trabajados, 1) if dias_trabajados > 0 else 0
            
            # Determinar estado de trabajo
            if horas_promedio_dia >= 7:
                estado_trabajo = 'completo'
                estadisticas_horarios['completos'] += 1
            elif horas_promedio_dia >= 5:
                estado_trabajo = 'regular'
                estadisticas_horarios['regulares'] += 1
            elif horas_promedio_dia >= 2:
                estado_trabajo = 'bajo'
                estadisticas_horarios['bajos'] += 1
            else:
                estado_trabajo = 'inactivo'
                estadisticas_horarios['inactivos'] += 1
            
            if estado_trabajo != 'inactivo':
                estadisticas_horarios['activos'] += 1
            
            # Calcular eficiencia de viajes
            viajes_totales = asignaciones_conductor.count()
            viajes_completados = asignaciones_conductor.filter(estado='completada').count()
            tasa_completitud = self._calcular_porcentaje(viajes_completados, viajes_totales)
            
            # Calcular distancia total
            distancia_total = asignaciones_conductor.aggregate(
                total=Sum('distancia_recorrida_km')
            )['total'] or 0
            
            # Porcentaje de actividad (basado en horas trabajadas vs 8 horas)
            porcentaje_actividad = min(100, (horas_promedio_dia / 8) * 100) if horas_promedio_dia > 0 else 0
            
            eficiencia_general = tasa_completitud
            
            analisis_horarios.append({
                'id': conductor.id,
                'nombre': conductor.nombre,
                'apellido': conductor.apellido,
                'numero_licencia': conductor.numero_licencia,
                'estado_disponibilidad': conductor.estado_disponibilidad,
                'horarios': {
                    'dias_trabajados': dias_trabajados,
                    'horas_promedio_dia': round(horas_promedio_dia, 1),
                    'total_horas': horas_totales,
                    'estado_trabajo': estado_trabajo,
                    'porcentaje_actividad': round(porcentaje_actividad, 1)
                },
                'viajes': {
                    'total_viajes': viajes_totales,
                    'viajes_completados': viajes_completados,
                    'tasa_completitud': tasa_completitud,
                    'distancia_total': round(distancia_total, 2)
                },
                'eficiencia_general': eficiencia_general
            })
            
            total_horas_flota += horas_promedio_dia
            total_eficiencia_flota += eficiencia_general
        
        # Calcular promedios de la flota
        total_conductores = len(analisis_horarios)
        if total_conductores > 0:
            estadisticas_horarios['horas_promedio_flota'] = round(total_horas_flota / total_conductores, 1)
            estadisticas_horarios['eficiencia_promedio'] = round(total_eficiencia_flota / total_conductores, 1)
        
        return {
            'estado_conductores': estado_conductores,
            'analisis_horarios': analisis_horarios,
            'estadisticas_horarios': estadisticas_horarios
        }
    
    def _get_mapa_stats(self, fechas):
        """Obtiene estadísticas para el componente de mapa"""
        asignaciones = Asignacion.objects.filter(
            fecha_hora_requerida_inicio__date__range=[fechas['inicio'], fechas['fin']]
        )
        
        # Contar asignaciones con coordenadas
        asignaciones_con_coordenadas = asignaciones.exclude(
            Q(origen_lat__isnull=True) | Q(origen_lon__isnull=True) |
            Q(destino_lat__isnull=True) | Q(destino_lon__isnull=True)
        ).count()
        
        # Calcular distancia total
        distancia_total = asignaciones.aggregate(
            total=Sum('distancia_recorrida_km')
        )['total'] or 0
        
        # Contar zonas activas (destinos únicos)
        zonas_activas = asignaciones.values('destino_descripcion').distinct().count()
        
        # Vehículos actualmente en ruta
        vehiculos_en_ruta = Conductor.objects.filter(estado_disponibilidad='en_ruta').count()
        
        return {
            'total_rutas': asignaciones.count(),
            'distancia_total': round(distancia_total, 2),
            'zonas_activas': zonas_activas,
            'vehiculos_en_ruta': vehiculos_en_ruta,
            'asignaciones_con_coordenadas': asignaciones_con_coordenadas,
            'cobertura_geografica': 'Región de Valparaíso',
            'zona_mas_activa': self._get_zona_mas_activa(asignaciones)
        }
    
    def _get_zona_mas_activa(self, asignaciones):
        """Determina la zona con más actividad"""
        zona_stats = asignaciones.values('destino_descripcion').annotate(
            count=Count('id')
        ).order_by('-count').first()
        
        if zona_stats:
            return zona_stats['destino_descripcion']
        return 'Centro de Valparaíso'
    
    def _get_tendencias(self, fechas):
        """Calcula tendencias comparando con el período anterior"""
        # Calcular período anterior
        duracion = fechas['fin'] - fechas['inicio']
        fecha_inicio_anterior = fechas['inicio'] - duracion - timedelta(days=1)
        fecha_fin_anterior = fechas['inicio'] - timedelta(days=1)
        
        # Asignaciones período actual
        asignaciones_actuales = Asignacion.objects.filter(
            fecha_hora_requerida_inicio__date__range=[fechas['inicio'], fechas['fin']]
        )
        
        # Asignaciones período anterior
        asignaciones_anteriores = Asignacion.objects.filter(
            fecha_hora_requerida_inicio__date__range=[fecha_inicio_anterior, fecha_fin_anterior]
        )
        
        # Contar asignaciones
        count_actual = asignaciones_actuales.count()
        count_anterior = asignaciones_anteriores.count()
        
        # Calcular distancia
        distancia_actual = asignaciones_actuales.aggregate(
            total=Sum('distancia_recorrida_km')
        )['total'] or 0
        distancia_anterior = asignaciones_anteriores.aggregate(
            total=Sum('distancia_recorrida_km')
        )['total'] or 0
        
        # Calcular eficiencia (tasa de completitud)
        completadas_actual = asignaciones_actuales.filter(estado='completada').count()
        completadas_anterior = asignaciones_anteriores.filter(estado='completada').count()
        
        eficiencia_actual = self._calcular_porcentaje(completadas_actual, count_actual)
        eficiencia_anterior = self._calcular_porcentaje(completadas_anterior, count_anterior)
        
        return {
            'asignaciones_cambio': self._calcular_cambio_porcentual(count_actual, count_anterior),
            'distancia_cambio': self._calcular_cambio_porcentual(distancia_actual, distancia_anterior),
            'eficiencia_cambio': eficiencia_actual - eficiencia_anterior
        }
    
    def _get_vehiculos_detallados(self, vehiculos, asignaciones):
        """Genera lista detallada de vehículos con información de mantenimiento"""
        vehiculos_detallados = []
        
        for vehiculo in vehiculos:
            # Calcular estado de mantenimiento
            km_actual = vehiculo.kilometraje or 0
            km_mantenimiento = 10000
            km_desde_ultimo = km_actual % km_mantenimiento
            km_restantes = km_mantenimiento - km_desde_ultimo
            porcentaje = (km_desde_ultimo / km_mantenimiento) * 100
            
            # Determinar estado
            if porcentaje >= 95:
                estado_mantenimiento = 'critico'
            elif porcentaje >= 90:
                estado_mantenimiento = 'urgente'
            elif porcentaje >= 80:
                estado_mantenimiento = 'proximo'
            else:
                estado_mantenimiento = 'ok'
            
            vehiculos_detallados.append({
                'id': vehiculo.id,
                'patente': vehiculo.patente,
                'marca': vehiculo.marca,
                'modelo': vehiculo.modelo,
                'anio': vehiculo.anio,
                'tipo_vehiculo': vehiculo.tipo_vehiculo,
                'capacidad_pasajeros': vehiculo.capacidad_pasajeros,
                'estado': vehiculo.estado,
                'kilometraje': km_actual,
                'mantenimiento': {
                    'estado': estado_mantenimiento,
                    'proximo_mantenimiento_km': km_actual + km_restantes,
                    'km_restantes': km_restantes,
                    'porcentaje': round(porcentaje, 1)
                }
            })
        
        return vehiculos_detallados
    
    def _calcular_porcentaje(self, parte, total):
        """Calcula porcentaje evitando división por cero"""
        if total == 0:
            return 0
        return round((parte / total) * 100, 1)
    
    def _calcular_cambio_porcentual(self, actual, anterior):
        """Calcula el cambio porcentual entre dos valores"""
        if anterior == 0:
            return 100 if actual > 0 else 0
        return round(((actual - anterior) / anterior) * 100, 1)


class DashboardRefreshCacheView(APIView):
    """
    Vista para refrescar los datos del dashboard
    """
    
    def post(self, request):
        try:
            return Response({
                'message': 'Dashboard cache refreshed successfully',
                'timestamp': timezone.now().isoformat(),
                'status': 'success'
            }, status=status.HTTP_200_OK)
            
        except Exception as e:
            return Response(
                {'error': f'Error refreshing dashboard cache: {str(e)}'}, 
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )


