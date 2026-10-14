import React, { useState, useEffect } from 'react'
import MapaInterativo from './components/MapaInterativo'

function App() {
  const [cotaAtual, setCotaAtual] = useState(null)
  const [ruas, setRuas] = useState([])

  const carregarCota = async () => {
    try {
      const resp = await fetch('http://localhost:8000/api/v1/cota/atual-sync/')
      if (resp.ok) {
        const data = await resp.json()
        setCotaAtual(data)
      }
    } catch (e) {
      console.error("Erro ao sincronizar cota:", e)
    }
  }

  const carregarRuas = async () => {
    try {
      const resp = await fetch('http://localhost:8000/api/v1/ruas/')
      if (resp.ok) {
        const data = await resp.json()
        if (data.ruas && Array.isArray(data.ruas)) {
          setRuas(data.ruas)
        } else if (Array.isArray(data)) {
          setRuas(data)
        }
      }
    } catch (e) {
      console.error("Erro ao carregar ruas:", e)
    }
  }

  useEffect(() => {
    // Carga inicial
    carregarCota()
    carregarRuas()

    // Robô do Frontend: Sincroniza a cota automaticamente a cada 3 minutos!
    const intervalo = setInterval(() => {
      carregarCota()
    }, 180000)

    return () => clearInterval(intervalo)
  }, [])

  return (
    <div className="w-full h-screen overflow-hidden bg-gray-900 select-none">
      <MapaInterativo cotaAtual={cotaAtual} ruas={ruas} />
    </div>
  )
}

export default App
