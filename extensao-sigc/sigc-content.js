// Automação da tela SIGC Retestes (Bubble.io).
// O Bubble não gera ids/classes estáveis, então os campos são localizados pelo
// texto do rótulo ("Service Desk:", "AS-ID:", ...) e pela posição na tela.
(() => {
    // Evita duas cópias ativas na mesma aba (o background reinjeta o script após recarregar a extensão).
    if (window.__qaSigcContent?.alive()) return;
    window.__qaSigcContent = { alive: () => !!chrome.runtime?.id };

    const POLL_MS = 300;
    // Tempo para o operador abrir o pop-up do teste manualmente antes da busca automática.
    const MANUAL_POPUP_MS = 10000;

    const sleep = (ms) => new Promise(r => setTimeout(r, ms));

    const normalizeText = (value) => String(value ?? '')
        .replace(/ /g, ' ')
        .replace(/\s+/g, ' ')
        .trim();

    const normalizeKey = (value) => normalizeText(value)
        .normalize('NFD').replace(/[̀-ͯ]/g, '')
        .replace(/:$/, '')
        .toLowerCase();

    const onlyDigits = (value) => String(value ?? '').replace(/\D/g, '');
    // Retestes podem ter mais de um SD Ticket ("245699, 243070"): vale o primeiro, antes da vírgula.
    const primaryTicket = (value) => onlyDigits(String(value ?? '').split(/[,;/|]/)[0]);

    function isVisible(el) {
        if (!el || !el.getClientRects().length) return false;
        const style = getComputedStyle(el);
        return style.visibility !== 'hidden' && style.display !== 'none' && Number(style.opacity) !== 0;
    }

    function textElements(root = document.body) {
        const result = [];
        const walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT, {
            acceptNode: node => normalizeText(node.nodeValue) ? NodeFilter.FILTER_ACCEPT : NodeFilter.FILTER_REJECT
        });
        let node;
        while ((node = walker.nextNode())) {
            const el = node.parentElement;
            if (el && !['SCRIPT', 'STYLE', 'OPTION'].includes(el.tagName) && isVisible(el)) {
                result.push({ el, text: normalizeText(node.nodeValue) });
            }
        }
        return result;
    }

    function findLabels(matcher, root = document.body) {
        const test = typeof matcher === 'string'
            ? (text) => normalizeKey(text) === normalizeKey(matcher)
            : (text) => matcher.test(normalizeKey(text));
        return textElements(root).filter(item => test(item.text)).map(item => item.el);
    }

    function readElementValue(el) {
        if (el.tagName === 'SELECT') return normalizeText(el.options[el.selectedIndex]?.text || '');
        if (el.tagName === 'INPUT' || el.tagName === 'TEXTAREA') return normalizeText(el.value || el.placeholder || '');
        return normalizeText(el.textContent);
    }

    function valueCandidates(root) {
        const fields = [...root.querySelectorAll('input, textarea, select')].filter(isVisible);
        const texts = textElements(root)
            .filter(item => !/:$/.test(item.text))
            .map(item => item.el)
            .filter(el => !el.closest('select'));
        return [...fields, ...texts];
    }

    // Campo com o rótulo em cima e o valor embaixo (layout do pop-up).
    function valueBelow(label, root) {
        const lr = label.getBoundingClientRect();
        let best = null;
        let bestScore = Infinity;
        for (const el of valueCandidates(root)) {
            if (el === label || el.contains(label) || label.contains(el)) continue;
            const r = el.getBoundingClientRect();
            const dy = r.top - lr.bottom;
            if (dy < -4 || dy > 45) continue;
            if (r.left > lr.left + 40 || r.right < lr.left + 2) continue;
            const score = Math.max(dy, 0) * 3 + Math.abs(r.left - lr.left);
            if (score < bestScore) { bestScore = score; best = el; }
        }
        return best;
    }

    // Campo com o rótulo à esquerda e o valor à direita (layout dos filtros).
    function inputRightOf(label, root = document.body) {
        const lr = label.getBoundingClientRect();
        const cy = lr.top + lr.height / 2;
        let best = null;
        let bestDx = Infinity;
        for (const el of root.querySelectorAll('input')) {
            if (!isVisible(el)) continue;
            const r = el.getBoundingClientRect();
            if (Math.abs((r.top + r.height / 2) - cy) > 20) continue;
            const dx = r.left - lr.right;
            if (dx < -5 || dx > 220) continue;
            if (dx < bestDx) { bestDx = dx; best = el; }
        }
        return best;
    }

    function textRightOf(label) {
        const lr = label.getBoundingClientRect();
        const cy = lr.top + lr.height / 2;
        let best = null;
        let bestDx = Infinity;
        for (const { el, text } of textElements()) {
            if (el === label) continue;
            const r = el.getBoundingClientRect();
            if (Math.abs((r.top + r.height / 2) - cy) > 20) continue;
            const dx = r.left - lr.right;
            if (dx < -5 || dx > 120) continue;
            if (dx < bestDx) { bestDx = dx; best = text; }
        }
        return best;
    }

    // Pop-up de "Verificar": o menor bloco visível que contém "AS-ID:" e "Teste Principal:".
    function findPopup() {
        for (const label of findLabels('AS-ID')) {
            let node = label.parentElement;
            while (node && node !== document.body) {
                if (findLabels('Teste Principal', node).length) return node;
                node = node.parentElement;
            }
        }
        return null;
    }

    // Pop-up da tela de Qualidade (grupo): o layout pode não ter "Teste Principal",
    // então vale o menor bloco em volta do "AS-ID:" que reúne vários rótulos.
    function findGroupPopup() {
        const strict = findPopup();
        if (strict) return strict;
        for (const label of findLabels('AS-ID')) {
            let node = label.parentElement;
            while (node && node !== document.body) {
                const labels = textElements(node).filter(item => /:$/.test(item.text));
                if (labels.length >= 5) return node;
                node = node.parentElement;
            }
        }
        return null;
    }

    // Todos os pares "Rótulo:" / valor do pop-up, para conferir telas com rótulos diferentes.
    function readAllPopupFields(popup) {
        return textElements(popup)
            .filter(item => /:$/.test(item.text))
            .map(item => {
                const el = valueBelow(item.el, popup);
                return { label: item.text.replace(/:$/, ''), valor: el ? readElementValue(el) : '' };
            });
    }

    function readPopupField(popup, labelText) {
        const [label] = findLabels(labelText, popup);
        if (!label) return '';
        const el = valueBelow(label, popup);
        return el ? readElementValue(el) : '';
    }

    // Link de uma evidência: aceita <a href>, campo de texto com a URL ou texto simples.
    function linkValue(el) {
        const anchor = el.tagName === 'A' ? el : (el.closest('a[href]') || el.querySelector?.('a[href]'));
        if (anchor?.href && !/^javascript:/i.test(anchor.href)) return anchor.href;
        return readElementValue(el);
    }

    // Valor da evidência embaixo do rótulo ou à direita dele, na mesma linha.
    function evidenceValueNear(label, popup) {
        const lr = label.getBoundingClientRect();
        const candidates = [
            ...[...popup.querySelectorAll('input, textarea, a[href]')].filter(isVisible),
            ...textElements(popup).filter(item => !/:$/.test(item.text)).map(item => item.el)
        ];
        let best = null;
        let bestScore = Infinity;
        for (const el of candidates) {
            if (el === label || el.contains(label) || label.contains(el)) continue;
            const r = el.getBoundingClientRect();
            const dy = r.top - lr.bottom;
            const below = dy >= -4 && dy <= 45 && r.left <= lr.left + 40 && r.right >= lr.left + 2;
            const right = Math.abs((r.top + r.height / 2) - (lr.top + lr.height / 2)) <= 14 && r.left >= lr.right - 5 && r.left - lr.right <= 400;
            if (!below && !right) continue;
            const score = below ? Math.max(dy, 0) * 3 + Math.abs(r.left - lr.left) : (r.left - lr.right);
            if (score < bestScore) { bestScore = score; best = el; }
        }
        return best;
    }

    // Links de evidência do pop-up ("Link Evidência 1", "Evidência 2", ...).
    // As evidências podem ficar fora do bloco do AS-ID: sobe pelos blocos do pop-up até achar os rótulos.
    // No SIGC os rótulos são "Link Evidência:" repetidos (sem número): a numeração segue a ordem na tela.
    // "Evidência:" sozinho é o grupo Imagem/Vídeo/Assistida e não entra. Campo vazio aparece como "-".
    function readEvidenceLinks(popup) {
        const pattern = /^link\s*(d[aeo]s?\s*)?evidencias?(\s*\d+)?$|^evidencias?\s*\d+$/;
        let scope = popup;
        let labels = [];
        while (scope) {
            labels = findLabels(pattern, scope);
            if (labels.length || scope === document.body) break;
            scope = scope.parentElement;
        }
        return labels
            .sort((a, b) => a.getBoundingClientRect().top - b.getBoundingClientRect().top)
            .map((label, i) => {
                const el = evidenceValueNear(label, scope);
                const link = el ? linkValue(el) : '';
                return { nome: `Evidência ${i + 1}`, link: /^[\s\-–—]*$/.test(link) ? '' : link };
            });
    }

    // Campo "Observações" do pop-up, mantendo as quebras de linha. Vazio ou "-" vira "".
    function readObservations(popup) {
        let scope = popup;
        let label = null;
        while (scope && !label) {
            [label] = findLabels(/^(observac(ao|oes)|obs)$/, scope);
            if (scope === document.body) break;
            if (!label) scope = scope.parentElement;
        }
        if (!label) return '';
        const el = evidenceValueNear(label, scope);
        if (!el) return '';
        const raw = el.tagName === 'INPUT' || el.tagName === 'TEXTAREA' ? el.value : el.innerText;
        const text = String(raw || '').replace(/\r/g, '').replace(/[ \t ]+/g, ' ').replace(/\n{3,}/g, '\n\n').trim();
        return /^[\s\-–—]*$/.test(text) ? '' : text;
    }

    // Textos com "evid" e links visíveis na tela, para ajustar a leitura quando nenhum link é encontrado.
    function evidenceDiagnostics() {
        const texts = [...new Set(textElements().map(item => item.text).filter(text => /evid/i.test(normalizeKey(text))))];
        const links = [...document.querySelectorAll('a[href]')].filter(isVisible)
            .map(a => a.href).filter(href => /^https?:/i.test(href) && !/sigc\.com\.br/i.test(href));
        return `textos com "evid": ${texts.slice(0, 10).join(' | ') || 'nenhum'}; links externos visíveis: ${links.length}`;
    }

    function readPopup(popup) {
        const testIds = findLabels(/^\d\s*[ºª°o]?\s*tentativa$/, popup)
            .map(label => {
                const el = valueBelow(label, popup);
                return { tentativa: normalizeText(label.textContent).replace(/:$/, ''), valor: el ? readElementValue(el) : '' };
            })
            .filter(item => item.valor);
        const evidencias = readEvidenceLinks(popup);

        return {
            nomeInstituicao: readPopupField(popup, 'Nome Instituição'),
            segmento: readPopupField(popup, 'Segmento'),
            alias: readPopupField(popup, 'Aliás'),
            asId: readPopupField(popup, 'AS-ID'),
            responsavel: readPopupField(popup, 'Responsável'),
            ciclo: readPopupField(popup, 'Ciclo'),
            grupo: readPopupField(popup, 'Grupo'),
            serviceDesk: readPopupField(popup, 'Service Desk'),
            sla: readPopupField(popup, 'SLA'),
            tipoTeste: readPopupField(popup, 'Tipo Teste'),
            testePrincipal: readPopupField(popup, 'Teste Principal'),
            status: readPopupField(popup, 'Status'),
            resultado: readPopupField(popup, 'Resultado'),
            statusTeste: readPopupField(popup, 'Status Teste'),
            dataExecucao: readPopupField(popup, /^data execucao( teste)?$/),
            testIds,
            evidencias,
            evidenciasDiag: evidencias.some(item => item.link) ? '' : evidenceDiagnostics(),
            observacoes: readObservations(popup)
        };
    }

    // Pop-up aberto manualmente pelo operador: vale se o Service Desk dele contém o ticket.
    // Se o Service Desk não pôde ser lido, vale quando o AS-ID já carregou; outro SD é recusado.
    function manualPopupFor(ticket, finder = findPopup) {
        const popup = finder();
        if (!popup) return null;
        const tickets = readPopupField(popup, 'Service Desk').split(/[,;/|]/).map(onlyDigits).filter(Boolean);
        if (tickets.length) return tickets.includes(ticket) ? popup : null;
        return readPopupField(popup, 'AS-ID') ? popup : null;
    }

    function setInputValue(input, value) {
        const setter = Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, 'value').set;
        input.focus();
        setter.call(input, value);
        input.dispatchEvent(new Event('input', { bubbles: true }));
        input.dispatchEvent(new KeyboardEvent('keyup', { bubbles: true, key: 'Enter' }));
        input.dispatchEvent(new Event('change', { bubbles: true }));
        input.blur();
        input.dispatchEvent(new FocusEvent('focusout', { bubbles: true }));
    }

    function clickElement(el) {
        const r = el.getBoundingClientRect();
        const opts = { bubbles: true, cancelable: true, view: window, clientX: r.left + r.width / 2, clientY: r.top + r.height / 2 };
        el.dispatchEvent(new PointerEvent('pointerdown', opts));
        el.dispatchEvent(new MouseEvent('mousedown', opts));
        el.dispatchEvent(new PointerEvent('pointerup', opts));
        el.dispatchEvent(new MouseEvent('mouseup', opts));
        el.dispatchEvent(new MouseEvent('click', opts));
    }

    // Elemento mais interno na coordenada, ignorando o pop-up/overlay aberto.
    function deepestElementAt(x, y, exclude) {
        let best = null;
        let bestArea = Infinity;
        for (const el of document.body.querySelectorAll('*')) {
            if (exclude && exclude.contains(el)) continue;
            const r = el.getBoundingClientRect();
            if (!r.width || !r.height || x < r.left || x > r.right || y < r.top || y > r.bottom) continue;
            const area = r.width * r.height;
            if (area > 20000 || !isVisible(el)) continue;
            if (area < bestArea) { bestArea = area; best = el; }
        }
        return best;
    }

    async function waitFor(fn, timeoutMs) {
        const start = Date.now();
        while (Date.now() - start < timeoutMs) {
            const value = fn();
            if (value) return value;
            await sleep(POLL_MS);
        }
        return null;
    }

    function tableHeaders(popup) {
        const outside = (el) => !popup || !popup.contains(el);
        const verificar = findLabels('Verificar').find(outside);
        const sd = findLabels('SD').find(outside);
        return { verificar, sd };
    }

    function findResultRows(ticket, popup) {
        const { verificar, sd } = tableHeaders(popup);
        if (!verificar) return [];
        const headerBottom = verificar.getBoundingClientRect().bottom;
        const sdRect = sd?.getBoundingClientRect();

        return textElements()
            .filter(({ el, text }) => {
                if (popup && popup.contains(el)) return false;
                if (onlyDigits(text) !== ticket || text.replace(/\D/g, '') !== text.replace(/\s/g, '')) return false;
                const r = el.getBoundingClientRect();
                if (r.top < headerBottom) return false;
                if (sdRect && Math.abs((r.left + r.width / 2) - (sdRect.left + sdRect.width / 2)) > 70) return false;
                return true;
            })
            .map(({ el }) => el);
    }

    function rowText(cell, popup) {
        const r = cell.getBoundingClientRect();
        const cy = r.top + r.height / 2;
        return textElements()
            .filter(({ el }) => {
                if (popup && popup.contains(el)) return false;
                const er = el.getBoundingClientRect();
                return Math.abs((er.top + er.height / 2) - cy) < 22;
            })
            .map(item => item.text)
            .join(' ');
    }

    function pickRow(cells, testName, popup) {
        if (cells.length <= 1 || !testName) return cells[0];
        const name = testName.toLowerCase();
        let best = cells[0];
        let bestScore = -1;
        for (const cell of cells) {
            const text = rowText(cell, popup).toLowerCase();
            let score = 0;
            while (score < name.length && text.includes(name.slice(0, score + 1))) score++;
            if (score > bestScore) { bestScore = score; best = cell; }
        }
        return best;
    }

    function readRecordCount() {
        const [label] = findLabels('Número de registros');
        return label ? onlyDigits(textRightOf(label)) : '';
    }

    // O que a tela mostra quando o pop-up não é reconhecido, para ajustar os rótulos.
    function popupDiagnostics() {
        const labels = [...new Set(textElements().filter(item => /:$/.test(item.text)).map(item => item.text))];
        return `[Diagnóstico: tela ${location.pathname.split('/')[1] || '?'}; rótulo "AS-ID:" ${findLabels('AS-ID').length}x; `
            + `"Teste Principal:" ${findLabels('Teste Principal').length}x; rótulos visíveis: ${labels.slice(0, 25).join(' | ') || 'nenhum'}]`;
    }

    async function lookup(payload) {
        // Leitura do pop-up aberto vale em Retestes, Qualidade e Execução de Testes; a busca, só em Retestes.
        if (payload?.readOnly && !/\/(retestes|qualidade|execucao_testes)/i.test(location.pathname)) {
            return { ok: false, error: 'A aba do SIGC aberta não está em Retestes, Qualidade ou Execução de Testes.' };
        }

        // Teste de grupo (sem SD Ticket): só lê o pop-up aberto, em qualquer módulo.
        if (payload?.module === 'grupo' || (payload?.readOnly && !primaryTicket(payload?.sdTicket))) {
            const popup = findGroupPopup();
            if (!popup) {
                return { ok: false, error: `Nenhum pop-up de teste reconhecido. Abra o pop-up do teste e clique no botão de leitura de novo. ${popupDiagnostics()}` };
            }
            return { ok: true, rowsFound: 1, fromOpenPopup: true, fields: { ...readPopup(popup), campos: readAllPopupFields(popup) } };
        }

        if (!payload?.readOnly && !/\/retestes/i.test(location.pathname)) {
            return { ok: false, error: 'A aba do SIGC aberta não está na tela de Retestes.' };
        }

        const ticket = primaryTicket(payload?.sdTicket);
        if (!ticket) return { ok: false, error: 'O log não informou um SD Ticket válido.' };

        // Modo "Ler pop-up aberto": só lê o pop-up que já está na tela, sem pesquisar.
        if (payload.readOnly) {
            const popup = manualPopupFor(ticket, findGroupPopup);
            if (popup) return { ok: true, rowsFound: 1, fromOpenPopup: true, fields: readPopup(popup) };
            const other = findGroupPopup();
            return {
                ok: false,
                error: other
                    ? `O pop-up aberto é de outro SD (Service Desk = "${readPopupField(other, 'Service Desk')}"). Abra o pop-up do SD ${ticket} e clique no botão de leitura de novo.`
                    : `Nenhum pop-up de teste reconhecido. Abra o pop-up do SD ${ticket} e clique no botão de leitura de novo. ${popupDiagnostics()}`
            };
        }

        // Dá uma margem para o operador abrir o pop-up do teste; se abrir, lê direto dele.
        const manualPopup = await waitFor(() => manualPopupFor(ticket), MANUAL_POPUP_MS);
        if (manualPopup) {
            await sleep(800);
            return { ok: true, rowsFound: 1, fromOpenPopup: true, fields: readPopup(manualPopup) };
        }

        document.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape', bubbles: true }));
        await sleep(400);

        const filterLabel = await waitFor(() => {
            const popup = findPopup();
            return findLabels('Service Desk').find(label => !popup || !popup.contains(label));
        }, 20000);
        if (!filterLabel) return { ok: false, error: 'Filtro "Service Desk" não encontrado. Verifique se você está logado no SIGC.' };

        const filterInput = inputRightOf(filterLabel);
        if (!filterInput) return { ok: false, error: 'Campo de pesquisa do filtro "Service Desk" não encontrado.' };

        const diagnostics = () => {
            const popup = findPopup();
            const { verificar, sd } = tableHeaders(popup);
            const sameNumber = textElements().filter(({ el, text }) => onlyDigits(text) === ticket && (!popup || !popup.contains(el))).length;
            const popupSd = popup ? ` (Service Desk lido no pop-up = "${readPopupField(popup, 'Service Desk')}")` : '';
            return `[Diagnóstico: filtro Service Desk = "${filterInput.value}"; registros = "${readRecordCount() || '?'}"; `
                + `coluna Verificar ${verificar ? 'encontrada' : 'NÃO encontrada'}; coluna SD ${sd ? 'encontrada' : 'NÃO encontrada'}; `
                + `textos com ${ticket} na tela = ${sameNumber}; pop-up aberto = ${popup ? 'sim' + popupSd : 'não'}]`;
        };

        if (onlyDigits(filterInput.value) !== ticket) {
            setInputValue(filterInput, ticket);
        }

        // Aguarda a lista atualizar com a linha do ticket (ou confirmar 0 registros).
        const start = Date.now();
        let cells = [];
        while (Date.now() - start < 25000) {
            // Se o operador abrir o pop-up do teste durante a busca, usa ele.
            const opened = manualPopupFor(ticket);
            if (opened) {
                await sleep(800);
                return { ok: true, rowsFound: 1, fromOpenPopup: true, fields: readPopup(opened) };
            }
            cells = findResultRows(ticket, findPopup());
            if (cells.length) break;
            if (Date.now() - start > 10000 && readRecordCount() === '0') {
                return { ok: false, notFound: true, error: `Nenhum teste encontrado no SIGC para o SD ${ticket} com os filtros atuais da tela (datas, Validação etc.). ${diagnostics()}` };
            }
            await sleep(POLL_MS);
        }
        if (!cells.length) return { ok: false, error: `A lista do SIGC não exibiu o SD ${ticket} dentro do tempo esperado. ${diagnostics()}` };

        await sleep(600);
        cells = findResultRows(ticket, findPopup());
        const cell = pickRow(cells, payload.testName, findPopup());
        cell.scrollIntoView({ block: 'center' });
        await sleep(300);

        const { verificar } = tableHeaders(findPopup());
        const vr = verificar.getBoundingClientRect();
        const cr = cell.getBoundingClientRect();
        const eyeX = vr.left + vr.width / 2;
        const eyeY = cr.top + cr.height / 2;
        const eye = deepestElementAt(eyeX, eyeY, findPopup());
        if (!eye) return { ok: false, error: `Botão "Verificar" (olho) não encontrado na linha do teste. ${diagnostics()}` };

        // O Bubble registra o clique no elemento marcado como "clickable-element".
        const clickable = eye.closest('.clickable-element') || (eye instanceof HTMLElement ? eye : eye.closest('div, span, a, button, i')) || eye;
        const er = clickable.getBoundingClientRect();
        const clickX = er.left + er.width / 2;
        const clickY = er.top + er.height / 2;

        const popupLoaded = () => manualPopupFor(ticket);

        clickElement(clickable);
        if (typeof clickable.click === 'function') clickable.click();
        let popup = await waitFor(popupLoaded, 4000);

        // Se o Bubble ignorou o clique simulado, faz um clique real pelo navegador.
        if (!popup) {
            const trusted = await chrome.runtime.sendMessage({ type: 'TRUSTED_CLICK', x: clickX, y: clickY });
            if (!trusted?.ok) {
                return { ok: false, error: `O clique no olho não abriu o pop-up e o clique real falhou: ${trusted?.error || 'sem resposta'}. ${diagnostics()}` };
            }
            popup = await waitFor(popupLoaded, 15000);
        }

        if (!popup) {
            const target = `${clickable.tagName.toLowerCase()}.${String(clickable.className || '').trim().split(/\s+/).join('.')}`;
            return { ok: false, error: `O pop-up do teste não abriu ou não carregou os dados do SD esperado (elemento clicado: ${target} em ${Math.round(clickX)},${Math.round(clickY)}). ${diagnostics()}` };
        }

        await sleep(800);
        return { ok: true, rowsFound: cells.length, fields: readPopup(popup) };
    }

    chrome.runtime.onMessage.addListener((message, _sender, sendResponse) => {
        if (message?.type !== 'SIGC_LOOKUP') return false;
        lookup(message.payload)
            .then(sendResponse)
            .catch(error => sendResponse({ ok: false, error: `Erro na automação do SIGC: ${error?.message || error}` }));
        return true;
    });
})();
