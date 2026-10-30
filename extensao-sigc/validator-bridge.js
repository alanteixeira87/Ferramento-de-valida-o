// Ponte entre a página do validador e a extensão.
// Só atua em páginas que tenham a estrutura do QA Analytics.
(() => {
    if (!document.getElementById('resultsContainer')) return;

    document.documentElement.dataset.sigcExtension = 'ready';

    window.addEventListener('message', (event) => {
        if (event.source !== window) return;
        const data = event.data;
        if (!data || data.source !== 'qa-validator') return;

        if (data.type === 'SIGC_FOCUS') {
            chrome.runtime.sendMessage({ type: 'SIGC_FOCUS', module: data.module });
            return;
        }
        if (data.type !== 'SIGC_CHECK') return;

        chrome.runtime.sendMessage({ type: 'SIGC_CHECK', payload: data.payload }, (result) => {
            const error = chrome.runtime.lastError;
            window.postMessage({
                source: 'sigc-extension',
                type: 'SIGC_RESULT',
                requestId: data.requestId,
                result: error ? { ok: false, error: `Falha de comunicação com a extensão: ${error.message}` } : result
            }, '*');
        });
    });
})();
