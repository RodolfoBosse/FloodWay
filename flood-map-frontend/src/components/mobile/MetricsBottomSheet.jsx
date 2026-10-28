import React, { useState, useRef, useEffect } from "react";
import { CloudRain, MoreHorizontal } from "lucide-react";
import BannerPatrocinador from "./BannerPatrocinador";
import GoogleAdBlock from "./GoogleAdBlock";

const MetricsBottomSheet = ({
	cotaReal = 13.84,
	cotaInundacao = 19.0,
	cotaAlerta = 23.0,
	suaCota = 26.0,
	dadosRota = null,
	temperatura = "13°",
	onAbrirRotas,
	onAbrirClima,
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
}) => {
	// Alturas em pixels: min = 60px, mid = 245px, max = 85vh (calculado dinamicamente)
	const [currentHeight, setCurrentHeight] = useState(245);
	const [isDragging, setIsDragging] = useState(false);
	const startYRef = useRef(0);
	const startHeightRef = useRef(245);

	const isInundacao = cotaReal >= cotaInundacao;
	const temBloqueios = dadosRota?.bloqueada || isInundacao;
	const qtdBloqueios =
		dadosRota?.pontosBloqueio?.length || (isInundacao ? 22 : 0);

	const getMaxHeight = () => Math.round(window.innerHeight * 0.84);
	const getMidHeight = () => 245;
	const getMinHeight = () => 60;

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

								<div className="relative w-full h-3 bg-gradient-to-r from-emerald-500 via-yellow-400 to-red-500 rounded-full overflow-visible">
									<div className="absolute top-5 left-[40%] text-[10px] font-bold text-gray-400">
										16.00m
									</div>
									<div className="absolute top-5 left-[60%] text-[10px] font-bold text-gray-400">
										19.00m
									</div>
									<div className="absolute top-5 right-0 text-[10px] font-bold text-gray-400">
										26.00m (Casa)
									</div>
									<div
										className="absolute top-1/2 -translate-y-1/2 w-4 h-4 bg-white border-2 border-gray-800 rounded-full shadow-md transition-all duration-500"
										style={{
											left: `${Math.min(Math.max(((Number(cotaReal) - 13) / (26 - 13)) * 100, 0), 100)}%`,
											marginLeft: "-8px",
										}}
									/>
								</div>

								<div className="grid grid-cols-2 gap-4 items-center">
									<div className="flex items-center gap-2">
										<span className="text-sm text-gray-500 font-medium">
											Última hora
										</span>
										<span className="text-lg font-bold text-gray-900">
											+0,35m
										</span>
										<span className="px-2 py-0.5 bg-emerald-100 text-emerald-700 text-[10px] font-bold rounded-full">
											Rio estável
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
							<div className="flex flex-col gap-y-4 animate-in fade-in duration-300">
								<h3 className="font-bold text-gray-900 flex items-center gap-2">
									<span className="text-xl">🚗</span> Planejar Rota Segura
								</h3>

								<div className="space-y-3">
									<div className="relative">
										<label className="text-[10px] font-bold text-gray-500 uppercase">
											Partida (A)
										</label>
										<input
											type="text"
											value={textoOrigem}
											onChange={(e) => setTextoOrigem(e.target.value)}
											placeholder="Ex: Centro, Univates..."
											className="w-full text-xs p-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
										/>
									</div>
									<div className="relative">
										<label className="text-[10px] font-bold text-gray-500 uppercase">
											Destino (B)
										</label>
										<input
											type="text"
											value={textoDestino}
											onChange={(e) => setTextoDestino(e.target.value)}
											placeholder="Ex: Hospital Bruno Born..."
											className="w-full text-xs p-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
										/>
									</div>
									<button
										disabled={calculandoRota}
										className="w-full py-2 bg-blue-600 text-white rounded-xl text-xs font-bold shadow-md active:scale-95 transition"
										onClick={() => {
											// Aqui chamaremos a função de gerar rota que moveremos do Mapa depois
											alert("Clique no mapa para marcar os pontos A e B!");
										}}>
										{calculandoRota
											? "⏳ Calculando..."
											: "🚀 Gerar Rota Anti-Enchente"}
									</button>
								</div>

								{dadosRota && (
									<div className="p-3 bg-gray-50 rounded-xl border border-gray-100 text-[11px]">
										<p>
											<strong>Distância:</strong> {dadosRota.distancia} km
										</p>
										<p>
											<strong>Tempo:</strong> {dadosRota.tempo} min
										</p>
										<p
											className={`font-bold mt-1 ${dadosRota.segura ? "text-emerald-600" : "text-red-600"}`}>
											{dadosRota.segura
												? "🛡️ Rota 100% Segura"
												: "⛔ Rota com Bloqueios"}
										</p>
									</div>
								)}
							</div>
						)}
					</div>
				)}

				{/* ESPAÇOS DE MONETIZAÇÃO QUANDO A GAVETA FOR EXPANDIDA */}
				{isExpanded && (
					<div className="mt-4 pt-3 border-t border-gray-100 overflow-y-auto space-y-3 pb-6">
						{/* 1. Anúncio Patrocinado Oficial (Empresas Locais / Parceiros) */}
						<BannerPatrocinador
							titulo="Apoiador Oficial da Prevenção"
							nome="Sicredi Integração RS/MG"
							descricao="Apoiando iniciativas de prevenção, reconstrução e monitoramento no Vale do Taquari."
							link="https://www.sicredi.com.br"
							iniciais="SI"
							corLogo="bg-emerald-600"
						/>

						{/* 2. Bloco Google AdSense (Monetização Automática) */}
						<GoogleAdBlock
							client="ca-pub-XXXXXXXXXXXXXXXX"
							slot="1234567890"
							format="auto"
						/>
					</div>
				)}
			</div>
		</div>
	);
};

export default MetricsBottomSheet;
