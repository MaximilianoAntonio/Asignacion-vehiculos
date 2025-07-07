# asignaciones/admin.py
from django.contrib import admin
from .models import Vehiculo, Conductor, Asignacion, RegistroTurno
from django.utils.html import format_html

@admin.register(Vehiculo)
class VehiculoAdmin(admin.ModelAdmin):
    list_display = (
        'patente',
        'marca',
        'modelo',
        'anio',
        'tipo_vehiculo',
        'capacidad_pasajeros',
        'estado',
        'numero_chasis',
        'numero_motor',
        'ver_foto_vehiculo' # Renombrado para claridad
    )
    list_filter = (
        'estado',
        'marca',
        'tipo_vehiculo',
        'anio',
        'capacidad_pasajeros'
    )
    search_fields = (
        'patente', 'marca', 'modelo', 'anio', 'numero_chasis', 'numero_motor'
    )
    list_editable = ('estado',)
    readonly_fields = ('foto_preview_vehiculo',) # Renombrado para claridad

    fieldsets = (
        (None, {
            'fields': ('patente', 'marca', 'modelo', 'anio', 'tipo_vehiculo')
        }),
        ('Identificación Única', {
            'fields': ('numero_chasis', 'numero_motor')
        }),
        ('Capacidad y Características', {
            'fields': ('capacidad_pasajeros',)
        }),
        ('Estado y Multimedia', {
            'fields': ('estado', 'foto', 'foto_preview_vehiculo') # Renombrado para claridad
        }),
    )

    def ver_foto_vehiculo(self, obj): # Renombrado para claridad
        if obj.foto:
            return format_html(f'<img src="{obj.foto.url}" width="50" height="50" />')
        return "Sin foto"
    ver_foto_vehiculo.short_description = 'Foto Vehículo' # Renombrado para claridad

    def foto_preview_vehiculo(self, obj): # Renombrado para claridad
        if obj.foto:
            return format_html(f'<img src="{obj.foto.url}" width="150" height="150" />')
        return "(Sin imagen)"
    foto_preview_vehiculo.short_description = 'Vista Previa de Foto Vehículo' # Renombrado para claridad


@admin.register(Conductor)
class ConductorAdmin(admin.ModelAdmin):
    list_display = (
        'ver_foto_conductor', # NUEVO
        'apellido',
        'nombre',
        'numero_licencia',
        'fecha_vencimiento_licencia',
        'estado_disponibilidad',
    )
    list_filter = ('estado_disponibilidad', 'fecha_vencimiento_licencia')
    search_fields = ('nombre', 'apellido', 'numero_licencia')
    list_editable = ('estado_disponibilidad',)
    ordering = ('apellido', 'nombre')
    readonly_fields = ('foto_preview_conductor',) # NUEVO

    fieldsets = (
        (None, {
            'fields': ('nombre', 'apellido', 'numero_licencia', 'fecha_vencimiento_licencia')
        }),
        ('Multimedia', { # NUEVA SECCIÓN
            'fields': ('foto', 'foto_preview_conductor')
        }),
        ('Contacto y Estado', {
            'fields': ('telefono', 'email', 'estado_disponibilidad',
                       'tipos_vehiculo_habilitados')
        }),
    )

    # NUEVOS MÉTODOS PARA FOTO CONDUCTOR
    def ver_foto_conductor(self, obj):
        if obj.foto:
            return format_html(f'<img src="{obj.foto.url}" width="50" height="50" />')
        return "Sin foto"
    ver_foto_conductor.short_description = 'Foto'

    def foto_preview_conductor(self, obj):
        if obj.foto:
            return format_html(f'<img src="{obj.foto.url}" width="150" height="150" />')
        return "(Sin imagen)"
    foto_preview_conductor.short_description = 'Vista Previa de Foto'


@admin.register(Asignacion)
class AsignacionAdmin(admin.ModelAdmin):
    list_display = (
        'id',
        'get_solicitante_info_admin',
        'destino_descripcion',
        'fecha_hora_requerida_inicio',
        'vehiculo',
        'conductor',
        'estado'
    )
    list_filter = (
        'estado',
        'solicitante_jerarquia',
        'fecha_hora_requerida_inicio',
        'vehiculo__marca',
        'conductor__apellido',
    )
    search_fields = (
        'id',
        'destino_descripcion',
        'solicitante_nombre',
        'vehiculo__patente',
        'conductor__nombre',
        'conductor__apellido'
    )
    autocomplete_fields = ['vehiculo', 'conductor']
    list_editable = ('estado',)
    ordering = ('-fecha_hora_requerida_inicio',)
    readonly_fields = ()

    fieldsets = (
        ('Información del Solicitante y Destino', {
            'fields': (
                'solicitante_nombre',
                'solicitante_telefono',
                'solicitante_jerarquia',
                'origen_descripcion',
                'destino_descripcion',
                'fecha_hora_requerida_inicio'
            )
        }),
        ('Requerimientos Específicos', {
            'classes': ('collapse',),
            'fields': ('req_pasajeros', 'req_tipo_vehiculo_preferente',
                       'origen_lat', 'origen_lon', 'destino_lat', 'destino_lon')
        }),
        ('Asignación (Vehículo/Conductor)', {
            'fields': ('vehiculo', 'conductor')
        }),
        ('Estado y Seguimiento', {
            'fields': ('estado', 'fecha_hora_fin_prevista', 'observaciones',)
        }),
    )

    def get_queryset(self, request):
        return super().get_queryset(request).select_related('vehiculo', 'conductor')

    @admin.display(description='Solicitante (Jerarquía)')
    def get_solicitante_info_admin(self, obj):
        return f"{obj.solicitante_nombre or 'N/A'} ({obj.get_solicitante_jerarquia_display()})"

@admin.register(RegistroTurno)
class RegistroTurnoAdmin(admin.ModelAdmin):
    list_display = ('conductor', 'fecha_hora', 'tipo')
    list_filter = ('tipo', 'conductor')
    search_fields = ('conductor__nombre', 'conductor__apellido')