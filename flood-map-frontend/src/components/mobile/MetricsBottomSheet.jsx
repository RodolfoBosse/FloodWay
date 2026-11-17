import React, { useState, useRef, useEffect } from "react";
import { CloudRain, MoreHorizontal, Trash2, Bookmark, Star, Check, Navigation, X, Plus, Minus, Bell, BellRing } from "lucide-react";
import BannerPatrocinador from "./BannerPatrocinador";
import GoogleAdBlock from "./GoogleAdBlock";
import { buscarDestinosCalibrados } from "../../services/locaisLajeado";
import { API_BASE } from "../../services/config";
import { dispararAlertaLocal, solicitarPermissaoNotificacao } from "../../services/notificationService";

const MetricsBottomSheet = ({
	cotaReal = 13.84,
	cotaInundacao = 19.0,
	cotaAlerta = 23.0,
	suaCota = 26.0,
	dadosRota = null,
	temperatura = "13°",
	cotaAtual = null,
	velocidade_cm_h = null,
	velocidade_formatada = null,
	onAbrirRotas,
	onAbrirClima,
	onAbrirAuth,
	// Novas Props do App.jsx
	cotaSimulada,
	setCotaSimulada,
	isSimulando,
	setIsSimulando,
	textoOrigem,
	setTextoOrigem,
	textoDestino,
	setTextoDestino,
	pontoOrigem,
	setPontoOrigem,
	pontoDestino,
	setPontoDestino,
	setDadosRota,
	calculandoRota,
	setCalculandoRota,
	abaAtiva,
	onLimparRota,
	usuario = null,
	localizacaoGPS = null,
	onCapturarGPS = null,
	obtendoGPS = false,
}) => {
	// Alturas em pixels: min = 60px, mid = 295px (exibe cota, barra e tendência com folga), max = 85vh (calculado dinamicamente)
	const [currentHeight, setCurrentHeight] = useState(295);
	const [isDragging, setIsDragging] = useState(false);
	const [sugestoesOrigem, setSugestoesOrigem] = useState([]);
	const [sugestoesDestino, setSugestoesDestino] = useState([]);
	const [rotasSalvas, setRotasSalvas] = useState([]);
	const [salvandoRotaAtual, setSalvandoRotaAtual] = useState(false);
	const [rotaJaSalva, setRotaJaSalva] = useState(false);
	const [modalSalvarRotaAberto, setModalSalvarRotaAberto] = useState(false);
	const [nomeNovaRota, setNomeNovaRota] = useState("");
	const [rotaParaExcluir, setRotaParaExcluir] = useState(null);
	const startYRef = useRef(0);
	const startHeightRef = useRef(295);

	// Rastreamento para disparo automático de notificação push no celular quando a simulação atinge locais
	const ultimoAlertaSimulacaoRef = useRef({ chave: null, timestamp: 0 });

	useEffect(() => {
		if (abaAtiva !== "simular" || !cotaSimulada) return;

		// Identifica se a cota simulada atingiu a casa ou algum local monitorado
		const locaisParaVerificar = [];
		if (usuario?.residencia) {
			locaisParaVerificar.push({
				id: 'residencia',
				nome: 'Sua Residência',
				cota: Number(usuario.residencia.cota || 24.0),
			});
		}
		if (Array.isArray(usuario?.pontosInteresse)) {
			usuario.pontosInteresse.forEach((p) => {
				locaisParaVerificar.push({
					id: `ponto-${p.id}`,
					nome: p.nome,
					cota: Number(p.cota || 24.0),
				});
			});
		}

		if (locaisParaVerificar.length === 0) return;

		// Encontra o local mais crítico atingido ou em alerta iminente
		// Margem de alerta: faltam até 1.5 metros para a água entrar no local
		for (const loc of locaisParaVerificar) {
			const margem = Number((loc.cota - cotaSimulada).toFixed(1));
			const isSubmerso = margem <= 0;
			const isAlertaIminente = margem > 0 && margem <= 1.5;

			if (isSubmerso || isAlertaIminente) {
				const agora = Date.now();
				const chave = `${loc.id}-${isSubmerso ? 'submerso' : 'alerta'}`;

				// Se mudou de estado ou passaram mais de 5s, dispara notificação
				if (
					ultimoAlertaSimulacaoRef.current.chave !== chave ||
					agora - ultimoAlertaSimulacaoRef.current.timestamp > 5000
				) {
					ultimoAlertaSimulacaoRef.current = { chave, timestamp: agora };

					const titulo = isSubmerso
						? `🚨 ALERTA MÁXIMO: ${loc.nome} Atingido!`
						: `⚠️ ALERTA DE CHEIA: Rio se aproximando de ${loc.nome}!`;

					const corpo = isSubmerso
						? `A cota do Rio Taquari (${cotaSimulada.toFixed(1)}m) superou a altitude do imóvel (${loc.cota.toFixed(1)}m). Início de inundação!`
						: `Rio em ${cotaSimulada.toFixed(1)}m está a apenas ${margem}m de atingir a cota (${loc.cota.toFixed(1)}m). Prepare desocupação preventiva.`;

					dispararAlertaLocal(titulo, corpo, `simulacao-critica`);
				}
				break;
			}
		}
	}, [cotaSimulada, abaAtiva, usuario]);

	// Carrega rotas salvas do LocalStorage e Backend
	useEffect(() => {
		if (usuario?.email) {
			try {
				const salvasLocal = localStorage.getItem(`rotas_${usuario.email}`);
				if (salvasLocal) setRotasSalvas(JSON.parse(salvasLocal));
			} catch (_) {}

			fetch(`${API_BASE}/api/v1/rotas/listar/?email=${encodeURIComponent(usuario.email)}`)
				.then((r) => (r.ok ? r.json() : null))
				.then((d) => {
					if (d?.rotas && Array.isArray(d.rotas)) {
						setRotasSalvas(d.rotas);
						localStorage.setItem(`rotas_${usuario.email}`, JSON.stringify(d.rotas));
					}
				})
				.catch(() => {});
		}
	}, [usuario]);

	// Verifica se a rota atual em exibição já está nos favoritos
	useEffect(() => {
		if (!dadosRota || !textoOrigem || !textoDestino) {
			setRotaJaSalva(false);
			return;
		}
		const existe = rotasSalvas.some(
			(r) =>
				(r.origem_nome === textoOrigem && r.destino_nome === textoDestino) ||
				(r.origem_nome === textoDestino && r.destino_nome === textoOrigem)
		);
		setRotaJaSalva(existe);
	}, [dadosRota, textoOrigem, textoDestino, rotasSalvas]);

	const handleSalvarRotaFavorita = () => {
		if (!usuario || !pontoOrigem || !pontoDestino || !dadosRota) return;
		const nomeSugerido = `${textoOrigem.split(',')[0].trim()} ➔ ${textoDestino.split(',')[0].trim()}`;
		setNomeNovaRota(nomeSugerido);
		setModalSalvarRotaAberto(true);
	};

	const handleConfirmarSalvarRota = async (e) => {
		if (e) e.preventDefault();
		const apelido = (nomeNovaRota || "").trim();
		if (!apelido) return;

		setSalvandoRotaAtual(true);
		const novaRotaObj = {
			id: Date.now(),
			email: usuario.email,
			nome: apelido,
			origem_nome: textoOrigem,
			origem_coords: pontoOrigem,
			destino_nome: textoDestino,
			destino_coords: pontoDestino,
			distancia: dadosRota.distancia || "0",
			tempo: dadosRota.tempo || 5,
		};

		const atualizadas = [novaRotaObj, ...rotasSalvas.filter((r) => r.id !== novaRotaObj.id)];
		setRotasSalvas(atualizadas);
		localStorage.setItem(`rotas_${usuario.email}`, JSON.stringify(atualizadas));
		setRotaJaSalva(true);
		setModalSalvarRotaAberto(false);

		try {
			await fetch(`${API_BASE}/api/v1/rotas/salvar/`, {
				method: "POST",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify(novaRotaObj),
			});
		} catch (_) {}
		setSalvandoRotaAtual(false);
	};

	const handleCarregarRotaSalva = (r) => {
		setTextoOrigem(r.origem_nome);
		setPontoOrigem(r.origem_coords);
		setTextoDestino(r.destino_nome);
		setPontoDestino(r.destino_coords);
		setSugestoesOrigem([]);
		setSugestoesDestino([]);
		// Dispara o cálculo automático da rota
		setTimeout(() => {
			window.dispatchEvent(new CustomEvent("trigger-gerar-rota"));
		}, 100);
	};

	const handleConfirmarExcluirRota = async () => {
		if (!rotaParaExcluir) return;
		const filtradas = rotasSalvas.filter((r) => r.id !== rotaParaExcluir.id);
		setRotasSalvas(filtradas);
		if (usuario?.email) {
			localStorage.setItem(`rotas_${usuario.email}`, JSON.stringify(filtradas));
		}
		try {
			await fetch(`${API_BASE}/api/v1/rotas/excluir/`, {
				method: "POST",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify({ id: rotaParaExcluir.id, email: usuario.email }),
			});
		} catch (_) {}
		setRotaParaExcluir(null);
	};

	const handleBuscar = async (termo, setter) => {
		if (!termo || termo.trim().length < 2) {
			setter([]);
			return;
		}
		const res = await buscarDestinosCalibrados(termo);
		setter(res || []);
	};

	const isInundacao = cotaReal >= cotaInundacao;
	const temBloqueios = dadosRota?.bloqueada || isInundacao;
	const qtdBloqueios =
		dadosRota?.pontosBloqueio?.length || (isInundacao ? 22 : 0);

	const getMaxHeight = () => Math.round(window.innerHeight * 0.90);
	const getMidHeight = () => {
		if (abaAtiva === "rotas") return dadosRota ? 620 : 460;
		if (abaAtiva === "simular") return 320;
		return 335;
	};
	const getMinHeight = () => 60;

	// Ajusta a altura da barra suavemente ao trocar entre as abas ou gerar rota
	useEffect(() => {
		if (abaAtiva === "rotas") {
			setCurrentHeight(dadosRota ? 620 : 460);
		} else if (abaAtiva === "simular") {
			setCurrentHeight(320);
		} else {
			setCurrentHeight(335);
		}
	}, [abaAtiva, !!dadosRota]);

	const abrirGoogleMaps = () => {
		if (!pontoOrigem || !pontoDestino) return;
		const oLat = pontoOrigem[0].toFixed(5);
		const oLon = pontoOrigem[1].toFixed(5);
		const dLat = pontoDestino[0].toFixed(5);
		const dLon = pontoDestino[1].toFixed(5);

		let paradas = [];
		if (dadosRota?.coords?.length >= 6) {
			const total = dadosRota.coords.length;
			const p1 = dadosRota.coords[Math.floor(total * 0.35)];
			const p2 = dadosRota.coords[Math.floor(total * 0.70)];
			paradas = [
				`${p1[0].toFixed(5)},${p1[1].toFixed(5)}`,
				`${p2[0].toFixed(5)},${p2[1].toFixed(5)}`,
			];
		}

		let pathGoogle = `${oLat},${oLon}/`;
		for (const p of paradas) {
			pathGoogle += `${p}/`;
		}
		pathGoogle += `${dLat},${dLon}`;

		const url = `https://www.google.com/maps/dir/${pathGoogle}/@${oLat},${oLon},14z/data=!4m2!4m1!3e0`;
		window.open(url, "_blank");
	};

	const abrirWaze = () => {
		if (!pontoDestino) return;
		// Se houver parada intermediária no desvio seguro anti-enchente, orienta para o ponto chave do desvio antes do destino
		let alvoLat = pontoDestino[0];
		let alvoLon = pontoDestino[1];

		if (dadosRota?.coords?.length >= 6) {
			const total = dadosRota.coords.length;
			const pDesvio = dadosRota.coords[Math.floor(total * 0.5)];
			alvoLat = pDesvio[0];
			alvoLon = pDesvio[1];
		}

		const url = `https://waze.com/ul?ll=${alvoLat},${alvoLon}&navigate=yes`;
		window.open(url, "_blank");
	};

	// Início do arrasto com o dedo ou mouse
	const handleTouchStart = (e) => {
		const clientY = e.touches ? e.touches[0].clientY : e.clientY;
		startYRef.current = clientY;
		startHeightRef.current = currentHeight;
		setIsDragging(true);
	};

	// Movimento de arrasto em tempo real (acompanha o dedo)
	const handleTouchMove = (e) => {
		if (!isDragging) return;
		const clientY = e.touches ? e.touches[0].clientY : e.clientY;
		const deltaY = startYRef.current - clientY; // Arrastar para cima = delta positivo
		const newHeight = Math.min(
			Math.max(startHeightRef.current + deltaY, getMinHeight()),
			getMaxHeight(),
		);
		setCurrentHeight(newHeight);
	};

	// Fim do arrasto (Snap automático para o estado mais próximo)
	const handleTouchEnd = () => {
		if (!isDragging) return;
		setIsDragging(false);

		const minH = getMinHeight();
		const midH = getMidHeight();
		const maxH = getMaxHeight();

		// Calcula qual estado está mais próximo
		const distMin = Math.abs(currentHeight - minH);
		const distMid = Math.abs(currentHeight - midH);
		const distMax = Math.abs(currentHeight - maxH);

		if (distMax <= distMid && distMax <= distMin) {
			setCurrentHeight(maxH);
		} else if (distMin <= distMid) {
			setCurrentHeight(minH);
		} else {
			setCurrentHeight(midH);
		}
	};

	// Alterna com clique caso o usuário dê apenas um toque
	const toggleSnap = () => {
		const midH = getMidHeight();
		const maxH = getMaxHeight();
		const minH = getMinHeight();

		if (currentHeight >= maxH - 20) {
			setCurrentHeight(midH);
		} else if (currentHeight >= midH - 20) {
			setCurrentHeight(maxH);
		} else {
			setCurrentHeight(midH);
		}
	};

	const isExpanded = currentHeight > 380;
	const isMinimized = currentHeight < 100;

	return (
		<div className="pointer-events-none">
			{/* BANNER VERMELHO DE BLOQUEIOS (SE HOUVER) */}
			{temBloqueios && !isMinimized && (
				<div
					style={{
						zIndex: 1150,
						bottom: `${currentHeight + 46}px`,
						transition: isDragging
							? "none"
							: "bottom 0.25s cubic-bezier(0.16, 1, 0.3, 1)",
					}}
					onClick={onAbrirRotas}
					className="fixed left-0 right-0 pointer-events-auto bg-red-600 text-white px-5 py-2.5 rounded-t-3xl flex items-center justify-between text-xs font-semibold shadow-lg cursor-pointer">
					<span className="font-medium text-white tracking-wide">
						Sua rota está com bloqueios
					</span>
					<span className="w-5 h-5 rounded-full bg-white text-red-600 flex items-center justify-center text-[11px] font-bold shadow-sm">
						{qtdBloqueios}
					</span>
				</div>
			)}

			{/* GAVETA INFERIOR (BOTTOM SHEET COM DRAG CONTÍNUO) */}
			<div
				style={{
					zIndex: 1140,
					height: `${currentHeight}px`,
					transition: isDragging
						? "none"
						: "height 0.3s cubic-bezier(0.2, 0.8, 0.2, 1)",
				}}
				className="fixed bottom-14 left-0 right-0 bg-white/90 backdrop-blur-xl rounded-t-[32px] shadow-[0_-12px_40px_rgba(0,0,0,0.1)] border-t border-white/20 px-6 pt-2 pb-5 pointer-events-auto select-none overflow-hidden flex flex-col">
				{/* ÁREA DE ARRASTO (HANDLE) */}
				<div
					onTouchStart={handleTouchStart}
					onTouchMove={handleTouchMove}
					onTouchEnd={handleTouchEnd}
					onMouseDown={handleTouchStart}
					onMouseMove={handleTouchMove}
					onMouseUp={handleTouchEnd}
					onClick={toggleSnap}
					className="w-full py-3 flex justify-center cursor-grab active:cursor-grabbing touch-none">
					<div
						className={`w-12 h-1.5 rounded-full transition-all duration-300 ${isDragging ? "bg-blue-500 w-16" : "bg-gray-300 hover:bg-gray-400"}`}
					/>
				</div>

				{/* CABEÇALHO (Lajeado RS + Clima) */}
				<div
					onClick={toggleSnap}
					className="w-full flex items-center justify-between cursor-pointer mb-3 transition-opacity duration-300"
					style={{ opacity: isMinimized ? 0.5 : 1 }}>
					<div className="flex items-center gap-2">
						<h2 className="text-[26px] font-extrabold text-gray-900 tracking-tight">
							Lajeado RS
						</h2>
					</div>
					<div className="flex items-center gap-3">
						<button
							type="button"
							onClick={(e) => {
								e.stopPropagation();
								if (onAbrirClima) onAbrirClima();
							}}
							className="flex items-center gap-1.5 text-xs text-gray-700 font-medium bg-blue-50/80 hover:bg-blue-100/90 active:scale-95 border border-blue-200/80 px-3 py-1.5 rounded-full shadow-sm transition-all"
							title="Ver Previsão do Tempo Completa"
						>
							<CloudRain size={16} className="text-blue-600 animate-pulse" />
							<span className="text-sm font-bold text-blue-900">{temperatura}</span>
						</button>
						<button
							className="text-gray-400 hover:text-gray-600 p-1 bg-gray-100/50 rounded-full transition-colors"
							onClick={(e) => {
								e.stopPropagation();
								toggleSnap();
							}}>
							<MoreHorizontal size={18} />
						</button>
					</div>
				</div>

				{/* MÉTRICAS PRINCIPAIS (ESTILO NOVO LAYOUT) */}
				{!isMinimized && (
					<div className="flex-1 overflow-y-auto pr-1 flex flex-col gap-y-3.5 pt-0.5">
						{/* VISTA 1: MÉTRICAS (Aba Mapa) */}
						{abaAtiva === "mapa" && (
							<div className="flex flex-col gap-y-3.5 animate-in fade-in duration-300">
								<div className="flex justify-between items-baseline">
									<div>
										<span className="text-[11px] font-semibold tracking-wider uppercase text-slate-500 block mb-0.5">
											Nível do Rio Taquari
										</span>
										<p className="text-[34px] font-extrabold text-slate-900 leading-none tracking-tight tabular-nums">
											{cotaReal ? Number(cotaReal).toFixed(2) : "13.84"} <span className="text-xl font-bold text-slate-500">m</span>
										</p>
									</div>
									<div
										className={`px-3 py-1 rounded-xl text-xs font-semibold border ${
											cotaReal >= cotaInundacao 
												? "bg-rose-50 border-rose-200 text-rose-700" 
												: cotaReal >= 19.0
												? "bg-amber-50 border-amber-200 text-amber-700"
												: "bg-emerald-50 border-emerald-200 text-emerald-700"
										}`}
									>
										{cotaReal >= cotaInundacao ? "Cota de Inundação" : cotaReal >= 19.0 ? "Atenção" : "Nível Normal"}
									</div>
								</div>

								{/* RÉGUA COLORIDA DO NÍVEL DO RIO ATÉ 40M COM PONTOS DE INTERESSE */}
								{(() => {
									const minRuler = 10;
									const maxRuler = 40;
									const range = maxRuler - minRuler;
									const getPct = (cota) => Math.min(Math.max(((Number(cota) - minRuler) / range) * 100, 0), 100);

									// Coleta a casa e todos os pontos de interesse monitorados pelo usuário
									const pontosMarcadores = [];
									if (usuario?.residencia?.cota) {
										pontosMarcadores.push({
											id: 'casa',
											nome: 'Minha Casa',
											icone: '🏠',
											cota: Number(usuario.residencia.cota),
											cor: 'text-amber-600',
											bg: 'bg-amber-500',
										});
									}
									if (Array.isArray(usuario?.pontosInteresse)) {
										usuario.pontosInteresse.forEach((p) => {
											if (p.cota) {
												pontosMarcadores.push({
													id: `pt-${p.id}`,
													nome: p.nome,
													icone: '📍',
													cota: Number(p.cota),
													cor: 'text-blue-600',
													bg: 'bg-blue-600',
												});
											}
										});
									}

									return (
										<div className="relative w-full pt-4 pb-2">
											{/* PONTOS DE INTERESSE / CASA EM CIMA DA RÉGUA */}
											{pontosMarcadores.map((m) => {
												const pct = getPct(m.cota);
												return (
													<div
														key={m.id}
														className="absolute top-0 -translate-x-1/2 flex flex-col items-center pointer-events-auto z-10 transition-all duration-300 group cursor-pointer"
														style={{ left: `${pct}%` }}
														title={`${m.nome} (${m.cota.toFixed(1)}m)`}
													>
														<div className="flex items-center gap-0.5 bg-white/95 px-1.5 py-0.5 rounded-full shadow-sm border border-gray-200 text-[10px] font-bold text-gray-700 whitespace-nowrap scale-90 sm:scale-100 mb-0.5">
															<span>{m.icone}</span>
															<span className="hidden sm:inline truncate max-w-[65px]">{m.nome}</span>
															<span className="text-[9px] text-gray-500">({m.cota.toFixed(0)}m)</span>
														</div>
														{/* Tracinho vertical conectando à barra */}
														<div className={`w-0.5 h-1.5 ${m.bg} opacity-70`}></div>
													</div>
												);
											})}

											{/* BARRA COLORIDA (10m até 40m) */}
											<div className="relative w-full h-3 bg-gradient-to-r from-emerald-500 via-yellow-400 via-50% via-orange-500 to-red-600 rounded-full overflow-visible shadow-inner">
												{/* PIN DA COTA ATUAL DO RIO */}
												<div
													className="absolute top-1/2 -translate-y-1/2 w-4 h-4 bg-white border-2 border-gray-900 rounded-full shadow-lg transition-all duration-500 z-20"
													style={{
														left: `${getPct(cotaReal || 13)}%`,
														marginLeft: "-8px",
													}}
													title={`Nível do Rio: ${Number(cotaReal).toFixed(2)}m`}
												/>
											</div>

											{/* MARCAS DE REFERÊNCIA INFERIORES */}
											<div className="relative w-full text-[10px] font-bold text-gray-400 mt-1 flex justify-between">
												<span>10m</span>
												<span className="text-yellow-600/80">19m (Atenção)</span>
												<span className="text-orange-600/80">24m</span>
												<span className="text-red-600/80">29.8m (Maio/24)</span>
												<span>40m</span>
											</div>
										</div>
									);
								})()}

								{(() => {
									const velNum = velocidade_cm_h !== null && velocidade_cm_h !== undefined
										? Number(velocidade_cm_h)
										: (cotaAtual?.velocidade_cm_h !== undefined ? Number(cotaAtual.velocidade_cm_h) : 0);
									const velTxt = velocidade_formatada || cotaAtual?.velocidade_formatada || (
										velNum > 0
											? `▲ Subindo a ${velNum.toFixed(1).replace('.', ',')} cm/h`
											: velNum < 0
												? `▼ Descendo a ${Math.abs(velNum).toFixed(1).replace('.', ',')} cm/h`
												: "⏸ Estável"
									);
									const isSubindo = velNum > 0;
									const isDescendo = velNum < 0;
									const badgeColor = isSubindo
										? "bg-amber-100 text-amber-800 border border-amber-200"
										: isDescendo
											? "bg-blue-100 text-blue-800 border border-blue-200"
											: "bg-emerald-100 text-emerald-700 border border-emerald-200";

									return (
										<div className="grid grid-cols-2 gap-4 items-center pt-0.5">
											<div className="flex items-center gap-1.5 flex-wrap">
												<span className="text-xs text-gray-500 font-medium">
													Tendência:
												</span>
												<span className={`px-2.5 py-1 text-[11px] font-bold rounded-full shadow-sm ${badgeColor}`}>
													{velTxt}
												</span>
											</div>
											<div className="flex items-center justify-end gap-2">
												<span className="text-sm text-gray-500 font-medium">
													Ruas bloqueadas
												</span>
												<span
													className={`text-lg font-bold ${dadosRota?.bloqueada ? "text-red-600" : "text-gray-900"}`}>
													{dadosRota?.pontosBloqueio?.length || 0}
												</span>
											</div>
										</div>
									);
								})()}
							</div>
						)}

						{/* VISTA 2: SIMULAÇÃO (Aba Simular) */}
						{abaAtiva === "simular" && (
							<div className="flex flex-col gap-y-4 animate-in fade-in duration-300">
								<div className="flex justify-between items-center bg-slate-50 border border-slate-200/80 p-3 rounded-2xl">
									<div>
										<span className="text-[10px] font-semibold tracking-wider uppercase text-slate-500 block">
											Nível Forçado para Teste
										</span>
										<p className="text-xs text-slate-600 mt-0.5">
											Simula a mancha de cheia e recalcula rotas seguras
										</p>
									</div>
									<span className="text-base font-bold text-slate-900 bg-white px-3 py-1.5 rounded-xl border border-slate-200 shadow-sm tabular-nums">
										{Number(cotaSimulada).toFixed(2)} m
									</span>
								</div>

								<div className="flex items-center gap-2 px-1">
									<button
										type="button"
										onClick={() => {
											setCotaSimulada((prev) => {
												const novo = Math.max(13.0, Math.round((prev - 0.2) * 10) / 10);
												return novo;
											});
										}}
										className="w-8 h-8 rounded-xl bg-slate-100 hover:bg-slate-200 active:scale-90 text-slate-800 font-bold flex items-center justify-center border border-slate-200 transition shrink-0 shadow-xs"
										title="Diminuir 0,2 metros"
									>
										<Minus size={14} strokeWidth={2.5} />
									</button>

									<span className="text-[11px] font-semibold text-slate-400">
										13m
									</span>

									<input
										type="range"
										min="13.0"
										max="36.0"
										step="0.2"
										value={cotaSimulada}
										onChange={(e) =>
											setCotaSimulada(parseFloat(e.target.value))
										}
										className="flex-1 h-2.5 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-slate-900"
									/>

									<span className="text-[11px] font-semibold text-slate-400">
										36m
									</span>

									<button
										type="button"
										onClick={() => {
											setCotaSimulada((prev) => {
												const novo = Math.min(36.0, Math.round((prev + 0.2) * 10) / 10);
												return novo;
											});
										}}
										className="w-8 h-8 rounded-xl bg-slate-100 hover:bg-slate-200 active:scale-90 text-slate-800 font-bold flex items-center justify-center border border-slate-200 transition shrink-0 shadow-xs"
										title="Aumentar 0,2 metros"
									>
										<Plus size={14} strokeWidth={2.5} />
									</button>
								</div>

								{/* Segmented Preset Buttons */}
								<div className="grid grid-cols-3 gap-2 bg-slate-100 p-1 rounded-2xl border border-slate-200/60">
									<button
										onClick={() => setCotaSimulada(cotaReal)}
										className="py-2 px-2 bg-white text-slate-800 rounded-xl text-xs font-semibold shadow-sm transition active:scale-95">
										Ao Vivo ({Number(cotaReal).toFixed(1)}m)
									</button>
									<button
										onClick={() => setCotaSimulada(19.0)}
										className="py-2 px-2 hover:bg-white/80 text-slate-700 rounded-xl text-xs font-semibold transition active:scale-95">
										Alerta (19.0m)
									</button>
									<button
										onClick={() => setCotaSimulada(29.8)}
										className="py-2 px-2 hover:bg-white/80 text-slate-700 rounded-xl text-xs font-semibold transition active:scale-95">
										Maio/24 (29.8m)
									</button>
								</div>

								{/* MONITORAMENTO DE IMPACTO EM TEMPO REAL NOS LOCAIS DO USUÁRIO */}
								{(() => {
									const locaisParaVerificar = [];
									if (usuario?.residencia) {
										locaisParaVerificar.push({
											id: 'residencia-principal',
											tipo: 'residencia',
											nome: 'Residência Principal',
											endereco: usuario.residencia.endereco || 'Minha Casa',
											cota: Number(usuario.residencia.cota || 24.0),
										});
									}
									if (Array.isArray(usuario?.pontosInteresse)) {
										usuario.pontosInteresse.forEach((pt) => {
											locaisParaVerificar.push({
												id: `pt-${pt.id}`,
												tipo: 'ponto',
												nome: pt.nome,
												endereco: pt.endereco,
												cota: Number(pt.cota || 24.0),
											});
										});
									}

									if (locaisParaVerificar.length === 0) {
										return (
											<div className="p-3 bg-slate-50 border border-slate-200 rounded-2xl text-xs text-slate-500 text-center">
												Cadastre sua casa ou pontos de interesse para monitorar alertas de cheia ao vivo no slider.
											</div>
										);
									}

									return (
										<div className="space-y-2">
											<div className="flex items-center justify-between">
												<span className="text-[10px] font-semibold uppercase tracking-wider text-slate-500">
													Impacto nos Meus Locais ({locaisParaVerificar.length})
												</span>
											</div>
											<div className="space-y-1.5 max-h-40 overflow-y-auto pr-1">
												{locaisParaVerificar.map((loc) => {
													const margem = Number((loc.cota - cotaSimulada).toFixed(1));
													const isInundado = margem <= 0;
													const isAlerta = margem > 0 && margem <= 1.5;

													return (
														<div
															key={loc.id}
															className={`p-2.5 rounded-xl border text-xs flex items-center justify-between gap-2 transition ${
																isInundado
																	? "bg-rose-50 border-rose-200 text-rose-900"
																	: isAlerta
																	? "bg-amber-50 border-amber-200 text-amber-900"
																	: "bg-emerald-50/70 border-emerald-200/80 text-emerald-900"
															}`}
														>
															<div className="min-w-0 flex-1">
																<div className="flex items-center gap-1.5 font-semibold text-xs">
																	<span>{loc.tipo === 'residencia' ? '🏠' : '📍'}</span>
																	<span className="truncate">{loc.nome}</span>
																	<span className="text-[10px] text-slate-500 font-normal">
																		({loc.cota.toFixed(1)}m)
																	</span>
																</div>
																<p className="text-[10px] text-slate-500 truncate mt-0.5">
																	{loc.endereco}
																</p>
															</div>

															<div className="text-right shrink-0">
																<span
																	className={`inline-block px-2 py-0.5 rounded-md font-bold text-[10px] ${
																		isInundado
																			? "bg-rose-600 text-white"
																			: isAlerta
																			? "bg-amber-500 text-white"
																			: "bg-emerald-600 text-white"
																	}`}
																>
																	{isInundado
																		? `Submerso por ${Math.abs(margem)}m`
																		: isAlerta
																		? `Atenção: +${margem}m`
																		: `Seguro (+${margem}m)`}
																</span>
															</div>
														</div>
													);
												})}
											</div>
										</div>
									);
								})()}

								{/* Disparador de Alerta Push e Ativação de Notificações */}
								<div className="pt-1 border-t border-slate-100 flex items-center gap-2">
									<button
										type="button"
										onClick={async () => {
											const perm = await solicitarPermissaoNotificacao();
											if (perm === "granted") {
												const primeiroLocal = usuario?.residencia?.endereco
													? `sua casa (${usuario.residencia.endereco})`
													: "seus locais cadastrados";

												await dispararAlertaLocal(
													`🚨 Alerta: Rio Taquari em ${Number(cotaSimulada).toFixed(1)}m!`,
													`Simulação ativa: Água se aproximando de ${primeiroLocal}. Alertas automáticos no celular ativos.`,
													"teste-usuario"
												);
											} else {
												alert("Para receber alertas na tela do celular, permita as notificações nas configurações do seu navegador.");
											}
										}}
										className="w-full py-2.5 px-3 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-semibold transition flex items-center justify-center gap-2 active:scale-98 shadow-sm"
									>
										<BellRing size={14} className="text-amber-400 animate-pulse" />
										<span>Ativar / Testar Alerta no Celular</span>
									</button>
								</div>
							</div>
						)}

						{/* VISTA 3: ROTAS (Aba Rotas) */}
						{abaAtiva === "rotas" && (
							!usuario ? (
								<div className="flex flex-col items-center justify-center py-8 px-4 text-center animate-in fade-in duration-300">
									<div className="w-12 h-12 bg-slate-100 text-slate-700 rounded-2xl flex items-center justify-center mb-3">
										<Bookmark size={22} className="text-slate-600" />
									</div>
									<h3 className="font-semibold text-slate-900 text-base mb-1">
										Acesse sua conta para traçar rotas
									</h3>
									<p className="text-xs text-slate-500 max-w-xs mb-5">
										Navegação inteligente com desvio automático de vias alagadas em tempo real.
									</p>
									<button
										onClick={onAbrirAuth}
										className="w-full max-w-xs bg-slate-900 hover:bg-slate-800 active:scale-95 text-white font-semibold py-2.5 px-6 rounded-xl text-xs transition shadow-sm flex items-center justify-center gap-2"
									>
										<span>Entrar ou Criar Conta</span>
									</button>
								</div>
							) : (
							<div className="flex flex-col gap-y-3 animate-in fade-in duration-300 pb-16">
								<div className="flex items-center justify-between">
									<h3 className="font-semibold text-slate-900 text-sm">
										Planejamento de Rota Segura
									</h3>
									<span className="text-[11px] text-slate-400">Desvios automáticos</span>
								</div>

								{/* ATALHOS RÁPIDOS: MINHA CASA */}
								{usuario?.residencia && (
									<div className="flex gap-2">
										<button
											type="button"
											onClick={() => {
												const c = usuario.residencia.coords || (usuario.residencia.lat && usuario.residencia.lon ? [usuario.residencia.lat, usuario.residencia.lon] : null);
												if (c) setPontoOrigem(c);
												setTextoOrigem(`Minha Casa (${usuario.residencia.endereco || ''})`);
												setSugestoesOrigem([]);
											}}
											className="flex-1 bg-slate-50 hover:bg-slate-100 border border-slate-200 text-slate-700 text-xs font-medium py-1.5 px-2 rounded-xl flex items-center justify-center gap-1.5 transition active:scale-95">
											<span>Partir de Casa</span>
										</button>
										<button
											type="button"
											onClick={() => {
												const c = usuario.residencia.coords || (usuario.residencia.lat && usuario.residencia.lon ? [usuario.residencia.lat, usuario.residencia.lon] : null);
												if (c) setPontoDestino(c);
												setTextoDestino(`Minha Casa (${usuario.residencia.endereco || ''})`);
												setSugestoesDestino([]);
											}}
											className="flex-1 bg-slate-50 hover:bg-slate-100 border border-slate-200 text-slate-700 text-xs font-medium py-1.5 px-2 rounded-xl flex items-center justify-center gap-1.5 transition active:scale-95">
											<span>Ir para Casa</span>
										</button>
									</div>
								)}

								{/* ROTAS FREQUENTES SALVAS */}
								{rotasSalvas?.length > 0 && (
									<div className="space-y-1">
										<div className="flex items-center justify-between">
											<span className="text-[10px] text-slate-400 font-semibold uppercase tracking-wider flex items-center gap-1">
												<Star size={11} className="text-amber-500 fill-amber-500" />
												Rotas Frequentes
											</span>
										</div>
										<div className="flex items-center gap-1.5 overflow-x-auto pb-1">
											{rotasSalvas.map((r) => (
												<div
													key={r.id}
													className="flex items-center bg-slate-50 border border-slate-200 text-slate-800 rounded-xl px-2.5 py-1 text-xs whitespace-nowrap hover:bg-slate-100 transition shrink-0 gap-1.5"
												>
													<button
														type="button"
														onClick={() => handleCarregarRotaSalva(r)}
														className="flex items-center gap-1 font-medium text-left"
														title={`${r.origem_nome} ➔ ${r.destino_nome}`}
													>
														<span>{r.nome}</span>
													</button>
													<button
														type="button"
														onClick={(e) => {
															e.stopPropagation();
															setRotaParaExcluir(r);
														}}
														className="text-slate-400 hover:text-rose-600 p-0.5 rounded transition"
														title="Remover dos favoritos"
													>
														<Trash2 size={11} />
													</button>
												</div>
											))}
										</div>
									</div>
								)}

								{/* ATALHOS DE PONTOS DE INTERESSE SALVOS */}
								{usuario?.pontosInteresse?.length > 0 && (
									<div className="flex items-center gap-1.5 overflow-x-auto pb-1">
										<span className="text-[10px] text-slate-400 font-semibold whitespace-nowrap">Meus Pontos:</span>
										{usuario.pontosInteresse.map((pt) => (
											<button
												key={pt.id}
												type="button"
												onClick={() => {
													if (!pontoOrigem) {
														setTextoOrigem(pt.nome);
														if (pt.coords) setPontoOrigem(pt.coords);
														setSugestoesOrigem([]);
													} else {
														setTextoDestino(pt.nome);
														if (pt.coords) setPontoDestino(pt.coords);
														setSugestoesDestino([]);
													}
												}}
												className="bg-slate-50 border border-slate-200 text-slate-700 text-[11px] font-medium px-2.5 py-0.5 rounded-full whitespace-nowrap hover:bg-slate-100 transition active:scale-95">
												{pt.nome}
											</button>
										))}
									</div>
								)}

								<div className="space-y-2.5">
									{/* PARTIDA (A) */}
									<div className="relative">
										<div className="flex items-center justify-between mb-1">
											<label className="text-[10px] font-semibold text-slate-500 uppercase tracking-wider flex items-center gap-1.5">
												<span className="w-2 h-2 rounded-full bg-emerald-500 inline-block"></span> Partida
											</label>
											<div className="flex items-center gap-1.5">
												<button
													type="button"
													onClick={() => {
														if (onCapturarGPS) {
															onCapturarGPS((coords) => {
																setPontoOrigem(coords);
																setTextoOrigem("Minha Localização Atual (GPS)");
																setSugestoesOrigem([]);
															});
														}
													}}
													disabled={obtendoGPS}
													className="text-[11px] text-slate-600 hover:text-slate-900 bg-slate-100 hover:bg-slate-200 font-medium px-2 py-0.5 rounded-lg transition active:scale-95 flex items-center gap-1"
												>
													<span>Usar GPS</span>
												</button>
												{pontoOrigem && (
													<span className="text-[11px] text-emerald-600 font-semibold">✓</span>
												)}
											</div>
										</div>
										<input
											type="text"
											value={textoOrigem}
											onChange={(e) => {
												setTextoOrigem(e.target.value);
												handleBuscar(e.target.value, setSugestoesOrigem);
											}}
											placeholder="Ponto de partida ou sua localização..."
											className="w-full text-xs p-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:border-slate-900 outline-none transition"
										/>

										{/* AUTOCOMPLETE PARTIDA */}
										{sugestoesOrigem.length > 0 && (
											<div className="absolute left-0 right-0 top-full mt-1 bg-white border border-slate-200 rounded-xl shadow-xl z-50 divide-y divide-slate-100 max-h-52 overflow-y-auto">
												{sugestoesOrigem.map((s, idx) => (
													<div
														key={idx}
														onClick={() => {
															setPontoOrigem(s.coords);
															setTextoOrigem(s.nome);
															setSugestoesOrigem([]);
														}}
														className="text-xs p-2.5 hover:bg-slate-50 cursor-pointer flex items-center gap-2">
														<div className="min-w-0 flex-1">
															<p className="font-semibold text-slate-900 truncate">{s.nome}</p>
															<p className="text-[10px] text-slate-500 truncate">{s.detalhe}</p>
														</div>
													</div>
												))}
											</div>
										)}
									</div>

									{/* DESTINO (B) */}
									<div className="relative">
										<div className="flex items-center justify-between mb-1">
											<label className="text-[10px] font-semibold text-slate-500 uppercase tracking-wider flex items-center gap-1.5">
												<span className="w-2 h-2 rounded-full bg-slate-900 inline-block"></span> Destino
											</label>
											<div className="flex items-center gap-1.5">
												<button
													type="button"
													onClick={() => {
														if (onCapturarGPS) {
															onCapturarGPS((coords) => {
																setPontoDestino(coords);
																setTextoDestino("Minha Localização Atual (GPS)");
																setSugestoesDestino([]);
															});
														}
													}}
													disabled={obtendoGPS}
													className="text-[11px] text-slate-600 hover:text-slate-900 bg-slate-100 hover:bg-slate-200 font-medium px-2 py-0.5 rounded-lg transition active:scale-95 flex items-center gap-1"
												>
													<span>Usar GPS</span>
												</button>
												{pontoDestino && (
													<span className="text-[11px] text-emerald-600 font-semibold">✓</span>
												)}
											</div>
										</div>
										<input
											type="text"
											value={textoDestino}
											onChange={(e) => {
												setTextoDestino(e.target.value);
												handleBuscar(e.target.value, setSugestoesDestino);
											}}
											placeholder="Para onde você quer ir?"
											className="w-full text-xs p-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:border-slate-900 outline-none transition"
										/>

										{/* AUTOCOMPLETE DESTINO */}
										{sugestoesDestino.length > 0 && (
											<div className="absolute left-0 right-0 top-full mt-1 bg-white border border-slate-200 rounded-xl shadow-xl z-50 divide-y divide-slate-100 max-h-52 overflow-y-auto">
												{sugestoesDestino.map((s, idx) => (
													<div
														key={idx}
														onClick={() => {
															setPontoDestino(s.coords);
															setTextoDestino(s.nome);
															setSugestoesDestino([]);
														}}
														className="text-xs p-2.5 hover:bg-slate-50 cursor-pointer flex items-center gap-2">
														<div className="min-w-0 flex-1">
															<p className="font-semibold text-slate-900 truncate">{s.nome}</p>
															<p className="text-[10px] text-slate-500 truncate">{s.detalhe}</p>
														</div>
													</div>
												))}
											</div>
										)}
									</div>

									<button
										disabled={calculandoRota || !pontoOrigem || !pontoDestino}
										className={`w-full py-2.5 rounded-xl font-semibold text-xs flex items-center justify-center gap-2 transition ${
											calculandoRota || !pontoOrigem || !pontoDestino
												? "bg-slate-100 text-slate-400 cursor-not-allowed"
												: "bg-slate-900 hover:bg-slate-800 text-white active:scale-98 shadow-sm"
										}`}
										onClick={() => {
											window.dispatchEvent(new CustomEvent("trigger-gerar-rota"));
										}}>
										{calculandoRota
											? "Calculando rota segura..."
											: "Calcular Rota com Desvios"}
									</button>
								</div>

								{dadosRota && (
									<div className="p-3.5 bg-slate-50 rounded-2xl border border-slate-200 text-xs space-y-2.5 mt-2">
										<div className="flex justify-between items-start">
											<div className="space-y-0.5">
												<p className="text-slate-600 font-medium">
													Distância: <span className="font-bold text-slate-900">{dadosRota.distancia} km</span>
												</p>
												<p className="text-slate-600 font-medium">
													Tempo estimado: <span className="font-bold text-slate-900">{dadosRota.tempo} min</span>
												</p>
											</div>
											<button
												type="button"
												onClick={() => {
													if (onLimparRota) onLimparRota();
												}}
												className="flex items-center gap-1 text-[11px] text-slate-500 hover:text-rose-600 px-2 py-1 rounded-lg transition"
												title="Apagar rota do mapa"
											>
												<Trash2 size={12} />
												<span>Limpar</span>
											</button>
										</div>
										<div
											className={`p-2 rounded-xl font-semibold text-center text-xs border ${
												dadosRota.segura ? "bg-emerald-50 border-emerald-200 text-emerald-800" : "bg-rose-50 border-rose-200 text-rose-800"
											}`}>
											{dadosRota.segura
												? "Trajeto Seguro (Desvio pelas Vias Altas)"
												: "Atenção: Destino ou vias de acesso ilhadas"}
										</div>

										{/* BOTÕES NAVEGAÇÃO EXTERNA (GOOGLE MAPS) & SALVAR FAVORITA */}
										<div className="flex gap-2 pt-1">
											<button
												type="button"
												onClick={abrirGoogleMaps}
												className="w-full bg-white hover:bg-slate-100 border border-slate-200 text-slate-800 font-semibold py-2.5 rounded-xl text-xs flex items-center justify-center gap-1.5 shadow-sm active:scale-95 transition">
												<Navigation size={13} className="text-slate-600" />
												<span>Navegar no Google Maps</span>
											</button>
										</div>

										{/* BOTÃO SALVAR ROTA FREQUENTE */}
										<button
											type="button"
											onClick={handleSalvarRotaFavorita}
											disabled={salvandoRotaAtual || rotaJaSalva}
											className={`w-full py-2 px-3 rounded-xl text-xs font-semibold flex items-center justify-center gap-1.5 transition active:scale-95 border ${
												rotaJaSalva
													? "bg-slate-100 text-slate-700 border-slate-200"
													: "bg-white hover:bg-slate-50 text-slate-800 border-slate-200 shadow-sm"
											}`}
										>
											{rotaJaSalva ? (
												<>
													<Check size={14} className="text-emerald-600 stroke-[2.5]" />
													<span>Salva nas Rotas Frequentes</span>
												</>
											) : (
												<>
													<Star size={14} className="text-amber-500 fill-amber-500" />
													<span>Salvar como Rota Frequente</span>
												</>
											)}
										</button>
									</div>
								)}
							</div>
							)
						)}
					</div>
				)}

				{/* ESPAÇOS DE MONETIZAÇÃO QUANDO A GAVETA FOR EXPANDIDA (DESATIVADO TEMPORARIAMENTE) */}
				{/*
				{isExpanded && (
					<div className="mt-4 pt-3 border-t border-gray-100 overflow-y-auto space-y-3 pb-6">
						<BannerPatrocinador
							titulo="Apoiador Oficial da Prevenção"
							nome="Sicredi Integração RS/MG"
							descricao="Apoiando iniciativas de prevenção, reconstrução e monitoramento no Vale do Taquari."
							link="https://www.sicredi.com.br"
							iniciais="SI"
							corLogo="bg-emerald-600"
						/>

						<GoogleAdBlock
							client="ca-pub-XXXXXXXXXXXXXXXX"
							slot="1234567890"
							format="auto"
						/>
					</div>
				)}
				*/}
			</div>

			{/* MODAL PERSONALIZADO (SEM CARA DE IA / BROWSER PROMPT) PARA SALVAR ROTA FREQUENTE */}
			{modalSalvarRotaAberto && (
				<div
					style={{ zIndex: 4000 }}
					className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in duration-200 pointer-events-auto"
				>
					<div className="bg-white w-full max-w-sm rounded-2xl p-5 shadow-2xl border border-slate-100 animate-in zoom-in-95 duration-150">
						<div className="flex items-center justify-between pb-3 border-b border-slate-100 mb-3">
							<div className="flex items-center gap-2 text-slate-900 font-semibold text-sm">
								<Star size={16} className="text-amber-500 fill-amber-500" />
								<span>Salvar Rota Frequente</span>
							</div>
							<button
								type="button"
								onClick={() => setModalSalvarRotaAberto(false)}
								className="text-slate-400 hover:text-slate-600 p-1 rounded-lg hover:bg-slate-100 transition"
							>
								<X size={16} />
							</button>
						</div>

						<form onSubmit={handleConfirmarSalvarRota} className="space-y-3">
							<div>
								<label className="text-[11px] font-medium text-slate-600 block mb-1">
									Nome ou identificador da rota
								</label>
								<input
									type="text"
									autoFocus
									value={nomeNovaRota}
									onChange={(e) => setNomeNovaRota(e.target.value)}
									placeholder="Ex: Minha Casa ➔ Trabalho"
									className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-medium text-slate-900 outline-none focus:border-slate-400 focus:bg-white transition"
								/>
							</div>

							<div className="p-2.5 bg-slate-50 rounded-xl border border-slate-100 text-[11px] text-slate-500 space-y-1">
								<p className="truncate"><span className="font-semibold text-slate-700">Partida:</span> {textoOrigem}</p>
								<p className="truncate"><span className="font-semibold text-slate-700">Destino:</span> {textoDestino}</p>
							</div>

							<div className="flex gap-2 pt-1">
								<button
									type="button"
									onClick={() => setModalSalvarRotaAberto(false)}
									className="flex-1 bg-white hover:bg-slate-100 border border-slate-200 text-slate-700 font-medium py-2 rounded-xl text-xs transition"
								>
									Cancelar
								</button>
								<button
									type="submit"
									disabled={salvandoRotaAtual || !nomeNovaRota.trim()}
									className="flex-1 bg-slate-900 hover:bg-slate-800 disabled:bg-slate-200 disabled:text-slate-400 text-white font-semibold py-2 rounded-xl text-xs active:scale-95 transition shadow-sm"
								>
									{salvandoRotaAtual ? "Salvando..." : "Salvar Rota"}
								</button>
							</div>
						</form>
					</div>
				</div>
			)}

			{/* MODAL DE CONFIRMAÇÃO DE EXCLUSÃO DE ROTA SALVA */}
			{rotaParaExcluir && (
				<div
					style={{ zIndex: 4000 }}
					className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in duration-200 pointer-events-auto"
				>
					<div className="bg-white w-full max-w-sm rounded-2xl p-5 shadow-2xl border border-slate-100 text-center space-y-3">
						<div className="w-10 h-10 rounded-full bg-rose-50 text-rose-600 flex items-center justify-center mx-auto">
							<Trash2 size={18} />
						</div>
						<div>
							<h4 className="font-semibold text-slate-900 text-sm">Remover Rota Frequente?</h4>
							<p className="text-xs text-slate-500 mt-1">
								Deseja remover <strong>"{rotaParaExcluir.nome}"</strong> da sua lista de favoritos?
							</p>
						</div>
						<div className="flex gap-2 pt-1">
							<button
								type="button"
								onClick={() => setRotaParaExcluir(null)}
								className="flex-1 bg-white hover:bg-slate-100 border border-slate-200 text-slate-700 font-medium py-2 rounded-xl text-xs transition"
							>
								Cancelar
							</button>
							<button
								type="button"
								onClick={handleConfirmarExcluirRota}
								className="flex-1 bg-rose-600 hover:bg-rose-700 text-white font-semibold py-2 rounded-xl text-xs active:scale-95 transition shadow-sm"
							>
								Remover
							</button>
						</div>
					</div>
				</div>
			)}
		</div>
	);
};

export default MetricsBottomSheet;
