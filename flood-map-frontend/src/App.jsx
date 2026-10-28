import React, { useState, useEffect } from "react";
import MapaInterativo from "./components/MapaInterativo";
import { API_BASE } from "./services/config";
import TopSearchBar from "./components/mobile/TopSearchBar";
import MetricsBottomSheet from "./components/mobile/MetricsBottomSheet";
import BottomNavigation from "./components/mobile/BottomNavigation";
import AuthLGPDModal from "./components/mobile/AuthLGPDModal";
import PerfilLGPDModal from "./components/mobile/PerfilLGPDModal";
import PrevisaoClimaModal from "./components/mobile/PrevisaoClimaModal";

function App() {
	const [cotaAtual, setCotaAtual] = useState(null);
	const [ruas, setRuas] = useState([]);
	const [isSimulando, setIsSimulando] = useState(false);
	const [painelRotaAberto, setPainelRotaAberto] = useState(false);

	// Autenticação Real com LGPD
	const [usuario, setUsuario] = useState(() => {
		try {
			const salvo = localStorage.getItem("usuario_sentinela");
			return salvo ? JSON.parse(salvo) : null;
		} catch (e) {
			return null;
		}
	});
	const [modalAuthAberto, setModalAuthAberto] = useState(false);
	const [modalPerfilAberto, setModalPerfilAberto] = useState(false);
	const [modalCasaAberto, setModalCasaAberto] = useState(false);
	const [modalClimaAberto, setModalClimaAberto] = useState(false);
	const [dadosClima, setDadosClima] = useState(null);

	// Estados de Simulação
	const [cotaReal, setCotaReal] = useState(12.86);
	const [cotaSimulada, setCotaSimulada] = useState(12.86);

	// Estados de Rotas
	const [textoOrigem, setTextoOrigem] = useState("");
	const [textoDestino, setTextoDestino] = useState("");
	const [pontoOrigem, setPontoOrigem] = useState(null);
	const [pontoDestino, setPontoDestino] = useState(null);
	const [dadosRota, setDadosRota] = useState(null);
	const [calculandoRota, setCalculandoRota] = useState(false);

	const limparRota = () => {
		setDadosRota(null);
		setPontoOrigem(null);
		setPontoDestino(null);
		setTextoOrigem("");
		setTextoDestino("");
	};

	const carregarClima = async () => {
		try {
			const resp = await fetch(
				"https://api.open-meteo.com/v1/forecast?latitude=-29.4669&longitude=-51.9611&current=temperature_2m,relative_humidity_2m,apparent_temperature,precipitation,weather_code,wind_speed_10m&daily=weather_code,temperature_2m_max,temperature_2m_min,precipitation_sum,precipitation_probability_max&timezone=America%2FSao_Paulo"
			);
			if (resp.ok) {
				const json = await resp.json();
				setDadosClima(json);
			}
		} catch (e) {
			console.warn("Erro ao buscar dados de previsão meteorológica:", e);
		}
	};

	const carregarCota = async () => {
		try {
			// Tenta buscar endpoint padrão
			let resp = await fetch(`${API_BASE}/api/v1/cota/atual-sync/`);
			if (!resp.ok) {
				resp = await fetch('/api/cota');
			}
			if (resp.ok) {
				const data = await resp.json();
				if (data && data.nivel) {
					setCotaAtual(data);
					setCotaReal(data.nivel);
					setCotaSimulada(data.nivel);
					return;
				}
			}
		} catch (e) {
			console.warn("Erro ao sincronizar cota via API principal, tentando fallback:", e);
		}

		// Fallback direto caso o backend esteja indisponível
		try {
			const fallbackResp = await fetch('/api/cota');
			if (fallbackResp.ok) {
				const fbData = await fallbackResp.json();
				setCotaAtual(fbData);
				if (fbData.nivel) {
					setCotaReal(fbData.nivel);
					setCotaSimulada(fbData.nivel);
				}
			}
		} catch (err) {
			console.error("Falha ao obter cota:", err);
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
		carregarClima();

		// Sincroniza dados da conta se houver token ativo
		const token = localStorage.getItem("sentinela_token");
		if (token) {
			fetch(`${API_BASE}/api/v1/auth/me/`, {
				headers: { Authorization: `Token ${token}` },
			})
				.then((r) => (r.ok ? r.json() : null))
				.then((d) => {
					if (d && d.usuario) {
						setUsuario(d.usuario);
						localStorage.setItem("usuario_sentinela", JSON.stringify(d.usuario));
					}
				})
				.catch(() => {});
		}

		// Robô do Frontend: Sincroniza a cota automaticamente a cada 3 minutos
		const intervalo = setInterval(() => {
			carregarCota();
			carregarClima();
		}, 180000);

		return () => clearInterval(intervalo);
	}, []);

	return (
		<div className="relative w-full h-screen overflow-hidden bg-gray-900 select-none">
			<MapaInterativo
				cotaAtual={cotaAtual}
				cotaSimulada={cotaSimulada}
				setCotaSimulada={setCotaSimulada}
				ruas={ruas}
				className="absolute inset-0 z-0"
				isSimulando={isSimulando}
				setIsSimulando={setIsSimulando}
				painelRotaAberto={painelRotaAberto}
				setPainelRotaAberto={setPainelRotaAberto}
				pontoOrigem={pontoOrigem}
				pontoDestino={pontoDestino}
				dadosRota={dadosRota}
				setDadosRota={setDadosRota}
				usuario={usuario}
				setUsuario={setUsuario}
				modalCasaAberto={modalCasaAberto}
				setModalCasaAberto={setModalCasaAberto}
			/>

			{/* Barra de Pesquisa e Perfil Superior Fixa */}
			<TopSearchBar
				usuario={usuario}
				temRotaAtiva={!!dadosRota || !!pontoOrigem || !!pontoDestino}
				onLimparRota={limparRota}
				onBuscarClick={() => {
					setPainelRotaAberto(true);
					setIsSimulando(false);
				}}
				onPerfilClick={() => {
					if (usuario) {
						setModalPerfilAberto(true);
					} else {
						setModalAuthAberto(true);
					}
				}}
				onNotifClick={() => {
					if (!usuario) {
						setModalAuthAberto(true);
					} else {
						setModalPerfilAberto(true);
					}
				}}
			/>

			{/* Painel Inferior Deslizante */}
			<MetricsBottomSheet
				cotaReal={cotaAtual?.nivel || 12.86}
				cotaSimulada={cotaSimulada}
				setCotaSimulada={setCotaSimulada}
				isSimulando={isSimulando}
				setIsSimulando={setIsSimulando}
				temperatura={dadosClima?.current?.temperature_2m !== undefined ? `${Math.round(dadosClima.current.temperature_2m)}°` : "20°"}
				onAbrirClima={() => setModalClimaAberto(true)}
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
				onLimparRota={limparRota}
				// Controle de Vista
				abaAtiva={isSimulando ? "simular" : painelRotaAberto ? "rotas" : "mapa"}
				className="absolute bottom-0 left-0 right-0 z-20"
			/>

			{/* Barra de Navegação Inferior */}
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

			{/* Modais Globais de Autenticação e Perfil LGPD */}
			<AuthLGPDModal
				isOpen={modalAuthAberto}
				onClose={() => setModalAuthAberto(false)}
				onLoginSucesso={(novoUser) => {
					setUsuario(novoUser);
					if (!novoUser?.residencia) {
						setModalCasaAberto(true);
					}
				}}
			/>

			<PerfilLGPDModal
				isOpen={modalPerfilAberto}
				onClose={() => setModalPerfilAberto(false)}
				usuario={usuario}
				onLogout={() => setUsuario(null)}
				onUsuarioAtualizado={(atualizado) => setUsuario(atualizado)}
				onAbrirConfigCasa={() => setModalCasaAberto(true)}
			/>

			{/* Modal de Previsão do Tempo e Chuvas */}
			<PrevisaoClimaModal
				isOpen={modalClimaAberto}
				onClose={() => setModalClimaAberto(false)}
				dadosClima={dadosClima}
			/>
		</div>
	);
}

export default App;
