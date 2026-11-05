# Extensão QA Analytics - Correlação SIGC

Faz a correlação entre o log FVP analisado no validador e o teste cadastrado no
**SIGC Retestes**, usando a tela do SIGC (sem API e sem token). A extensão usa a
sessão que você já tem logada no navegador e não grava nenhum dado.

## Instalação (Chrome ou Edge)

1. Baixe o projeto em https://github.com/alanteixeira87/Ferramento-de-valida-o
   (botão **Code** → **Download ZIP**) e extraia o ZIP numa pasta fixa do computador.
   Não apague nem mova essa pasta depois: o navegador carrega a extensão a partir dela.
2. Abra `chrome://extensions` (ou `edge://extensions`).
3. Ative o **Modo do desenvolvedor**.
4. Clique em **Carregar sem compactação** e selecione a pasta `extensao-sigc` do projeto extraído.
5. Abra o validador em https://alanteixeira87.github.io/Ferramento-de-valida-o/ e atualize a página (F5).
6. Faça login no SIGC no mesmo navegador.

Se o validador for aberto direto do arquivo (`file:///.../index.html`), clique em
**Detalhes** na extensão e ative **Permitir acesso a URLs de arquivo**.

### Atualizar a extensão

Quando houver versão nova: baixe o ZIP de novo, substitua os arquivos da pasta
`extensao-sigc`, clique em **recarregar (↻)** na extensão em `chrome://extensions` e
atualize as abas do validador e do SIGC.

O validador também é reconhecido em `localhost`, `127.0.0.1` e `*.github.io`.
Se ele estiver hospedado em outro endereço, inclua esse endereço em
`manifest.json` → `content_scripts` → segundo bloco `matches`.

## Uso

1. Faça login no SIGC e abra a tela de **Retestes**. Se ela não estiver aberta,
   a extensão abre uma aba nova.
2. No validador, importe os ZIPs normalmente.
3. Clique em **Conferir no SIGC** no card do teste, ou em **Conferir todos no SIGC**.
4. A extensão vai até a aba do SIGC, preenche o filtro **Service Desk**, clica no
   olho (**Verificar**), lê o pop-up e volta para o validador com a comparação.
5. A extensão não clica em mais nada: o pop-up do teste fica aberto no SIGC. Use o
   botão **Ir para o SIGC** no card para voltar a ele e seguir com o preenchimento.
   Em teste de **Reteste**, o botão é **Ir para o Service Desk** e abre a lista de chamados
   (https://servicedesk.openfinancebrasil.org.br/HelpDesk.jsp?fromId=List&showFirstPage=true)
   em nova aba, para responder o chamado com o texto copiado.
6. Reteste com divergência (campo marcado como erro) fica **bloqueado**: o texto para o Service
   Desk não é exibido e o botão **Ir para o Service Desk** fica desabilitado. Corrija os dados no
   SIGC e clique de novo em **Ler Reteste** (ou **Conferir no SIGC**): a conferência sem divergência
   libera o Service Desk. Em Qualidade e Execução, o botão continua sendo **Ir para o SIGC**.

### Leitura do pop-up aberto (Reteste, Qualidade e Execução)

Todo card tem três botões de leitura, um para cada módulo do SIGC:

| Botão              | Tela do SIGC lida                          |
|--------------------|--------------------------------------------|
| **Ler Reteste**    | Retestes (`/retestes/...`)                 |
| **Ler Qualidade**  | Qualidade (`/qualidade/...`)               |
| **Ler Execução**   | Execução de Testes (`/execucao_testes/...`) |

1. No SIGC, abra a tela do módulo e abra o pop-up do teste executado.
2. No validador, clique no botão de leitura do mesmo módulo.
3. A extensão lê o pop-up aberto (sem pesquisar e sem trocar de aba) e mostra a comparação.

- Teste com SD Ticket: o pop-up só é aceito se o Service Desk for o mesmo do log.
- Teste de grupo (sem SD Ticket): o pop-up aberto é lido como está. Confira se é o teste certo.
  Em "Todos os campos lidos do pop-up" aparecem todos os rótulos e valores encontrados.
- Se o pop-up não for reconhecido, a mensagem traz um `[Diagnóstico: …]` com os rótulos vistos
  na tela, para ajustar a leitura em `sigc-content.js`.

A busca automática (**Conferir no SIGC** e **Conferir todos no SIGC**) só existe para testes
com SD e só na tela de Retestes.

## O que é comparado

| Campo           | Log (FVP)         | SIGC (pop-up)            | Divergência |
|-----------------|-------------------|--------------------------|-------------|
| SD Ticket       | `sdTicket`        | Service Desk             | erro        |
| Ciclo           | `cycle`           | Ciclo                    | erro        |
| AS-ID           | AS-ID oficial     | AS-ID                    | erro        |
| Alias           | alias             | Aliás                    | erro        |
| Test_ID         | Test ID           | 1ª/2ª/3ª Tentativa       | erro        |
| Segmento        | PF/PJ detectado   | Segmento                 | erro        |
| Teste principal | Test Name         | Teste Principal          | alerta      |
| Instituição     | marca do AS-ID    | Nome Instituição         | alerta      |

## Observações

- Log com mais de um SD Ticket (ex.: `001, 002`): o teste é aprovado quando o SD do SIGC é
  **qualquer um** deles (SIGC `001` ou `002` confere). A busca e a leitura do pop-up tentam cada
  SD do log, na ordem, até achar o teste. **Ir para o Service Desk** copia o SD **do SIGC** (já
  validado contra o log) antes de abrir a página, para colar direto na busca do chamado. O SD do
  log serve só para a validação: se o SIGC não informar o SD, nada é copiado.

- Os filtros da tela do SIGC continuam valendo. Por exemplo, com **Validação = Não**,
  testes já validados não aparecem na lista. Ajuste os filtros de data e
  validação antes de rodar o lote, se precisar.
- Quando houver mais de um teste com o mesmo SD, a extensão escolhe a linha cujo
  "Testes Executados" mais se parece com o Test Name do log e avisa no card.
- Os campos são localizados pelo texto dos rótulos ("Service Desk:", "AS-ID:", etc.).
  Se a tela do SIGC for alterada e os rótulos mudarem, ajuste os nomes em
  `sigc-content.js` (função `readPopup`).
