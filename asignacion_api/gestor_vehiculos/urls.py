"""
URL configuration for gestor_vehiculos project.
"""
from django.contrib import admin
from django.urls import path, include
# Asegúrate de tener estas dos importaciones:
from django.conf import settings
from django.conf.urls.static import static

urlpatterns = [
    path('admin/', admin.site.urls),
    path('api/', include('asignaciones.urls')),
]

# Y asegúrate de que estas líneas estén al final:
if settings.DEBUG:
    urlpatterns += static(settings.MEDIA_URL, document_root=settings.MEDIA_ROOT)