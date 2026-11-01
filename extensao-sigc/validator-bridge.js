// Ponte entre a página do validador e a extensão.
// Só atua em páginas que tenham a estrutura do QA Analytics.
(() => {
    if (!document.getElementById('resultsContainer')) return;

    document.documentElement.dataset.sigcExtension = 'ready';

    const reply = (requestId, result) => window.postMessage({
        source: 'sigc-extension',
        type: 'SIGC_RESULT',
        requestId,
        result
    }, '*');

    window.addEventListener('message', (event) => {
        if (event.source !== window) return;
        const data = event.data;
        if (!data || data.source !== 'qa-validator') return;
        if (data.type !== 'SIGC_FOCUS' && data.type !== 'SIGC_CHECK') return;

        // Extensão recarregada sem atualizar esta página: a ponte antiga perdeu a conexão.
        if (!chrome.runtime?.id) {
            if (data.type === 'SIGC_CHECK') {
                reply(data.requestId, { ok: false, error: 'A extensão foi atualizada. Aperte F5 nesta página e tente de novo.' });
            }
            return;
        }

        try {
            if (data.type === 'SIGC_FOCUS') {
                // Sem resposta esperada: o callback só consome o lastError para não gerar erro na extensão.
                chrome.runtime.sendMessage({ type: 'SIGC_FOCUS', module: data.module }, () => void chrome.runtime.lastError);
                return;
            }

            chrome.runtime.sendMessage({ type: 'SIGC_CHECK', payload: data.payload }, (result) => {
                const error = chrome.runtime.lastError;
                reply(data.requestId, error ? { ok: false, error: `Falha de comunicação com a extensão: ${error.message}` } : result);
            });
        } catch (error) {
            if (data.type === 'SIGC_CHECK') {
                reply(data.requestId, { ok: false, error: 'A extensão foi atualizada. Aperte F5 nesta página e tente de novo.' });
            }
        }
    });
})();
