# asignaciones/urls.py
from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import VehiculoViewSet, ConductorViewSet, AsignacionViewSet
from asignaciones.views import nominatim_proxy

router = DefaultRouter()
router.register(r'vehiculos', VehiculoViewSet, basename='vehiculo')
router.register(r'conductores', ConductorViewSet, basename='conductor')
router.register(r'asignaciones', AsignacionViewSet, basename='asignacion')

urlpatterns = [
    path('', include(router.urls)),
    path('nominatim/', nominatim_proxy, name='nominatim_proxy'),
]