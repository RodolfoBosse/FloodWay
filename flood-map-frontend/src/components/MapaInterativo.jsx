import React, { useState, useEffect, useRef } from "react";
import { API_BASE } from "../services/config";
import {
	MapContainer,
	TileLayer,
	Polyline,
	Marker,
	Popup,
	LayersControl,
	useMap,
} from "react-leaflet";
import "leaflet/dist/leaflet.css";
import L from "leaflet";
import { formatDistanceToNow } from "date-fns";
import { ptBR } from "date-fns/locale";
import AuthLGPDModal from "./mobile/AuthLGPDModal";

import { buscarDestinosCalibrados, estimarCotaTerreno, LOCAIS_OFICIAIS_LAJEADO } from "../services/locaisLajeado";

const ESTILOS_RUA = {
	alagada: { color: "#dc2626", weight: 5.5, opacity: 1.0, dashArray: "8,4" },
	risco: { color: "#eab308", weight: 5.0, opacity: 0.95, dashArray: null },
	livre: { color: "#16a34a", weight: 3.5, opacity: 0.8, dashArray: null },
};

const CamadaRuasOtimizada = React.memo(({ segmentosBase, nivelAtivo }) => {
	const map = useMap();
	const layerGroupRef = useRef(null);
	const polylinesRef = useRef(new Map());
	const nivelAtivoRef = useRef(nivelAtivo);
	nivelAtivoRef.current = nivelAtivo;

	// Cria as polylines uma única vez quando a malha de ruas carrega
	useEffect(() => {
		if (!map) return;
		if (!layerGroupRef.current) {
			layerGroupRef.current = L.layerGroup().addTo(map);
		}
		const group = layerGroupRef.current;
		group.clearLayers();
		polylinesRef.current.clear();

		const nivel = nivelAtivoRef.current;
		for (const seg of segmentosBase) {
			const margem = seg.cota - nivel;
			const estado = margem <= 0 ? "alagada" : margem <= 1.0 ? "risco" : "livre";
			const poly = L.polyline(seg.coords, ESTILOS_RUA[estado]);

			poly.on("click", (e) => {
				const nv = nivelAtivoRef.current;
				const m = seg.cota - nv;
				const isBloqueado = m <= 0;
				const isRisco = !isBloqueado && m <= 1.0;
				const lamina = isBloqueado ? Math.max(nv - seg.cota, 0.1).toFixed(1) : "0";
				const margemStr = m.toFixed(2);

				const badgeHtml = seg.isCalibrado
					? `<span style="background:#e0f2fe;color:#075985;font-size:9px;padding:2px 6px;border-radius:4px;font-weight:800;white-space:nowrap;">🎯 ASFALTO REAL</span>`
					: "";

				const statusHtml = isBloqueado
					? `<div style="margin-top:8px;padding:4px;border-radius:4px;font-weight:700;text-align:center;background:#fee2e2;color:#991b1b;">🌊 SUBMERSA (+${lamina}m)</div>`
					: isRisco
						? `<div style="margin-top:8px;padding:4px;border-radius:4px;font-weight:700;text-align:center;background:#fef9c3;color:#713f12;border:1px solid #fde047;">⚠️ ATENÇÃO / ALERTA (Folga de ${margemStr}m)</div>`
						: seg.isCalibrado
							? `<div style="margin-top:8px;padding:4px;border-radius:4px;font-weight:700;text-align:center;background:#e0f2fe;color:#0c4a6e;border:1px solid #7dd3fc;">🎯 ASFALTO LIVRE (CALIBRADO)</div>`
							: `<div style="margin-top:8px;padding:4px;border-radius:4px;font-weight:700;text-align:center;background:#dcfce7;color:#166534;">✅ TRÂNSITO LIVRE</div>`;

				const html = `
					<div style="font-size:12px;padding:4px;font-family:sans-serif;min-width:210px;">
						<div style="display:flex;align-items:center;justify-content:space-between;gap:4px;margin-bottom:4px;">
							<h4 style="font-weight:700;color:#111827;font-size:14px;margin:0;">${seg.nome}</h4>
							${badgeHtml}
						</div>
						<p style="color:#4b5563;margin:2px 0;">Altitude Asfalto: <strong style="color:#1d4ed8;">${seg.cota.toFixed(1)}m</strong></p>
						<p style="color:#4b5563;margin:2px 0;">Nível do Rio: <strong>${Number(nv).toFixed(1)}m</strong></p>
						<p style="color:#4b5563;margin:2px 0;">${isBloqueado ? "Lâmina de Água:" : "Margem de Segurança:"} <strong>${isBloqueado ? `+${lamina}m` : `+${margemStr}m`}</strong></p>
						${statusHtml}
					</div>
				`;
				L.popup().setLatLng(e.latlng).setContent(html).openOn(map);
			});

			poly.addTo(group);
			polylinesRef.current.set(seg.id, { poly, estado, cota: seg.cota });
		}

		return () => {
			group.clearLayers();
			polylinesRef.current.clear();
		};
	}, [map, segmentosBase]);

	// Atualiza apenas o estilo dos trechos que mudaram de estado durante a simulação
	useEffect(() => {
		for (const item of polylinesRef.current.values()) {
			const margem = item.cota - nivelAtivo;
			const novoEstado = margem <= 0 ? "alagada" : margem <= 1.0 ? "risco" : "livre";
			if (novoEstado !== item.estado) {
				item.estado = novoEstado;
				item.poly.setStyle(ESTILOS_RUA[novoEstado]);
				if (novoEstado === "alagada" || novoEstado === "risco") {
					item.poly.bringToFront();
				}
			}
		}
	}, [nivelAtivo, segmentosBase]);

	return null;
});
// Ícones Customizados
const iconeBloqueio = new L.DivIcon({
	html: '<div style="background-color: #dc2626; color: white; border-radius: 50%; width: 22px; height: 22px; display: flex; align-items: center; justify-content: center; font-size: 11px; font-weight: bold; border: 2px solid white; box-shadow: 0 2px 4px rgba(0,0,0,0.35);">⛔</div>',
	className: "custom-barrier-icon",
	iconSize: [22, 22],
	iconAnchor: [11, 11],
});

const iconeCasa = new L.DivIcon({
	html: `
		<div style="position: relative; width: 36px; height: 46px; display: flex; flex-direction: column; align-items: center; cursor: grab; filter: drop-shadow(0 4px 8px rgba(0,0,0,0.4));">
			<div style="width: 36px; height: 36px; background: linear-gradient(135deg, #f59e0b, #d97706); border-radius: 50% 50% 50% 0; transform: rotate(-45deg); display: flex; align-items: center; justify-content: center; border: 2.5px solid white; box-shadow: inset 0 2px 4px rgba(255,255,255,0.4);">
				<span style="transform: rotate(45deg); font-size: 17px; margin-top: -1px; margin-left: -1px;">🏠</span>
			</div>
			<div style="width: 8px; height: 8px; background: rgba(0,0,0,0.25); border-radius: 50%; margin-top: 1px; filter: blur(1px);"></div>
		</div>
	`,
	className: "custom-house-pin",
	iconSize: [36, 46],
	iconAnchor: [18, 44],
	popupAnchor: [0, -42],
});

const iconePontoInteresse = new L.DivIcon({
	html: `
		<div style="position: relative; width: 32px; height: 42px; display: flex; flex-direction: column; align-items: center; cursor: pointer; filter: drop-shadow(0 3px 6px rgba(0,0,0,0.35));">
			<div style="width: 32px; height: 32px; background: linear-gradient(135deg, #3b82f6, #1d4ed8); border-radius: 50% 50% 50% 0; transform: rotate(-45deg); display: flex; align-items: center; justify-content: center; border: 2px solid white; box-shadow: inset 0 2px 4px rgba(255,255,255,0.4);">
				<span style="transform: rotate(45deg); font-size: 15px; margin-top: -1px; margin-left: -1px;">📍</span>
			</div>
			<div style="width: 6px; height: 6px; background: rgba(0,0,0,0.2); border-radius: 50%; margin-top: 1px; filter: blur(1px);"></div>
		</div>
	`,
	className: "custom-interest-pin",
	iconSize: [32, 42],
	iconAnchor: [16, 40],
	popupAnchor: [0, -38],
});

const iconeOrigem = new L.DivIcon({
	html: '<div style="background-color: #16a34a; color: white; border-radius: 50%; width: 34px; height: 34px; display: flex; align-items: center; justify-content: center; font-size: 15px; font-weight: bold; border: 3px solid white; box-shadow: 0 4px 10px rgba(0,0,0,0.5);">A</div>',
	className: "custom-pin-a",
	iconSize: [34, 34],
	iconAnchor: [17, 34],
});

const iconeDestino = new L.DivIcon({
	html: '<div style="background-color: #dc2626; color: white; border-radius: 50%; width: 34px; height: 34px; display: flex; align-items: center; justify-content: center; font-size: 15px; font-weight: bold; border: 3px solid white; box-shadow: 0 4px 10px rgba(0,0,0,0.5);">B</div>',
	className: "custom-pin-b",
	iconSize: [34, 34],
	iconAnchor: [17, 34],
});

const iconeUsuarioGPS = new L.DivIcon({
	html: `
		<div style="position: relative; width: 32px; height: 32px; display: flex; align-items: center; justify-content: center;">
			<div style="position: absolute; width: 32px; height: 32px; border-radius: 50%; background-color: rgba(59, 130, 246, 0.4); animation: ping 2s cubic-bezier(0, 0, 0.2, 1) infinite;"></div>
			<div style="position: relative; width: 18px; height: 18px; background-color: #2563eb; border: 3px solid #ffffff; border-radius: 50%; box-shadow: 0 2px 6px rgba(0,0,0,0.4); margin: auto;"></div>
		</div>
	`,
	className: "custom-user-gps-pulse",
	iconSize: [32, 32],
	iconAnchor: [16, 16],
});

// BASE OFICIAL VERIFICADA DE MARCOS E ESTABELECIMENTOS DE LAJEADO/RS

const CapturadorDeCliques = ({ modoSelecao, onPontoSelecionado }) => {
	const map = useMap();
	useEffect(() => {
		if (!map) return;
		const handleClick = (e) => {
			if (modoSelecao) {
				onPontoSelecionado([e.latlng.lat, e.latlng.lng]);
			}
		};
		map.on("click", handleClick);
		return () => map.off("click", handleClick);
	}, [map, modoSelecao, onPontoSelecionado]);
	return null;
};

const MapaInterativo = ({
	cotaAtual,
	cotaSimulada,
	ruas,
	isSimulando,
	setIsSimulando,
	painelRotaAberto,
	setPainelRotaAberto,
	usuario: usuarioProp,
	setUsuario: setUsuarioProp,
	modalCasaAberto: modalCasaAbertoProp,
	setModalCasaAberto: setModalCasaAbertoProp,
	pontoOrigem: pontoOrigemProp,
	setPontoOrigem: setPontoOrigemProp,
	pontoDestino: pontoDestinoProp,
	setPontoDestino: setPontoDestinoProp,
	dadosRota: dadosRotaProp,
	setDadosRota: setDadosRotaProp,
	onGpsCapturado,
	onGpsLoadingChange,
}) => {
	const config = {
		centro: [-29.4669, -51.9611],
		zoom: 15,
		bounds: [
			[-29.495, -51.995],
			[-29.41, -51.87],
		],
	};

	const [usuarioLocal, setUsuarioLocal] = useState(() => {
		const salvo = localStorage.getItem("usuario_sentinela");
		return salvo ? JSON.parse(salvo) : null;
	});
	const usuario = usuarioProp !== undefined ? usuarioProp : usuarioLocal;
	const setUsuario = (u) => {
		setUsuarioLocal(u);
		if (setUsuarioProp) setUsuarioProp(u);
	};

	// Permissão de Notificação Web Push
	const [permissaoPush, setPermissaoPush] = useState(() => {
		return typeof window !== "undefined" && "Notification" in window
			? Notification.permission
			: "default";
	});

	const [modalAuthAberto, setModalAuthAberto] = useState(false);
	const [sheetMobileAberto, setSheetMobileAberto] = useState(true);
	const [modalGoogleChooserAberto, setModalGoogleChooserAberto] =
		useState(false);
	const [modalCasaAbertoLocal, setModalCasaAbertoLocal] = useState(false);
	const modalCasaAberto = modalCasaAbertoProp !== undefined ? modalCasaAbertoProp : modalCasaAbertoLocal;
	const setModalCasaAberto = (v) => {
		setModalCasaAbertoLocal(v);
		if (setModalCasaAbertoProp) setModalCasaAbertoProp(v);
	};
	const [modalPerfilAberto, setModalPerfilAberto] = useState(false);
	const [modalRotasSalvasAberto, setModalRotasSalvasAberto] = useState(false);
	const [abaAuth, setAbaAuth] = useState("entrar");
	const [minhasRotas, setMinhasRotas] = useState([]);

	const [emailInput, setEmailInput] = useState("");
	const [senhaInput, setSenhaInput] = useState("");
	const [nomeInput, setNomeInput] = useState("");

	const contasGoogleDisponiveis = [];

	const [casaEndereco, setCasaEndereco] = useState("");
	const [casaCep, setCasaCep] = useState("");
	const [buscandoCep, setBuscandoCep] = useState(false);
	const [casaNumero, setCasaNumero] = useState("");
	const [casaBairro, setCasaBairro] = useState("");
	const [casaWhatsapp, setCasaWhatsapp] = useState("");
	const [casaCoords, setCasaCoords] = useState(null);
	const [salvandoCasa, setSalvandoCasa] = useState(false);

	// Estado do GPS / Localização Atual do Usuário
	const [localizacaoGPS, setLocalizacaoGPS] = useState(null);
	const [obtendoGPS, setObtendoGPS] = useState(false);
	const mapRef = useRef(null);

	const capturarLocalizacaoAtual = (comoOrigem = false) => {
		if (!("geolocation" in navigator)) {
			alert("Geolocalização não é suportada pelo seu dispositivo ou navegador.");
			return;
		}

		setObtendoGPS(true);
		if (onGpsLoadingChange) onGpsLoadingChange(true);

		navigator.geolocation.getCurrentPosition(
			(pos) => {
				const coords = [pos.coords.latitude, pos.coords.longitude];
				setLocalizacaoGPS(coords);
				setObtendoGPS(false);
				if (onGpsLoadingChange) onGpsLoadingChange(false);
				if (onGpsCapturado) onGpsCapturado(coords);

				if (comoOrigem) {
					setPontoOrigem(coords);
					setTextoOrigem("Minha Posição Atual (GPS)");
					setSugestoesOrigem([]);
				}

				if (mapRef.current) {
					mapRef.current.flyTo(coords, 16, { animate: true, duration: 1.2 });
				}
			},
			(err) => {
				setObtendoGPS(false);
				if (onGpsLoadingChange) onGpsLoadingChange(false);
				let msg = "Não foi possível obter a sua localização GPS.";
				if (err.code === 1) msg = "Permissão de GPS negada. Por favor, autorize a localização nas configurações do navegador.";
				else if (err.code === 2) msg = "Sinal de GPS indisponível no momento.";
				else if (err.code === 3) msg = "Tempo esgotado ao buscar sinal GPS.";
				alert(msg);
			},
			{ enableHighAccuracy: true, timeout: 10000, maximumAge: 30000 }
		);
	};

	// Solicita automaticamente o GPS quando o mapa é aberto (para mostrar 'Você está aqui' de imediato)
	useEffect(() => {
		if ("geolocation" in navigator) {
			navigator.geolocation.getCurrentPosition(
				(pos) => {
					const coords = [pos.coords.latitude, pos.coords.longitude];
					setLocalizacaoGPS(coords);
					if (onGpsCapturado) onGpsCapturado(coords);
				},
				() => {
					// Usuário ainda não autorizou ou cancelou silenciosamente
				},
				{ enableHighAccuracy: true, timeout: 10000, maximumAge: 60000 }
			);
		}
	}, []);

	// Registro do Service Worker para Push
	useEffect(() => {
		if ("serviceWorker" in navigator) {
			navigator.serviceWorker
				.register("/sw.js")
				.catch((err) => console.log("SW fail:", err));
		}
	}, []);

	const ativarNotificacoesPush = async () => {
		if (!("Notification" in window)) {
			alert("Seu navegador não suporta notificações Push.");
			return;
		}

		const perm = await Notification.requestPermission();
		setPermissaoPush(perm);

		if (perm === "granted") {
			dispararNotificacaoLocal(
				"🔔 Alertas Ativados com Sucesso!",
				"Você receberá avisos automáticos na tela do seu celular se o Rio Taquari subir em direção à sua casa ou locais salvos.",
			);
		} else {
			alert("Permissão de notificações não autorizada no navegador.");
		}
	};

	const dispararNotificacaoLocal = (titulo, mensagem) => {
		try {
			if (typeof window !== "undefined" && "Notification" in window) {
				if (Notification.permission === "granted") {
					if ("serviceWorker" in navigator) {
						navigator.serviceWorker.ready.then((reg) => {
							reg.showNotification(titulo, {
								body: mensagem,
								icon: "/icon-192.png",
								badge: "/icon-192.png",
								vibrate: [300, 100, 300, 100, 300],
								tag: "alerta-floodway",
							});
						}).catch(() => {
							new Notification(titulo, { body: mensagem, icon: "/icon-192.png" });
						});
					} else {
						new Notification(titulo, { body: mensagem, icon: "/icon-192.png" });
					}
				} else if (Notification.permission !== "denied") {
					Notification.requestPermission().then((perm) => {
						setPermissaoPush(perm);
						if (perm === "granted") {
							new Notification(titulo, { body: mensagem, icon: "/icon-192.png" });
						}
					});
				}
			}
		} catch (e) {
			console.warn("Falha ao disparar notificacao local:", e);
		}
	};

	const testarNotificacaoEmergencia = () => {
		const horasTexto =
			estimativaHorasCasa !== null
				? `Impacto estimado em ~${estimativaHorasCasa}h.`
				: "Rio em monitoramento ativo.";
		dispararNotificacaoLocal(
			`🚨 ALERTA: RIO TAQUARI EM ${Number(nivelAtivo).toFixed(2)}m`,
			`Margem para sua casa (${usuario?.residencia?.endereco || "Residência"}): +${margemCasa}m livres. ${horasTexto}`,
		);
	};

	const cotaReal = cotaAtual?.nivel || 13.39;
	const velocidadeCmH =
		cotaAtual?.velocidade_cm_h !== undefined
			? Number(cotaAtual.velocidade_cm_h)
			: -5.3;
	const velocidadeFormatada =
		cotaAtual?.velocidade_formatada || "▼ Descendo a 5,3 cm/h";
	const isSubindo = velocidadeCmH > 0;

	// const [cotaSimulada, setCotaSimulada] = useState(cotaReal);
	const [animando, setAnimando] = useState(false);
	const animRef = useRef(null);

	const cotaRealCalculada = cotaAtual?.nivel || cotaReal || 13.39;
	const nivelAtivo = (cotaSimulada && Math.abs(cotaSimulada - cotaRealCalculada) > 0.05)
		? cotaSimulada
		: (isSimulando ? cotaSimulada : cotaRealCalculada);

	const limparRotaAtual = () => {
		setDadosRota(null);
		setPontoOrigem(null);
		setPontoDestino(null);
		setTextoOrigem("");
		setTextoDestino("");
	};
	const [textoOrigem, setTextoOrigem] = useState("");
	const [textoDestino, setTextoDestino] = useState("");
	const [pontoOrigemLocal, setPontoOrigemLocal] = useState(null);
	const pontoOrigem = pontoOrigemProp !== undefined ? pontoOrigemProp : pontoOrigemLocal;
	const setPontoOrigem = (p) => {
		setPontoOrigemLocal(p);
		if (setPontoOrigemProp) setPontoOrigemProp(p);
	};

	const [pontoDestinoLocal, setPontoDestinoLocal] = useState(null);
	const pontoDestino = pontoDestinoProp !== undefined ? pontoDestinoProp : pontoDestinoLocal;
	const setPontoDestino = (p) => {
		setPontoDestinoLocal(p);
		if (setPontoDestinoProp) setPontoDestinoProp(p);
	};

	const [dadosRotaLocal, setDadosRotaLocal] = useState(null);
	const dadosRota = dadosRotaProp !== undefined ? dadosRotaProp : dadosRotaLocal;
	const setDadosRota = (d) => {
		setDadosRotaLocal(d);
		if (setDadosRotaProp) setDadosRotaProp(d);
	};

	const [modoSelecao, setModoSelecao] = useState(null);
	const [sugestoesOrigem, setSugestoesOrigem] = useState([]);
	const [sugestoesDestino, setSugestoesDestino] = useState([]);
	const [sugestoesCasa, setSugestoesCasa] = useState([]);
	const [calculandoRota, setCalculandoRota] = useState(false);

	const carregarRotasSalvas = async (email) => {
		if (!email) return;
		try {
			const resp = await fetch(
				`${API_BASE}/api/v1/rotas/listar/?email=${encodeURIComponent(email)}`,
			);
			if (resp.ok) {
				const data = await resp.json();
				setMinhasRotas(data.rotas || []);
			}
		} catch (e) {}
	};

	useEffect(() => {
		if (usuario?.email) carregarRotasSalvas(usuario.email);
	}, [usuario]);

	const listaRuas = Array.isArray(ruas) ? ruas : [];

	const buscarDestinos = async (termo, setSugestoes) => {
		if (!termo || termo.trim().length < 2) {
			setSugestoes([]);
			return;
		}
		try {
			const listaRuas = Array.isArray(ruas) ? ruas : [];
			const resultados = await buscarDestinosCalibrados(termo, listaRuas);
			setSugestoes(resultados);
		} catch (err) {
			console.warn("Erro ao buscar destinos calibrados:", err);
			setSugestoes([]);
		}
	};
	const selecionarContaGoogle = (conta) => {
		const user = {
			nome: conta.nome,
			email: conta.email,
			avatar: null,
			residencia: null,
		};
		setUsuario(user);
		localStorage.setItem("usuario_sentinela", JSON.stringify(user));
		setModalGoogleChooserAberto(false);
		setModalAuthAberto(false);
		if (!user.residencia) setModalCasaAberto(true);
	};

	const handleLoginEmail = (e) => {
		e.preventDefault();
		if (!emailInput) return;
		const user = {
			nome: nomeInput || emailInput.split("@")[0],
			email: emailInput.trim(),
			avatar: null,
			residencia: null,
		};
		setUsuario(user);
		localStorage.setItem("usuario_sentinela", JSON.stringify(user));
		setModalAuthAberto(false);
		if (!user.residencia) setModalCasaAberto(true);
	};

	const handleBuscarCep = async (cepDigitado) => {
		const cepLimpo = (cepDigitado || "").replace(/\D/g, "");
		setCasaCep(cepDigitado);

		if (cepLimpo.length === 8) {
			setBuscandoCep(true);
			try {
				const resp = await fetch(`https://viacep.com.br/ws/${cepLimpo}/json/`);
				if (resp.ok) {
					const data = await resp.json();
					if (!data.erro) {
						if (data.logradouro) setCasaEndereco(data.logradouro);
						if (data.bairro) setCasaBairro(data.bairro);

						// Busca coordenadas da rua localizada pelo CEP
						const lista = Array.isArray(ruas) ? ruas : [];
						const nomeBusca = data.logradouro;
						const matchRua = lista.find((r) =>
							(r.nome || "").toLowerCase().includes(nomeBusca.toLowerCase()) ||
							nomeBusca.toLowerCase().includes((r.nome || "").toLowerCase())
						);
						if (matchRua) {
							const c = matchRua.coords || (matchRua.pontos && matchRua.pontos[0]);
							if (c) setCasaCoords(c);
						}
					}
				}
			} catch (e) {
				console.warn("Erro ao buscar CEP:", e);
			} finally {
				setBuscandoCep(false);
			}
		}
	};

	const handleSalvarCasa = async (e) => {
		e.preventDefault();
		setSalvandoCasa(true);

		let coordsFinais = casaCoords;
		const enderecoCompleto = `${casaEndereco}${casaNumero ? ", " + casaNumero : ""}`;

		// Se o usuário informou o número da casa (ex: 145), refinamos as coordenadas
		// ao longo da extensão métrica calibrada da rua
		if (casaEndereco && (casaNumero || !coordsFinais)) {
			try {
				const busca = await buscarDestinosCalibrados(enderecoCompleto, listaRuas);
				if (busca && busca.length > 0 && busca[0].coords) {
					coordsFinais = busca[0].coords;
				}
			} catch (_) {}
		}

		if (!coordsFinais && casaEndereco) {
			try {
				const busca = await buscarDestinosCalibrados(enderecoCompleto, listaRuas);
				if (busca && busca.length > 0) {
					coordsFinais = busca[0].coords;
				}
			} catch (_) {}

			if (!coordsFinais) {
				const termoNorm = casaEndereco
					.toLowerCase()
					.normalize("NFD")
					.replace(/[\u0300-\u036f]/g, "")
					.trim();
				const matchLocal = LOCAIS_OFICIAIS_LAJEADO.find((l) =>
					(l.nome || "")
						.toLowerCase()
						.normalize("NFD")
						.replace(/[\u0300-\u036f]/g, "")
						.includes(termoNorm),
				);
				if (matchLocal) {
					coordsFinais = matchLocal.coords;
				} else {
					const matchRua = listaRuas.find((r) =>
						(r.nome || "")
							.toLowerCase()
							.normalize("NFD")
							.replace(/[\u0300-\u036f]/g, "")
							.includes(termoNorm),
					);
					if (matchRua) {
						coordsFinais = matchRua.coords ||
							(matchRua.pontos && matchRua.pontos[0]) || [-29.4668, -51.9614];
					}
				}
			}
		}

		if (!coordsFinais) {
			const normalizar = (txt) =>
				(txt || "")
					.toLowerCase()
					.normalize("NFD")
					.replace(/[\u0300-\u036f]/g, "")
					.replace(/^(rua|avenida|av\.?|travessa|alameda)\s+/i, "")
					.trim();
			const endLimpo = normalizar(
				casaEndereco.replace(/,\s*\d+.*$/, "").replace(/\d+/g, ""),
			);

			const ruaEncontrada = listaRuas.find((r) => {
				const n = normalizar(r.nome || r.name || (r.tags && r.tags.name) || "");
				return n.length > 2 && (n.includes(endLimpo) || endLimpo.includes(n));
			});

			if (ruaEncontrada) {
				if (ruaEncontrada.coords) coordsFinais = ruaEncontrada.coords;
				else if (ruaEncontrada.lat && ruaEncontrada.lng)
					coordsFinais = [ruaEncontrada.lat, ruaEncontrada.lng];
				else if (ruaEncontrada.bounds) {
					coordsFinais = [
						(ruaEncontrada.bounds.minlat + ruaEncontrada.bounds.maxlat) / 2,
						(ruaEncontrada.bounds.minlon + ruaEncontrada.bounds.maxlon) / 2,
					];
				}
			}

			if (!coordsFinais) {
				coordsFinais = [-29.46738, -51.96263];
			}
		}

		// Calcula a cota precisa imediata baseada na malha viária oficial calibrada
		const cotaEstimadaOficial = estimarCotaTerreno(
			coordsFinais[0],
			coordsFinais[1],
			enderecoCompleto,
			listaRuas
		);

		try {
			const resp = await fetch(`${API_BASE}/api/v1/perfil/salvar/`, {
				method: "POST",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify({
					email: usuario.email,
					nome: usuario.nome,
					whatsapp: casaWhatsapp,
					endereco_completo: enderecoCompleto,
					bairro: casaBairro,
					latitude: coordsFinais[0],
					longitude: coordsFinais[1],
					cota_terreno: cotaEstimadaOficial,
				}),
			});

			const data = await resp.json();
			const cotaCalculada = data?.perfil?.cota_terreno || cotaEstimadaOficial || 29.2;

			const usuarioAtualizado = {
				...usuario,
				residencia: {
					endereco: enderecoCompleto,
					bairro: casaBairro,
					whatsapp: casaWhatsapp,
					coords: coordsFinais,
					cota: cotaCalculada,
				},
			};

			setUsuario(usuarioAtualizado);
			localStorage.setItem("usuario_sentinela", JSON.stringify(usuarioAtualizado));
			if (usuario?.email) {
				localStorage.setItem("dados_perfil_" + usuario.email, JSON.stringify(usuarioAtualizado));
			}
			setModalCasaAberto(false);
		} catch (err) {
			const usuarioAtualizado = {
				...usuario,
				residencia: {
					endereco: enderecoCompleto,
					bairro: casaBairro,
					whatsapp: casaWhatsapp,
					coords: coordsFinais,
					cota: cotaEstimadaOficial || 29.2,
				},
			};
			setUsuario(usuarioAtualizado);
			localStorage.setItem("usuario_sentinela", JSON.stringify(usuarioAtualizado));
			if (usuario?.email) {
				localStorage.setItem("dados_perfil_" + usuario.email, JSON.stringify(usuarioAtualizado));
			}
			setModalCasaAberto(false);
		} finally {
			setSalvandoCasa(false);
		}
	};

	const handleArrastarCasa = async (e) => {
		const novaPos = e.target.getLatLng();
		const novasCoords = [novaPos.lat, novaPos.lng];
		const cotaEstimadaArrasto = estimarCotaTerreno(
			novasCoords[0],
			novasCoords[1],
			usuario.residencia?.endereco || "",
			listaRuas
		);

		try {
			const resp = await fetch(`${API_BASE}/api/v1/perfil/salvar/`, {
				method: "POST",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify({
					email: usuario.email,
					nome: usuario.nome,
					whatsapp: usuario.residencia?.whatsapp || "",
					endereco_completo:
						usuario.residencia?.endereco || "Residência Ajustada",
					bairro: usuario.residencia?.bairro || "",
					latitude: novasCoords[0],
					longitude: novasCoords[1],
					cota_terreno: cotaEstimadaArrasto,
				}),
			});

			const data = await resp.json();
			const cotaNova =
				data?.perfil?.cota_terreno || cotaEstimadaArrasto || usuario.residencia?.cota || 29.2;

			const usuarioAtualizado = {
				...usuario,
				residencia: {
					...usuario.residencia,
					coords: novasCoords,
					cota: cotaNova,
				},
			};

			setUsuario(usuarioAtualizado);
			localStorage.setItem("usuario_sentinela", JSON.stringify(usuarioAtualizado));
			if (usuario?.email) {
				localStorage.setItem("dados_perfil_" + usuario.email, JSON.stringify(usuarioAtualizado));
			}
		} catch (err) {
			const usuarioAtualizado = {
				...usuario,
				residencia: {
					...usuario.residencia,
					coords: novasCoords,
					cota: cotaEstimadaArrasto || usuario.residencia?.cota || 29.2,
				},
			};
			setUsuario(usuarioAtualizado);
			localStorage.setItem("usuario_sentinela", JSON.stringify(usuarioAtualizado));
			if (usuario?.email) {
				localStorage.setItem("dados_perfil_" + usuario.email, JSON.stringify(usuarioAtualizado));
			}
		}
	};

	const handleSalvarRotaAtual = async () => {
		if (!usuario || !pontoOrigem || !pontoDestino || !dadosRota) return;
		const apelido = window.prompt("Dê um nome para esta rota:", "Minha Rota");
		if (!apelido) return;

		try {
			const resp = await fetch(`${API_BASE}/api/v1/rotas/salvar/`, {
				method: "POST",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify({
					email: usuario.email,
					nome: apelido,
					origem_nome: textoOrigem,
					origem_coords: pontoOrigem,
					destino_nome: textoDestino,
					destino_coords: pontoDestino,
					cota_corte: 19.5,
					distancia: dadosRota.distancia,
					tempo: dadosRota.tempo,
				}),
			});

			if (resp.ok) {
				alert("✅ Rota salva com sucesso nos seus favoritos!");
				carregarRotasSalvas(usuario.email);
			}
		} catch (e) {
			alert("Erro ao salvar rota.");
		}
	};

	const handleCarregarRotaSalva = (rota) => {
		setPontoOrigem(rota.origem_coords);
		setTextoOrigem(rota.origem_nome);
		setPontoDestino(rota.destino_coords);
		setTextoDestino(rota.destino_nome);
		setModalRotasSalvasAberto(false);
		setPainelRotaAberto(true);
	};

	const handleExcluirRota = async (id, e) => {
		e.stopPropagation();
		if (!window.confirm("Excluir esta rota salva?")) return;
		try {
			await fetch(`${API_BASE}/api/v1/rotas/${id}/excluir/`, {
				method: "POST",
			});
			setMinhasRotas(minhasRotas.filter((r) => r.id !== id));
		} catch (err) {}
	};

	const handleLogout = () => {
		setUsuario(null);
		localStorage.removeItem("usuario_sentinela");
		setPainelRotaAberto(false);
	};

	const tentarAbrirRotas = () => {
		if (!usuario) {
			setModalAuthAberto(true);
		} else {
			setPainelRotaAberto(!painelRotaAberto);
		}
	};

	useEffect(() => {
		if (animando) {
			animRef.current = setInterval(() => {
				setCotaSimulada((prev) => {
					if (prev >= 32.0) {
						setAnimando(false);
						return 32.0;
					}
					return Math.round((prev + 0.2) * 10) / 10;
				});
			}, 250);
		} else {
			clearInterval(animRef.current);
		}
		return () => clearInterval(animRef.current);
	}, [animando]);

	const getStatusCor = (nivel) => {
		if (nivel >= 21.0) return { bg: "bg-red-700", text: "INUNDAÇÃO SEVERA" };
		if (nivel >= 19.0) return { bg: "bg-red-500", text: "COTA DE INUNDAÇÃO" };
		if (nivel >= 17.0) return { bg: "bg-amber-500", text: "COTA DE ALERTA" };
		return { bg: "bg-green-600", text: "NORMAL" };
	};

	const status = getStatusCor(nivelAtivo);

	// Pré-processamento único da malha de ruas (JSON.parse roda apenas quando listaRuas muda)
	const segmentosBase = React.useMemo(() => {
		const segs = [];
		for (const rua of listaRuas) {
			if (!rua.coordenadas_json) continue;
			let rawCoords = rua.coordenadas_json;
			if (typeof rawCoords === "string") {
				try {
					rawCoords = JSON.parse(rawCoords);
				} catch (e) {
					continue;
				}
			}
			if (!Array.isArray(rawCoords)) continue;

			let listaSegmentos = [];
			if (
				typeof rawCoords[0] === "object" &&
				!Array.isArray(rawCoords[0]) &&
				rawCoords[0]?.coords
			) {
				for (const seg of rawCoords) {
					listaSegmentos.push({
						cota: seg.cota || rua.cota_bloqueio,
						coords: seg.coords,
						calibrado_asfalto: Boolean(seg.calibrado_asfalto),
					});
				}
			} else if (
				Array.isArray(rawCoords[0]) &&
				Array.isArray(rawCoords[0][0])
			) {
				for (const coords of rawCoords) {
					listaSegmentos.push({
						cota: rua.cota_bloqueio,
						coords,
						calibrado_asfalto: false,
					});
				}
			} else {
				listaSegmentos.push({
					cota: rua.cota_bloqueio,
					coords: rawCoords,
					calibrado_asfalto: false,
				});
			}

			listaSegmentos.forEach((t, sIdx) => {
				if (!t.coords || !Array.isArray(t.coords) || t.coords.length < 2) return;
				segs.push({
					id: `pista-${rua.id}-${sIdx}`,
					sIdx,
					nome: rua.nome,
					cota: Number(t.cota || rua.cota_bloqueio || 99.0),
					coords: t.coords,
					isCalibrado: Boolean(t.calibrado_asfalto),
				});
			});
		}
		return segs;
	}, [listaRuas]);

	const { trechosPistas, barricadas, pontosBloqueadosGeo } =
		React.useMemo(() => {
			const tPistas = [];
			const bRicadas = [];
			const pBloqueados = [];

			for (const seg of segmentosBase) {
				const margemAgua = seg.cota - nivelAtivo;
				const isBloqueado = margemAgua <= 0;
				const isRiscoIminente = !isBloqueado && margemAgua <= 1.0;

				if (isBloqueado) {
					for (const pt of seg.coords) {
						pBloqueados.push(pt);
					}
					if (seg.sIdx === 0 && bRicadas.length < 35) {
						const lamina = Math.max(nivelAtivo - seg.cota, 0.1);
						bRicadas.push({
							pos: seg.coords[0],
							rua: seg.nome,
							cota: seg.cota,
							lamina: lamina.toFixed(1),
						});
					}
				}
				tPistas.push({
					id: seg.id,
					coords: seg.coords,
					isBloqueado,
					isRiscoIminente,
					isCalibrado: seg.isCalibrado,
					cota: seg.cota,
					nome: seg.nome,
				});
			}
			return {
				trechosPistas: tPistas,
				barricadas: bRicadas,
				pontosBloqueadosGeo: pBloqueados,
			};
		}, [segmentosBase, nivelAtivo]);

	const selecionarPontoNoMapa = (coords) => {
		if (modoSelecao === "origem") {
			setPontoOrigem(coords);
			setTextoOrigem(`Ponto A selecionado no mapa`);
		} else if (modoSelecao === "destino") {
			setPontoDestino(coords);
			setTextoDestino(`Ponto B selecionado no mapa`);
		} else if (modoSelecao === "casa") {
			setCasaCoords(coords);
			setCasaEndereco(`Ponto exato marcado no mapa`);
		}
		setModoSelecao(null);
	};

	
	useEffect(() => {
		const handlerTrigger = () => {
			gerarRotaAntiEnchente();
		};
		window.addEventListener('trigger-gerar-rota', handlerTrigger);
		return () => window.removeEventListener('trigger-gerar-rota', handlerTrigger);
	}, [pontoOrigem, pontoDestino, nivelAtivo, pontosBloqueadosGeo]);

	const gerarRotaAntiEnchente = async () => {
		if (!pontoOrigem || !pontoDestino) {
			alert("Selecione os Pontos A e B!");
			return;
		}

		setCalculandoRota(true);
		setDadosRota(null);

		try {
			const lonA = pontoOrigem[1],
				latA = pontoOrigem[0];
			const lonB = pontoDestino[1],
				latB = pontoDestino[0];

			const rotaTemAlagamento = (coordsGeoJson) => {
				if (!pontosBloqueadosGeo || pontosBloqueadosGeo.length === 0)
					return false;

				// Raio de seguran?a: ~18 metros (0.00016 graus)
				const LIMITE_GRAUS = 0.00025;
				const RAIO_QUADRADO = 18 * 18;

				for (let i = 0; i < coordsGeoJson.length; i++) {
					const lonRota = coordsGeoJson[i][0];
					const latRota = coordsGeoJson[i][1];

					for (let j = 0; j < pontosBloqueadosGeo.length; j++) {
						const pt = pontosBloqueadosGeo[j];
						const latBloq = pt[0];
						const lonBloq = pt[1];

						// Filtro r?pido por caixa delimitadora antes do c?lculo m?trico
						if (
							Math.abs(latBloq - latRota) < LIMITE_GRAUS &&
							Math.abs(lonBloq - lonRota) < LIMITE_GRAUS
						) {
							const dLatM = (latBloq - latRota) * 110850;
							const dLonM = (lonBloq - lonRota) * 96700;
							if (dLatM * dLatM + dLonM * dLonM <= RAIO_QUADRADO) {
								return true; // Rota interceptou ponto de alagamento!
							}
						}
					}
				}
				return false;
			};

			let urlDireta = `https://router.project-osrm.org/route/v1/driving/${lonA},${latA};${lonB},${latB}?overview=full&geometries=geojson&alternatives=true`;
			let resp = await fetch(urlDireta);
			let data = await resp.json();

			let rotaEscolhida = null;
			let rota100Segura = false;
			let pontoAncoraSegura = null;
			let distanciaPeMetros = 0;

			if (data.routes && data.routes.length > 0) {
				for (const r of data.routes) {
					if (!rotaTemAlagamento(r.geometry.coordinates)) {
						rotaEscolhida = r;
						rota100Segura = true;
						break;
					}
				}
			}

			// 2. SE A DIRETA BATER EM ÁGUA, BUSCA CORREDORES DE FUGA EM COTAS ALTAS
			if (!rota100Segura) {
				// Pontos estratégicos nas cristas secas de Lajeado (Americano, Florestal alto, Saldanha, Bento, Pasqualini)
				const corredoresCristaAlta = [
					// Corredor 1: Crista da Pasqualini / Americano (Cota ~55m - 60m)
					{ nome: "Americano / Pasqualini", coords: [-29.4535, -51.9615] },
					// Corredor 2: Florestal Alto / Saldanha Marinho (Cota ~48m)
					{ nome: "Florestal / Saldanha Marinho", coords: [-29.458, -51.9675] },
					// Corredor 3: Entrada Centro Alto via Bento Gonçalves (Cota ~42m)
					{
						nome: "Centro Alto / Bento Gonçalves",
						coords: [-29.462, -51.9645],
					},
					// Corredor 4: Alto da Alberto Torres / Benjamin (antes da descida)
					{ nome: "Alberto Torres Alto", coords: [-29.459, -51.963] },
					// Corredor 5: Bairro Americano / Crista Leste
					{ nome: "Americano Leste", coords: [-29.449, -51.9605] },
					// Corredor 6: Contorno Moinhos / Florestal
					{ nome: "Florestal Norte", coords: [-29.451, -51.969] },
					// Corredor 7: Topo do Centro (Júlio de Castilhos alta com Saldanha)
					{ nome: "Centro Topo", coords: [-29.4635, -51.966] },
				];

				for (const corredor of corredoresCristaAlta) {
					const wp = corredor.coords;
					const urlDesvio = `https://router.project-osrm.org/route/v1/driving/${lonA},${latA};${wp[1]},${wp[0]};${lonB},${latB}?overview=full&geometries=geojson&alternatives=true`;
					try {
						const respWp = await fetch(urlDesvio);
						const dataWp = await respWp.json();
						if (dataWp.routes && dataWp.routes.length > 0) {
							for (const rWp of dataWp.routes) {
								if (!rotaTemAlagamento(rWp.geometry.coordinates)) {
									rotaEscolhida = rWp;
									rota100Segura = true;
									break;
								}
							}
							if (rota100Segura) break;
						}
					} catch (e) {
						console.error("Falha ao consultar corredor alternativo:", e);
					}
				}
			}

			// 3. SE O DESTINO ESTIVER ILHADO OU ACESSOS BLOQUEADOS:
			// ALGORITMO DE ÂNCORA SEGURA (SAFE LANDING POINT)
			// Busca o ponto viável de asfalto seco mais próximo real das coordenadas de destino
			if (!rota100Segura) {
				// Candidatos secos da malha de ruas ordenados por distância direta ao destino
				const candidatosSecos = [];
				for (const pista of trechosPistas) {
					if (pista.isBloqueado) continue;
					if (pista.coords && pista.coords.length > 0) {
						for (const pt of pista.coords) {
							const dLat = (pt[0] - latB) * 110850;
							const dLon = (pt[1] - lonB) * 96700;
							const distDestinoMetros = Math.sqrt(dLat * dLat + dLon * dLon);
							if (distDestinoMetros <= 1800) {
								candidatosSecos.push({
									coord: pt,
									distDestino: distDestinoMetros,
									nomeRua: pista.nome,
									cota: pista.cota
								});
							}
						}
					}
				}

				candidatosSecos.sort((a, b) => a.distDestino - b.distDestino);

				// Filtra candidatos para evitar pontos adjacentes redundantes
				const melhoresCandidatos = [];
				for (const cand of candidatosSecos) {
					const jaTemPerto = melhoresCandidatos.some((mc) => {
						const d1 = (mc.coord[0] - cand.coord[0]) * 110850;
						const d2 = (mc.coord[1] - cand.coord[1]) * 96700;
						return Math.sqrt(d1 * d1 + d2 * d2) < 40;
					});
					if (!jaTemPerto) {
						melhoresCandidatos.push(cand);
						if (melhoresCandidatos.length >= 6) break;
					}
				}

				// Testa rotas seguras de carro até os melhores pontos secos de desembarque
				for (const cand of melhoresCandidatos) {
					const cLat = cand.coord[0];
					const cLon = cand.coord[1];
					const urlAncora = `https://router.project-osrm.org/route/v1/driving/${lonA},${latA};${cLon},${cLat}?overview=full&geometries=geojson&alternatives=true`;
					try {
						const respAncora = await fetch(urlAncora);
						const dataAncora = await respAncora.json();
						if (dataAncora.routes && dataAncora.routes.length > 0) {
							for (const rAncora of dataAncora.routes) {
								if (!rotaTemAlagamento(rAncora.geometry.coordinates)) {
									rotaEscolhida = rAncora;
									pontoAncoraSegura = {
										coord: cand.coord,
										distanciaPe: Math.round(cand.distDestino),
										nomeRua: cand.nomeRua,
										cota: cand.cota
									};
									distanciaPeMetros = Math.round(cand.distDestino);
									break;
								}
							}
						}
					} catch (e) {
						console.warn("Falha ao testar âncora segura:", e);
					}
					if (pontoAncoraSegura) break;
				}
			}

			// 4. FALLBACK EM CASO EXTREMO DE CERCO TOTAL
			if (!rotaEscolhida && data.routes && data.routes.length > 0) {
				rotaEscolhida = data.routes[0];
				rota100Segura = false;
			}

			if (!rotaEscolhida) {
				alert("Não foi possível calcular trajeto.");
				setCalculandoRota(false);
				return;
			}

			const rotaCoords = rotaEscolhida.geometry.coordinates.map((c) => [
				c[1],
				c[0],
			]);
			const distanciaKm = (rotaEscolhida.distance / 1000).toFixed(1);
			const tempoMin = Math.round(rotaEscolhida.duration / 60);

			// 5. DIVISÃO: TRECHO DE CARRO + TRECHO A PÉ / BLOQUEIO
			let coordsCarro = rotaCoords;
			let coordsBloqueado = [];
			let pontoParada = null;

			if (pontoAncoraSegura) {
				// Destino ilhado com Âncora Segura de Desembarque encontrada
				coordsCarro = rotaCoords;
				pontoParada = pontoAncoraSegura.coord;
				// Caminho a pé em linha reta ou tracejado do ponto seguro até o destino
				coordsBloqueado = [pontoAncoraSegura.coord, [latB, lonB]];
			} else if (!rota100Segura) {
				// Rota direta cortada no primeiro obstáculo
				let indiceBloqueio = -1;
				for (let i = 0; i < rotaCoords.length; i++) {
					const pt = rotaCoords[i];
					const pontoSubmerso = trechosPistas.some((pista) => {
						if (!pista.isBloqueado) return false;
						return pista.coords.some((coordPista) => {
							const dLat = Math.abs(coordPista[0] - pt[0]);
							const dLon = Math.abs(coordPista[1] - pt[1]);
							return dLat < 0.00025 && dLon < 0.00025;
						});
					});

					if (pontoSubmerso) {
						indiceBloqueio = i;
						break;
					}
				}

				if (indiceBloqueio > 0) {
					coordsCarro = rotaCoords.slice(0, indiceBloqueio + 1);
					coordsBloqueado = rotaCoords.slice(indiceBloqueio);
					pontoParada = rotaCoords[indiceBloqueio];
				} else if (indiceBloqueio === 0) {
					coordsCarro = [];
					coordsBloqueado = rotaCoords;
					pontoParada = rotaCoords[0];
				}
				if (pontoParada) {
					const dLat = (pontoParada[0] - latB) * 110850;
					const dLon = (pontoParada[1] - lonB) * 96700;
					distanciaPeMetros = Math.round(Math.sqrt(dLat * dLat + dLon * dLon));
				}
			}

			setDadosRota({
				coords: rotaCoords,
				coordsCarro: coordsCarro,
				coordsBloqueado: coordsBloqueado,
				pontoParada: pontoParada,
				pontoAncoraSegura: pontoAncoraSegura,
				distanciaPeMetros: distanciaPeMetros,
				distancia: distanciaKm,
				tempo: tempoMin,
				segura: rota100Segura,
			});
		} catch (err) {
			alert("Erro ao calcular rota.");
		} finally {
			setCalculandoRota(false);
		}
	};

	const abrirGoogleMaps = () => {
		if (!pontoOrigem || !pontoDestino) return;

		const oLat = pontoOrigem[0].toFixed(5);
		const oLon = pontoOrigem[1].toFixed(5);

		// SE O DESTINO ESTÁ ILHADO E TEMOS PONTO DE PARADA / ÂNCORA SEGURA:
		// Direciona o motorista para o ponto seguro onde o carro pode parar!
		let destinoFinalGoogle = pontoDestino;
		if (dadosRota && !dadosRota.segura && dadosRota.pontoParada) {
			destinoFinalGoogle = dadosRota.pontoParada;
		}

		const dLat = destinoFinalGoogle[0].toFixed(5);
		const dLon = destinoFinalGoogle[1].toFixed(5);

		let paradasIntermediarias = [];
		if (dadosRota?.coordsCarro?.length >= 6) {
			const total = dadosRota.coordsCarro.length;
			const p1 = dadosRota.coordsCarro[Math.floor(total * 0.35)];
			const p2 = dadosRota.coordsCarro[Math.floor(total * 0.7)];
			paradasIntermediarias = [
				`${p1[0].toFixed(5)},${p1[1].toFixed(5)}`,
				`${p2[0].toFixed(5)},${p2[1].toFixed(5)}`,
			];
		}

		let pathGoogle = `${oLat},${oLon}/`;
		for (const p of paradasIntermediarias) {
			pathGoogle += `${p}/`;
		}
		pathGoogle += `${dLat},${dLon}`;

		const url = `https://www.google.com/maps/dir/${pathGoogle}/@${oLat},${oLon},14z/data=!4m2!4m1!3e0`;
		window.open(url, "_blank");
	};

	const abrirWaze = () => {
		if (!pontoDestino) return;
		let alvo = pontoDestino;
		if (dadosRota && !dadosRota.segura && dadosRota.pontoParada) {
			alvo = dadosRota.pontoParada;
		}
		const url = `https://waze.com/ul?ll=${alvo[0]},${alvo[1]}&navigate=yes`;
		window.open(url, "_blank");
	};

	// CÁLCULO PREDITIVO DO SENTINELA (RESIDÊNCIA)
	const margemCasa = usuario?.residencia
		? Number((usuario.residencia.cota - nivelAtivo).toFixed(1))
		: null;
	const casaEmRisco = margemCasa !== null && margemCasa <= 0.0;

	let estimativaHorasCasa = null;
	if (isSubindo && margemCasa !== null && margemCasa > 0 && velocidadeCmH > 0) {
		const horas = (margemCasa * 100) / velocidadeCmH;
		estimativaHorasCasa = horas <= 72 ? Math.round(horas) : null;
	}

	return (
		<div className="w-full h-screen flex flex-col font-sans select-none relative overflow-hidden bg-gray-100">
			{/* MODAL: MINHAS ROTAS SALVAS */}
			{modalRotasSalvasAberto && (
				<div
					style={{ zIndex: 3000 }}
					className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-end sm:items-center justify-center p-0 sm:p-4">
					<div className="bg-white w-full sm:max-w-md rounded-t-3xl sm:rounded-2xl p-6 shadow-2xl transition-all max-h-[85vh] flex flex-col">
						<div className="flex justify-between items-center pb-3 border-b">
							<div className="flex items-center gap-2">
								<span className="text-2xl">⭐</span>
								<div>
									<h3 className="font-black text-gray-900 text-base leading-tight">
										Minhas Rotas Salvas
									</h3>
									<p className="text-[11px] text-gray-500">{usuario?.email}</p>
								</div>
							</div>
							<button
								onClick={() => setModalRotasSalvasAberto(false)}
								className="text-gray-400 hover:text-gray-600 font-bold">
								✕
							</button>
						</div>

						<div className="flex-1 overflow-y-auto divide-y divide-gray-100 my-3 space-y-2">
							{minhasRotas.length === 0 ? (
								<div className="text-center py-8 text-gray-500 text-xs">
									<span className="text-3xl block mb-2">🚗</span>
									Você ainda não salvou nenhuma rota.
									<br />
									Trace uma rota e clique em <strong>"⭐ Salvar Rota"</strong>!
								</div>
							) : (
								minhasRotas.map((r) => {
									const margem = Number((r.cota_corte - nivelAtivo).toFixed(1));
									const bloqueada = margem <= 0;

									let tempoCorte = null;
									if (isSubindo && margem > 0 && velocidadeCmH > 0) {
										const h = (margem * 100) / velocidadeCmH;
										tempoCorte = h <= 72 ? Math.round(h) : null;
									}

									return (
										<div
											key={r.id}
											onClick={() => handleCarregarRotaSalva(r)}
											className="p-3 bg-gray-50 hover:bg-indigo-50 border border-gray-200 hover:border-indigo-300 rounded-xl cursor-pointer transition flex justify-between items-center">
											<div className="min-w-0 flex-1 pr-2">
												<h4 className="font-bold text-gray-900 text-xs flex items-center gap-1.5">
													<span>🚗</span> {r.nome}
												</h4>
												<p className="text-[11px] text-gray-500 truncate mt-0.5">
													De: {r.origem_nome}
												</p>
												<p className="text-[11px] text-gray-500 truncate">
													Para: {r.destino_nome}
												</p>
												<div className="mt-1 flex items-center gap-2 text-[10px]">
													<span
														className={`px-2 py-0.5 rounded font-bold ${
															bloqueada
																? "bg-red-100 text-red-800"
																: tempoCorte !== null && tempoCorte <= 24
																	? "bg-orange-100 text-orange-900"
																	: "bg-green-100 text-green-800"
														}`}>
														{bloqueada
															? "⛔ INUNDADA"
															: tempoCorte !== null
																? `⚠️ Corte em ~${tempoCorte}h (+${margem}m)`
																: `✅ LIVRE (+${margem}m)`}
													</span>
													<span className="text-gray-400 font-mono">
														{r.distancia} km
													</span>
												</div>
											</div>
											<button
												onClick={(e) => handleExcluirRota(r.id, e)}
												className="text-gray-400 hover:text-red-600 p-2 text-sm">
												🗑️
											</button>
										</div>
									);
								})
							)}
						</div>

						<button
							onClick={() => setModalRotasSalvasAberto(false)}
							className="w-full bg-gray-100 hover:bg-gray-200 text-gray-800 font-bold py-2.5 rounded-xl text-xs">
							Fechar
						</button>
					</div>
				</div>
			)}

			{/* MODAL: MEU PERFIL (USUÁRIO LOGADO) */}
			{modalPerfilAberto && usuario && (
				<div
					style={{ zIndex: 3000 }}
					className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-end sm:items-center justify-center p-0 sm:p-4">
					<div className="bg-white w-full sm:max-w-md rounded-t-3xl sm:rounded-2xl p-6 shadow-2xl transition-all">
						<div className="flex justify-between items-center pb-3 border-b border-gray-100">
							<div className="flex items-center gap-3">
								<div className="w-11 h-11 rounded-full bg-blue-600 text-white flex items-center justify-center text-lg font-bold shadow-md">
									{usuario.nome ? usuario.nome.charAt(0).toUpperCase() : "U"}
								</div>
								<div>
									<h3 className="font-bold text-gray-900 text-base leading-tight">
										{usuario.nome || "Minha Conta"}
									</h3>
									<p className="text-xs text-gray-500">{usuario.email}</p>
								</div>
							</div>
							<button
								onClick={() => setModalPerfilAberto(false)}
								className="text-gray-400 hover:text-gray-600 text-lg font-bold p-1">
								✕
							</button>
						</div>

						<div className="space-y-2.5 my-4">
							{/* Status da Casa */}
							<div
								onClick={() => {
									setModalPerfilAberto(false);
									setModalCasaAberto(true);
								}}
								className="p-3.5 bg-gray-50 hover:bg-blue-50 border border-gray-200 rounded-2xl flex items-center justify-between cursor-pointer transition">
								<div className="flex items-center gap-3">
									<span className="text-2xl">🏠</span>
									<div>
										<p className="text-xs font-bold text-gray-900">
											{usuario.residencia
												? "Configuração da Minha Casa"
												: "Cadastrar Minha Residência"}
										</p>
										<p className="text-[11px] text-gray-500">
											{usuario.residencia
												? `${usuario.residencia.endereco || "Casa"} • Cota: ${usuario.residencia.cota}m`
												: "Monitore a altitude do seu terreno"}
										</p>
									</div>
								</div>
								<span className="text-gray-400 text-sm">➔</span>
							</div>

							{/* Minhas Rotas Salvas */}
							<div
								onClick={() => {
									setModalPerfilAberto(false);
									setModalRotasSalvasAberto(true);
								}}
								className="p-3.5 bg-gray-50 hover:bg-amber-50 border border-gray-200 rounded-2xl flex items-center justify-between cursor-pointer transition">
								<div className="flex items-center gap-3">
									<span className="text-2xl">⭐</span>
									<div>
										<p className="text-xs font-bold text-gray-900">
											Minhas Rotas Salvas
										</p>
										<p className="text-[11px] text-gray-500">
											{minhasRotas.length > 0
												? `${minhasRotas.length} rotas monitoradas`
												: "Nenhuma rota salva ainda"}
										</p>
									</div>
								</div>
								<span className="text-gray-400 text-sm">➔</span>
							</div>

							{/* Notificações Push */}
							<div
								onClick={ativarNotificacoesPush}
								className="p-3.5 bg-gray-50 hover:bg-emerald-50 border border-gray-200 rounded-2xl flex items-center justify-between cursor-pointer transition">
								<div className="flex items-center gap-3">
									<span className="text-2xl">🔔</span>
									<div>
										<p className="text-xs font-bold text-gray-900">
											Notificações Push no Celular
										</p>
										<p className="text-[11px] text-gray-500">
											{permissaoPush === "granted"
												? "Ativadas com sucesso"
												: "Clique para permitir avisos"}
										</p>
									</div>
								</div>
								<span
									className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
										permissaoPush === "granted"
											? "bg-emerald-100 text-emerald-800"
											: "bg-amber-100 text-amber-800"
									}`}>
									{permissaoPush === "granted" ? "Ativo" : "Ativar"}
								</span>
							</div>
						</div>

						{/* Botão Sair */}
						<button
							onClick={() => {
								handleLogout();
								setModalPerfilAberto(false);
							}}
							className="w-full bg-red-50 hover:bg-red-100 text-red-600 font-bold py-2.5 rounded-xl text-xs transition border border-red-200">
							Desconectar da Conta
						</button>
					</div>
				</div>
			)}

			{/* MODAL AUTH REAL COM LGPD */}
			<AuthLGPDModal
				isOpen={modalAuthAberto}
				onClose={() => setModalAuthAberto(false)}
				onLoginSucesso={(user) => {
					setUsuario(user);
					if (!user.residencia) setModalCasaAberto(true);
				}}
			/>

			{/* PASSO 2: CONFIGURAR CASA COM TESTE DE ALERTA PUSH */}
			{modalCasaAberto && (
				<div
					style={{ zIndex: 3000 }}
					className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-end sm:items-center justify-center p-0 sm:p-4 animate-in fade-in duration-200">
					<div className="bg-white w-full sm:max-w-md rounded-t-3xl sm:rounded-2xl p-6 shadow-2xl transition-all">
						<div className="flex justify-between items-center pb-3 border-b border-slate-100">
							<div>
								<h3 className="font-semibold text-slate-900 text-base leading-tight">
									Residência Monitorada
								</h3>
								<p className="text-xs text-slate-500 mt-0.5">{usuario?.email}</p>
							</div>
							<button
								onClick={() => setModalCasaAberto(false)}
								className="w-8 h-8 rounded-full flex items-center justify-center text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition">
								✕
							</button>
						</div>

						{/* BOTÃO TESTAR NOTIFICAÇÃO NO CELULAR */}
						{usuario?.residencia && (
							<div className="my-3 p-3 bg-slate-50 border border-slate-200 rounded-xl flex items-center justify-between gap-2">
								<div>
									<p className="font-semibold text-slate-900 text-xs">
										Alertas Hidrológicos Ativos
									</p>
									<p className="text-[11px] text-slate-500">
										Teste o aviso sonoro e push no seu aparelho
									</p>
								</div>
								<button
									type="button"
									onClick={testarNotificacaoEmergencia}
									className="bg-slate-900 hover:bg-slate-800 text-white text-xs font-semibold px-3 py-1.5 rounded-lg shadow-sm transition active:scale-95 whitespace-nowrap">
									Testar Alerta
								</button>
							</div>
						)}

						<form onSubmit={handleSalvarCasa} className="space-y-3.5 mt-3">
							{/* CAMPO CEP COM AUTO-PREENCHIMENTO */}
							<div>
								<div className="flex items-center justify-between mb-1">
									<label className="text-xs font-medium text-slate-700 block">
										CEP (Opcional)
									</label>
									{buscandoCep && (
										<span className="text-[11px] text-slate-500 animate-pulse">
											Buscando logradouro...
										</span>
									)}
								</div>
								<div className="relative">
									<input
										type="text"
										maxLength={9}
										placeholder="95900-000"
										value={casaCep}
										onChange={(e) => handleBuscarCep(e.target.value)}
										className="w-full text-xs p-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:border-slate-900 outline-none transition"
									/>
								</div>
							</div>

							{/* CAMPO RUA / ENDEREÇO */}
							<div className="relative">
								<label className="text-xs font-medium text-slate-700 mb-1 block">
									Logradouro / Rua
								</label>
								<div className="flex gap-2">
									<input
										type="text"
										placeholder="Ex: Bento Gonçalves, Alfonso Haas..."
										value={casaEndereco}
										onChange={(e) => {
											setCasaEndereco(e.target.value);
											buscarDestinos(e.target.value, setSugestoesCasa);
										}}
										className="flex-1 text-xs p-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:border-slate-900 outline-none transition"
										required
									/>
									<button
										type="button"
										onClick={() => {
											setModoSelecao("casa");
											setModalCasaAberto(false);
										}}
										className="bg-slate-100 hover:bg-slate-200 border border-slate-200 text-slate-800 text-xs px-3 py-2 rounded-xl font-medium transition active:scale-95 shadow-sm whitespace-nowrap">
										No Mapa
									</button>
								</div>

								{sugestoesCasa.length > 0 && (
									<div className="absolute left-0 right-0 top-full mt-1 bg-white border border-slate-200 rounded-xl shadow-xl z-50 overflow-hidden divide-y divide-slate-100 max-h-52 overflow-y-auto">
										<div className="p-2 bg-slate-50 flex items-center justify-between text-xs text-slate-500 font-medium border-b border-slate-100">
											<span>Endereços sugeridos</span>
											<button
												type="button"
												onClick={() => setSugestoesCasa([])}
												className="text-slate-400 hover:text-slate-700 px-1">
												✕
											</button>
										</div>
										{sugestoesCasa.map((s, idx) => (
											<div
												key={idx}
												onClick={() => {
													setCasaEndereco(s.nome);
													setCasaCoords(s.coords);
													setSugestoesCasa([]);
												}}
												className="text-xs p-2.5 hover:bg-slate-50 cursor-pointer flex items-center justify-between gap-2">
												<div className="min-w-0 flex-1">
													<p className="font-semibold text-slate-900 truncate">
														{s.nome}
													</p>
													<p className="text-[10px] text-slate-500 truncate">
														{s.detalhe}
													</p>
												</div>
												{s.cota && (
													<span className="text-[11px] bg-slate-100 text-slate-800 font-bold px-2 py-0.5 rounded-lg border border-slate-200">
														{s.cota.toFixed(1)} m
													</span>
												)}
											</div>
										))}
									</div>
								)}
							</div>

							<div className="flex gap-2">
								<div className="w-1/3">
									<label className="text-xs font-medium text-slate-700 mb-1 block">
										Número
									</label>
									<input
										type="text"
										placeholder="Ex: 145"
										value={casaNumero}
										onChange={(e) => setCasaNumero(e.target.value)}
										className="w-full text-xs p-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:border-slate-900 outline-none transition"
									/>
								</div>
								<div className="flex-1">
									<label className="text-xs font-medium text-slate-700 mb-1 block">
										Bairro
									</label>
									<input
										type="text"
										placeholder="Ex: Carneiros, Centro..."
										value={casaBairro}
										onChange={(e) => setCasaBairro(e.target.value)}
										className="w-full text-xs p-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:border-slate-900 outline-none transition"
									/>
								</div>
							</div>

							<button
								type="submit"
								disabled={salvandoCasa}
								className="w-full bg-slate-900 hover:bg-slate-800 text-white font-semibold py-2.5 rounded-xl text-xs shadow-sm transition active:scale-98">
								{salvandoCasa
									? "Calculando altitude do terreno..."
									: "Salvar Residência"}
							</button>
						</form>
					</div>
				</div>
			)}

			{/* PAINEL DE ROTA MOBILE / DESKTOP (SUBSTITUÍDO PELA BOTTOM SHEET) */}
			{false && painelRotaAberto && (
				<div
					style={{ zIndex: 2000 }}
					className="fixed inset-x-0 bottom-0 sm:bottom-auto sm:right-auto sm:top-20 sm:left-4 sm:w-96 bg-white rounded-t-3xl sm:rounded-2xl shadow-2xl border border-gray-200 p-5 max-h-[85vh] overflow-y-auto transition-all">
					<div className="flex justify-between items-center mb-3 border-b pb-2">
						<h3 className="font-bold text-gray-900 flex items-center gap-1.5 text-sm">
							🚗 Rota Anti-Enchente (Lajeado)
						</h3>
						<button
							onClick={() => setPainelRotaAberto(false)}
							className="text-gray-400 hover:text-gray-600 font-bold p-1">
							✕
						</button>
					</div>

					<div className="space-y-3">
						{/* Atalhos Rápidos: GPS e Residência */}
						<div className="flex gap-1.5 pb-0.5">
							<button
								onClick={() => capturarLocalizacaoAtual(true)}
								disabled={obtendoGPS}
								className="flex-1 bg-blue-50 hover:bg-blue-100 border border-blue-200 text-blue-900 text-[11px] font-bold py-1.5 px-2 rounded-lg flex items-center justify-center gap-1.5 transition active:scale-95 shadow-xs cursor-pointer">
								<span>{obtendoGPS ? "🛰️ Localizando..." : "📍 Minha Posição Atual (GPS)"}</span>
							</button>

							{usuario?.residencia?.coords && (
								<button
									onClick={() => {
										setPontoDestino(usuario.residencia.coords);
										setTextoDestino(
											`Minha Casa (${usuario.residencia.endereco})`,
										);
									}}
									className="bg-amber-50 hover:bg-amber-100 border border-amber-200 text-amber-900 text-[11px] font-bold py-1.5 px-2.5 rounded-lg flex items-center justify-center gap-1 transition active:scale-95 shadow-xs cursor-pointer">
									🏁 Ir p/ Casa
								</button>
							)}
						</div>

						{/* PONTO A */}
						<div className="relative">
							<label className="text-[11px] font-semibold text-gray-600 flex items-center gap-1 mb-1">
								<span className="w-2 h-2 rounded-full bg-green-600 inline-block"></span>{" "}
								Partida (A)
							</label>
							<div className="flex gap-1.5">
								<input
									type="text"
									placeholder="Ex: Madre Bárbara, Bento Gonçalves, Univates..."
									value={textoOrigem}
									onChange={(e) => {
										setTextoOrigem(e.target.value);
										buscarDestinos(e.target.value, setSugestoesOrigem);
									}}
									className="flex-1 text-xs p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:outline-none"
								/>
								<button
									onClick={() => setModoSelecao("origem")}
									className={`text-[11px] px-2.5 py-1.5 rounded-lg border font-semibold ${modoSelecao === "origem" ? "bg-green-600 text-white" : "bg-gray-100 text-gray-700"}`}>
									🎯 No Mapa
								</button>
							</div>

							{sugestoesOrigem.length > 0 && (
								<div className="absolute left-0 right-0 top-full mt-1 bg-white border border-gray-200 rounded-xl shadow-2xl z-50 divide-y divide-gray-100 max-h-52 overflow-y-auto">
									{sugestoesOrigem.map((s, idx) => (
										<div
											key={idx}
											onClick={() => {
												setPontoOrigem(s.coords);
												setTextoOrigem(s.nome);
												setSugestoesOrigem([]);
											}}
											className="text-xs p-2.5 hover:bg-green-50 cursor-pointer flex items-center gap-2">
											<span>
												{s.tipo === "hospital"
													? "🏥"
													: s.tipo === "escola"
														? "🎓"
														: s.tipo === "rua"
															? "📍"
															: "🏢"}
											</span>
											<div className="min-w-0 flex-1">
												<p className="font-bold text-gray-900 truncate">
													{s.nome}
												</p>
												<p className="text-[10px] text-gray-500 truncate">
													{s.detalhe}
												</p>
											</div>
										</div>
									))}
								</div>
							)}
						</div>

						{/* PONTO B */}
						<div className="relative">
							<label className="text-[11px] font-semibold text-gray-600 flex items-center gap-1 mb-1">
								<span className="w-2 h-2 rounded-full bg-red-600 inline-block"></span>{" "}
								Destino (B)
							</label>
							<div className="flex gap-1.5">
								<input
									type="text"
									placeholder="Ex: Madre Bárbara, Alfonso Haas, HBB..."
									value={textoDestino}
									onChange={(e) => {
										setTextoDestino(e.target.value);
										buscarDestinos(e.target.value, setSugestoesDestino);
									}}
									className="flex-1 text-xs p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:outline-none"
								/>
								<button
									onClick={() => setModoSelecao("destino")}
									className={`text-[11px] px-2.5 py-1.5 rounded-lg border font-semibold ${modoSelecao === "destino" ? "bg-red-600 text-white" : "bg-gray-100 text-gray-700"}`}>
									🎯 No Mapa
								</button>
							</div>

							{sugestoesDestino.length > 0 && (
								<div className="absolute left-0 right-0 top-full mt-1 bg-white border border-gray-200 rounded-xl shadow-2xl z-50 divide-y divide-gray-100 max-h-52 overflow-y-auto">
									{sugestoesDestino.map((s, idx) => (
										<div
											key={idx}
											onClick={() => {
												setPontoDestino(s.coords);
												setTextoDestino(s.nome);
												setSugestoesDestino([]);
											}}
											className="text-xs p-2.5 hover:bg-red-50 cursor-pointer flex items-center gap-2">
											<span>
												{s.tipo === "hospital"
													? "🏥"
													: s.tipo === "escola"
														? "🎓"
														: s.tipo === "rua"
															? "📍"
															: "🏢"}
											</span>
											<div className="min-w-0 flex-1">
												<p className="font-bold text-gray-900 truncate">
													{s.nome}
												</p>
												<p className="text-[10px] text-gray-500 truncate">
													{s.detalhe}
												</p>
											</div>
										</div>
									))}
								</div>
							)}
						</div>

						<button
							onClick={gerarRotaAntiEnchente}
							disabled={calculandoRota || !pontoOrigem || !pontoDestino}
							className={`w-full py-2.5 rounded-xl font-bold text-xs flex items-center justify-center gap-2 shadow-md transition ${
								calculandoRota || !pontoOrigem || !pontoDestino
									? "bg-gray-300 text-gray-500 cursor-not-allowed"
									: "bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white"
							}`}>
							{calculandoRota
								? "⏳ Calculando Desvio Seguro..."
								: "🚀 Gerar Rota Anti-Enchente"}
						</button>

						{dadosRota && (
							<div className="mt-2 p-2.5 bg-gray-50 rounded-xl border border-gray-200 space-y-2 text-xs">
								<div className="flex justify-between">
									<span className="text-gray-500">
										Distância: <strong>{dadosRota.distancia} km</strong>
									</span>
									<span className="text-gray-500">
										Tempo: <strong>{dadosRota.tempo} min</strong>
									</span>
								</div>

								<div
									className={`p-1.5 rounded-lg font-bold text-center text-[11px] ${
										dadosRota.segura
											? "bg-green-100 text-green-800"
											: "bg-red-100 text-red-800"
									}`}>
									{dadosRota.segura
										? "🛡️ ROTA 100% SEGURA (Desvio pelas Colinas)"
										: "⛔ ATENÇÃO: CIDADE ILHADA NO NÍVEL SELECIONADO"}
								</div>

								<button
									onClick={handleSalvarRotaAtual}
									className="w-full bg-amber-500 hover:bg-amber-600 text-white font-bold py-1.5 rounded-lg text-xs flex items-center justify-center gap-1.5 shadow-sm transition">
									⭐ Salvar Rota nos Meus Alertas
								</button>
								<button
									onClick={limparRotaAtual}
									className="w-full bg-red-50 hover:bg-red-100 text-red-600 border border-red-200 font-bold py-1.5 rounded-lg text-xs flex items-center justify-center gap-1.5 shadow-sm transition active:scale-95">
									🗑️ Apagar / Limpar Rota do Mapa
								</button>

								<div className="flex gap-2 pt-1">
									<button
										onClick={abrirGoogleMaps}
										className="flex-1 bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 rounded-lg text-xs shadow">
										🗺️ Google Maps
									</button>
									<button
										onClick={abrirWaze}
										className="flex-1 bg-purple-600 hover:bg-purple-700 text-white font-bold py-2 rounded-lg text-xs shadow">
										🚗 Waze
									</button>
								</div>
							</div>
						)}
					</div>
				</div>
			)}

			{/* DICA DE CLIQUE NO MAPA */}
			{modoSelecao && (
				<div
					style={{ zIndex: 3000 }}
					className="absolute top-20 left-1/2 transform -translate-x-1/2 bg-gray-900 text-white px-4 py-2 rounded-full shadow-2xl text-xs font-bold flex items-center gap-2 animate-bounce">
					<span>
						🎯 Toque no mapa para marcar{" "}
						{modoSelecao === "casa"
							? "o lote exato da sua Casa 🏠"
							: modoSelecao === "origem"
								? "o Ponto A"
								: "o Ponto B"}
					</span>
					<button
						onClick={() => {
							setModoSelecao(null);
							if (modoSelecao === "casa") setModalCasaAberto(true);
						}}
						className="ml-1 bg-gray-700 px-1.5 py-0.5 rounded-full text-[10px]">
						✕
					</button>
				</div>
			)}

			{/* MAPA */}
			<div className="flex-1 w-full relative z-0">
				{/* COMPONENTES MODULARES MOBILE DA FOTO */}

				{dadosRota && (
					<div className="absolute top-4 right-14 z-[999]">
						<button
							onClick={limparRotaAtual}
							title="Remover rota ativa do mapa"
							className="bg-white/95 hover:bg-red-50 text-red-600 hover:text-red-700 font-bold px-3 py-1.5 rounded-xl shadow-lg border border-red-200 text-xs flex items-center gap-1.5 transition active:scale-95">
							<span>🗑️</span><span>Limpar Rota</span>
						</button>
					</div>
				)}

				<MapContainer zoomControl={false}
					ref={mapRef}
					center={config.centro}
					zoom={config.zoom}
					preferCanvas={true}
					style={{ width: "100%", height: "100%" }}
					minZoom={10}
					maxZoom={19}>
					<CapturadorDeCliques
						modoSelecao={modoSelecao}
						onPontoSelecionado={selecionarPontoNoMapa}
					/>

					<LayersControl position="topright">
						<LayersControl.BaseLayer checked name="🗺️ Mapa de Ruas">
							<TileLayer
								url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
								attribution="&copy; OSM"
								maxZoom={19}
							/>
						</LayersControl.BaseLayer>
						<LayersControl.BaseLayer name="🏔️ Topografia">
							<TileLayer
								url="https://{s}.tile.opentopomap.org/{z}/{x}/{y}.png"
								attribution="&copy; OpenTopoMap"
								maxZoom={17}
							/>
						</LayersControl.BaseLayer>
					</LayersControl>

					{/* Ruas (Camada Canvas Imperativa com Atualização Diferencial Zero-Lag) */}
					<CamadaRuasOtimizada
						segmentosBase={segmentosBase}
						nivelAtivo={nivelAtivo}
					/>

					{/* ROTA NAVEGÁVEL DE CARRO (ROXO VIBRANTE DE ALTO CONTRASTE) */}
					{dadosRota &&
						dadosRota.coordsCarro &&
						dadosRota.coordsCarro.length > 1 && (
							<>
								{/* Contorno escuro para destacar sobre qualquer fundo */}
								<Polyline
									positions={dadosRota.coordsCarro}
									pathOptions={{ color: "#1e3a8a", weight: 8, opacity: 0.6 }}
								/>
								{/* Linha principal violeta */}
								<Polyline
									positions={dadosRota.coordsCarro}
									pathOptions={{ color: "#2563eb", weight: 5, opacity: 1.0 }}
								/>
							</>
						)}

					{/* ROTA INTRANSITÁVEL / A PÉ (TRACEJADO VERMELHO DE ALERTA) */}
					{dadosRota &&
						dadosRota.coordsBloqueado &&
						dadosRota.coordsBloqueado.length > 1 && (
							<Polyline
								positions={dadosRota.coordsBloqueado}
								pathOptions={{
									color: "#dc2626",
									weight: 5,
									opacity: 0.9,
									dashArray: "8, 12",
								}}
							/>
						)}

					{/* MARCADOR NO PONTO LIMITE DO CARRO (ONDE COMEÇA A ÁGUA) */}
					{dadosRota && dadosRota.pontoParada && (
						<Marker
							position={dadosRota.pontoParada}
							icon={L.divIcon({
								className: "custom-stop-marker",
								html: `
              <div style="background-color: #dc2626; color: white; border-radius: 9999px; width: 32px; height: 32px; display: flex; align-items: center; justify-content: center; font-size: 16px; box-shadow: 0 4px 6px -1px rgba(0,0,0,0.4); border: 2px solid white; cursor: pointer;">
                🛑
              </div>
            `,
								iconSize: [32, 32],
								iconAnchor: [16, 16],
							})}>
							<Popup>
								<div style={{ textAlign: "center", minWidth: "180px" }}>
									<div
										style={{
											fontWeight: "bold",
											color: "#dc2626",
											fontSize: "13px",
										}}>
										🛑 LIMITE DE ACESSO DE CARRO
									</div>
									<p
										style={{
											margin: "6px 0 0",
											fontSize: "12px",
											color: "#4b5563",
										}}>
										A partir deste ponto a via encontra-se{" "}
										<strong>submersa ou intransponível</strong>.
									</p>
								</div>
							</Popup>
						</Marker>
					)}

					{/* Marcador da Localização GPS Atual do Usuário */}
					{localizacaoGPS && (
						<Marker position={localizacaoGPS} icon={iconeUsuarioGPS}>
							<Popup>
								<div className="text-xs p-1 font-sans">
									<h4 className="font-bold text-blue-700 text-sm flex items-center gap-1">
										📍 Você está aqui
									</h4>
									<p className="text-gray-500 text-[11px] mt-0.5">
										Posição obtida pelo GPS do seu dispositivo.
									</p>
									<button
										onClick={() => {
											setPontoOrigem(localizacaoGPS);
											setTextoOrigem("Minha Posição Atual (GPS)");
											setPainelRotaAberto(true);
										}}
										className="mt-2 w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-1 px-2 rounded text-[11px] transition shadow-xs cursor-pointer">
										Traçar Rota a Partir Daqui
									</button>
								</div>
							</Popup>
						</Marker>
					)}

					{usuario?.residencia?.coords && (
						<Marker
							position={usuario.residencia.coords}
							icon={iconeCasa}
							draggable={true}
							eventHandlers={{
								dragend: (e) => {
									const pos = e.target.getLatLng();
									const novasCoords = [
										parseFloat(pos.lat.toFixed(6)),
										parseFloat(pos.lng.toFixed(6)),
									];
									setCasaCoords(novasCoords);
									if (typeof setUsuario === "function" && usuario) {
										setUsuario((prev) => ({
											...prev,
											residencia: { ...prev.residencia, coords: novasCoords },
										}));
									}
								},
							}}>
							<Popup>
								<div className="text-xs p-1 font-sans min-w-[200px]">
									<h4 className="font-bold text-gray-900 text-sm">
										🏠 {usuario.residencia.endereco || "Minha Residência"}
									</h4>
									{usuario.residencia.bairro && (
										<p className="text-gray-500">{usuario.residencia.bairro}</p>
									)}
									<div className="mt-1.5 pt-1.5 border-t border-gray-100 flex flex-col gap-0.5">
										<p className="text-gray-700">
											Altitude do Solo:{" "}
											<strong className="text-blue-700">
												{usuario.residencia.cota}m
											</strong>
										</p>
										<p className="text-gray-700">
											Situação Atual:{" "}
											<strong
												className={
													margemCasa > 1
														? "text-emerald-600"
														: margemCasa > 0
															? "text-amber-600"
															: "text-red-600"
												}>
												{margemCasa > 0
													? `🟢 +${margemCasa}m de margem livre`
													: `🔴 Submerso por ${Math.abs(margemCasa)}m`}
											</strong>
										</p>
									</div>
								</div>
							</Popup>
						</Marker>
					)}

					{/* TODOS OS DEMAIS PONTOS DE INTERESSE SALVOS DO USUÁRIO */}
					{usuario?.pontosInteresse?.map((pt) => {
						if (!pt.coords || !Array.isArray(pt.coords)) return null;
						// Calcula a cota precisa com base na localização exata das coordenadas do pino no terreno
						const cotaPrecisaGPS = estimarCotaTerreno(pt.coords[0], pt.coords[1], pt.endereco || pt.nome, listaRuas);
						const cotaPt = Number(cotaPrecisaGPS || pt.cota || 19.5);
						const margemPt = Number((cotaPt - nivelAtivo).toFixed(1));

						return (
							<Marker
								key={`pt-interesse-${pt.id}`}
								position={pt.coords}
								icon={iconePontoInteresse}>
								<Popup>
									<div className="text-xs p-1 font-sans min-w-[200px]">
										<div className="flex items-center gap-1.5 mb-0.5">
											<span className="text-base">📍</span>
											<h4 className="font-bold text-gray-900 text-sm truncate">
												{pt.nome}
											</h4>
										</div>
										<p className="text-gray-500 text-[11px] mb-1.5">
											{pt.endereco}
										</p>
										<div className="pt-1.5 border-t border-gray-100 flex flex-col gap-0.5">
											<p className="text-gray-700">
												Altitude:{" "}
												<strong className="text-blue-700">
													{cotaPt.toFixed(1)}m
												</strong>
											</p>
											<p className="text-gray-700">
												Situação:{" "}
												<strong
													className={
														margemPt > 1
															? "text-emerald-600"
															: margemPt > 0
																? "text-amber-600"
																: "text-red-600"
													}>
													{margemPt > 0
														? `🟢 +${margemPt}m de margem livre`
														: `🔴 Submerso por ${Math.abs(margemPt)}m`}
												</strong>
											</p>
										</div>
									</div>
								</Popup>
							</Marker>
						);
					})}
					{pontoOrigem && <Marker position={pontoOrigem} icon={iconeOrigem} />}
					{pontoDestino && (
						<Marker position={pontoDestino} icon={iconeDestino} />
					)}

					{barricadas.map((b, bIdx) => (
						<Marker key={`b-${bIdx}`} position={b.pos} icon={iconeBloqueio} />
					))}
				</MapContainer>
			</div>
		</div>
	);
};

export default MapaInterativo;
