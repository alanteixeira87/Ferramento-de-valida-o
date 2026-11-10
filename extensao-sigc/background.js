// Orquestra a consulta: localiza/abre a aba do SIGC Retestes, pede a busca
// ao content script e devolve o resultado ao validador.
// Telas do SIGC por módulo: Retestes (busca pelo SD), Qualidade (testes de grupo, sem SD)
// e Execução de Testes (com ou sem SD). A leitura do pop-up aberto vale nas três.
const SIGC_PAGES = {
    retestes: { url: 'https://www.sigc.com.br/retestes/1741341291210x205418165883587200', path: /\/retestes/i, name: 'Retestes' },
    grupo: { url: 'https://www.sigc.com.br/qualidade/1741341291210x205418165883587200', path: /\/qualidade/i, name: 'Qualidade' },
    execucao: { url: 'https://www.sigc.com.br/execucao_testes/1741341291210x205418165883587200', path: /\/execucao_testes/i, name: 'Execução de Testes' }
};
const sigcPage = (module) => SIGC_PAGES[module] || SIGC_PAGES.retestes;

// Uma consulta por vez, para não disputar os filtros da mesma aba.
let queue = Promise.resolve();
// Logs do FVP também um por vez, na mesma aba do FVP.
let fvpQueue = Promise.resolve();

const FVP_ORIGIN = 'https://web.fvp.directory.openbankingbrasil.org.br';

chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
    if (message?.type === 'SIGC_FOCUS') {
        focusSigcTab(message.module).catch(() => {});
        return false;
    }
    if (message?.type === 'TRUSTED_CLICK') {
        trustedClick(sender.tab.id, message.x, message.y)
            .then(() => sendResponse({ ok: true }))
            .catch(error => sendResponse({ ok: false, error: error?.message || String(error) }));
        return true;
    }
    if (message?.type === 'SHAREPOINT_FILES') {
        fvpQueue = fvpQueue
            .then(() => fetchSharePointFiles(message.payload?.link))
            .catch(error => ({ ok: false, error: error?.message || String(error) }))
            .then(result => { sendResponse(result); });
        return true;
    }
    if (message?.type === 'FVP_LOG') {
        fvpQueue = fvpQueue
            .then(() => fetchFvpLog(message.payload?.testId))
            .catch(error => ({ ok: false, error: error?.message || String(error) }))
            .then(result => { sendResponse(result); });
        return true;
    }
    if (message?.type !== 'SIGC_CHECK' && message?.type !== 'SIGC_ROW') return false;

    const run = message.type === 'SIGC_ROW' ? () => runRow(message.payload, sender.tab) : () => runCheck(message.payload, sender.tab);
    queue = queue
        .then(run)
        .catch(error => ({ ok: false, error: error?.message || String(error) }))
        .then(result => { sendResponse(result); });

    return true;
});

async function runCheck(payload, validatorTab) {
    // Leitura do pop-up já aberto: não abre nem ativa a aba do SIGC.
    // Procura nas abas de Retestes, Qualidade e Execução de Testes, começando pela do módulo.
    if (payload?.readOnly) {
        // Botão de um módulo específico: lê só a aba daquele módulo.
        const tabs = (await findReadableTabs(payload.page || payload.module))
            .filter(item => !payload.page || item.page === payload.page);
        if (!tabs.length) {
            const where = payload.page ? `do SIGC ${sigcPage(payload.page).name}` : 'do SIGC (Retestes, Qualidade ou Execução de Testes)';
            return { ok: false, error: `Nenhuma aba ${where} aberta. Abra a tela com o pop-up do teste e tente de novo.` };
        }
        const errors = [];
        for (const { tab, page } of tabs) {
            const result = await sendToSigc(tab.id, { type: 'SIGC_LOOKUP', payload }, 6);
            if (result?.ok) return { ...result, page };
            errors.push(`${SIGC_PAGES[page].name}: ${result?.error || 'sem resposta'}`);
        }
        return { ok: false, error: errors.join(' — ') };
    }

    const tab = await getSigcTab();
    await chrome.tabs.update(tab.id, { active: true });
    await chrome.windows.update(tab.windowId, { focused: true });

    const result = await sendToSigc(tab.id, { type: 'SIGC_LOOKUP', payload });

    if (validatorTab?.id && payload?.returnToValidator !== false) {
        await chrome.tabs.update(validatorTab.id, { active: true }).catch(() => {});
        await chrome.windows.update(validatorTab.windowId, { focused: true }).catch(() => {});
    }
    return result;
}

// Abre o pop-up de uma linha da lista de Retestes (clique no olho) e lê os dados do teste.
async function runRow(payload, validatorTab) {
    const tab = await getSigcTab('retestes');
    await chrome.tabs.update(tab.id, { active: true });
    await chrome.windows.update(tab.windowId, { focused: true });

    const result = await sendToSigc(tab.id, { type: 'SIGC_ROW', payload });

    if (validatorTab?.id) {
        await chrome.tabs.update(validatorTab.id, { active: true }).catch(() => {});
        await chrome.windows.update(validatorTab.windowId, { focused: true }).catch(() => {});
    }
    return result;
}

// Traz o log de um teste do FVP (a mesma exportação em ZIP do botão do FVP), sem salvar arquivo.
// A leitura roda dentro de uma aba do FVP, para usar a sessão já logada do Directory.
async function fetchFvpLog(testId) {
    if (!/^[A-Za-z0-9_-]+$/.test(String(testId || ''))) {
        return { ok: false, error: `Test ID inválido no link do log: "${testId || ''}".` };
    }

    let tab = (await chrome.tabs.query({ url: `${FVP_ORIGIN}/*` }))[0];
    if (!tab) {
        tab = await chrome.tabs.create({ url: `${FVP_ORIGIN}/`, active: false });
        await waitForTabComplete(tab.id);
        tab = await chrome.tabs.get(tab.id);
    }
    if (!String(tab.url || '').startsWith(FVP_ORIGIN)) {
        await chrome.tabs.update(tab.id, { active: true }).catch(() => {});
        return { ok: false, loginRequired: true, error: 'Faça login no FVP (Directory) na aba que foi aberta e clique em Validar de novo.' };
    }

    const [injection] = await chrome.scripting.executeScript({
        target: { tabId: tab.id },
        args: [testId],
        func: async (id) => {
            const urls = [`/api/log/export/${id}?public=true`, `/api/log/export/${id}`];
            const errors = [];
            for (const url of urls) {
                try {
                    // Sem sessão, o FVP redireciona para o login do Directory.
                    const response = await fetch(url, { credentials: 'include', redirect: 'manual' });
                    if (response.type === 'opaqueredirect') {
                        errors.push(`${url} → redirecionado para o login`);
                        continue;
                    }
                    const type = response.headers.get('content-type') || '';
                    if (!response.ok || /text\/html/i.test(type) || !response.url.startsWith(location.origin)) {
                        errors.push(`${url} → HTTP ${response.status}${/text\/html/i.test(type) ? ' (página HTML: provável login)' : ''}`);
                        continue;
                    }
                    const bytes = new Uint8Array(await response.arrayBuffer());
                    let binary = '';
                    for (let i = 0; i < bytes.length; i += 0x8000) {
                        binary += String.fromCharCode.apply(null, bytes.subarray(i, i + 0x8000));
                    }
                    const disposition = response.headers.get('content-disposition') || '';
                    const name = (disposition.match(/filename\*?=(?:UTF-8'')?"?([^";]+)"?/i) || [])[1] || `test-log-${id}.zip`;
                    return { ok: true, name: decodeURIComponent(name), base64: btoa(binary), size: bytes.length };
                } catch (error) {
                    errors.push(`${url} → ${error?.message || error}`);
                }
            }
            return { ok: false, error: `O FVP não entregou o log ${id}. ${errors.join(' | ')}` };
        }
    });
    const result = injection?.result || { ok: false, error: 'A aba do FVP não respondeu.' };
    if (!result.ok && /login/i.test(result.error || '')) {
        await chrome.tabs.update(tab.id, { active: true }).catch(() => {});
        result.loginRequired = true;
        result.error = `Faça login no FVP (Directory) na aba que foi aberta e clique em Validar de novo. [${result.error}]`;
    }
    return result;
}

// Baixa os arquivos de um link do SharePoint/OneDrive ("Link Log" do SIGC), sem salvar no computador.
// Arquivo: devolve o próprio arquivo. Pasta: devolve os arquivos dela (sem subpastas).
// Roda dentro de uma aba do SharePoint, para usar a sessão Microsoft já logada no navegador.
async function fetchSharePointFiles(link) {
    let origin;
    try {
        const url = new URL(link);
        if (!/\.sharepoint\.com$/i.test(url.hostname)) throw new Error('host');
        origin = url.origin;
    } catch (_) {
        return { ok: false, error: `O "Link Log" não é um link do SharePoint: "${link || ''}".` };
    }

    let tab = (await chrome.tabs.query({ url: `${origin}/*` }))[0];
    if (!tab) {
        tab = await chrome.tabs.create({ url: `${origin}/`, active: false });
        await waitForTabComplete(tab.id);
        tab = await chrome.tabs.get(tab.id);
    }
    if (!String(tab.url || '').startsWith(origin)) {
        await chrome.tabs.update(tab.id, { active: true }).catch(() => {});
        return { ok: false, loginRequired: true, error: 'Faça login na conta Microsoft (SharePoint) na aba que foi aberta e clique em "Trazer testes do Reteste" de novo.' };
    }

    const [injection] = await chrome.scripting.executeScript({
        target: { tabId: tab.id },
        args: [link],
        func: async (shareLink) => {
            const MAX_BYTES = 60 * 1024 * 1024;
            const wanted = /\.(zip|html?|json|sig|png|jpe?g|pdf)$/i;
            const toBase64 = (bytes) => {
                let binary = '';
                for (let i = 0; i < bytes.length; i += 0x8000) binary += String.fromCharCode.apply(null, bytes.subarray(i, i + 0x8000));
                return btoa(binary);
            };
            const download = async (url, name) => {
                const response = await fetch(url, { credentials: 'include' });
                const type = response.headers.get('content-type') || '';
                if (!response.ok || /text\/html/i.test(type) && !/\.html?$/i.test(name)) {
                    throw new Error(`${name}: HTTP ${response.status}${/text\/html/i.test(type) ? ' (página HTML: provável login ou sem permissão)' : ''}`);
                }
                const bytes = new Uint8Array(await response.arrayBuffer());
                return { name, size: bytes.length, base64: toBase64(bytes) };
            };

            // API de compartilhamento do SharePoint: "u!" + link em base64url.
            const shareId = 'u!' + btoa(unescape(encodeURIComponent(shareLink))).replace(/=+$/, '').replace(/\//g, '_').replace(/\+/g, '-');
            const api = `/_api/v2.0/shares/${shareId}/driveItem`;
            const errors = [];
            try {
                const response = await fetch(`${api}?$expand=children`, { credentials: 'include', headers: { accept: 'application/json' } });
                if (!response.ok) throw new Error(`API de compartilhamento: HTTP ${response.status}`);
                const item = await response.json();
                const contentUrl = (it) => it['@content.downloadUrl']
                    || (it.parentReference?.driveId ? `/_api/v2.0/drives/${it.parentReference.driveId}/items/${it.id}/content` : `${api}/content`);

                if (item.folder) {
                    const children = (item.children || []).filter(child => child.file && wanted.test(child.name || ''));
                    if (!children.length) {
                        const seen = (item.children || []).map(child => child.name).slice(0, 15).join(', ') || 'pasta vazia';
                        return { ok: false, error: `A pasta "${item.name}" do Link Log não tem ZIP, HTML ou imagens do teste. Conteúdo: ${seen}.` };
                    }
                    const files = [];
                    let total = 0;
                    for (const child of children) {
                        total += child.size || 0;
                        if (total > MAX_BYTES) { errors.push(`limite de 60 MB atingido; ${child.name} e os seguintes ficaram de fora`); break; }
                        files.push(await download(contentUrl(child), child.name));
                    }
                    return { ok: true, kind: 'folder', name: item.name, files, warning: errors.join(' | ') };
                }
                return { ok: true, kind: 'file', name: item.name, files: [await download(contentUrl(item), item.name)] };
            } catch (error) {
                errors.push(error?.message || String(error));
            }

            // Plano B: o próprio link com download=1 (vale para link de arquivo).
            try {
                const separator = shareLink.includes('?') ? '&' : '?';
                const file = await download(`${shareLink}${separator}download=1`, 'arquivo-do-link.zip');
                return { ok: true, kind: 'file', name: file.name, files: [file] };
            } catch (error) {
                errors.push(`download direto: ${error?.message || error}`);
            }
            return { ok: false, error: `O SharePoint não entregou os arquivos do Link Log. ${errors.join(' | ')}` };
        }
    });
    const result = injection?.result || { ok: false, error: 'A aba do SharePoint não respondeu.' };
    if (!result.ok && /login|HTTP 401|HTTP 403/i.test(result.error || '')) {
        await chrome.tabs.update(tab.id, { active: true }).catch(() => {});
        result.loginRequired = /login|HTTP 401/i.test(result.error || '');
    }
    return result;
}

// Clique "real" (como o do mouse) via protocolo do DevTools, para telas que
// ignoram cliques gerados por script. Coordenadas em pixels CSS da janela.
async function trustedClick(tabId, x, y) {
    const target = { tabId };
    await chrome.debugger.attach(target, '1.3');
    try {
        const base = { x, y, button: 'left', clickCount: 1 };
        await chrome.debugger.sendCommand(target, 'Input.dispatchMouseEvent', { ...base, type: 'mouseMoved', button: 'none' });
        await chrome.debugger.sendCommand(target, 'Input.dispatchMouseEvent', { ...base, type: 'mousePressed' });
        await chrome.debugger.sendCommand(target, 'Input.dispatchMouseEvent', { ...base, type: 'mouseReleased' });
    } finally {
        await chrome.debugger.detach(target).catch(() => {});
    }
}

// Leva o operador para a aba do SIGC, onde o pop-up do teste ficou aberto.
async function focusSigcTab(module) {
    const tab = await getSigcTab(module);
    await chrome.tabs.update(tab.id, { active: true });
    await chrome.windows.update(tab.windowId, { focused: true });
}

// Aba do SIGC na tela do módulo (com ou sem "www", em qualquer janela).
async function findSigcTab(module) {
    const tabs = await chrome.tabs.query({ url: ['https://www.sigc.com.br/*', 'https://sigc.com.br/*'] });
    return tabs.find(tab => sigcPage(module).path.test(new URL(tab.url).pathname)) || null;
}

async function findReadableTabs(module) {
    const tabs = await chrome.tabs.query({ url: ['https://www.sigc.com.br/*', 'https://sigc.com.br/*'] });
    const order = [module in SIGC_PAGES ? module : 'retestes', ...Object.keys(SIGC_PAGES)];
    const result = [];
    for (const page of new Set(order)) {
        for (const tab of tabs) {
            if (SIGC_PAGES[page].path.test(new URL(tab.url).pathname)) result.push({ tab, page });
        }
    }
    return result;
}

async function getSigcTab(module) {
    const existing = await findSigcTab(module);
    if (existing) return existing;

    const tab = await chrome.tabs.create({ url: sigcPage(module).url, active: true });
    await waitForTabComplete(tab.id);
    return tab;
}

function waitForTabComplete(tabId) {
    return new Promise((resolve) => {
        const listener = (id, info) => {
            if (id === tabId && info.status === 'complete') {
                chrome.tabs.onUpdated.removeListener(listener);
                resolve();
            }
        };
        chrome.tabs.onUpdated.addListener(listener);
    });
}

// O content script pode ainda não ter carregado (página do Bubble demora).
// Se a extensão foi recarregada, a aba já aberta perde o content script até ser atualizada
// (o que fecharia o pop-up): nesse caso injeta o script de novo na aba.
async function sendToSigc(tabId, message, attempts = 40) {
    let injected = false;
    for (let i = 0; i < attempts; i++) {
        try {
            const response = await chrome.tabs.sendMessage(tabId, message);
            if (response) return response;
        } catch (_) {
            // content script ainda não está pronto ou ficou desconectado
            if (!injected) {
                injected = true;
                await chrome.scripting.executeScript({ target: { tabId }, files: ['sigc-content.js'] }).catch(() => {});
                continue;
            }
        }
        await new Promise(r => setTimeout(r, 500));
    }
    return { ok: false, error: 'A página do SIGC Retestes não respondeu. Verifique se você está logado e se a tela de Retestes abriu.' };
}
