# asignaciones/urls.py
from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import (
    VehiculoViewSet,
    ConductorViewSet,
    AsignacionViewSet,
    RegistroTurnoViewSet,
    CustomAuthToken,
    UserGroupView,
    DashboardStatsView,        # NUEVA
    DashboardRefreshCacheView  # NUEVA
)

# Note for the developer:
# This file creates the URL patterns for the 'asignaciones' app.
# You must include these URLs in your main project's urls.py file.
# For example, in 'asignacion_api/urls.py', you should have something like:
#
# from django.urls import path, include
#
# urlpatterns = [
#     ...
#     path('api/', include('asignaciones.urls')),
#     ...
# ]

router = DefaultRouter()
router.register(r'vehiculos', VehiculoViewSet)
router.register(r'conductores', ConductorViewSet)
router.register(r'asignaciones', AsignacionViewSet)
router.register(r'registros-turno', RegistroTurnoViewSet, basename='registroturno')

urlpatterns = [
    path('', include(router.urls)),
    path('get-token/', CustomAuthToken.as_view(), name='get-token'),
    path('user-groups/', UserGroupView.as_view(), name='user-groups'),
    path('dashboard/stats/', DashboardStatsView.as_view(), name='dashboard-stats'),
    path('dashboard/refresh-cache/', DashboardRefreshCacheView.as_view(), name='dashboard-refresh-cache'),
]