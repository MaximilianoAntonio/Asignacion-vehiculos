# Generated by Django 5.2.1 on 2025-06-06 04:39

from django.db import migrations, models


class Migration(migrations.Migration):
    dependencies = [
        ("asignaciones", "0007_conductor_foto"),
    ]

    operations = [
        migrations.RemoveField(
            model_name="vehiculo",
            name="ubicacion_actual_lat",
        ),
        migrations.RemoveField(
            model_name="vehiculo",
            name="ubicacion_actual_lon",
        ),
        migrations.AddField(
            model_name="vehiculo",
            name="ubicacion",
            field=models.CharField(blank=True, max_length=255, null=True),
        ),
    ]
