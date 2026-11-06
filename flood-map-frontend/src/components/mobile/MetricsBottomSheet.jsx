import React, { useState, useRef, useEffect } from "react";
import { CloudRain, MoreHorizontal, Trash2, Bookmark, Star, Check } from "lucide-react";
import BannerPatrocinador from "./BannerPatrocinador";
import GoogleAdBlock from "./GoogleAdBlock";
import { buscarDestinosCalibrados } from "../../services/locaisLajeado";
import { API_BASE } from "../../services/config";

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
}) => {
	// Alturas em pixels: min = 60px, mid = 295px (exibe cota, barra e tendência com folga), max = 85vh (calculado dinamicamente)
	const [currentHeight, setCurrentHeight] = useState(295);
	const [isDragging, setIsDragging] = useState(false);
	const [sugestoesOrigem, setSugestoesOrigem] = useState([]);
	const [sugestoesDestino, setSugestoesDestino] = useState([]);
	const [rotasSalvas, setRotasSalvas] = useState([]);
	const [salvandoRotaAtual, setSalvandoRotaAtual] = useState(false);
	const [rotaJaSalva, setRotaJaSalva] = useState(false);
	const startYRef = useRef(0);
	const startHeightRef = useRef(295);

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

	const handleSalvarRotaFavorita = async () => {
		if (!usuario || !pontoOrigem || !pontoDestino || !dadosRota) return;
		const nomeSugerido = `${textoOrigem.split(',')[0]} ➔ ${textoDestino.split(',')[0]}`;
		const apelido = window.prompt("Nome para esta rota frequente:", nomeSugerido);
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

	const handleExcluirRotaSalva = async (id, e) => {
		e.stopPropagation();
		if (!window.confirm("Remover esta rota dos seus favoritos?")) return;
		const filtradas = rotasSalvas.filter((r) => r.id !== id);
		setRotasSalvas(filtradas);
		if (usuario?.email) {
			localStorage.setItem(`rotas_${usuario.email}`, JSON.stringify(filtradas));
		}
		try {
			await fetch(`${API_BASE}/api/v1/rotas/${id}/excluir/`, { method: "POST" });
		} catch (_) {}
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

	const getMaxHeight = () => Math.round(window.innerHeight * 0.88);
	const getMidHeight = () => {
		if (abaAtiva === "rotas") return dadosRota ? 520 : 450;
		if (abaAtiva === "simular") return 310;
		return 295;
	};
	const getMinHeight = () => 60;

	// Ajusta a altura da barra suavemente ao trocar entre as abas ou gerar rota
	useEffect(() => {
		if (abaAtiva === "rotas") {
			setCurrentHeight(dadosRota ? 520 : 450);
		} else if (abaAtiva === "simular") {
			setCurrentHeight(310);
		} else {
			setCurrentHeight(295);
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
					className="w-full flex items-center justify-between cursor-pointer mb-6 transition-opacity duration-300"
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
					<div className="flex flex-col gap-y-6 pt-1">
						{/* VISTA 1: MÉTRICAS (Aba Mapa) */}
						{abaAtiva === "mapa" && (
							<div className="flex flex-col gap-y-6 animate-in fade-in duration-300">
								<div className="flex justify-between items-end">
									<div>
										<p className="text-[12px] text-gray-500 font-medium mb-1">
											Cota atual
										</p>
										<p className="text-[48px] font-black text-gray-900 leading-none tracking-tighter">
											{cotaReal ? Number(cotaReal).toFixed(2) : "13.84"}m
										</p>
									</div>
									<div
										className={`px-4 py-1.5 rounded-full text-sm font-bold ${cotaReal >= cotaInundacao ? "bg-red-100 text-red-600" : "bg-emerald-100 text-emerald-600"}`}>
										{cotaReal >= cotaInundacao ? "Inundação" : "Normal"}
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
										<div className="relative w-full pt-6 pb-5">
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
														<div className={`w-0.5 h-2 ${m.bg} opacity-70`}></div>
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
											<div className="relative w-full text-[10px] font-bold text-gray-400 mt-2 flex justify-between">
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
										<div className="grid grid-cols-2 gap-4 items-center">
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
							<div className="flex flex-col gap-y-6 animate-in fade-in duration-300">
								<div className="flex justify-between items-center">
									<h3 className="font-bold text-gray-900 flex items-center gap-2">
										<span className="text-xl">🎛️</span> Simulação de Cota
									</h3>
									<span className="text-base font-black text-blue-600 bg-blue-50 px-2.5 py-1 rounded-xl border border-blue-200">
										{Number(cotaSimulada).toFixed(2)}m
									</span>
								</div>

								<div className="flex items-center gap-3">
									<span className="text-[10px] font-bold text-gray-400">
										13m
									</span>
									<input
										type="range"
										min="13.0"
										max="36.0"
										step="0.1"
										value={cotaSimulada}
										onChange={(e) =>
											setCotaSimulada(parseFloat(e.target.value))
										}
										className="flex-1 h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-blue-600"
									/>
									<span className="text-[10px] font-bold text-gray-400">
										36m
									</span>
								</div>

								<div className="grid grid-cols-3 gap-2">
									<button
										onClick={() => setCotaSimulada(cotaReal)}
										className="py-2 px-2 bg-gray-100 hover:bg-gray-200 text-gray-800 rounded-xl text-[11px] font-bold transition">
										Ao Vivo
									</button>
									<button
										onClick={() => setCotaSimulada(19.0)}
										className="py-2 px-2 bg-amber-50 hover:bg-amber-100 text-amber-800 border border-amber-200 rounded-xl text-[11px] font-bold transition">
										Alerta
									</button>
									<button
										onClick={() => setCotaSimulada(29.8)}
										className="py-2 px-2 bg-red-50 hover:bg-red-100 text-red-800 border border-red-200 rounded-xl text-[11px] font-bold transition">
										Maio/24
									</button>
								</div>
							</div>
						)}

						{/* VISTA 3: ROTAS (Aba Rotas) */}
						{abaAtiva === "rotas" && (
							!usuario ? (
								<div className="flex flex-col items-center justify-center py-8 px-4 text-center animate-in fade-in duration-300">
									<div className="w-14 h-14 bg-blue-50 text-blue-600 rounded-2xl flex items-center justify-center text-2xl mb-3 shadow-inner">
										🗺️
									</div>
									<h3 className="font-bold text-gray-900 text-base mb-1">
										Faça login para traçar Rotas Seguras
									</h3>
									<p className="text-xs text-gray-500 max-w-xs mb-5">
										Acesse o traçado inteligente de rotas com <strong>desvio automático de ruas alagadas</strong> em tempo real.
									</p>
									<button
										onClick={onAbrirAuth}
										className="w-full max-w-xs bg-blue-600 hover:bg-blue-700 active:scale-95 text-white font-bold py-3 px-6 rounded-xl text-xs shadow-lg shadow-blue-500/20 transition flex items-center justify-center gap-2"
									>
										<span>👤 Entrar ou Criar Conta Grátis</span>
									</button>
								</div>
							) : (
							<div className="flex flex-col gap-y-3 animate-in fade-in duration-300 pb-16">
								<h3 className="font-bold text-gray-900 flex items-center gap-2 text-sm">
									<span className="text-xl">🚗</span> Traçar Rota Segura
								</h3>

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
											className="flex-1 bg-amber-50 hover:bg-amber-100 border border-amber-200 text-amber-900 text-[11px] font-bold py-1.5 rounded-lg flex items-center justify-center gap-1 transition active:scale-95">
											🏠 Partir de Casa
										</button>
										<button
											type="button"
											onClick={() => {
												const c = usuario.residencia.coords || (usuario.residencia.lat && usuario.residencia.lon ? [usuario.residencia.lat, usuario.residencia.lon] : null);
												if (c) setPontoDestino(c);
												setTextoDestino(`Minha Casa (${usuario.residencia.endereco || ''})`);
												setSugestoesDestino([]);
											}}
											className="flex-1 bg-amber-50 hover:bg-amber-100 border border-amber-200 text-amber-900 text-[11px] font-bold py-1.5 rounded-lg flex items-center justify-center gap-1 transition active:scale-95">
											🏁 Ir para Casa
										</button>
									</div>
								)}

								{/* ROTAS FREQUENTES SALVAS */}
								{rotasSalvas?.length > 0 && (
									<div className="space-y-1">
										<div className="flex items-center justify-between">
											<span className="text-[10px] text-gray-400 font-bold uppercase tracking-wider flex items-center gap-1">
												<Star size={11} className="text-amber-500 fill-amber-500" />
												Rotas Frequentes
											</span>
										</div>
										<div className="flex items-center gap-1.5 overflow-x-auto pb-1">
											{rotasSalvas.map((r) => (
												<div
													key={r.id}
													className="flex items-center bg-amber-50/80 border border-amber-200/80 text-amber-950 rounded-lg px-2 py-1 text-[11px] whitespace-nowrap shadow-sm hover:bg-amber-100 transition shrink-0 gap-1.5"
												>
													<button
														type="button"
														onClick={() => handleCarregarRotaSalva(r)}
														className="flex items-center gap-1 font-semibold text-left"
														title={`${r.origem_nome} ➔ ${r.destino_nome}`}
													>
														<span>🚗</span>
														<span>{r.nome}</span>
													</button>
													<button
														type="button"
														onClick={(e) => handleExcluirRotaSalva(r.id, e)}
														className="text-amber-700/60 hover:text-red-600 p-0.5 rounded transition"
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
										<span className="text-[10px] text-gray-400 font-bold whitespace-nowrap">Meus Pontos:</span>
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
												className="bg-blue-50 border border-blue-200 text-blue-900 text-[10px] font-semibold px-2 py-0.5 rounded-full whitespace-nowrap hover:bg-blue-100 transition active:scale-95">
												📍 {pt.nome}
											</button>
										))}
									</div>
								)}

								<div className="space-y-3">
									{/* PARTIDA (A) */}
									<div className="relative">
										<div className="flex items-center justify-between mb-1">
											<label className="text-[10px] font-bold text-gray-500 uppercase flex items-center gap-1">
												<span className="w-2 h-2 rounded-full bg-emerald-500 inline-block"></span> Partida (A)
											</label>
											{pontoOrigem && (
												<span className="text-[10px] text-emerald-600 font-bold">✓ Definido</span>
											)}
										</div>
										<input
											type="text"
											value={textoOrigem}
											onChange={(e) => {
												setTextoOrigem(e.target.value);
												handleBuscar(e.target.value, setSugestoesOrigem);
											}}
											placeholder="Ex: Centro, Univates, CEAT, HBB, Rua..."
											className="w-full text-xs p-2.5 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none"
										/>

										{/* AUTOCOMPLETE PARTIDA */}
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
														className="text-xs p-2.5 hover:bg-emerald-50 cursor-pointer flex items-center gap-2">
														<span>
															{s.tipo === "hospital" ? "🏥" : s.tipo === "faculdade" || s.tipo === "escola" ? "🎓" : s.tipo === "rua" ? "📍" : "🏢"}
														</span>
														<div className="min-w-0 flex-1">
															<p className="font-bold text-gray-900 truncate">{s.nome}</p>
															<p className="text-[10px] text-gray-500 truncate">{s.detalhe}</p>
														</div>
													</div>
												))}
											</div>
										)}
									</div>

									{/* DESTINO (B) */}
									<div className="relative">
										<div className="flex items-center justify-between mb-1">
											<label className="text-[10px] font-bold text-gray-500 uppercase flex items-center gap-1">
												<span className="w-2 h-2 rounded-full bg-red-500 inline-block"></span> Destino (B)
											</label>
											{pontoDestino && (
												<span className="text-[10px] text-emerald-600 font-bold">✓ Definido</span>
											)}
										</div>
										<input
											type="text"
											value={textoDestino}
											onChange={(e) => {
												setTextoDestino(e.target.value);
												handleBuscar(e.target.value, setSugestoesDestino);
											}}
											placeholder="Ex: Univates, Castelinho, Hospital Bruno Born..."
											className="w-full text-xs p-2.5 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none"
										/>

										{/* AUTOCOMPLETE DESTINO */}
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
															{s.tipo === "hospital" ? "🏥" : s.tipo === "faculdade" || s.tipo === "escola" ? "🎓" : s.tipo === "rua" ? "📍" : "🏢"}
														</span>
														<div className="min-w-0 flex-1">
															<p className="font-bold text-gray-900 truncate">{s.nome}</p>
															<p className="text-[10px] text-gray-500 truncate">{s.detalhe}</p>
														</div>
													</div>
												))}
											</div>
										)}
									</div>

									<button
										disabled={calculandoRota || !pontoOrigem || !pontoDestino}
										className={`w-full py-2.5 rounded-xl font-bold text-xs flex items-center justify-center gap-2 shadow-md transition ${
											calculandoRota || !pontoOrigem || !pontoDestino
												? "bg-gray-300 text-gray-500 cursor-not-allowed"
												: "bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white active:scale-95"
										}`}
										onClick={() => {
											window.dispatchEvent(new CustomEvent("trigger-gerar-rota"));
										}}>
										{calculandoRota
											? "⏳ Calculando Desvio Seguro..."
											: "🚀 Gerar Rota Anti-Enchente"}
									</button>
								</div>

								{dadosRota && (
									<div className="p-3 bg-gray-50 rounded-xl border border-gray-200 text-[11px] space-y-2.5 mt-2">
										<div className="flex justify-between items-start">
											<div>
												<p>
													<strong>Distância:</strong> {dadosRota.distancia} km
												</p>
												<p>
													<strong>Tempo:</strong> {dadosRota.tempo} min
												</p>
											</div>
											<button
												type="button"
												onClick={() => {
													if (onLimparRota) onLimparRota();
												}}
												className="flex items-center gap-1 text-[11px] text-red-600 hover:text-red-700 bg-red-50 hover:bg-red-100 border border-red-200 px-2.5 py-1 rounded-lg font-bold transition active:scale-95 shadow-sm"
												title="Apagar rota do mapa"
											>
												<Trash2 size={12} />
												<span>Limpar Rota</span>
											</button>
										</div>
										<div
											className={`p-1.5 rounded-lg font-bold text-center text-[11px] ${
												dadosRota.segura ? "bg-green-100 text-green-800" : "bg-red-100 text-red-800"
											}`}>
											{dadosRota.segura
												? "🛡️ ROTA 100% SEGURA (Desvio pelas Colinas)"
												: "⛔ ATENÇÃO: CIDADE ILHADA NO NÍVEL ATIVO"}
										</div>

										{/* BOTÕES NAVEGAÇÃO EXTERNA (GOOGLE MAPS & WAZE) & SALVAR FAVORITA */}
										<div className="flex gap-2 pt-1">
											<button
												type="button"
												onClick={abrirGoogleMaps}
												className="flex-1 bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 rounded-xl text-xs flex items-center justify-center gap-1.5 shadow-sm active:scale-95 transition">
												<span>🗺️</span>
												<span>Google Maps</span>
											</button>
											<button
												type="button"
												onClick={abrirWaze}
												className="flex-1 bg-purple-600 hover:bg-purple-700 text-white font-bold py-2 rounded-xl text-xs flex items-center justify-center gap-1.5 shadow-sm active:scale-95 transition">
												<span>🚗</span>
												<span>Waze</span>
											</button>
										</div>

										{/* BOTÃO SALVAR ROTA FREQUENTE */}
										<button
											type="button"
											onClick={handleSalvarRotaFavorita}
											disabled={salvandoRotaAtual || rotaJaSalva}
											className={`w-full py-2 px-3 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 transition active:scale-95 border ${
												rotaJaSalva
													? "bg-amber-50 text-amber-800 border-amber-300"
													: "bg-white hover:bg-amber-50 text-gray-800 border-gray-300 shadow-sm"
											}`}
										>
											{rotaJaSalva ? (
												<>
													<Check size={14} className="text-emerald-600 stroke-[3]" />
													<span className="text-amber-900">Salva nas Rotas Frequentes</span>
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
		</div>
	);
};

export default MetricsBottomSheet;
