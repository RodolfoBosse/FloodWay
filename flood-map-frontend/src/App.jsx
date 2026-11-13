import React, { useState, useEffect } from "react";
import MapaInterativo from "./components/MapaInterativo";
import { API_BASE } from "./services/config";
import TopSearchBar from "./components/mobile/TopSearchBar";
import MetricsBottomSheet from "./components/mobile/MetricsBottomSheet";
import BottomNavigation from "./components/mobile/BottomNavigation";
import AuthLGPDModal from "./components/mobile/AuthLGPDModal";
import PerfilLGPDModal from "./components/mobile/PerfilLGPDModal";
import PrevisaoClimaModal from "./components/mobile/PrevisaoClimaModal";
import InstallPWABanner from "./components/mobile/InstallPWABanner";
import AutoUpdateNotifier from "./components/common/AutoUpdateNotifier";
import CookieConsentBanner from "./components/common/CookieConsentBanner";
import ModoTesteBar from "./components/common/ModoTesteBar";
import AnalyticsDashboard from "./components/admin/AnalyticsDashboard";
import PoliticaPrivacidadePage from "./components/pages/PoliticaPrivacidadePage";
import SobrePage from "./components/pages/SobrePage";
import TermosUsoPage from "./components/pages/TermosUsoPage";
import PortalEditorialPage from "./components/pages/PortalEditorialPage";
import { estimarCotaTerreno } from "./services/locaisLajeado";
import { trackPageView, trackSimulacao } from "./services/telemetryTracker";

function App() {
	const [cotaAtual, setCotaAtual] = useState(null);
	const [ruas, setRuas] = useState([]);
	const [isSimulando, setIsSimulando] = useState(false);
	const [painelRotaAberto, setPainelRotaAberto] = useState(false);
	const [paginaAtiva, setPaginaAtiva] = useState(() => {
		// Abre na página do Portal Editorial por padrão (garantindo conteúdo do editor para o AdSense)
		// Se o usuário acessar rotas específicas na URL, respeita a rota
		if (typeof window !== "undefined") {
			const path = window.location.pathname.toLowerCase();
			if (path.includes("politica") || path.includes("privacidade")) return "politica";
			if (path.includes("termos")) return "termos";
			if (path.includes("sobre")) return "sobre";
			if (path.includes("analytics") || path.includes("admin")) return "analytics";
			if (path.includes("teste") || path.includes("sandbox") || path.includes("simulador")) {
				// Ativação via URL /teste
				return "mapa";
			}
			if (path === "/mapa") return null;
		}
		return "portal";
	});

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
	const [modoTesteAtivo, setModoTesteAtivo] = useState(() => {
		if (typeof window !== "undefined") {
			const path = window.location.pathname.toLowerCase();
			return path.includes("teste") || path.includes("sandbox") || path.includes("simulador");
		}
		return false;
	});

	// Estados de Rotas
	const [textoOrigem, setTextoOrigem] = useState("");
	const [textoDestino, setTextoDestino] = useState("");
	const [pontoOrigem, setPontoOrigem] = useState(null);
	const [pontoDestino, setPontoDestino] = useState(null);
	const [dadosRota, setDadosRota] = useState(null);
	const [calculandoRota, setCalculandoRota] = useState(false);
	const [localizacaoGPS, setLocalizacaoGPS] = useState(null);
	const [obtendoGPS, setObtendoGPS] = useState(false);

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
			// Prioriza /api/cota (serverless com scraping em tempo real de nivelguaiba.com.br/lajeado)
			let resp = await fetch('/api/cota');
			if (!resp.ok) {
				resp = await fetch(`${API_BASE}/api/v1/cota/atual-sync/`);
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
			console.warn("Erro ao sincronizar cota via /api/cota, tentando backend Django:", e);
		}

		// Fallback secundário
		try {
			const fbResp = await fetch(`${API_BASE}/api/v1/cota/atual-sync/`);
			if (fbResp.ok) {
				const fbData = await fbResp.json();
				setCotaAtual(fbData);
				if (fbData.nivel) {
					setCotaReal(fbData.nivel);
					setCotaSimulada(fbData.nivel);
				}
			}
		} catch (err) {
			console.error("Falha ao obter cota de todas as fontes:", err);
		}
	};

	const carregarRuas = async () => {
		// 1. Carrega imediatamente o JSON local estático (/ruas_calibradas.json) que é servido pela CDN da Vercel em milissegundos
		try {
			const localResp = await fetch("/ruas_calibradas.json");
			if (localResp.ok) {
				const localData = await localResp.json();
				if (Array.isArray(localData) && localData.length > 0) {
					setRuas(localData);

					// Auto-correção da cota da casa salva se tiver cota padrão incorreta (ex: 20 ou 22)
					setUsuario((prevUser) => {
						if (!prevUser?.residencia) return prevUser;
						const res = prevUser.residencia;
						const coords = res.coords || (res.lat && res.lon ? [res.lat, res.lon] : null);
						if (!coords) return prevUser;

						// Se cota for a antiga de fallback (ex: 20 ou 22) ou faltante
						if (!res.cota || res.cota === 20.0 || res.cota === 22.0 || res.cota === 29.2) {
							const cotaRealCalculada = estimarCotaTerreno(coords[0], coords[1], res.endereco || "", localData);
							if (cotaRealCalculada && cotaRealCalculada !== res.cota) {
								const userCorrigido = {
									...prevUser,
									residencia: {
										...res,
										cota: cotaRealCalculada,
									},
								};
								localStorage.setItem("usuario_sentinela", JSON.stringify(userCorrigido));
								if (prevUser.email) {
									localStorage.setItem(`dados_perfil_${prevUser.email}`, JSON.stringify(userCorrigido));
								}
								return userCorrigido;
							}
						}
						return prevUser;
					});

					return;
				}
			}
		} catch (err) {
			console.warn("Base local /ruas_calibradas.json falhou, tentando API:", err);
		}

		// 2. Fallback caso a CDN local não responda
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
				}
			}
		} catch (e) {
			console.error("Falha ao obter ruas da API remota:", e);
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

	const irParaPagina = (pag) => {
		setPaginaAtiva(pag);
		trackPageView(pag || 'mapa');
		if (typeof window !== "undefined") {
			const rotas = {
				portal: "/",
				sobre: "/sobre",
				politica: "/politica-de-privacidade",
				termos: "/termos-de-uso",
				analytics: "/analytics",
				mapa: "/mapa",
			};
			if (pag && rotas[pag]) {
				window.history.pushState(null, "", rotas[pag]);
			} else if (pag === null) {
				window.history.pushState(null, "", "/mapa");
			} else {
				window.history.pushState(null, "", "/");
			}
		}
	};

	const voltarAoMapa = () => {
		irParaPagina(null);
	};

	if (paginaAtiva === "portal") {
		return (
			<>
				<PortalEditorialPage
					cotaAtual={cotaAtual}
					onIniciarNavegacao={() => irParaPagina(null)}
					onAbrirPolitica={() => irParaPagina("politica")}
					onAbrirTermos={() => irParaPagina("termos")}
					onAbrirAnalytics={() => irParaPagina("analytics")}
				/>
				<CookieConsentBanner onAbrirPolitica={() => irParaPagina("politica")} />
			</>
		);
	}

	if (paginaAtiva === "analytics") {
		return <AnalyticsDashboard onVoltar={voltarAoMapa} />;
	}

	if (paginaAtiva === "politica") {
		return <PoliticaPrivacidadePage onVoltar={voltarAoMapa} />;
	}

	if (paginaAtiva === "sobre") {
		return <SobrePage onVoltar={voltarAoMapa} />;
	}

	if (paginaAtiva === "termos") {
		return <TermosUsoPage onVoltar={voltarAoMapa} />;
	}

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
				onGpsCapturado={(coords) => setLocalizacaoGPS(coords)}
				onGpsLoadingChange={(loading) => setObtendoGPS(loading)}
			/>

			{/* Barra de Pesquisa e Perfil Superior Fixa */}
			<TopSearchBar
				usuario={usuario}
				temRotaAtiva={!!dadosRota || !!pontoOrigem || !!pontoDestino}
				onLimparRota={limparRota}
				obtendoGPS={obtendoGPS}
				onGpsClick={() => {
					if (!("geolocation" in navigator)) {
						alert("Geolocalização não é suportada pelo seu dispositivo.");
						return;
					}
					setObtendoGPS(true);
					navigator.geolocation.getCurrentPosition(
						(pos) => {
							const coords = [pos.coords.latitude, pos.coords.longitude];
							setLocalizacaoGPS(coords);
							setObtendoGPS(false);
							setPontoOrigem(coords);
							setTextoOrigem("Minha Posição Atual (GPS)");
							setPainelRotaAberto(true);
						},
						(err) => {
							setObtendoGPS(false);
							alert("Por favor, autorize o acesso à localização nas configurações do seu navegador para ver sua posição no mapa.");
						},
						{ enableHighAccuracy: true, timeout: 10000, maximumAge: 30000 }
					);
				}}
				onBuscarClick={() => {
					if (!usuario) {
						setModalAuthAberto(true);
						return;
					}
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
				cotaReal={cotaAtual?.nivel || 13.24}
				cotaAtual={cotaAtual}
				velocidade_cm_h={cotaAtual?.velocidade_cm_h}
				velocidade_formatada={cotaAtual?.velocidade_formatada}
				cotaSimulada={cotaSimulada}
				setCotaSimulada={setCotaSimulada}
				isSimulando={isSimulando}
				setIsSimulando={setIsSimulando}
				temperatura={dadosClima?.current?.temperature_2m !== undefined ? `${Math.round(dadosClima.current.temperature_2m)}°` : "20°"}
				onAbrirClima={() => setModalClimaAberto(true)}
				onAbrirAuth={() => setModalAuthAberto(true)}
				usuario={usuario}
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
				localizacaoGPS={localizacaoGPS}
				obtendoGPS={obtendoGPS}
				onCapturarGPS={(callback) => {
					if (!("geolocation" in navigator)) {
						alert("Geolocalização não suportada.");
						return;
					}
					setObtendoGPS(true);
					navigator.geolocation.getCurrentPosition(
						(pos) => {
							const coords = [pos.coords.latitude, pos.coords.longitude];
							setLocalizacaoGPS(coords);
							setObtendoGPS(false);
							if (callback) callback(coords);
						},
						(err) => {
							setObtendoGPS(false);
							alert("Não foi possível obter o sinal do GPS.");
						},
						{ enableHighAccuracy: true, timeout: 10000, maximumAge: 30000 }
					);
				}}
				// Controle de Vista
				abaAtiva={isSimulando ? "simular" : painelRotaAberto ? "rotas" : "mapa"}
				className="absolute bottom-0 left-0 right-0 z-20"
			/>

			{/* Barra de Navegação Inferior */}
			<BottomNavigation
				className="absolute bottom-0 left-0 right-0 z-30"
				abaAtiva={paginaAtiva || (isSimulando ? "simular" : painelRotaAberto ? "rotas" : "mapa")}
				onMapaClick={() => {
					setPainelRotaAberto(false);
					setIsSimulando(false);
					setPaginaAtiva(null);
				}}
				onRotasClick={() => {
					if (!usuario) {
						setModalAuthAberto(true);
						return;
					}
					setIsSimulando(false);
					setPaginaAtiva(null);
					setPainelRotaAberto(!painelRotaAberto);
				}}
				onInfoClick={() => irParaPagina("portal")}
				onGraficosClick={() => {}}
				onSimularClick={() => {
					setPaginaAtiva(null);
					setIsSimulando(!isSimulando);
				}}
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
				cotaAtual={cotaAtual?.nivel || cotaReal || 13.24}
				onAbrirPolitica={() => irParaPagina("politica")}
				onAbrirSobre={() => irParaPagina("sobre")}
				onAbrirTermos={() => irParaPagina("termos")}
				onAbrirAnalytics={() => irParaPagina("analytics")}
				onAtivarModoTeste={() => setModoTesteAtivo(true)}
			/>

			{/* Laboratório Flutuante do Modo de Testes */}
			{modoTesteAtivo && (
				<ModoTesteBar
					cotaSimulada={cotaSimulada}
					setCotaSimulada={(cota) => {
						setCotaSimulada(cota);
						setIsSimulando(true);
					}}
					onDesativar={() => {
						setModoTesteAtivo(false);
						setCotaSimulada(cotaReal);
						setIsSimulando(false);
					}}
					onAbrirRotasTeste={() => {
						setPainelRotaAberto(true);
						setIsSimulando(true);
					}}
					onDispararNotificacaoTeste={() => {
						if (!("Notification" in window)) {
							alert("Seu navegador não suporta notificações Push.");
							return;
						}
						Notification.requestPermission().then((perm) => {
							if (perm === "granted") {
								const titulo = `🚨 [TESTE] COTA DO RIO EM ${Number(cotaSimulada).toFixed(1)}m`;
								const corpo = `Aviso simulado FloodWay: Água atingindo cotas críticas em Lajeado. Ruas centrais com bloqueio.`;
								if ("serviceWorker" in navigator) {
									navigator.serviceWorker.ready.then((reg) => {
										reg.showNotification(titulo, {
											body: corpo,
											icon: "/icon-192.png",
											badge: "/icon-192.png",
											vibrate: [300, 100, 300, 100, 300],
											tag: "teste-floodway",
										});
									}).catch(() => new Notification(titulo, { body: corpo, icon: "/icon-192.png" }));
								} else {
									new Notification(titulo, { body: corpo, icon: "/icon-192.png" });
								}
							} else {
								alert("Permissão de notificação negada. Ative as notificações no navegador.");
							}
						});
					}}
				/>
			)}

			{/* Banner de Instalação PWA */}
			<InstallPWABanner />

			{/* Notificador e Atualizador Automático de Versão PWA */}
			<AutoUpdateNotifier />

			{/* Modal de Previsão do Tempo e Chuvas */}
			<PrevisaoClimaModal
				isOpen={modalClimaAberto}
				onClose={() => setModalClimaAberto(false)}
				dadosClima={dadosClima}
			/>

			{/* Banner de Consentimento de Cookies LGPD */}
			<CookieConsentBanner onAbrirPolitica={() => irParaPagina("politica")} />
		</div>
	);
}

export default App;
