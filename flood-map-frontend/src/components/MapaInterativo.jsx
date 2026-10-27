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

// Ícones Customizados
const iconeBloqueio = new L.DivIcon({
	html: '<div style="background-color: #dc2626; color: white; border-radius: 50%; width: 22px; height: 22px; display: flex; align-items: center; justify-content: center; font-size: 11px; font-weight: bold; border: 2px solid white; box-shadow: 0 2px 4px rgba(0,0,0,0.35);">⛔</div>',
	className: "custom-barrier-icon",
	iconSize: [22, 22],
	iconAnchor: [11, 11],
});

const iconeCasa = new L.DivIcon({
	html: '<div style="background-color: #eab308; color: #1e293b; border-radius: 50%; width: 38px; height: 38px; display: flex; align-items: center; justify-content: center; font-size: 20px; border: 3px solid white; box-shadow: 0 4px 14px rgba(0,0,0,0.45); cursor: grab;">🏠</div>',
	className: "custom-house-icon",
	iconSize: [38, 38],
	iconAnchor: [19, 19],
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

// BASE OFICIAL VERIFICADA DE MARCOS E ESTABELECIMENTOS DE LAJEADO/RS
const LOCAIS_OFICIAIS_LAJEADO = [
	{
		nome: "Colégio Madre Bárbara",
		tipo: "escola",
		detalhe: "Rua Júlio May, 340 - Centro",
		coords: [-29.46725, -51.96443],
	},
	{
		nome: "Hospital Bruno Born (HBB)",
		tipo: "hospital",
		detalhe: "Av. Benjamin Constant, 881 - Centro",
		coords: [-29.46085, -51.96245],
	},
	{
		nome: "Universidade Univates",
		tipo: "faculdade",
		detalhe: "Av. Avelino Talini, 100 - Universitário",
		coords: [-29.4442, -51.9568],
	},
	{
		nome: "Colégio Evangélico Alberto Torres (CEAT)",
		tipo: "escola",
		detalhe: "Rua Alberto Torres, 260 - Centro",
		coords: [-29.4601, -51.9608],
	},
	{
		nome: "Prefeitura Municipal de Lajeado",
		tipo: "estabelecimento",
		detalhe: "Rua Cel. Júlio May, 242 - Centro",
		coords: [-29.4655, -51.961],
	},
	{
		nome: "Delegacia de Polícia de Lajeado",
		tipo: "estabelecimento",
		detalhe: "Rua Cel. João Batista de Mello, 509 - Centro",
		coords: [-29.465, -51.9665],
	},
	{
		nome: "Parque Professor Theobaldo Dick (Parque do Dick)",
		tipo: "estabelecimento",
		detalhe: "Rua Santos Filho - Centro",
		coords: [-29.4665, -51.968],
	},
	{
		nome: "Shopping Lajeado",
		tipo: "estabelecimento",
		detalhe: "Rodovia BR-386, Km 346 - São Cristóvão",
		coords: [-29.445, -51.975],
	},
	{
		nome: "Supermercado Imec (Centro)",
		tipo: "estabelecimento",
		detalhe: "Rua Júlio de Castilhos, 1157 - Centro",
		coords: [-29.462, -51.963],
	},
	{
		nome: "Supermercado Imec (São Cristóvão)",
		tipo: "estabelecimento",
		detalhe: "Av. Senador Alberto Pasqualini, 1760",
		coords: [-29.448, -51.952],
	},
	{
		nome: "Colégio Gustavo Adolfo",
		tipo: "escola",
		detalhe: "Rua Doutor Albert Schweitzer, 270 - Florestal",
		coords: [-29.456, -51.971],
	},
];

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
	cotaReal,
	ruas,
	isSimulando,
	setIsSimulando,
	painelRotaAberto,
	setPainelRotaAberto,
}) => {
	const config = {
		centro: [-29.4669, -51.9611],
		zoom: 15,
		bounds: [
			[-29.495, -51.995],
			[-29.41, -51.87],
		],
	};

	const [usuario, setUsuario] = useState(() => {
		const salvo = localStorage.getItem("usuario_sentinela");
		return salvo ? JSON.parse(salvo) : null;
	});

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
	const [modalCasaAberto, setModalCasaAberto] = useState(false);
	const [modalPerfilAberto, setModalPerfilAberto] = useState(false);
	const [modalRotasSalvasAberto, setModalRotasSalvasAberto] = useState(false);
	const [abaAuth, setAbaAuth] = useState("entrar");
	const [minhasRotas, setMinhasRotas] = useState([]);

	const [emailInput, setEmailInput] = useState("");
	const [senhaInput, setSenhaInput] = useState("");
	const [nomeInput, setNomeInput] = useState("");

	const contasGoogleDisponiveis = [
		{
			nome: "Rodolfo Bosse de Jesus",
			email: "engenharia6@medicalsan.com.br",
			iniciais: "R",
			cor: "bg-orange-600",
		},
		{
			nome: "RODOLFO BOSSE DE JESUS",
			email: "rodolfo.jesus@universo.univates.br",
			iniciais: "R",
			cor: "bg-blue-600",
		},
		{
			nome: "Rodolfo Bosse",
			email: "rodolfobosse@gmail.com",
			iniciais: "R",
			cor: "bg-green-600",
		},
	];

	const [casaEndereco, setCasaEndereco] = useState("");
	const [casaNumero, setCasaNumero] = useState("");
	const [casaBairro, setCasaBairro] = useState("");
	const [casaWhatsapp, setCasaWhatsapp] = useState("");
	const [casaCoords, setCasaCoords] = useState(null);
	const [salvandoCasa, setSalvandoCasa] = useState(false);

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
				"🔔 SENTINELA ATIVADO COM SUCESSO!",
				"Você receberá alertas automáticos na tela do seu celular se o Rio Taquari subir em direção à sua casa.",
			);
		} else {
			alert("Permissão de notificações não autorizada no navegador.");
		}
	};

	const dispararNotificacaoLocal = (titulo, mensagem) => {
		if ("serviceWorker" in navigator && navigator.serviceWorker.controller) {
			navigator.serviceWorker.ready.then((reg) => {
				reg.showNotification(titulo, {
					body: mensagem,
					icon: "/favicon.ico",
					vibrate: [300, 100, 300, 100, 300],
					tag: "alerta-floodway",
				});
			});
		} else if (
			"Notification" in window &&
			Notification.permission === "granted"
		) {
			new Notification(titulo, { body: mensagem, icon: "/favicon.ico" });
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

	const nivelAtivo = isSimulando
		? cotaSimulada
		: cotaAtual?.nivel || cotaReal || 13.39;

	const limparRotaAtual = () => {
		setDadosRota(null);
		setPontoOrigem(null);
		setPontoDestino(null);
		setNomeOrigem("");
		setNomeDestino("");
	};
	const [textoOrigem, setTextoOrigem] = useState("");
	const [textoDestino, setTextoDestino] = useState("");
	const [pontoOrigem, setPontoOrigem] = useState(null);
	const [pontoDestino, setPontoDestino] = useState(null);
	const [modoSelecao, setModoSelecao] = useState(null);
	const [sugestoesOrigem, setSugestoesOrigem] = useState([]);
	const [sugestoesDestino, setSugestoesDestino] = useState([]);
	const [sugestoesCasa, setSugestoesCasa] = useState([]);
	const [calculandoRota, setCalculandoRota] = useState(false);
	const [dadosRota, setDadosRota] = useState(null);

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

		const tNorm = termo
			.toLowerCase()
			.normalize("NFD")
			.replace(/[̀-ͯ]/g, "")
			.trim();

		const termoLimpo = tNorm
			.replace(/[,\.\-\/#??]/g, " ")
			.replace(/\s+/g, " ")
			.trim();
		const tokens = termoLimpo
			.split(" ")
			.filter((t) => t.length >= 2 && !/^\d+$/.test(t));

		const resultados = [];

		// 1. Busca nos Locais Oficiais de Lajeado (Madre B?rbara, Univates, etc.)
		for (const loc of LOCAIS_OFICIAIS_LAJEADO) {
			const nNorm = (loc.nome || "")
				.toLowerCase()
				.normalize("NFD")
				.replace(/[̀-ͯ]/g, "");
			const dNorm = (loc.detalhe || "")
				.toLowerCase()
				.normalize("NFD")
				.replace(/[̀-ͯ]/g, "");

			const matchDireto =
				nNorm.includes(tNorm) ||
				tNorm.includes(nNorm) ||
				dNorm.includes(tNorm) ||
				tNorm.includes(dNorm);
			const matchTokens =
				tokens.length > 0 &&
				tokens.every((tok) => nNorm.includes(tok) || dNorm.includes(tok));

			if (matchDireto || matchTokens) {
				resultados.push({
					nome: loc.nome,
					tipo: loc.tipo || "local",
					detalhe: loc.detalhe || "",
					coords: loc.coords,
					cota: loc.cota || null,
				});
			}
		}

		// 2. Busca na Lista de Ruas de Lajeado (com suporte a n?mero e pontua??o)
		for (const rua of listaRuas) {
			const rNorm = (rua.nome || "")
				.toLowerCase()
				.normalize("NFD")
				.replace(/[̀-ͯ]/g, "");
			const bNorm = (rua.bairro || "")
				.toLowerCase()
				.normalize("NFD")
				.replace(/[̀-ͯ]/g, "");

			const matchDireto = rNorm.includes(tNorm) || tNorm.includes(rNorm);
			const matchTokens =
				tokens.length > 0 &&
				tokens.every((tok) => rNorm.includes(tok) || bNorm.includes(tok));

			if (matchDireto || matchTokens) {
				const coordsRua = rua.coords ||
					(rua.pontos && rua.pontos[0]) || [-29.4668, -51.9614];
				resultados.push({
					nome: rua.nome,
					tipo: "rua",
					detalhe: rua.bairro ? `Bairro ${rua.bairro}` : "Lajeado",
					coords: coordsRua,
					cota: rua.cota || null,
				});
			}
		}

		setSugestoes(resultados.slice(0, 7));

		// 3. Fallback online para qualquer endere?o ou n?mero de Lajeado
		if (resultados.length < 3) {
			try {
				const url = `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(termoLimpo + ", Lajeado, RS, Brasil")}&limit=3&viewbox=-52.05,-29.40,-51.90,-29.52`;
				const resp = await fetch(url, {
					headers: { "Accept-Language": "pt-BR" },
				});
				if (resp.ok) {
					const dados = await resp.json();
					const adicionais = dados.map((d) => ({
						nome: d.display_name.split(",")[0],
						tipo: "endereco",
						detalhe: d.display_name,
						coords: [parseFloat(d.lat), parseFloat(d.lon)],
						cota: null,
					}));
					setSugestoes((prev) => [...prev, ...adicionais].slice(0, 7));
				}
			} catch (_) {}
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

	const handleSalvarCasa = async (e) => {
		e.preventDefault();
		setSalvandoCasa(true);

		let coordsFinais = casaCoords;
		const enderecoCompleto = `${casaEndereco}${casaNumero ? ", " + casaNumero : ""}`;

		if (!coordsFinais && casaEndereco) {
			// Localiza??o autom?tica caso o usu?rio tenha digitado sem clicar na sugest?o
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
				}),
			});

			const data = await resp.json();
			const cotaCalculada = data?.perfil?.cota_terreno || 29.2;

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
			localStorage.setItem(
				"usuario_sentinela",
				JSON.stringify(usuarioAtualizado),
			);
			setModalCasaAberto(false);
		} catch (err) {
			const usuarioAtualizado = {
				...usuario,
				residencia: {
					endereco: enderecoCompleto,
					bairro: casaBairro,
					whatsapp: casaWhatsapp,
					coords: coordsFinais,
					cota: 29.2,
				},
			};
			setUsuario(usuarioAtualizado);
			localStorage.setItem(
				"usuario_sentinela",
				JSON.stringify(usuarioAtualizado),
			);
			setModalCasaAberto(false);
		} finally {
			setSalvandoCasa(false);
		}
	};

	const handleArrastarCasa = async (e) => {
		const novaPos = e.target.getLatLng();
		const novasCoords = [novaPos.lat, novaPos.lng];

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
				}),
			});

			const data = await resp.json();
			const cotaNova =
				data?.perfil?.cota_terreno || usuario.residencia?.cota || 29.2;

			const usuarioAtualizado = {
				...usuario,
				residencia: {
					...usuario.residencia,
					coords: novasCoords,
					cota: cotaNova,
				},
			};

			setUsuario(usuarioAtualizado);
			localStorage.setItem(
				"usuario_sentinela",
				JSON.stringify(usuarioAtualizado),
			);
		} catch (err) {}
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
				alert("✅ Rota salva com sucesso no seu Sentinela!");
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

	const { trechosPistas, barricadas, pontosBloqueadosGeo } =
		React.useMemo(() => {
			let totalTrechos = 0;
			let trechosAlagados = 0;
			let trechosRiscoIminente = 0;
			let trechosCalibradosAsfalto = 0;
			const tPistas = [];
			const bRicadas = [];
			const pBloqueados = [];

			for (const rua of listaRuas) {
				if (!rua.coordenadas_json) continue;
				let listaSegmentos = [];
				let rawCoords = rua.coordenadas_json;
				if (typeof rawCoords === "string") {
					try {
						rawCoords = JSON.parse(rawCoords);
					} catch (e) {
						continue;
					}
				}
				if (!Array.isArray(rawCoords)) continue;
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
					if (!t.coords || !Array.isArray(t.coords) || t.coords.length < 2)
						return;
					totalTrechos++;
					const cotaTrecho = Number(t.cota || rua.cota_bloqueio || 99.0);
					const margemAgua = cotaTrecho - nivelAtivo;
					const isBloqueado = margemAgua <= 0;
					const isRiscoIminente = !isBloqueado && margemAgua <= 1.0;
					const isCalibrado = Boolean(t.calibrado_asfalto);
					if (isCalibrado) trechosCalibradosAsfalto++;
					if (isBloqueado) trechosAlagados++;
					else if (isRiscoIminente) trechosRiscoIminente++;
					if (isBloqueado) {
						const lamina = Math.max(nivelAtivo - cotaTrecho, 0.1);
						for (const pt of t.coords) {
							pBloqueados.push(pt);
						}
						if (sIdx === 0 && bRicadas.length < 35) {
							bRicadas.push({
								pos: t.coords[0],
								rua: rua.nome,
								cota: cotaTrecho,
								lamina: lamina.toFixed(1),
							});
						}
					}
					tPistas.push({
						id: `pista-${rua.id}-${sIdx}`,
						coords: t.coords,
						isBloqueado,
						isRiscoIminente,
						isCalibrado,
						cota: cotaTrecho,
						margem: margemAgua.toFixed(2),
						nome: rua.nome,
						lamina: isBloqueado ? (nivelAtivo - cotaTrecho).toFixed(1) : "0",
					});
				});
			}
			return {
				trechosPistas: tPistas,
				barricadas: bRicadas,
				pontosBloqueadosGeo: pBloqueados,
			};
		}, [listaRuas, nivelAtivo]);

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

			// 3. SE MESMO ASSIM TODAS CRUZAREM ÁGUA (ILHADO REAL), SELECIONA A QUE CHEGA MAIS PERTO DO DESTINO
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

			// 4. DIVISÃO: TRECHO DE CARRO + TRECHO A PÉ / BLOQUEIO
			let indiceBloqueio = -1;
			if (!rota100Segura) {
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
			}

			let coordsCarro = rotaCoords;
			let coordsBloqueado = [];
			let pontoParada = null;

			if (!rota100Segura && indiceBloqueio > 0) {
				coordsCarro = rotaCoords.slice(0, indiceBloqueio + 1);
				coordsBloqueado = rotaCoords.slice(indiceBloqueio);
				pontoParada = rotaCoords[indiceBloqueio];
			} else if (!rota100Segura && indiceBloqueio === 0) {
				coordsCarro = [];
				coordsBloqueado = rotaCoords;
				pontoParada = rotaCoords[0];
			}

			setDadosRota({
				coords: rotaCoords,
				coordsCarro: coordsCarro,
				coordsBloqueado: coordsBloqueado,
				pontoParada: pontoParada,
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
		const dLat = pontoDestino[0].toFixed(5);
		const dLon = pontoDestino[1].toFixed(5);

		let paradasIntermediarias = [];
		if (dadosRota?.coords?.length >= 6) {
			const total = dadosRota.coords.length;
			const p1 = dadosRota.coords[Math.floor(total * 0.35)];
			const p2 = dadosRota.coords[Math.floor(total * 0.7)];
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
		const url = `https://waze.com/ul?ll=${pontoDestino[0]},${pontoDestino[1]}&navigate=yes`;
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

			{/* MODAL AUTH */}
			{modalAuthAberto && (
				<div
					style={{ zIndex: 3000 }}
					className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-end sm:items-center justify-center p-0 sm:p-4">
					<div className="bg-white w-full sm:max-w-md rounded-t-3xl sm:rounded-2xl p-6 shadow-2xl transition-all">
						<div className="flex justify-between items-center pb-3 border-b border-gray-100">
							<div className="flex items-center gap-2">
								<span className="text-2xl">🌊</span>
								<div>
									<h3 className="font-bold text-gray-900 text-base leading-tight">
										Sentinela Lajeado
									</h3>
									<p className="text-[11px] text-gray-500">
										Monitore sua casa e rotas de fuga
									</p>
								</div>
							</div>
							<button
								onClick={() => setModalAuthAberto(false)}
								className="text-gray-400 hover:text-gray-600 text-lg font-bold p-1">
								✕
							</button>
						</div>

						<p className="text-xs text-gray-600 mt-3 mb-4 leading-relaxed">
							Acesse sua conta para salvar a localização exata da sua casa,
							calcular rotas seguras e receber avisos de inundação em tempo
							real.
						</p>

						<button
							onClick={() => {
								setModalAuthAberto(false);
								setModalGoogleChooserAberto(true);
							}}
							className="w-full bg-white border border-gray-300 hover:bg-gray-50 text-gray-800 font-bold py-3 px-4 rounded-2xl text-xs flex items-center justify-center gap-3 shadow-sm transition active:scale-95 mb-4">
							<svg className="w-4 h-4" viewBox="0 0 24 24">
								<path
									fill="#4285F4"
									d="M23.745 12.27c0-.7-.06-1.4-.19-2.07H12v4.51h6.6c-.29 1.52-1.14 2.8-2.4 3.66v3.04h3.88c2.27-2.09 3.66-5.17 3.66-9.14z"
								/>
								<path
									fill="#34A853"
									d="M12 24c3.24 0 5.95-1.08 7.93-2.91l-3.88-3.04c-1.08.72-2.45 1.16-4.05 1.16-3.12 0-5.77-2.1-6.72-4.93H1.25v3.13C3.27 21.36 7.36 24 12 24z"
								/>
								<path
									fill="#FBBC05"
									d="M5.28 14.28c-.25-.72-.38-1.49-.38-2.28s.13-1.56.38-2.28V6.59H1.25C.45 8.18 0 9.98 0 12s.45 3.82 1.25 5.41l4.03-3.13z"
								/>
								<path
									fill="#EA4335"
									d="M12 4.75c1.77 0 3.35.61 4.6 1.8l3.42-3.42C17.95 1.19 15.24 0 12 0 7.36 0 3.27 2.64 1.25 6.59l4.03 3.13c.95-2.83 3.6-4.97 6.72-4.97z"
								/>
							</svg>
							<span>Continuar com o Google (Escolher Conta)</span>
						</button>

						<div className="relative my-3 text-center">
							<div className="absolute inset-0 flex items-center">
								<div className="w-full border-t border-gray-200"></div>
							</div>
							<span className="relative bg-white px-3 text-[11px] text-gray-400 font-semibold uppercase">
								ou acesse com seu e-mail
							</span>
						</div>

						<div className="flex bg-gray-100 p-1 rounded-xl mb-3">
							<button
								onClick={() => setAbaAuth("entrar")}
								className={`flex-1 py-1.5 text-xs font-bold rounded-lg transition ${abaAuth === "entrar" ? "bg-white shadow-sm text-gray-900" : "text-gray-500"}`}>
								Entrar
							</button>
							<button
								onClick={() => setAbaAuth("cadastrar")}
								className={`flex-1 py-1.5 text-xs font-bold rounded-lg transition ${abaAuth === "cadastrar" ? "bg-white shadow-sm text-gray-900" : "text-gray-500"}`}>
								Criar Conta
							</button>
						</div>

						<form onSubmit={handleLoginEmail} className="space-y-2.5">
							{abaAuth === "cadastrar" && (
								<input
									type="text"
									placeholder="Seu Nome Completo"
									value={nomeInput}
									onChange={(e) => setNomeInput(e.target.value)}
									className="w-full text-xs p-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500"
									required
								/>
							)}
							<input
								type="email"
								placeholder="seu.email@exemplo.com"
								value={emailInput}
								onChange={(e) => setEmailInput(e.target.value)}
								className="w-full text-xs p-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500"
								required
							/>
							<input
								type="password"
								placeholder="Sua senha secreta"
								value={senhaInput}
								onChange={(e) => setSenhaInput(e.target.value)}
								className="w-full text-xs p-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500"
								required
							/>
							<button
								type="submit"
								className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 rounded-2xl text-xs shadow-md transition active:scale-95">
								{abaAuth === "entrar"
									? "Acessar Conta"
									: "Criar Conta Gratuita"}
							</button>
						</form>
					</div>
				</div>
			)}

			{/* MODAL GOOGLE CHOOSER */}
			{modalGoogleChooserAberto && (
				<div
					style={{ zIndex: 4000 }}
					className="fixed inset-0 bg-black/75 backdrop-blur-md flex items-center justify-center p-4">
					<div className="bg-[#1f1f1f] text-white w-full max-w-md rounded-3xl p-6 sm:p-8 shadow-2xl border border-gray-800">
						<h2 className="text-2xl font-bold text-gray-100 mb-1">
							Escolha uma conta
						</h2>
						<p className="text-xs text-gray-400 mb-6">
							Prosseguir para{" "}
							<strong className="text-blue-400">Sentinela Lajeado</strong>
						</p>

						<div className="divide-y divide-gray-800 border-t border-b border-gray-800">
							{contasGoogleDisponiveis.map((c, idx) => (
								<div
									key={idx}
									onClick={() => selecionarContaGoogle(c)}
									className="flex items-center gap-3.5 py-3 px-2 hover:bg-gray-800/80 rounded-xl cursor-pointer transition">
									<div
										className={`w-10 h-10 rounded-full ${c.cor} text-white flex items-center justify-center font-bold text-base shadow-inner`}>
										{c.iniciais}
									</div>
									<div className="flex-1 min-w-0">
										<p className="text-sm font-semibold text-gray-100 truncate">
											{c.nome}
										</p>
										<p className="text-xs text-gray-400 truncate">{c.email}</p>
									</div>
								</div>
							))}
						</div>

						<div className="mt-6 text-right">
							<button
								onClick={() => setModalGoogleChooserAberto(false)}
								className="text-xs text-gray-400 hover:text-white">
								Cancelar
							</button>
						</div>
					</div>
				</div>
			)}

			{/* PASSO 2: CONFIGURAR CASA COM TESTE DE ALERTA PUSH */}
			{modalCasaAberto && (
				<div
					style={{ zIndex: 3000 }}
					className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-end sm:items-center justify-center p-0 sm:p-4">
					<div className="bg-white w-full sm:max-w-md rounded-t-3xl sm:rounded-2xl p-6 shadow-2xl transition-all">
						<div className="flex justify-between items-center pb-3 border-b">
							<div className="flex items-center gap-2">
								<span className="text-2xl">🏠</span>
								<div>
									<h3 className="font-black text-gray-900 text-base leading-tight">
										Configurar Minha Casa
									</h3>
									<p className="text-[11px] text-gray-500">{usuario?.email}</p>
								</div>
							</div>
							<button
								onClick={() => setModalCasaAberto(false)}
								className="text-gray-400 hover:text-gray-600 font-bold">
								✕
							</button>
						</div>

						{/* BOTÃO TESTAR NOTIFICAÇÃO NO CELULAR */}
						{usuario?.residencia && (
							<div className="my-3 p-3 bg-indigo-50 border border-indigo-200 rounded-xl flex items-center justify-between gap-2">
								<div>
									<p className="font-bold text-indigo-950 text-xs">
										🔔 Notificações Ativas
									</p>
									<p className="text-[10px] text-indigo-700">
										Simule agora o aviso no seu aparelho
									</p>
								</div>
								<button
									type="button"
									onClick={testarNotificacaoEmergencia}
									className="bg-indigo-600 hover:bg-indigo-700 text-white text-[11px] font-bold px-3 py-1.5 rounded-lg shadow transition active:scale-95 whitespace-nowrap">
									Testar Alerta
								</button>
							</div>
						)}

						<form onSubmit={handleSalvarCasa} className="space-y-3 mt-2">
							<div className="relative">
								<label className="text-[11px] font-semibold text-gray-700 mb-1 block">
									Rua ou Local
								</label>
								<div className="flex gap-1.5">
									<input
										type="text"
										placeholder="Ex: Bento Gonçalves, Alfonso Haas..."
										value={casaEndereco}
										onChange={(e) => {
											setCasaEndereco(e.target.value);
											buscarDestinos(e.target.value, setSugestoesCasa);
										}}
										className="flex-1 text-xs p-2.5 border border-gray-300 rounded-lg focus:outline-none"
										required
									/>
									<button
										type="button"
										onClick={() => {
											setModoSelecao("casa");
											setModalCasaAberto(false);
										}}
										className="bg-amber-100 border border-amber-300 text-amber-900 text-[11px] px-2.5 py-1.5 rounded-lg font-bold">
										🎯 No Mapa
									</button>
								</div>

								{sugestoesCasa.length > 0 && (
									<div className="absolute left-0 right-0 top-full mt-1 bg-white border border-gray-200 rounded-xl shadow-2xl z-50 overflow-hidden divide-y divide-gray-100 max-h-52 overflow-y-auto">
										{sugestoesCasa.map((s, idx) => (
											<div
												key={idx}
												onClick={() => {
													setCasaEndereco(s.nome);
													setCasaCoords(s.coords);
													setSugestoesCasa([]);
												}}
												className="text-xs p-2.5 hover:bg-amber-50 cursor-pointer flex items-center gap-2">
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

							<div className="flex gap-2">
								<div className="w-1/3">
									<label className="text-[11px] font-semibold text-gray-700 mb-1 block">
										Número
									</label>
									<input
										type="text"
										placeholder="Ex: 529"
										value={casaNumero}
										onChange={(e) => setCasaNumero(e.target.value)}
										className="w-full text-xs p-2.5 border border-gray-300 rounded-lg focus:outline-none font-bold"
									/>
								</div>
								<div className="flex-1">
									<label className="text-[11px] font-semibold text-gray-700 mb-1 block">
										Bairro
									</label>
									<input
										type="text"
										placeholder="Ex: Centro"
										value={casaBairro}
										onChange={(e) => setCasaBairro(e.target.value)}
										className="w-full text-xs p-2.5 border border-gray-300 rounded-lg focus:outline-none"
									/>
								</div>
							</div>

							<button
								type="submit"
								disabled={salvandoCasa}
								className="w-full bg-gradient-to-r from-amber-500 to-amber-600 text-white font-bold py-3 rounded-xl text-xs shadow-md transition">
								{salvandoCasa
									? "⏳ Salvando cota real..."
									: "🛡️ Salvar Localização Exata"}
							</button>
						</form>
					</div>
				</div>
			)}

			{/* PAINEL DE ROTA MOBILE / DESKTOP */}
			{painelRotaAberto && (
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
						{usuario?.residencia && (
							<div className="flex gap-2">
								<button
									onClick={() => {
										setPontoOrigem(usuario.residencia.coords);
										setTextoOrigem(
											`Minha Casa (${usuario.residencia.endereco})`,
										);
									}}
									className="flex-1 bg-amber-50 hover:bg-amber-100 border border-amber-200 text-amber-900 text-[11px] font-bold py-1.5 rounded-lg flex items-center justify-center gap-1">
									🏠 Sair de Casa
								</button>
								<button
									onClick={() => {
										setPontoDestino(usuario.residencia.coords);
										setTextoDestino(
											`Minha Casa (${usuario.residencia.endereco})`,
										);
									}}
									className="flex-1 bg-amber-50 hover:bg-amber-100 border border-amber-200 text-amber-900 text-[11px] font-bold py-1.5 rounded-lg flex items-center justify-center gap-1">
									🏁 Ir para Casa
								</button>
							</div>
						)}

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
							className="bg-white/95 hover:bg-red-50 text-gray-700 hover:text-red-600 font-bold px-3 py-1.5 rounded-lg shadow-md border border-gray-300 text-xs flex items-center gap-1.5 transition">
							? Desativar Rota
						</button>
					</div>
				)}

				<MapContainer
					center={config.centro}
					zoom={config.zoom}
					style={{ width: "100%", height: "100%" }}
					maxBounds={config.bounds}
					maxBoundsViscosity={0.8}>
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

					{/* Ruas */}
					{trechosPistas.map((p) => {
						let cor = "#16a34a";
						let peso = 3.5;
						let opacidade = 0.8;
						let tracejado = undefined;

						if (p.isBloqueado) {
							cor = "#dc2626";
							peso = 5.5;
							opacidade = 1.0;
							tracejado = "8,4";
						} else if (p.isRiscoIminente) {
							cor = "#ea580c";
							peso = 5.0;
							opacidade = 0.95;
						}

						return (
							<Polyline
								key={`${p.id}-${p.isBloqueado ? "alagada" : p.isRiscoIminente ? "risco" : p.isCalibrado ? "calibrada" : "livre"}`}
								positions={p.coords}
								color={cor}
								weight={peso}
								opacity={opacidade}
								dashArray={tracejado}>
								<Popup>
									<div className="text-xs p-1 font-sans min-w-[210px]">
										<div className="flex items-center justify-between gap-1 mb-1">
											<h4 className="font-bold text-gray-900 text-sm truncate">
												{p.nome}
											</h4>
											{p.isCalibrado && (
												<span className="bg-sky-100 text-sky-800 text-[9px] px-1.5 py-0.5 rounded font-black tracking-tight whitespace-nowrap">
													🎯 ASFALTO REAL
												</span>
											)}
										</div>

										<p className="text-gray-600">
											Altitude Asfalto:{" "}
											<strong className="text-blue-700">
												{p.cota.toFixed(1)}m
											</strong>
										</p>
										<p className="text-gray-600">
											Nível do Rio:{" "}
											<strong>{Number(nivelAtivo).toFixed(1)}m</strong>
										</p>
										<p className="text-gray-600">
											{p.isBloqueado
												? "Lâmina de Água:"
												: "Margem de Segurança:"}{" "}
											<strong>
												{p.isBloqueado ? `+${p.lamina}m` : `+${p.margem}m`}
											</strong>
										</p>

										<div
											className={`mt-2 p-1 rounded font-bold text-center ${
												p.isBloqueado
													? "bg-red-100 text-red-800"
													: p.isRiscoIminente
														? "bg-orange-100 text-orange-900 border border-orange-300"
														: p.isCalibrado
															? "bg-sky-100 text-sky-900 border border-sky-300"
															: "bg-green-100 text-green-800"
											}`}>
											{p.isBloqueado
												? `🌊 SUBMERSA (+${p.lamina}m)`
												: p.isRiscoIminente
													? `⚠️ RISCO IMINENTE (Folga de ${p.margem}m)`
													: p.isCalibrado
														? "🎯 ASFALTO LIVRE (CALIBRADO)"
														: "✅ TRÂNSITO LIVRE"}
										</div>
									</div>
								</Popup>
							</Polyline>
						);
					})}

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
										?? {usuario.residencia.endereco || "Minha Resid?ncia"}
									</h4>
									{usuario.residencia.bairro && (
										<p className="text-gray-500">{usuario.residencia.bairro}</p>
									)}
									<div className="mt-1.5 pt-1.5 border-t border-gray-100 flex flex-col gap-0.5">
										<p className="text-gray-700">
											Cota Terreno:{" "}
											<strong className="text-emerald-700">
												{usuario.residencia.cota}m
											</strong>
										</p>
										<p className="text-gray-700">
											Margem Atual:{" "}
											<strong
												className={
													margemCasa > 1
														? "text-emerald-600"
														: margemCasa > 0
															? "text-amber-600"
															: "text-red-600"
												}>
												{margemCasa > 0
													? `+${margemCasa}m livres`
													: `${Math.abs(margemCasa)}m submerso`}
											</strong>
										</p>
									</div>
								</div>
							</Popup>
						</Marker>
					)}
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
