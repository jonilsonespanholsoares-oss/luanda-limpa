'use client'
import { useEffect } from 'react'
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet'
import L from 'leaflet'
import 'leaflet/dist/leaflet.css'

const icone = new L.Icon({
  iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41]
})

interface Ponto {
  id: string
  nome: string
  municipio: string
  latitude: number
  longitude: number
  estado: string
}

export default function MapaComponent({ pontos }: { pontos: Ponto[] }) {
  return (
    <MapContainer
      center={[-8.8368, 13.2343]}
      zoom={12}
      style={{ height: '100%', width: '100%' }}
    >
      <TileLayer
        attribution='&copy; OpenStreetMap'
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
      />
      {pontos.map(p => (
        <Marker key={p.id} position={[p.latitude, p.longitude]} icon={icone}>
          <Popup>
            <strong>{p.nome}</strong><br />
            {p.municipio}<br />
            Estado: {p.estado}
          </Popup>
        </Marker>
      ))}
    </MapContainer>
  )
}