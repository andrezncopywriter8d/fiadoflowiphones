# Prompt interno - Cadastro de Produto em Estoque (/lojadeiphone)

Objetivo: evoluir o cadastro de estoque da rota `/lojadeiphone` mantendo a identidade visual do Fiado V2, mas com profundidade operacional parecida com um ERP de loja de iPhone.

Regras de design:

- Manter fundo claro, cards brancos, bordas grandes, sombras suaves, botoes pill e cor principal roxo/azul premium.
- No desktop, usar formulario denso em duas colunas com labels alinhadas e campos compactos.
- No mobile, empilhar os campos sem gerar scroll horizontal visivel.
- Evitar textos explicativos longos dentro da interface; a tela deve parecer ferramenta de uso diario.

Funcionalidades obrigatorias:

- Alternar entre Aparelho, Acessorio e Peca no mesmo formulario.
- Salvar Aparelho em estoque de celulares e Peca/Acessorio em estoque de pecas.
- Calcular lucro, margem e mark-up automaticamente a partir de custo e venda.
- Validar tipo, nome/modelo e valor de venda antes de salvar.
- Permitir dados fiscais, fornecedor, garantia, estoque minimo, SKU, codigo de barras, serial e observacoes.
- Depois de salvar, limpar o formulario e atualizar tabelas/resumos imediatamente.

Criterios de aceite:

- O botao Salvar cria um item real e ele aparece na listagem da aba Pecas ou no estoque de celulares.
- O cadastro nao quebra o layout em 1366px, 1920px e mobile.
- O formulario nao exibe barras de rolagem horizontais feias.
- A base continua zerada para conta nova, sem seeds aparecendo no dashboard.
- A rota principal do Fiado continua independente da V2 `/lojadeiphone`.
