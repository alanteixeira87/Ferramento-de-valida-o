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

chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
    if (message?.type === 'SIGC_FOCUS') {
        focusSigcTab(message.module);
        return false;
    }
    if (message?.type === 'TRUSTED_CLICK') {
        trustedClick(sender.tab.id, message.x, message.y)
            .then(() => sendResponse({ ok: true }))
            .catch(error => sendResponse({ ok: false, error: error?.message || String(error) }));
        return true;
    }
    if (message?.type !== 'SIGC_CHECK') return false;

    queue = queue
        .then(() => runCheck(message.payload, sender.tab))
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
