from django.core.management.base import BaseCommand
from django.core.management import call_command

class Command(BaseCommand):
    help = 'Populate database with initial data for Railway deployment'

    def handle(self, *args, **options):
        self.stdout.write('Starting database population...')
        
        try:
            # Create superuser first
            self.stdout.write('Creating superuser...')
            call_command('create_superuser_production')
            
            # Populate vehicles
            self.stdout.write('Populating vehicles...')
            call_command('seed_vehicles')
            
            # Populate conductors
            self.stdout.write('Populating conductors...')
            call_command('seed_conductores')
            
            # Populate general data
            self.stdout.write('Populating assignments and shifts...')
            call_command('populate_data')
            
            self.stdout.write(
                self.style.SUCCESS('Database populated successfully!')
            )
            self.stdout.write('Access credentials:')
            self.stdout.write('Username: admin')
            self.stdout.write('Password: admin123')
            
        except Exception as e:
            self.stdout.write(
                self.style.ERROR(f'Error populating database: {str(e)}')
            )
