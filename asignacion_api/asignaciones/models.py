# asignaciones/models.py
from django.db import models
from django.utils import timezone

class Vehiculo(models.Model):
    ESTADO_CHOICES = [
        ('disponible', 'Disponible'),
        ('en_uso', 'En Uso'),
        ('mantenimiento', 'Mantenimiento'),
        ('reservado', 'Reservado'),
    ]
    TIPO_VEHICULO_CHOICES = [
        ('automovil', 'Automóvil'),
        ('camioneta', 'Camioneta'),
        ('minibus', 'Minibús'),
        ('station_wagon', 'Station Wagon'),
    ]

    marca = models.CharField(max_length=100)
    modelo = models.CharField(max_length=100)
    patente = models.CharField(max_length=20, unique=True)
    anio = models.PositiveIntegerField(
        null=True, blank=True,
        help_text="Año de fabricación del vehículo"
    )
    numero_chasis = models.CharField(
        max_length=100, unique=True, blank=True, null=True,
        help_text="Número de chasis (VIN)"
    )
    numero_motor = models.CharField(
        max_length=100, unique=True, blank=True, null=True,
        help_text="Número de motor"
    )
    estado = models.CharField(max_length=20, choices=ESTADO_CHOICES, default='disponible')
    foto = models.ImageField(upload_to='vehiculos_fotos/', null=True, blank=True)
    tipo_vehiculo = models.CharField(
        max_length=50,
        choices=TIPO_VEHICULO_CHOICES,
        default='automovil',
        help_text="Tipo de vehículo según su uso principal"
    )
    capacidad_pasajeros = models.PositiveIntegerField(
        default=4,
        help_text="Número máximo de pasajeros (sin incluir conductor)"
    )
    kilometraje = models.FloatField(default=0.0, help_text="Kilometraje total del vehículo en km.")

    def __str__(self):
        return f"{self.marca} {self.modelo} ({self.patente}) - Año {self.anio or 'N/A'}"

class Conductor(models.Model):
    ESTADO_DISPONIBILIDAD_CHOICES = [
        ('disponible', 'Disponible'),
        ('en_ruta', 'En Ruta'),
        ('dia_libre', 'Día Libre'),
        ('no_disponible', 'No Disponible'),
    ]
    run = models.CharField(max_length=12, unique=True, null=True, blank=True, help_text="Rol Único Nacional (ej: 12345678-9)")
    nombre = models.CharField(max_length=100, help_text="Nombre del conductor")
    apellido = models.CharField(max_length=100, help_text="Apellido del conductor")
    numero_licencia = models.CharField(max_length=50, unique=True, help_text="Número de licencia de conducir")
    fecha_vencimiento_licencia = models.DateField(help_text="Fecha de vencimiento de la licencia")
    telefono = models.CharField(max_length=20, blank=True, null=True, help_text="Número de teléfono (opcional)")
    email = models.EmailField(max_length=254, blank=True, null=True, help_text="Correo electrónico (opcional)")
    
    # NUEVO CAMPO FOTO PARA CONDUCTOR
    foto = models.ImageField(upload_to='conductores_fotos/', null=True, blank=True, help_text="Foto del conductor")

    tipos_vehiculo_habilitados = models.CharField(
        max_length=255, blank=True,
        help_text="Tipos de vehículo que puede manejar (ej: automovil,camioneta), separados por coma"
    )
    estado_disponibilidad = models.CharField(
        max_length=20,
        choices=ESTADO_DISPONIBILIDAD_CHOICES,
        default='dia_libre'
    )

    def __str__(self):
        return f"{self.nombre} {self.apellido} ({self.run or self.numero_licencia})"

    class Meta:
        verbose_name = "Conductor"
        verbose_name_plural = "Conductores"
        ordering = ['apellido', 'nombre']

class Asignacion(models.Model):
    ESTADO_ASIGNACION_CHOICES = [
        ('pendiente_auto', 'Pendiente de Asignación Automática'),
        ('programada', 'Programada (Auto/Manual)'),
        ('activa', 'Activa'),
        ('completada', 'Completada'),
        ('cancelada', 'Cancelada'),
        ('fallo_auto', 'Falló Asignación Automática'),
    ]
    SOLICITANTE_JERARQUIA_CHOICES = [
        (3, 'Jefatura/Subdirección'),
        (2, 'Coordinación/Referente'),
        (1, 'Funcionario'),
        (0, 'Otro/No especificado')
    ]

    vehiculo = models.ForeignKey(Vehiculo, on_delete=models.SET_NULL, null=True, blank=True, related_name='asignaciones_realizadas')
    conductor = models.ForeignKey(Conductor, on_delete=models.SET_NULL, null=True, blank=True, related_name='asignaciones_realizadas')
    destino_descripcion = models.CharField(
        max_length=200,
        help_text="Descripción del destino",
        default='Destino pendiente'
    )
    origen_descripcion = models.CharField(max_length=200, blank=True, help_text="Descripción del origen (opcional)")
    fecha_hora_requerida_inicio = models.DateTimeField(
        help_text="Cuándo se necesita el servicio",
        default=timezone.now
    )
    req_pasajeros = models.PositiveIntegerField(default=1, help_text="Número de pasajeros a trasladar")
    req_tipo_vehiculo_preferente = models.CharField(
        max_length=50, choices=Vehiculo.TIPO_VEHICULO_CHOICES, blank=True, null=True,
        help_text="Tipo de vehículo preferido/requerido (opcional)"
    )
    origen_lat = models.FloatField(null=True, blank=True)
    origen_lon = models.FloatField(null=True, blank=True)
    destino_lat = models.FloatField(null=True, blank=True)
    destino_lon = models.FloatField(null=True, blank=True)
    fecha_hora_fin_prevista = models.DateTimeField(null=True, blank=True)
    estado = models.CharField(max_length=20, choices=ESTADO_ASIGNACION_CHOICES, default='pendiente_auto')
    observaciones = models.TextField(blank=True, null=True)
    solicitante_jerarquia = models.IntegerField(
        choices=SOLICITANTE_JERARQUIA_CHOICES,
        default=0,
        help_text="Nivel jerárquico del área o persona que origina la solicitud."
    )
    solicitante_nombre = models.CharField(
        max_length=200,
        blank=True,
        help_text="Nombre del solicitante de la asignación."
    )
    solicitante_telefono = models.CharField(
        max_length=50,
        blank=True,
        help_text="Teléfono de contacto del solicitante."
    )
    responsable_nombre = models.CharField(
        max_length=200,
        blank=True,
        help_text="Nombre del responsable de la asignación."
    )
    responsable_telefono = models.CharField(
        max_length=50,
        blank=True,
        help_text="Teléfono de contacto del responsable de la asignación."
    )
    fecha_asignacion_funcionario = models.DateTimeField(
        null=True, blank=True,
        help_text="Marca temporal cuando un funcionario crea la asignación"
    )
    distancia_recorrida_km = models.FloatField(null=True, blank=True, help_text="Distancia del viaje en km.")

    def __str__(self):
        conductor_str = f"{self.conductor.nombre} {self.conductor.apellido}" if self.conductor else "Por asignar"
        vehiculo_str = str(self.vehiculo.patente) if self.vehiculo else "Por asignar"
        return f"Traslado a {self.destino_descripcion} ({self.fecha_hora_requerida_inicio.strftime('%Y-%m-%d %H:%M')}) - Vehículo: {vehiculo_str}, Conductor: {conductor_str}, Solicitante: {self.solicitante_nombre or 'N/A'}"

class RegistroTurno(models.Model):
    TIPO_REGISTRO_CHOICES = [
        ('entrada', 'Entrada de turno'),
        ('salida', 'Salida de turno'),
    ]
    conductor = models.ForeignKey(Conductor, on_delete=models.CASCADE, related_name='registros_turno')
    fecha_hora = models.DateTimeField(default=timezone.now)
    tipo = models.CharField(max_length=10, choices=TIPO_REGISTRO_CHOICES)
    notas = models.TextField(blank=True, null=True)

    def __str__(self):
        return f"{self.get_tipo_display()} de {self.conductor} a las {self.fecha_hora.strftime('%Y-%m-%d %H:%M')}"

    class Meta:
        ordering = ['-fecha_hora']
        verbose_name = "Registro de Turno"
        verbose_name_plural = "Registros de Turno"