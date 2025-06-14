import { useRef, useEffect, useState } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

const MapView = ({ asignacion }) => {
  const mapRef = useRef(null);
  const [routeCoords, setRouteCoords] = useState(null);

  useEffect(() => {
    if (!asignacion.origen_lat || !asignacion.origen_lon || !asignacion.destino_lat || !asignacion.destino_lon) return;

    // Solicita la ruta a OSRM
    const fetchRoute = async () => {
      const url = `https://router.project-osrm.org/route/v1/driving/${asignacion.origen_lon},${asignacion.origen_lat};${asignacion.destino_lon},${asignacion.destino_lat}?overview=full&geometries=geojson`;
      const res = await fetch(url);
      const data = await res.json();
      if (data.routes && data.routes.length > 0) {
        setRouteCoords(data.routes[0].geometry.coordinates.map(([lon, lat]) => [lat, lon]));
      } else {
        setRouteCoords(null);
      }
    };

    fetchRoute();
  }, [asignacion]);

  useEffect(() => {
    if (!asignacion.origen_lat || !asignacion.origen_lon || !asignacion.destino_lat || !asignacion.destino_lon) return;

    // Limpia el mapa anterior si existe
    if (mapRef.current && mapRef.current._leaflet_id) {
      mapRef.current.remove();
    }

    // Crea el mapa
    const map = L.map(mapRef.current, {
      center: [asignacion.origen_lat, asignacion.origen_lon],
      zoom: 13,
      zoomControl: true,
    });

    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '&copy; OpenStreetMap contributors'
    }).addTo(map);

    // Marcadores
    L.marker([asignacion.origen_lat, asignacion.origen_lon]).addTo(map).bindPopup('Origen').openPopup();
    L.marker([asignacion.destino_lat, asignacion.destino_lon]).addTo(map).bindPopup('Destino');

    // Dibuja la ruta si está disponible
    if (routeCoords) {
      L.polyline(routeCoords, { color: 'blue', weight: 5 }).addTo(map);
      map.fitBounds(routeCoords);
    } else {
      // Si no hay ruta, dibuja línea recta
      L.polyline([
        [asignacion.origen_lat, asignacion.origen_lon],
        [asignacion.destino_lat, asignacion.destino_lon]
      ], { color: 'red', dashArray: '5,10' }).addTo(map);
    }

    return () => {
      map.remove();
    };
  }, [asignacion, routeCoords]);

  return (
    <div ref={mapRef} style={{ width: '100%', height: '400px' }} />
  );
};

export default MapView;