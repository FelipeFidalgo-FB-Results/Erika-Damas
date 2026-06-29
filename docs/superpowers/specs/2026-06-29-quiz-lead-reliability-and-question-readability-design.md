# Quiz Erika Damas: captura confiável e leitura das perguntas

Data: 2026-06-29
Status: design aprovado visualmente; aguardando revisão desta especificação

## Objetivo

Resolver dois problemas encontrados no quiz publicado:

1. O resultado aparece mesmo quando o envio do lead falha silenciosamente.
2. Os títulos das perguntas perdem legibilidade sobre algumas fotografias.

A solução deve preservar as imagens originais, a identidade visual aprovada e a planilha atual.

## Evidências do diagnóstico

- O endpoint atual do Google Apps Script respondeu normalmente.
- Um lead sintético autorizado foi recebido pela planilha.
- O cliente atual inicia um `fetch` em segundo plano e retorna sucesso imediatamente, sem aguardar a rede.
- Falhas do navegador são registradas apenas no console e não impedem a exibição do resultado.
- A planilha possui colunas dedicadas apenas para `p1` a `p10`; `p11` e `p12` ficam somente em `answers_json`.

## Solução aprovada

### 1. Captura confirmada pelo servidor

O navegador enviará o lead para uma função de mesma origem em `/api/lead`.

A função:

- aceitará somente `POST`;
- validará os campos essenciais e o tamanho da requisição;
- encaminhará o payload ao Google Apps Script;
- aguardará a resposta JSON do Apps Script;
- retornará sucesso apenas quando receber `ok: true`;
- devolverá erro controlado quando o serviço estiver indisponível;
- não registrará nome, e-mail, telefone ou respostas em logs.

O endpoint do Apps Script será configurável por `APPS_SCRIPT_LEAD_ENDPOINT`, mantendo o endpoint atual como fallback durante a migração.

### 2. Comportamento do formulário

Ao enviar:

1. O botão mostra `Enviando...` e fica temporariamente desabilitado.
2. O quiz aguarda a confirmação de `/api/lead`.
3. Somente depois de `ok: true` o evento `Lead` é disparado e o resultado é liberado.
4. Em caso de falha, os dados digitados permanecem no formulário e aparece uma mensagem curta com ação para tentar novamente.

Mensagem de erro:

> Não conseguimos salvar seus dados agora. Confira sua conexão e tente novamente.

Não haverá avanço silencioso nem envio direto de fallback pelo navegador, pois isso recriaria o risco de duplicidade.

### 3. Proteção contra duplicidade

O `lead_id` continuará sendo criado no navegador e será reutilizado quando a pessoa tentar novamente.

O Apps Script verificará a coluna `lead_id` antes de inserir uma linha:

- se o identificador ainda não existir, insere o lead;
- se já existir, retorna `ok: true` e `duplicate: true`, sem criar outra linha.

Isso protege o CRM quando a planilha recebe o dado, mas a resposta se perde durante o retorno.

### 4. Estrutura das 12 respostas

O Apps Script deixará de depender de posições fixas de coluna. Ele preencherá a linha usando os nomes do cabeçalho.

- As colunas existentes e os campos do CRM serão preservados.
- As colunas ausentes `p11` e `p12` serão acrescentadas ao final da planilha.
- `answers_json` continuará armazenando o conjunto completo como redundância.

### 5. Faixa rosé nas perguntas

As fotografias originais serão mantidas em todas as perguntas e no formulário.

O bloco composto por `Pergunta N` e pelo título receberá uma faixa editorial:

- fundo rosé terroso: `#B7654E`;
- título creme: `#FFFDF9`;
- etiqueta pequena em marrom profundo: `#180D09`, para contraste AA;
- filete lateral rosé claro: `#E8C8B7`;
- sem cantos arredondados, sombra ou aparência de card;
- faixa limitada à região do título, deixando a foto visível no restante da tela.

Tipografia:

- título: `Cormorant Garamond`, peso 500, `clamp(34px, 7.8vw, 46px)`, entrelinha `1.04`;
- etiqueta: `Inter`, 12px, peso 800, caixa alta;
- espaçamento de letras somente na etiqueta; título com `letter-spacing: 0`;
- quebra equilibrada, sem reduzir a fonte conforme a largura da viewport.

O título creme sobre o rosé possui contraste adequado para texto grande. A etiqueta usa marrom mais escuro para atingir contraste adequado em tamanho pequeno.

## Arquivos e limites da mudança

Fonte principal:

- `Quiz/build-lead-capture-html.js`
- `Quiz/apps-script-leads.gs`
- `Quiz/quiz-lead-capture.test.js`

Artefato gerado:

- `Quiz/index-leads.html`

Publicação:

- `Erika-Damas-github-deploy/index.html`
- `Erika-Damas-github-deploy/api/lead.js`

Não fazem parte desta mudança:

- copy dos resultados;
- lógica de pontuação;
- fotografias;
- CTA e FAQ dos resultados;
- estrutura comercial da planilha.

## Testes

### Automatizados

- O cliente usa `/api/lead` e aguarda a resposta.
- O resultado não é liberado quando a API responde com erro.
- O evento `Lead` ocorre somente após confirmação.
- Uma nova tentativa reutiliza o mesmo `lead_id`.
- A função rejeita métodos e payloads inválidos.
- O Apps Script mapeia `p1` a `p12` por cabeçalho.
- O CSS contém a faixa rosé e os estilos tipográficos aprovados.

### Visuais

- Conferir as 12 perguntas em 390 x 844 e 1280 x 900.
- Validar títulos curtos e longos sobre todas as fotografias.
- Confirmar que a faixa não cobre alternativas nem controles do topo.
- Confirmar ausência de overflow horizontal e sobreposições.

### Integração

- Testar sucesso real com lead sintético identificado.
- Simular falha da API e confirmar permanência no formulário.
- Repetir o mesmo `lead_id` e confirmar que apenas uma linha existe.
- Conferir `p11` e `p12` em colunas próprias.
- Validar o evento `Lead` apenas no fluxo confirmado.

## Publicação

1. Atualizar e republicar o Google Apps Script.
2. Publicar a função e o HTML no Vercel.
3. Executar um teste sintético na URL pública.
4. Conferir planilha, deduplicação, Pixel e responsividade.

As publicações externas exigem confirmação de Felipe no momento da ação.
