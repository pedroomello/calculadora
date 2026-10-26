// =====================================================================
// TAXAS DE CADA MARKETPLACE
//
// Quando algum marketplace mudar as taxas, você só precisa mexer NESTE
// arquivo. O resto do site lê os números daqui.
//
// Como ler os números:
//   0.20 significa 20%      0.14 significa 14%
//   4.50 significa R$ 4,50  (use ponto, não vírgula, aqui no código)
//
// Sempre confira no painel de vendedor de cada marketplace antes de
// atualizar, e troque a data em "conferidoEm".
//
// IMPORTANTE: o texto explicativo no index.html (seção "Quanto cada
// marketplace cobra em 2026") tem os números escritos à mão.
// Quando mudar algo aqui, atualize lá também.
// =====================================================================

const TAXAS = {
  conferidoEm: "26/10/2026",

  // -------------------------------------------------------------------
  // SHOPEE
  // -------------------------------------------------------------------
  shopee: {
    nota: "Comissão por faixa de preço, em vigor desde 1º de outubro de 2026. Abaixo de R$ 9, a taxa fixa vira metade do preço do item.",

    // "desde" é o preço a partir do qual a faixa começa a valer.
    faixas: [
      { desde: 0,   comissao: 0.20, taxaFixa: 4.50 },
      { desde: 80,  comissao: 0.14, taxaFixa: 16 },
      { desde: 100, comissao: 0.14, taxaFixa: 20 },
      { desde: 200, comissao: 0.14, taxaFixa: 26 },
    ],

    // Abaixo deste preço, a taxa fixa vira metade do preço do item.
    limiteItemBarato: 9,

    // Vendedor CPF com mais de 450 pedidos em 90 dias paga isto a mais por item.
    extraCpfAltoVolume: 3,
  },

  // -------------------------------------------------------------------
  // MERCADO LIVRE
  // -------------------------------------------------------------------
  mercadoLivre: {
    nota: "A tarifa de venda varia por categoria: Clássico de 10% a 14%, Premium de 15% a 19%. Os custos de envio são para reputação verde ou sem reputação. Com reputação amarela ou pior, o frete fica mais caro.",

    // Valor que já vem preenchido. A pessoa pode trocar no site.
    comissaoClassico: 0.12,
    comissaoPremium: 0.17,

    // A partir deste preço o frete grátis é obrigatório e você paga parte dele.
    precoFreteGratis: 79,

    // Pesos que aparecem na lista do site (a ordem casa com as tabelas abaixo).
    pesos: ["Até 300 g", "De 300 g a 500 g", "De 500 g a 1 kg", "De 1 kg a 1,5 kg", "De 1,5 kg a 2 kg", "De 2 kg a 3 kg"],

    // Abaixo de R$ 79: custo por unidade.
    // Colunas: até R$ 18,99 | de R$ 19 a R$ 48,99 | de R$ 49 a R$ 78,99
    custoAbaixo79: {
      faixasPreco: [0, 19, 49],
      valores: [
        [5.65, 6.85, 8.15],
        [5.95, 6.95, 8.25],
        [6.05, 7.15, 8.45],
        [6.15, 7.35, 8.65],
        [6.25, 7.45, 8.75],
        [6.35, 8.65, 9.15],
      ],
    },

    // A partir de R$ 79: parte do frete grátis que você paga.
    // Colunas: R$ 79 a 99,99 | 100 a 119,99 | 120 a 149,99 | 150 a 199,99 | 200 ou mais
    freteAcima79: {
      faixasPreco: [79, 100, 120, 150, 200],
      valores: [
        [12.95, 14.95, 16.95, 19.05, 21.65],
        [13.85, 16.15, 18.15, 20.45, 23.25],
        [14.45, 16.85, 19.05, 21.35, 24.45],
        [14.75, 17.15, 19.45, 21.75, 25.45],
        [15.05, 17.65, 19.85, 22.25, 25.55],
        [16.45, 19.15, 21.65, 24.35, 27.05],
      ],
    },
  },

  // -------------------------------------------------------------------
  // AMAZON
  // -------------------------------------------------------------------
  amazon: {
    nota: "A comissão varia por categoria (de 10% a 15%, mais ou menos) e também incide sobre o frete pago pelo comprador. O plano Profissional custa R$ 19 por mês e não cobra por item.",
    comissaoPadrao: 0.13,
    comissaoMinima: 1,      // a comissão nunca é menor que R$ 1 por item
    taxaPlanoIndividual: 2, // plano Individual: R$ 2 por item vendido
  },

  // -------------------------------------------------------------------
  // MAGALU
  // -------------------------------------------------------------------
  magalu: {
    nota: "O Magalu não publica uma tabela única. A comissão padrão fica em torno de 18%, e vendedores novos podem ter 9,9% nos primeiros meses. Confira a sua no painel.",
    comissaoPadrao: 0.18,
    taxaFixa: 5,            // por venda...
    taxaFixaAcimaDe: 10,    // ...quando o preço passa de R$ 10
  },

  // -------------------------------------------------------------------
  // TIKTOK SHOP
  // -------------------------------------------------------------------
  tiktokShop: {
    nota: "Tabela em vigor desde 15 de julho de 2026. O Programa de Taxas de Envio cobra 6% (até R$ 50 por produto), e a inscrição é automática.",
    faixas: [
      { desde: 0,  comissao: 0.10, taxaFixa: 4 },
      { desde: 50, comissao: 0.06, taxaFixa: 6 },
    ],
    programaFrete: 0.06,
    tetoProgramaFrete: 50,
  },

  // -------------------------------------------------------------------
  // SHEIN
  // -------------------------------------------------------------------
  shein: {
    nota: "Comissão de 16% sobre o preço já com descontos, sem taxa fixa por item. Vendedores novos com CNPJ ficam 90 dias sem comissão.",
    comissao: 0.16,
  },

  // -------------------------------------------------------------------
  // OUTRO (a pessoa digita as taxas)
  // -------------------------------------------------------------------
  outro: {
    nota: "Serve para qualquer lugar onde você vende: digite a comissão e a taxa fixa que aparecem no seu painel.",
  },
};
