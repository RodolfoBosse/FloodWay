import React, { useState, useEffect } from "react";
import MapaInterativo from "./components/MapaInterativo";
import { API_BASE } from "./services/config";
import TopSearchBar from "./components/mobile/TopSearchBar";
import MetricsBottomSheet from "./components/mobile/MetricsBottomSheet";
import BottomNavigation from "./components/mobile/BottomNavigation";

function App() {
	const [cotaAtual, setCotaAtual] = useState(null);
	const [ruas, setRuas] = useState([]);
	const [isSimulando, setIsSimulando] = useState(false);
	const [painelRotaAberto, setPainelRotaAberto] = useState(false);
	const [modalPerfilAberto, setModalPerfilAberto] = useState(false);
	// Estados de Simulação
	const [cotaReal, setCotaReal] = useState(13.84);
	const [cotaSimulada, setCotaSimulada] = useState(13.84);

	// Estados de Rotas
	const [textoOrigem, setTextoOrigem] = useState("");
	const [textoDestino, setTextoDestino] = useState("");
	const [pontoOrigem, setPontoOrigem] = useState(null);
	const [pontoDestino, setPontoDestino] = useState(null);
	const [dadosRota, setDadosRota] = useState(null);
	const [calculandoRota, setCalculandoRota] = useState(false);

	const carregarCota = async () => {
		try {
			const resp = await fetch(`${API_BASE}/api/v1/cota/atual-sync/`);
			if (resp.ok) {
				const data = await resp.json();
				setCotaAtual(data);
			}
		} catch (e) {
			console.error("Erro ao sincronizar cota:", e);
		}
	};

	const carregarRuas = async () => {
		try {
			const resp = await fetch(`${API_BASE}/api/v1/ruas/`);
			if (resp.ok) {
				const data = await resp.json();
				const lista =
					data.ruas && Array.isArray(data.ruas)
						? data.ruas
						: Array.isArray(data)
							? data
							: [];
				if (lista.length > 0) {
					setRuas(lista);
					return;
				}
			}
		} catch (e) {
			console.warn(
				"API de ruas indisponível ou vazia, usando base calibrada local:",
				e,
			);
		}

		// Fallback: carrega base de ruas calibradas embutida
		try {
			const localResp = await fetch("/ruas_calibradas.json");
			if (localResp.ok) {
				const localData = await localResp.json();
				if (Array.isArray(localData) && localData.length > 0) {
					setRuas(localData);
				}
			}
		} catch (err) {
			console.error("Erro ao carregar base calibrada local:", err);
		}
	};

	useEffect(() => {
		// Carga inicial
		carregarCota();
		carregarRuas();

		// Robô do Frontend: Sincroniza a cota automaticamente a cada 3 minutos!
		const intervalo = setInterval(() => {
			carregarCota();
		}, 180000);

		return () => clearInterval(intervalo);
	}, []);

	return (
		<div className="relative w-full h-screen overflow-hidden bg-gray-900 select-none">
			<MapaInterativo
				cotaAtual={cotaAtual}
				ruas={ruas}
				className="absolute inset-0 z-0"
				isSimulando={isSimulando}
				setIsSimulando={setIsSimulando}
				painelRotaAberto={painelRotaAberto}
				setPainelRotaAberto={setPainelRotaAberto}
				// Novas props de sincronização com a gaveta
				pontoOrigem={pontoOrigem}
				pontoDestino={pontoDestino}
				dadosRota={dadosRota}
				setDadosRota={setDadosRota}
			/>
			<TopSearchBar className="absolute top-4 left-0 right-0 z-10 px-4" />
			<MetricsBottomSheet
				cotaReal={cotaAtual?.nivel || 13.84}
				cotaSimulada={cotaSimulada}
				setCotaSimulada={setCotaSimulada}
				isSimulando={isSimulando}
				setIsSimulando={setIsSimulando}
				// Props de Rotas
				textoOrigem={textoOrigem}
				setTextoOrigem={setTextoOrigem}
				textoDestino={textoDestino}
				setTextoDestino={setTextoDestino}
				pontoOrigem={pontoOrigem}
				setPontoOrigem={setPontoOrigem}
				pontoDestino={pontoDestino}
				setPontoDestino={setPontoDestino}
				dadosRota={dadosRota}
				setDadosRota={setDadosRota}
				calculandoRota={calculandoRota}
				setCalculandoRota={setCalculandoRota}
				// Controle de Vista
				abaAtiva={isSimulando ? "simular" : painelRotaAberto ? "rotas" : "mapa"}
				className="absolute bottom-0 left-0 right-0 z-20"
			/>
			<BottomNavigation
				className="absolute bottom-0 left-0 right-0 z-30"
				abaAtiva={isSimulando ? "simular" : painelRotaAberto ? "rotas" : "mapa"}
				onMapaClick={() => {
					setPainelRotaAberto(false);
					setIsSimulando(false);
				}}
				onRotasClick={() => {
					setIsSimulando(false);
					setPainelRotaAberto(!painelRotaAberto);
				}}
				onGraficosClick={() => {}}
				onSimularClick={() => setIsSimulando(!isSimulando)}
				isSimulando={isSimulando}
				painelRotaAberto={painelRotaAberto}
			/>
		</div>
	);
}

export default App;
