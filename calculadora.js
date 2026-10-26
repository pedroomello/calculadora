// =====================================================================
// CALCULADORA
//
// Este arquivo faz as contas e mostra o resultado na tela.
// Os números das taxas vêm do arquivo taxas.js.
//
// Partes do arquivo:
//   1. Funções de ajuda (ler números, mostrar dinheiro)
//   2. As regras de cada marketplace
//   3. Contas que servem para todos (preço mínimo, armadilha)
//   4. Ler o que a pessoa digitou
//   5. Mostrar na tela
//   6. Ligar tudo
// =====================================================================


// ---------------------------------------------------------------------
// 1. FUNÇÕES DE AJUDA
// ---------------------------------------------------------------------

// Transforma o que a pessoa digitou ("49,90", "R$ 1.299,00") em número.
// Se não der para entender, devolve NaN ("não é um número").
function lerValor(texto) {
  let limpo = texto.replace("R$", "").replace("%", "").replace(/\s/g, "");
  if (limpo === "") return NaN;

  // No Brasil a vírgula separa os centavos e o ponto separa os milhares.
  if (limpo.includes(",")) {
    limpo = limpo.replace(/\./g, "").replace(",", ".");
  }

  // Só aceita números de verdade (ex.: 49.9). Recusa coisas como "4a9".
  if (!/^\d+(\.\d+)?$/.test(limpo)) return NaN;
  return parseFloat(limpo);
}

// Mostra um número como dinheiro: 49.9 vira "R$ 49,90".
function dinheiro(valor) {
  return valor.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
}

// Mostra uma fração como porcentagem: 0.125 vira "12,5%".
function porcentagem(valor) {
  return (valor * 100).toLocaleString("pt-BR", { maximumFractionDigits: 1 }) + "%";
}

// Arredonda para centavos, para não aparecer coisa como 4,4999999.
function centavos(valor) {
  return Math.round(valor * 100) / 100;
}

// Numa lista de faixas como [{ desde: 0 }, { desde: 80 }],
// devolve a última faixa cujo "desde" é menor ou igual ao preço.
function acharFaixa(faixas, preco) {
  let escolhida = faixas[0];
  faixas.forEach(function (faixa) {
    if (preco >= faixa.desde) escolhida = faixa;
  });
  return escolhida;
}

// Mesma ideia, mas para uma lista de números como [79, 100, 120].
// Devolve a posição (0, 1, 2...) da coluna da tabela.
function acharColuna(inicios, preco) {
  let posicao = 0;
  inicios.forEach(function (inicio, i) {
    if (preco >= inicio) posicao = i;
  });
  return posicao;
}


// ---------------------------------------------------------------------
// 2. AS REGRAS DE CADA MARKETPLACE
//
// Cada marketplace tem:
//   nome:     como aparece no site
//   onde:     usado no título do extrato ("na Shopee", "no Magalu")
//   taxas:    recebe o preço e as opções e devolve a lista de
//             descontos, cada um com rótulo e valor
//   degraus:  preços em que a taxa "pula" (usado para achar armadilhas)
// ---------------------------------------------------------------------

const MARKETPLACES = {

  "shopee": {
    nome: "Shopee",
    onde: "na Shopee",
    taxas: function (preco, opcoes) {
      const t = TAXAS.shopee;
      const faixa = acharFaixa(t.faixas, preco);

      let taxaFixa = faixa.taxaFixa;
      if (preco < t.limiteItemBarato) taxaFixa = preco / 2;
      if (opcoes.cpfAltoVolume) taxaFixa = taxaFixa + t.extraCpfAltoVolume;

      return [
        { rotulo: "Comissão de " + porcentagem(faixa.comissao), valor: preco * faixa.comissao },
        { rotulo: "Taxa fixa por item", valor: taxaFixa },
      ];
    },
    degraus: function () {
      const t = TAXAS.shopee;
      return [t.limiteItemBarato].concat(t.faixas.slice(1).map(function (f) { return f.desde; }));
    },
  },

  "mercado-livre": {
    nome: "Mercado Livre",
    onde: "no Mercado Livre",
    taxas: function (preco, opcoes) {
      const t = TAXAS.mercadoLivre;
      const tipo = opcoes.tipo === "premium" ? "Premium" : "Clássico";
      const linhas = [
        { rotulo: "Tarifa " + tipo + " de " + porcentagem(opcoes.comissao), valor: preco * opcoes.comissao },
      ];

      if (preco < t.precoFreteGratis) {
        const tabela = t.custoAbaixo79;
        let custo = tabela.valores[opcoes.peso][acharColuna(tabela.faixasPreco, preco)];
        // Na primeira faixa de preço, o custo nunca passa de metade do preço.
        if (preco < tabela.faixasPreco[1]) custo = Math.min(custo, preco / 2);
        linhas.push({ rotulo: "Custo por unidade", valor: custo });
      } else {
        const tabela = t.freteAcima79;
        linhas.push({
          rotulo: "Frete grátis (sua parte)",
          valor: tabela.valores[opcoes.peso][acharColuna(tabela.faixasPreco, preco)],
        });
      }
      return linhas;
    },
    degraus: function () {
      const t = TAXAS.mercadoLivre;
      return t.custoAbaixo79.faixasPreco.slice(1).concat(t.freteAcima79.faixasPreco);
    },
  },

  "amazon": {
    nome: "Amazon",
    onde: "na Amazon",
    taxas: function (preco, opcoes) {
      const t = TAXAS.amazon;
      const linhas = [
        { rotulo: "Comissão de " + porcentagem(opcoes.comissao), valor: Math.max(preco * opcoes.comissao, t.comissaoMinima) },
      ];
      if (opcoes.plano === "individual") {
        linhas.push({ rotulo: "Taxa do plano Individual", valor: t.taxaPlanoIndividual });
      }
      return linhas;
    },
    degraus: function () { return []; },
  },

  "magalu": {
    nome: "Magalu",
    onde: "no Magalu",
    taxas: function (preco, opcoes) {
      const t = TAXAS.magalu;
      const linhas = [
        { rotulo: "Comissão de " + porcentagem(opcoes.comissao), valor: preco * opcoes.comissao },
      ];
      if (preco > t.taxaFixaAcimaDe) {
        linhas.push({ rotulo: "Taxa fixa por venda", valor: t.taxaFixa });
      }
      return linhas;
    },
    degraus: function () { return [centavos(TAXAS.magalu.taxaFixaAcimaDe + 0.01)]; },
  },

  "tiktok-shop": {
    nome: "TikTok Shop",
    onde: "no TikTok Shop",
    taxas: function (preco, opcoes) {
      const t = TAXAS.tiktokShop;
      const faixa = acharFaixa(t.faixas, preco);
      const linhas = [
        { rotulo: "Comissão de " + porcentagem(faixa.comissao), valor: preco * faixa.comissao },
        { rotulo: "Taxa fixa por item", valor: faixa.taxaFixa },
      ];
      if (opcoes.programaFrete) {
        linhas.push({
          rotulo: "Programa de envio (" + porcentagem(t.programaFrete) + ")",
          valor: Math.min(preco * t.programaFrete, t.tetoProgramaFrete),
        });
      }
      return linhas;
    },
    degraus: function () {
      return TAXAS.tiktokShop.faixas.slice(1).map(function (f) { return f.desde; });
    },
  },

  "shein": {
    nome: "Shein",
    onde: "na Shein",
    taxas: function (preco) {
      return [
        { rotulo: "Comissão de " + porcentagem(TAXAS.shein.comissao), valor: preco * TAXAS.shein.comissao },
      ];
    },
    degraus: function () { return []; },
  },

  "outro": {
    nome: "Taxas",
    onde: "",
    taxas: function (preco, opcoes) {
      const linhas = [
        { rotulo: "Comissão de " + porcentagem(opcoes.comissao), valor: preco * opcoes.comissao },
      ];
      if (opcoes.taxaFixa > 0) {
        linhas.push({ rotulo: "Taxa fixa por venda", valor: opcoes.taxaFixa });
      }
      return linhas;
    },
    degraus: function () { return []; },
  },
};


// ---------------------------------------------------------------------
// 3. CONTAS QUE SERVEM PARA TODOS OS MARKETPLACES
// ---------------------------------------------------------------------

// Lista de descontos com cada valor já arredondado para centavos.
function calcularDescontos(lugar, preco, opcoes) {
  return MARKETPLACES[lugar].taxas(preco, opcoes).map(function (linha) {
    return { rotulo: linha.rotulo, valor: centavos(linha.valor) };
  });
}

// Quanto cai na conta do vendedor (preço menos as taxas).
function calcularRepasse(lugar, preco, opcoes) {
  let total = 0;
  calcularDescontos(lugar, preco, opcoes).forEach(function (linha) {
    total = total + linha.valor;
  });
  return centavos(preco - total);
}

// Os "pedaços" de preço entre um degrau e outro.
// Dentro de cada pedaço, cobrar mais sempre faz receber mais.
function pedacosDePreco(lugar) {
  const degraus = MARKETPLACES[lugar].degraus().slice().sort(function (a, b) { return a - b; });
  const inicios = [0.01].concat(degraus);
  return inicios.map(function (inicio, i) {
    const proximo = inicios[i + 1];
    return { de: inicio, ate: proximo === undefined ? null : centavos(proximo - 0.01) };
  });
}

// Procura, centavo por centavo (de um jeito rápido), o primeiro preço
// entre "de" e "ate" em que a condição fica verdadeira.
function primeiroPreco(de, ate, condicao) {
  let baixo = Math.round(de * 100);
  let alto = Math.round(ate * 100);
  while (baixo < alto) {
    const meio = Math.floor((baixo + alto) / 2);
    if (condicao(meio / 100)) alto = meio;
    else baixo = meio + 1;
  }
  return baixo / 100;
}

// Menor preço a partir de "inicio" em que a condição é verdadeira.
// Se não existir (por exemplo, comissão de 100%), devolve null.
function procurarPreco(lugar, inicio, condicao) {
  const pedacos = pedacosDePreco(lugar);
  for (let i = 0; i < pedacos.length; i++) {
    const pedaco = pedacos[i];
    if (pedaco.ate !== null && pedaco.ate < inicio) continue;

    const de = Math.max(pedaco.de, inicio);
    // O último pedaço não tem fim. Usamos um teto bem alto.
    const ate = pedaco.ate !== null ? pedaco.ate : Math.max(de, 1) * 1000;

    if (condicao(ate)) return primeiroPreco(de, ate, condicao);
  }
  return null;
}

// Menor preço em que a venda não dá prejuízo.
function calcularPrecoMinimo(lugar, custos, opcoes) {
  return procurarPreco(lugar, 0.01, function (preco) {
    return calcularRepasse(lugar, preco, opcoes) - custos >= 0;
  });
}

// "Armadilha" de preço: logo depois de um degrau a taxa pula tanto que
// o vendedor recebe MENOS do que cobrando um pouquinho abaixo.
// Se o preço cair nessa zona, devolve um aviso. Senão, devolve null.
function verificarArmadilha(lugar, preco, opcoes) {
  const repasseAgora = calcularRepasse(lugar, preco, opcoes);
  let melhor = null;

  MARKETPLACES[lugar].degraus().forEach(function (degrau) {
    if (degrau > preco) return;
    const precoAbaixo = centavos(degrau - 0.01);
    const repasse = calcularRepasse(lugar, precoAbaixo, opcoes);
    if (repasse > repasseAgora && (melhor === null || repasse > melhor.repasse)) {
      melhor = { preco: precoAbaixo, repasse: repasse };
    }
  });

  if (melhor === null) return null;

  melhor.compensaEm = procurarPreco(lugar, preco, function (p) {
    return calcularRepasse(lugar, p, opcoes) >= melhor.repasse;
  });
  return melhor;
}


// ---------------------------------------------------------------------
// 4. LER O QUE A PESSOA DIGITOU
// ---------------------------------------------------------------------

// Atalho para pegar um elemento da página pelo id.
function el(id) {
  return document.getElementById(id);
}

function mostrarErro(campo, mensagem) {
  el("erro-" + campo).textContent = mensagem;
  el(campo).setAttribute("aria-invalid", mensagem ? "true" : "false");
}

// Lê um campo de porcentagem ("12" ou "12,5") e devolve 0.12 ou 0.125.
// Se estiver errado, mostra o erro e devolve null.
function lerPorcentagem(campo) {
  const valor = lerValor(el(campo).value);
  if (isNaN(valor) || valor >= 100) {
    mostrarErro(campo, "Digite a comissão em %, como 12 ou 12,5.");
    return null;
  }
  mostrarErro(campo, "");
  return valor / 100;
}

// Qual marketplace está marcado.
function lugarEscolhido() {
  return document.querySelector('input[name="lugar"]:checked').value;
}

// Junta as opções extras de cada marketplace num objeto só.
// Devolve null se algum campo estiver errado.
function lerOpcoes(lugar) {
  if (lugar === "shopee") {
    return { cpfAltoVolume: el("shopee-cpf").checked };
  }
  if (lugar === "mercado-livre") {
    const comissao = lerPorcentagem("ml-comissao");
    if (comissao === null) return null;
    return { tipo: el("ml-tipo").value, comissao: comissao, peso: Number(el("ml-peso").value) };
  }
  if (lugar === "amazon") {
    const comissao = lerPorcentagem("amazon-comissao");
    if (comissao === null) return null;
    return { comissao: comissao, plano: el("amazon-plano").value };
  }
  if (lugar === "magalu") {
    const comissao = lerPorcentagem("magalu-comissao");
    if (comissao === null) return null;
    return { comissao: comissao };
  }
  if (lugar === "tiktok-shop") {
    return { programaFrete: el("tiktok-frete").checked };
  }
  if (lugar === "outro") {
    const comissao = lerPorcentagem("outro-comissao");
    const textoFixa = el("outro-fixa").value;
    const taxaFixa = textoFixa.trim() === "" ? 0 : lerValor(textoFixa);
    mostrarErro("outro-fixa", isNaN(taxaFixa) ? "Digite só números, como 5 ou 5,50." : "");
    if (comissao === null || isNaN(taxaFixa)) return null;
    return { comissao: comissao, taxaFixa: taxaFixa };
  }
  return {};
}


// ---------------------------------------------------------------------
// 5. MOSTRAR NA TELA
// ---------------------------------------------------------------------

// Mostra só os campos extras do marketplace escolhido.
function mostrarCamposDoLugar(lugar) {
  document.querySelectorAll(".extras").forEach(function (bloco) {
    bloco.hidden = bloco.dataset.lugar !== lugar;
  });
}

// Desenha as linhas de desconto no extrato.
function desenharDescontos(descontos) {
  const caixa = el("r-descontos");
  caixa.innerHTML = "";
  descontos.forEach(function (linha) {
    const div = document.createElement("div");
    div.className = "linha desconto";
    const dt = document.createElement("dt");
    dt.textContent = linha.rotulo;
    const dd = document.createElement("dd");
    dd.textContent = "− " + dinheiro(linha.valor);
    div.appendChild(dt);
    div.appendChild(dd);
    caixa.appendChild(div);
  });
}

function atualizar() {
  const lugar = lugarEscolhido();
  const nome = MARKETPLACES[lugar].nome;
  mostrarCamposDoLugar(lugar);
  el("nota-taxas").textContent = TAXAS[nomeNoArquivoDeTaxas(lugar)].nota;

  const textoPreco = el("preco").value;
  const textoCusto = el("custo").value;
  const textoOutros = el("outros").value;

  const preco = lerValor(textoPreco);
  const custo = textoCusto.trim() === "" ? 0 : lerValor(textoCusto);
  const outros = textoOutros.trim() === "" ? 0 : lerValor(textoOutros);

  // Confere se os números fazem sentido antes de calcular.
  let tudoCerto = true;
  mostrarErro("preco", "");
  mostrarErro("custo", "");
  mostrarErro("outros", "");

  if (textoPreco.trim() !== "" && (isNaN(preco) || preco <= 0)) {
    mostrarErro("preco", "Digite um preço maior que zero, como 49,90.");
    tudoCerto = false;
  }
  if (isNaN(custo)) {
    mostrarErro("custo", "Digite só números, como 20 ou 20,50.");
    tudoCerto = false;
  }
  if (isNaN(outros)) {
    mostrarErro("outros", "Digite só números, como 2 ou 2,50.");
    tudoCerto = false;
  }

  const opcoes = lerOpcoes(lugar);
  if (opcoes === null) tudoCerto = false;

  if (!tudoCerto || textoPreco.trim() === "") {
    el("resultado").hidden = true;
    el("vazio").hidden = false;
    return;
  }

  // As contas.
  const descontos = calcularDescontos(lugar, preco, opcoes);
  const repasse = calcularRepasse(lugar, preco, opcoes);
  const taxaTotal = centavos(preco - repasse);
  const custos = centavos(custo + outros);
  const lucro = centavos(repasse - custos);
  const margem = lucro / preco;

  // Extrato linha por linha.
  el("r-titulo").textContent = ("Extrato da venda " + MARKETPLACES[lugar].onde).trim();
  el("r-preco").textContent = dinheiro(preco);
  desenharDescontos(descontos);
  el("r-repasse").textContent = dinheiro(repasse);
  el("r-custos").textContent = "− " + dinheiro(custos);

  if (lucro >= 0) {
    el("r-lucro-rotulo").textContent = "Seu lucro";
    el("r-lucro").textContent = dinheiro(lucro);
    el("r-margem").textContent = porcentagem(Math.round(margem * 100) / 100) + " do preço";
  } else {
    el("r-lucro-rotulo").textContent = "Seu prejuízo";
    el("r-lucro").textContent = dinheiro(-lucro);
    el("r-margem").textContent = "você perde dinheiro nesta venda";
  }
  el("linha-lucro").classList.toggle("negativo", lucro < 0);

  // Barra "para onde vai o dinheiro".
  // Se der prejuízo, a barra mostra só taxas e custos (o lucro não existe).
  const base = lucro >= 0 ? preco : taxaTotal + custos;
  el("barra-taxa").style.width = (taxaTotal / base) * 100 + "%";
  el("barra-custo").style.width = (custos / base) * 100 + "%";
  el("barra-lucro").style.width = (Math.max(lucro, 0) / base) * 100 + "%";
  el("legenda-taxa").textContent = nome + " " + Math.round((taxaTotal / preco) * 100) + "%";
  el("legenda-custo").textContent = "Custos " + Math.round((custos / preco) * 100) + "%";
  el("legenda-lucro").textContent = "Você " + Math.max(Math.round(margem * 100), 0) + "%";

  // Preço mínimo para não ter prejuízo.
  const minimo = calcularPrecoMinimo(lugar, custos, opcoes);
  el("minimo").hidden = custos === 0;
  el("r-minimo").textContent = minimo === null ? "nenhum preço cobre essas taxas" : dinheiro(minimo);

  // Aviso de armadilha.
  const armadilha = verificarArmadilha(lugar, preco, opcoes);
  if (armadilha) {
    let texto =
      "Cobrando " + dinheiro(armadilha.preco) +
      " você recebe " + dinheiro(armadilha.repasse) + ", mais do que agora.";
    if (armadilha.compensaEm !== null) {
      texto += " Se quiser cobrar mais que isso, cobre pelo menos " + dinheiro(armadilha.compensaEm) + ".";
    }
    el("aviso-texto").textContent = texto;
    el("aviso").hidden = false;
  } else {
    el("aviso").hidden = true;
  }

  el("vazio").hidden = true;
  el("resultado").hidden = false;
}

// No site, os nomes têm hífen ("mercado-livre"). No taxas.js, não ("mercadoLivre").
function nomeNoArquivoDeTaxas(lugar) {
  const nomes = {
    "shopee": "shopee", "mercado-livre": "mercadoLivre", "amazon": "amazon",
    "magalu": "magalu", "tiktok-shop": "tiktokShop", "shein": "shein", "outro": "outro",
  };
  return nomes[lugar];
}


// ---------------------------------------------------------------------
// 6. LIGAR TUDO
// ---------------------------------------------------------------------

// Transforma 0.17 em "17" e 0.125 em "12,5" para colocar num campo.
function paraCampo(fracao) {
  return String(Math.round(fracao * 1000) / 10).replace(".", ",");
}

// Preenche os campos com os valores padrão que estão no taxas.js.
function preencherPadroes() {
  el("ml-comissao").value = paraCampo(TAXAS.mercadoLivre.comissaoClassico);
  el("amazon-comissao").value = paraCampo(TAXAS.amazon.comissaoPadrao);
  el("magalu-comissao").value = paraCampo(TAXAS.magalu.comissaoPadrao);

  TAXAS.mercadoLivre.pesos.forEach(function (peso, i) {
    const opcao = document.createElement("option");
    opcao.value = i;
    opcao.textContent = peso;
    el("ml-peso").appendChild(opcao);
  });
}

// Se o endereço terminar com #mercado-livre, já abre com ele marcado.
// Assim dá para mandar um link direto para cada marketplace.
function lerEndereco() {
  const lugar = location.hash.replace("#", "");
  const opcao = document.querySelector('input[name="lugar"][value="' + lugar + '"]');
  if (lugar && opcao) opcao.checked = true;
}

preencherPadroes();
lerEndereco();

// Recalcula toda vez que a pessoa digita, escolhe ou marca algo.
document.querySelector(".entradas").addEventListener("input", atualizar);
document.querySelector(".entradas").addEventListener("change", atualizar);

// Trocou o marketplace: atualiza o endereço da página.
document.querySelectorAll('input[name="lugar"]').forEach(function (opcao) {
  opcao.addEventListener("change", function () {
    try {
      history.replaceState(null, "", "#" + opcao.value);
    } catch (e) {
      // Alguns navegadores não deixam mudar o endereço de arquivos locais.
    }
  });
});

// Trocou Clássico/Premium: preenche a tarifa padrão daquele tipo.
el("ml-tipo").addEventListener("change", function () {
  const padrao = el("ml-tipo").value === "premium"
    ? TAXAS.mercadoLivre.comissaoPremium
    : TAXAS.mercadoLivre.comissaoClassico;
  el("ml-comissao").value = paraCampo(padrao);
  atualizar();
});

el("data-taxas").textContent = TAXAS.conferidoEm;
atualizar();
