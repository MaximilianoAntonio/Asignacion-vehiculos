# asignaciones/urls.py
from django.contrib import admin
from django.urls import path, include
from django.conf import settings
from django.conf.urls.static import static
from rest_framework.authtoken import views as authtoken_views

# For Swagger/OpenAPI documentation (drf-yasg)
from rest_framework import permissions
from drf_yasg.views import get_schema_view
from drf_yasg import openapi

schema_view = get_schema_view(
   openapi.Info(
      title="Gestor de Vehículos API",
      default_version='v1',
      description="API para la gestión de vehículos, conductores y asignaciones",
      # terms_of_service="https://www.google.com/policies/terms/",
      # contact=openapi.Contact(email="contact@example.com"),
      # license=openapi.License(name="BSD License"),
   ),
   public=True,
   permission_classes=(permissions.AllowAny,),
)

urlpatterns = [
    path('admin/', admin.site.urls),
    path('api/', include('asignaciones.urls')),  # Your app's API endpoints

    # --- Autenticación ---
    # Endpoint para obtener token (usado por tu authService.js actual)
    path('api/get-token/', authtoken_views.obtain_auth_token, name='get_token'), 
    
    # --- MODIFICACIÓN: Incluir URLs de dj_rest_auth ---
    # Esto proporcionará endpoints como /api/auth/login/, /api/auth/logout/, /api/auth/user/, etc.
    # La URL base 'api/auth/' es un prefijo común.
    path('api/auth/', include('dj_rest_auth.urls')), 

    # Opcional: Si quieres usar las vistas de registro de dj_rest_auth (requiere django-allauth)
    # path('api/auth/registration/', include('dj_rest_auth.registration.urls')),

    # --- Documentación de la API (Swagger/OpenAPI) ---
    path('swagger<format>/', schema_view.without_ui(cache_timeout=0), name='schema-json'),
    path('swagger/', schema_view.with_ui('swagger', cache_timeout=0), name='schema-swagger-ui'),
    path('redoc/', schema_view.with_ui('redoc', cache_timeout=0), name='schema-redoc'),
]