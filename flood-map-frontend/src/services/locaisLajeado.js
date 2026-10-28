/**
 * BASE CALIBRADA DE MARCOS, ESCOLAS, UNIVERSIDADES, HOSPITAIS E PONTOS DE INTERESSE
 * DE LAJEADO / RS (COM COORDENADAS REAIS VERIFICADAS)
 */

export const LOCAIS_OFICIAIS_LAJEADO = [
	// --- EDUCAÇÃO (UNIVERSIDADES E ESCOLAS) ---
	{
		nome: "Universidade Univates (Campus Lajeado)",
		tipo: "faculdade",
		detalhe: "Av. Avelino Talini, 171 - Universitário",
		coords: [-29.4442, -51.9568],
		aliases: ["univates", "universidade univates", "campus univates", "universidade do vale do taquari", "faculdade univates", "centro cultural univates", "teatro univates", "estadio univates"],
		cota: 58.0,
	},
	{
		nome: "Colégio Evangélico Alberto Torres (CEAT)",
		tipo: "escola",
		detalhe: "Rua Alberto Torres, 219 / Rua Carlos von Koseritz - Centro",
		coords: [-29.46212, -51.96252],
		aliases: ["ceat", "colegio ceat", "escola ceat", "colegio evangelico alberto torres", "alberto torres ceat"],
		cota: 33.5,
	},
	{
		nome: "Colégio Madre Bárbara",
		tipo: "escola",
		detalhe: "Rua Cel. Júlio May, 340 - Centro",
		coords: [-29.4675, -51.9653],
		aliases: ["madre barbara", "colegio madre barbara", "escola madre barbara", "madre"],
		cota: 32.8,
	},
	{
		nome: "Colégio Sinodal Gustavo Adolfo",
		tipo: "escola",
		detalhe: "Rua Miguel Tostes, 425 - São Cristóvão",
		coords: [-29.4477, -51.9639],
		aliases: ["gustavo adolfo", "colegio gustavo adolfo", "sinodal gustavo adolfo"],
		cota: 54.0,
	},
	{
		nome: "Colégio Estadual Presidente Castelo Branco (Castelinho)",
		tipo: "escola",
		detalhe: "Rua Bento Gonçalves, 291 - Centro",
		coords: [-29.46778, -51.96141],
		aliases: ["castelo branco", "castelinho", "colegio castelinho", "escola castelinho", "presidente castelo branco"],
		cota: 31.0,
	},
	{
		nome: "Colégio Cenecista João Batista de Mello (São João)",
		tipo: "escola",
		detalhe: "Rua Dr. Germano Berner, 272 - Florestal",
		coords: [-29.45878, -51.9701],
		aliases: ["sao joao batista", "colegio sao joao batista", "joao batista de mello", "cnec lajeado"],
		cota: 46.5,
	},
	{
		nome: "EEEF Manuel Bandeira",
		tipo: "escola",
		detalhe: "Rua Dona Theresa Christina, 598 - Florestal",
		coords: [-29.4580, -51.9695],
		aliases: ["manuel bandeira", "escola manuel bandeira", "eeef manuel bandeira"],
		cota: 45.0,
	},
	{
		nome: "SENAI Lajeado",
		tipo: "escola",
		detalhe: "Av. Senador Alberto Pasqualini, 1874 - São Cristóvão",
		coords: [-29.4455, -51.9542],
		aliases: ["senai", "senai lajeado", "escola senai"],
		cota: 56.0,
	},
	{
		nome: "SENAC Lajeado",
		tipo: "escola",
		detalhe: "Av. Senador Alberto Pasqualini, 421 - Americano",
		coords: [-29.4585, -51.9658],
		aliases: ["senac", "senac lajeado", "escola senac"],
		cota: 42.0,
	},

	// --- SAÚDE E HOSPITAIS ---
	{
		nome: "Hospital Bruno Born (HBB)",
		tipo: "hospital",
		detalhe: "Av. Benjamin Constant, 881 - Centro",
		coords: [-29.4629, -51.9663],
		aliases: ["hbb", "hospital bruno born", "bruno born", "pronto socorro hbb", "emergencia hbb", "hospital hbb"],
		cota: 35.2,
	},
	{
		nome: "Unimed VTRP (Sede / Atendimento)",
		tipo: "hospital",
		detalhe: "Av. Piraí, 155 - São Cristóvão",
		coords: [-29.4476, -51.9640],
		aliases: ["unimed", "unimed lajeado", "unimed vtrp", "pronto atendimento unimed"],
		cota: 53.0,
	},
	{
		nome: "Unidade Central de Saúde (Posto de Saúde Centro)",
		tipo: "hospital",
		detalhe: "Rua Cel. Júlio May, 383 - Centro",
		coords: [-29.4678, -51.9658],
		aliases: ["posto de saude centro", "posto central", "unidade central de saude", "posto julio may"],
		cota: 33.0,
	},
	{
		nome: "UPA 24h Lajeado (Jardim Botânico)",
		tipo: "hospital",
		detalhe: "Rua Carlos Spohr Filho, 3058 - Jardim Botânico",
		coords: [-29.4610, -51.9970],
		aliases: ["upa", "upa 24h", "upa lajeado", "pronto atendimento upa"],
		cota: 38.0,
	},

	// --- SEGURANÇA E DEFESA CIVIL ---
	{
		nome: "Prefeitura Municipal de Lajeado",
		tipo: "estabelecimento",
		detalhe: "Rua Cel. Júlio May, 242 - Centro",
		coords: [-29.46659, -51.96324],
		aliases: ["prefeitura", "prefeitura de lajeado", "prefeitura municipal de lajeado", "centro administrativo"],
		cota: 32.5,
	},
	{
		nome: "Corpo de Bombeiros Militar de Lajeado",
		tipo: "estabelecimento",
		detalhe: "Rua Nicolau Araújo Junges, 500 - Montanha",
		coords: [-29.4539, -51.9825],
		aliases: ["bombeiros", "corpo de bombeiros", "bombeiros lajeado", "pelotao de bombeiros"],
		cota: 48.0,
	},
	{
		nome: "Brigada Militar (22º BPM Lajeado)",
		tipo: "estabelecimento",
		detalhe: "Rua Cel. Júlio May, 509 - Centro",
		coords: [-29.46658, -51.96457],
		aliases: ["brigada militar", "policia militar", "brigada lajeado", "22 bpm"],
		cota: 33.0,
	},
	{
		nome: "Delegacia de Polícia Civil de Lajeado (DPPA)",
		tipo: "estabelecimento",
		detalhe: "Rua Cel. João Batista de Mello, 509 - Centro",
		coords: [-29.4650, -51.9665],
		aliases: ["policia civil", "delegacia", "dppa", "delegacia de lajeado"],
		cota: 34.0,
	},
	{
		nome: "Fórum da Comarca de Lajeado (TJRS)",
		tipo: "estabelecimento",
		detalhe: "Rua Paulo Frederico Schumacher, 77 - Moinhos",
		coords: [-29.4591, -51.9644],
		aliases: ["forum", "forum de lajeado", "tribunal de justica", "foro da comarca de lajeado"],
		cota: 39.0,
	},

	// --- LAZER, CULTURA E COMPRAS ---
	{
		nome: "Shopping Lajeado",
		tipo: "estabelecimento",
		detalhe: "Rodovia BR-386, Km 346 - São Cristóvão",
		coords: [-29.4493, -51.9689],
		aliases: ["shopping", "shopping lajeado", "passarela shopping"],
		cota: 52.0,
	},
	{
		nome: "Parque Professor Theobaldo Dick (Parque do Dick)",
		tipo: "estabelecimento",
		detalhe: "Rua Santos Filho - Centro",
		coords: [-29.4644, -51.9646],
		aliases: ["parque do dick", "dick", "parque dick", "parque theobaldo dick", "lago do dick"],
		cota: 26.5,
	},
	{
		nome: "Parque Histórico de Lajeado",
		tipo: "estabelecimento",
		detalhe: "Av. Lourenço Mayer da Silva - Alto do Parque",
		coords: [-29.4562, -51.9534],
		aliases: ["parque historico", "parque alemao", "deutscher kolonie park"],
		cota: 47.0,
	},
	{
		nome: "Jardim Botânico de Lajeado",
		tipo: "estabelecimento",
		detalhe: "Rua Carlos Spohr Filho - Moinhos d'Água",
		coords: [-29.4553, -51.9964],
		aliases: ["jardim botanico", "botanico lajeado"],
		cota: 43.0,
	},
	{
		nome: "Estação Rodoviária de Lajeado",
		tipo: "estabelecimento",
		detalhe: "Av. Pres. Castelo Branco, 42 - Moinhos",
		coords: [-29.4526, -51.9785],
		aliases: ["rodoviaria", "rodoviaria de lajeado", "estacao rodoviaria"],
		cota: 46.0,
	},
	{
		nome: "SESC Lajeado",
		tipo: "estabelecimento",
		detalhe: "Rua Silva Jardim, 135 - Centro",
		coords: [-29.4678, -51.9620],
		aliases: ["sesc", "sesc lajeado", "academia sesc"],
		cota: 32.0,
	},

	// --- SUPERMERCADOS E ATACAREJOS ---
	{
		nome: "Supermercado STR Lajeado (Matriz Centro)",
		tipo: "estabelecimento",
		detalhe: "Rua Bento Gonçalves, 639 - Centro",
		coords: [-29.4647, -51.9628],
		aliases: ["str", "supermercado str", "str lajeado", "str centro"],
		cota: 32.0,
	},
	{
		nome: "Supermercado Imec (Centro)",
		tipo: "estabelecimento",
		detalhe: "Rua Júlio de Castilhos, 1157 - Centro",
		coords: [-29.4655, -51.9630],
		aliases: ["imec centro", "supermercado imec centro", "imec julio de castilhos"],
		cota: 32.5,
	},
	{
		nome: "Supermercado Imec (São Cristóvão)",
		tipo: "estabelecimento",
		detalhe: "Av. Senador Alberto Pasqualini, 1760 - São Cristóvão",
		coords: [-29.4480, -51.9520],
		aliases: ["imec sao cristovao", "imec pasqualini", "supermercado imec sao cristovao"],
		cota: 57.0,
	},
	{
		nome: "Supermercado Imec (Florestal)",
		tipo: "estabelecimento",
		detalhe: "Av. Benjamin Constant, 1758 - Florestal",
		coords: [-29.4633, -51.9616],
		aliases: ["imec florestal", "supermercado imec florestal"],
		cota: 36.0,
	},
	{
		nome: "Desco Atacado Lajeado (Americano)",
		tipo: "estabelecimento",
		detalhe: "Av. Senador Alberto Pasqualini, 659 - Americano",
		coords: [-29.4560, -51.9635],
		aliases: ["desco", "desco atacado", "desco lajeado", "atacado desco"],
		cota: 44.0,
	},
	{
		nome: "Atacadão Lajeado (Antigo Maxxi)",
		tipo: "estabelecimento",
		detalhe: "Av. Senador Alberto Pasqualini, 1476 - São Cristóvão",
		coords: [-29.4490, -51.9540],
		aliases: ["atacadao", "maxxi", "maxxi atacado", "atacadao lajeado"],
		cota: 56.0,
	},
	{
		nome: "Via Atacadista Lajeado (Passarela Florestal)",
		tipo: "estabelecimento",
		detalhe: "Rua General Flores da Cunha, 410 - Florestal",
		coords: [-29.4565, -51.9680],
		aliases: ["via atacadista", "passarela atacado", "alviazul atacado"],
		cota: 46.0,
	},
];

/**
 * Normaliza strings para busca sem acentos e sem pontuação
 */
export function normalizarTexto(txt = "") {
	return String(txt)
		.toLowerCase()
		.normalize("NFD")
		.replace(/[\u0300-\u036f]/g, "")
		.replace(/[,\.\-\/#\(\)ºª]/g, " ")
		.replace(/\s+/g, " ")
		.trim();
}

/**
 * Função de busca inteligente e calibrada de destinos em Lajeado
 * Prioriza POIs calibrados com aliases, depois ruas cadastradas e por fim OpenStreetMap
 */
export async function buscarDestinosCalibrados(termo, listaRuas = []) {
	if (!termo || termo.trim().length < 2) {
		return [];
	}

	const tNorm = normalizarTexto(termo);
	const tokens = tNorm.split(" ").filter((t) => t.length >= 2 && !/^\d+$/.test(t));
	const resultados = [];
	const idsVistos = new Set();

	// 1. Busca prioritária nos Marcos e Locais Oficiais de Lajeado (Univates, CEAT, HBB, etc.)
	for (const loc of LOCAIS_OFICIAIS_LAJEADO) {
		const nNorm = normalizarTexto(loc.nome);
		const dNorm = normalizarTexto(loc.detalhe);
		const aliasesNorm = (loc.aliases || []).map(normalizarTexto);

		// Match exato no alias ou substring forte
		const matchAlias = aliasesNorm.some(
			(a) => a === tNorm || a.includes(tNorm) || tNorm.includes(a)
		);
		const matchNome = nNorm.includes(tNorm) || tNorm.includes(nNorm);
		const matchDetalhe = dNorm.includes(tNorm);
		const matchTokens =
			tokens.length > 0 &&
			tokens.every(
				(tok) =>
					nNorm.includes(tok) ||
					dNorm.includes(tok) ||
					aliasesNorm.some((a) => a.includes(tok))
			);

		if (matchAlias || matchNome || matchDetalhe || matchTokens) {
			const idKey = `${loc.coords[0].toFixed(4)},${loc.coords[1].toFixed(4)}`;
			if (!idsVistos.has(idKey)) {
				idsVistos.add(idKey);
				resultados.push({
					nome: loc.nome,
					tipo: loc.tipo || "local",
					detalhe: loc.detalhe,
					coords: loc.coords,
					cota: loc.cota || null,
					prioridade: matchAlias ? 1 : 2,
				});
			}
		}
	}

	// 2. Busca na base de Ruas de Lajeado
	for (const rua of listaRuas) {
		const rNorm = normalizarTexto(rua.nome || "");
		const bNorm = normalizarTexto(rua.bairro || "");

		const matchDireto = rNorm.includes(tNorm) || tNorm.includes(rNorm);
		const matchTokens =
			tokens.length > 0 &&
			tokens.every((tok) => rNorm.includes(tok) || bNorm.includes(tok));

		if (matchDireto || matchTokens) {
			// Extrai coordenadas reais da rua (suporta coords, pontos, latitude_inicio ou json)
			let coordsRua = null;
			if (rua.coords && Array.isArray(rua.coords) && rua.coords.length === 2) {
				coordsRua = rua.coords;
			} else if (rua.pontos && Array.isArray(rua.pontos) && rua.pontos[0]) {
				coordsRua = rua.pontos[0];
			} else if (rua.latitude_inicio && rua.longitude_inicio) {
				coordsRua = [rua.latitude_inicio, rua.longitude_inicio];
			} else if (rua.coordenadas_json) {
				try {
					const j = JSON.parse(rua.coordenadas_json);
					if (Array.isArray(j) && j[0]?.coords?.[0]) {
						coordsRua = j[0].coords[0];
					}
				} catch (e) {}
			}

			if (coordsRua) {
				const idKey = `${coordsRua[0].toFixed(4)},${coordsRua[1].toFixed(4)}`;
				if (!idsVistos.has(idKey)) {
					idsVistos.add(idKey);
					resultados.push({
						nome: rua.nome,
						tipo: "rua",
						detalhe: rua.bairro ? `Bairro ${rua.bairro}` : "Lajeado - RS",
						coords: coordsRua,
						cota: rua.cota_bloqueio || rua.altitude_min || rua.cota || null,
						prioridade: 3,
					});
				}
			}
		}
	}

	// Ordena por prioridade (POIs calibrados primeiro)
	resultados.sort((a, b) => (a.prioridade || 99) - (b.prioridade || 99));

	if (resultados.length >= 4) {
		return resultados.slice(0, 8);
	}

	// 3. Fallback online (OpenStreetMap Nominatim limitado estritamente à área de Lajeado)
	try {
		const url = `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(
			tNorm + ", Lajeado, RS, Brasil"
		)}&limit=4&viewbox=-52.05,-29.40,-51.90,-29.52&bounded=1`;
		const resp = await fetch(url, {
			headers: { "Accept-Language": "pt-BR" },
		});
		if (resp.ok) {
			const dados = await resp.json();
			for (const d of dados) {
				const lat = parseFloat(d.lat);
				const lon = parseFloat(d.lon);
				const idKey = `${lat.toFixed(4)},${lon.toFixed(4)}`;
				if (!idsVistos.has(idKey)) {
					idsVistos.add(idKey);
					resultados.push({
						nome: d.display_name.split(",")[0],
						tipo: "endereco",
						detalhe: d.display_name,
						coords: [lat, lon],
						cota: null,
						prioridade: 4,
					});
				}
			}
		}
	} catch (err) {
		console.warn("Erro ao buscar no Nominatim:", err);
	}

	return resultados.slice(0, 8);
}
