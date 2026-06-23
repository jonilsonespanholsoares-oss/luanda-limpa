'use client'
import { useEffect, useState } from 'react'
import { MapContainer, TileLayer, Marker, Popup, Polyline, useMap } from 'react-leaflet'
import L from 'leaflet'
import 'leaflet/dist/leaflet.css'

const iconeVerde = new L.Icon({
  iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-green.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
  iconSize: [25, 41], iconAnchor: [12, 41], popupAnchor: [1, -34], shadowSize: [41, 41]
})

const iconeVermelho = new L.Icon({
  iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-red.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
  iconSize: [25, 41], iconAnchor: [12, 41], popupAnchor: [1, -34], shadowSize: [41, 41]
})

interface Ponto {
  id: string
  nome: string
  municipio: string
  latitude: number
  longitude: number
  estado: string
  capacidade: string
}

interface Props {
  pontos: Ponto[]
  rotaCoordenadas?: [number, number][]
  municipioFiltro?: string
}

function AjustarVista({ pontos }: { pontos: Ponto[] }) {
  const mapa = useMap()
  useEffect(() => {
    if (pontos.length > 0) {
      const bounds = L.latLngBounds(pontos.map(p => [p.latitude, p.longitude]))
      mapa.fitBounds(bounds, { padding: [40, 40] })
    }
  }, [pontos, mapa])
  return null
}

export default function MapaComponent({ pontos, rotaCoordenadas, municipioFiltro }: Props) {
  const pontosFiltrados = municipioFiltro
    ? pontos.filter(p => p.municipio === municipioFiltro)
    : pontos

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

      {municipioFiltro && pontosFiltrados.length > 0 && (
        <AjustarVista pontos={pontosFiltrados} />
      )}

      {pontosFiltrados.map((p, idx) => (
        <Marker
          key={p.id}
          position={[p.latitude, p.longitude]}
          icon={p.estado === 'cheio' ? iconeVermelho : iconeVerde}
        >
          <Popup>
            <div style={{ minWidth: '160px' }}>
              <strong style={{ color: '#166534' }}>#{idx + 1} {p.nome}</strong><br />
              <span>📍 {p.municipio}</span><br />
              <span>Estado: {p.estado === 'cheio' ? '🔴 Cheio' : '🟢 Normal'}</span><br />
              <span>Capacidade: {p.capacidade}</span>
            </div>
          </Popup>
        </Marker>
      ))}

      {rotaCoordenadas && rotaCoordenadas.length > 1 && (
        <Polyline
          positions={rotaCoordenadas}
          color="#22c55e"
          weight={4}
          opacity={0.8}
          dashArray="10, 5"
        />
      )}
    </MapContainer>
  )
}