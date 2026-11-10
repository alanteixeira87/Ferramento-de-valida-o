// -------------------------------------------------------------
// IMPORTAÇÃO DA ABA RETESTES DO SIGC (função separada, carregada depois do app.js)
// Um botão percorre a lista de Retestes do SIGC: para cada linha, a extensão clica no olho
// (Verificar), lê o pop-up, pega o link do log, baixa o log no FVP (sessão logada do navegador)
// e o validador processa o arquivo como se ele tivesse sido arrastado, já com a comparação do SIGC no card.
// Usa do app.js: processFiles, sigcPayloads, sigcPayloadSeq, sigcPendingRequests,
// renderSigcResult, sameSdTicket, sigcLinkTestId, isSigcExtensionReady, escapeHtml.
// -------------------------------------------------------------
(() => {
    const uploadSection = document.querySelector('#viewTests .upload-section');
    if (!uploadSection || typeof processFiles !== 'function') return;

    uploadSection.insertAdjacentHTML('afterbegin', `
        <div class="ispb-upload-card retest-import-card">
            <div>
                <strong>Retestes do SIGC</strong>
                <span id="retestImportStatus">Abre cada teste da aba Retestes do SIGC, baixa o log no FVP e já valida e compara com o SIGC.</span>
            </div>
            <button id="retestImportBtn" class="btn-primary" type="button">Trazer testes do Reteste</button>
        </div>
        <div id="retestImportList" class="retest-import-list" hidden></div>`);

    const button = document.getElementById('retestImportBtn');
    const statusEl = document.getElementById('retestImportStatus');
    const listEl = document.getElementById('retestImportList');
    const MAX_ROWS = 200;

    // Pedido à extensão; a resposta chega pelo mesmo canal da correlação SIGC (app.js).
    function extensionRequest(type, payload, timeoutMs = 120000) {
        return Promise.race([
            new Promise(resolve => {
                const requestId = `ret-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
                sigcPendingRequests[requestId] = resolve;
                window.postMessage({ source: 'qa-validator', type, requestId, payload }, '*');
            }),
            new Promise(resolve => setTimeout(() => resolve({
                ok: false,
                error: 'A extensão não respondeu. Recarregue a extensão (↻ em chrome://extensions), atualize (F5) a aba do SIGC e esta página e tente de novo.'
            }), timeoutMs))
        ]);
    }

    function showError(message) {
        statusEl.textContent = 'A importação não foi concluída. Veja o motivo abaixo.';
        listEl.hidden = false;
        listEl.insertAdjacentHTML('beforeend', `<div class="validation-box error retest-import-error"><div><strong>Trazer testes do Reteste:</strong> ${escapeHtml(message)}</div></div>`);
    }

    function base64ToBytes(base64) {
        const binary = atob(base64);
        const bytes = new Uint8Array(binary.length);
        for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);
        return bytes;
    }

    function addRow(index, fields, priority = false) {
        const info = [
            fields.nomeInstituicao && `<span><b>Instituição:</b> ${escapeHtml(fields.nomeInstituicao)}</span>`,
            fields.segmento && `<span><b>Segmento:</b> ${escapeHtml(fields.segmento)}</span>`,
            fields.testePrincipal && `<span><b>Teste:</b> ${escapeHtml(fields.testePrincipal)}</span>`,
            fields.responsavel && `<span><b>Responsável:</b> ${escapeHtml(fields.responsavel)}</span>`
        ].filter(Boolean).join('');
        listEl.hidden = false;
        listEl.insertAdjacentHTML('beforeend', `
            <div class="retest-import-row${priority ? ' is-priority' : ''}" data-index="${index}">
                <div class="retest-import-info">
                    <strong>SD ${escapeHtml(fields.serviceDesk || 'não informado')}${priority ? '<span class="badge badge-priority">Prioridade</span>' : ''}</strong>
                    <div class="retest-import-cols">${info}</div>
                </div>
                <div class="retest-import-actions">
                    <span class="retest-import-state pending">Na fila</span>
                </div>
            </div>`);
        return listEl.lastElementChild;
    }

    function setRowState(rowEl, text, state = 'pending') {
        const stateEl = rowEl.querySelector('.retest-import-state');
        stateEl.className = `retest-import-state ${state}`;
        stateEl.textContent = text;
    }

    function addRowAction(rowEl, html) {
        rowEl.querySelector('.retest-import-actions').insertAdjacentHTML('beforeend', html);
    }

    function answerButtonHtml(sd, testName) {
        return sd
            ? `<button type="button" class="btn-view-log retest-answer-sigc" data-sd="${escapeHtml(sd)}" data-test="${escapeHtml(testName || '')}" title="Abre o teste do SD ${escapeHtml(sd)} no SIGC Retestes, com o pop-up aberto para responder">Responder no SIGC</button>`
            : `<button type="button" class="btn-view-log" disabled title="O SIGC não informou o SD deste teste">Responder no SIGC</button>`;
    }

    // Vai para o teste no SIGC: busca o SD na tela de Retestes, abre o pop-up e fica no SIGC (não volta ao validador).
    async function answerInSigc(buttonEl) {
        if (!isSigcExtensionReady()) {
            buttonEl.title = 'A extensão "QA Analytics - Correlação SIGC" não está instalada ou ativa neste navegador.';
            buttonEl.textContent = 'Extensão inativa';
            return;
        }
        const sd = buttonEl.dataset.sd;
        const buttons = [...document.querySelectorAll(`.retest-answer-sigc[data-sd="${CSS.escape(sd)}"]`)];
        const setAll = (text, disabled) => buttons.forEach(b => { b.textContent = text; b.disabled = disabled; });
        setAll('Abrindo no SIGC...', true);
        const result = await extensionRequest('SIGC_CHECK', {
            sdTicket: sd,
            testName: buttonEl.dataset.test || '',
            module: 'retestes',
            skipManualWait: true,
            returnToValidator: false
        });
        if (result?.ok) {
            setAll('Responder no SIGC', false);
        } else {
            setAll('Não abriu: tentar de novo', false);
            buttons.forEach(b => { b.title = result?.error || 'Falha ao abrir o teste no SIGC.'; });
            statusEl.textContent = `Responder no SIGC (SD ${sd}): ${result?.error || 'falha ao abrir o teste no SIGC.'}`;
        }
    }

    // Um teste já lido do pop-up: links do log → log do FVP → card validado e comparado com o SIGC.
    async function importTest(lookup, rowEl) {
        const fields = lookup.fields || {};
        const sigcSd = String(fields.serviceDesk || '').split(/[,;/|]/)[0].replace(/\D/g, '');
        // Só o campo "Link Log" do pop-up (o "Link Evidência" continua sendo usado no texto do Service Desk).
        const logLinks = [...new Set((fields.linksLog || []).map(item => item.link).filter(Boolean))];
        if (!logLinks.length) {
            setRowState(rowEl, 'O pop-up do SIGC não tem o campo "Link Log" preenchido.', 'error');
            return {};
        }

        // Pacotes ZIP a validar: do SharePoint (arquivo ou pasta) ou, se o link for do FVP, a exportação do log.
        const packages = [];
        for (const link of logLinks) {
            const testId = sigcLinkTestId(link);
            if (testId && /fvp\.directory/i.test(link)) {
                setRowState(rowEl, `Baixando o log ${testId} no FVP...`);
                const log = await extensionRequest('FVP_LOG', { testId });
                if (!log?.ok) {
                    setRowState(rowEl, log?.error || 'O FVP não entregou o log.', 'error');
                    return { loginRequired: !!log?.loginRequired };
                }
                packages.push({ name: log.name, blob: new Blob([base64ToBytes(log.base64)], { type: 'application/zip' }) });
                continue;
            }

            setRowState(rowEl, 'Baixando os arquivos do Link Log (SharePoint)...');
            const share = await extensionRequest('SHAREPOINT_FILES', { link });
            if (!share?.ok) {
                setRowState(rowEl, share?.error || 'O SharePoint não entregou os arquivos do Link Log.', 'error');
                return { loginRequired: !!share?.loginRequired };
            }
            const files = (share.files || []).map(file => ({ name: file.name, bytes: base64ToBytes(file.base64) }));
            const zips = files.filter(file => /\.zip$/i.test(file.name));
            // ZIP sem extensão no nome (download direto): reconhece pela assinatura "PK".
            const unnamedZips = files.filter(file => !/\.zip$/i.test(file.name) && file.bytes[0] === 0x50 && file.bytes[1] === 0x4b);
            [...zips, ...unnamedZips].forEach(file => packages.push({ name: file.name, blob: new Blob([file.bytes], { type: 'application/zip' }) }));

            // Pasta com o log solto (HTML, JSON, prints): junta tudo num ZIP, como o export do FVP + evidências.
            const loose = files.filter(file => !zips.includes(file) && !unnamedZips.includes(file));
            if (loose.some(file => /\.html?$/i.test(file.name))) {
                const zip = new JSZip();
                loose.forEach(file => zip.file(file.name, file.bytes));
                packages.push({ name: `${share.name || 'Link Log'}.zip`, blob: await zip.generateAsync({ type: 'blob' }) });
            }
            if (share.warning) addRowAction(rowEl, `<span class="retest-import-state pending">${escapeHtml(share.warning)}</span>`);
        }
        if (!packages.length) {
            setRowState(rowEl, 'O Link Log não tem um ZIP nem o HTML do log do teste para validar.', 'error');
            return {};
        }

        const results = [];
        for (let i = 0; i < packages.length; i++) {
            const pack = packages[i];
            const progress = packages.length > 1 ? ` (${i + 1} de ${packages.length})` : '';
            const blob = pack.blob;
            const downloadUrl = URL.createObjectURL(blob);
            addRowAction(rowEl, `<a class="btn-view-log" href="${downloadUrl}" download="${escapeHtml(pack.name)}">Baixar ${escapeHtml(pack.name)}</a>`);

            setRowState(rowEl, `Validando o log${progress}...`);
            const fileName = [sigcSd && `SD ${sigcSd}`, fields.nomeInstituicao, pack.name].filter(Boolean).join(' - ');
            const seqBefore = sigcPayloadSeq;
            await processFiles([new File([blob], fileName, { type: 'application/zip' })]);
            if (sigcPayloadSeq === seqBefore) {
                setRowState(rowEl, 'O arquivo do FVP não pôde ser lido pelo validador (veja o card de erro).', 'error');
                return {};
            }

            // Card recém-criado: comparação com o SIGC usando o pop-up já lido, sem nova busca.
            const id = `sigc${sigcPayloadSeq}`;
            const payload = sigcPayloads[id];
            const container = document.getElementById(`sigc-result-${id}`);
            if (payload && container) {
                const ticket = (payload.sdTickets || []).find(t => sigcSd && sameSdTicket(t, sigcSd)) || payload.sdTicket || sigcSd;
                renderSigcResult(container, { ...payload, module: 'retestes', sdTicket: ticket }, lookup);
                const card = container.closest('.file-report');
                if (card) card.id = `retest-card-${id}`;
                addRowAction(rowEl, `<button type="button" class="btn-view-log retest-import-goto" data-card="retest-card-${id}">Ver card</button>`);
                // "Responder no SIGC": no cabeçalho do card (não é redesenhado nas novas conferências) e na lista.
                const answerButton = answerButtonHtml(sigcSd, fields.testePrincipal);
                card?.querySelector('.card-actions')?.insertAdjacentHTML('beforeend', answerButton);
                if (i === 0) addRowAction(rowEl, answerButton);
                results.push(card?.dataset.status === 'passed');
            }
        }

        const passed = results.length > 0 && results.every(Boolean);
        setRowState(rowEl, passed ? 'Validado: OK' : 'Validado: com falha', passed ? 'success' : 'error');
        return { done: true, passed };
    }

    async function importAll() {
        listEl.innerHTML = '';
        listEl.hidden = true;
        if (!isSigcExtensionReady()) {
            showError('A extensão "QA Analytics - Correlação SIGC" não está instalada ou ativa neste navegador (veja extensao-sigc/LEIAME.md).');
            return;
        }
        button.disabled = true;

        let ok = 0, failed = 0, errors = 0, total = 0;
        try {
            // 1ª etapa: abre o pop-up de cada linha e lê os dados (sem baixar nada ainda).
            const pending = [];
            for (let index = 0; index < MAX_ROWS; index++) {
                statusEl.textContent = total
                    ? `Lendo o teste ${index + 1} de ${total} no SIGC...`
                    : 'Lendo o primeiro teste da aba Retestes do SIGC...';
                const row = await extensionRequest('SIGC_ROW', { index });
                if (row?.total) total = row.total;
                if (row?.ok && row.done) break;
                if (!row?.ok) {
                    if (index === 0) { showError(row?.error || 'Não foi possível abrir os testes da aba Retestes.'); return; }
                    errors++;
                    showError(`Teste ${index + 1}: ${row?.error || 'falha ao abrir o pop-up.'}`);
                    continue;
                }

                const priority = window.isPriorityTest?.(row.fields?.testePrincipal) || false;
                const rowEl = addRow(index, row.fields || {}, priority);
                if (row.sameAsPrevious) {
                    errors++;
                    setRowState(rowEl, 'O pop-up não mudou em relação ao teste anterior (o clique no olho pode não ter funcionado). Teste não importado.', 'error');
                    continue;
                }
                setRowState(rowEl, priority ? 'Prioridade: será validado primeiro' : 'Lido; aguardando validação');
                pending.push({ row, rowEl, priority });
            }

            // 2ª etapa: testes de longa duração (Pix Scheduling, Retry, Verification) primeiro, no topo da lista.
            const ordered = [...pending.filter(item => item.priority), ...pending.filter(item => !item.priority)];
            ordered.forEach(item => listEl.appendChild(item.rowEl));
            const priorityCount = ordered.filter(item => item.priority).length;

            for (let i = 0; i < ordered.length; i++) {
                const { row, rowEl, priority } = ordered[i];
                statusEl.textContent = `Validando ${i + 1} de ${ordered.length}${priority ? ' (prioridade)' : ''}...`;
                const result = await importTest(row, rowEl);
                if (result.done) result.passed ? ok++ : failed++;
                else errors++;
                if (result.loginRequired) {
                    statusEl.textContent = 'Faça login na aba que foi aberta (SharePoint ou FVP) e clique em "Trazer testes do Reteste" de novo.';
                    return;
                }
            }
            statusEl.textContent = `Concluído: ${total} teste(s) da aba Retestes${priorityCount ? `, ${priorityCount} de prioridade validado(s) primeiro` : ''}. ${ok} OK, ${failed} com falha, ${errors} não importado(s).`;
        } finally {
            button.disabled = false;
        }
    }

    button.addEventListener('click', importAll);
    document.addEventListener('click', event => {
        const answer = event.target.closest('.retest-answer-sigc');
        if (answer && !answer.disabled) answerInSigc(answer);
    });
    listEl.addEventListener('click', event => {
        const goto = event.target.closest('.retest-import-goto');
        if (!goto) return;
        document.getElementById(goto.dataset.card)?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    });
})();
