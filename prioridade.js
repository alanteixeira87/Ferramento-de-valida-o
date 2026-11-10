// -------------------------------------------------------------
// TESTES PRIORITÁRIOS (função separada, carregada depois do app.js)
// Testes de longa duração (Pix Scheduling, Retry e Verification) têm prazo de D+0 a D+3:
// ganham a etiqueta "Prioridade" e ficam fixos no topo dos resultados, importados ou arrastados.
// A importação da aba Retestes (retestes-import.js) também valida esses testes primeiro.
// -------------------------------------------------------------
(() => {
    const PRIORITY_PATTERN = /pix[\s_-]*schedul|retry|verification/i;

    // Vale para o nome do teste (log ou SIGC) e para o nome do arquivo.
    window.isPriorityTest = (...names) => names.some(name => PRIORITY_PATTERN.test(String(name || '')));

    const container = document.getElementById('resultsContainer');
    if (!container) return;

    function cardIsPriority(card) {
        const id = card.querySelector('[data-sigc-id]')?.dataset.sigcId;
        const payload = id && typeof sigcPayloads !== 'undefined' ? sigcPayloads[id] : null;
        return window.isPriorityTest(payload?.testName, payload?.fileName, card.querySelector('.file-title')?.textContent);
    }

    // Marca os cards prioritários e os move para o topo, mantendo a ordem entre eles.
    function pinPriorityCards() {
        const cards = [...container.querySelectorAll(':scope > .file-report')];
        const priority = cards.filter(card => {
            if (!('priority' in card.dataset)) card.dataset.priority = cardIsPriority(card) ? '1' : '0';
            return card.dataset.priority === '1';
        });
        priority.forEach(card => {
            const title = card.querySelector('.file-title');
            if (title && !title.querySelector('.badge-priority')) {
                title.insertAdjacentHTML('beforeend', '<span class="badge badge-priority" title="Teste de longa duração (Pix Scheduling, Retry ou Verification): validar primeiro">Prioridade</span>');
            }
        });
        if (!priority.length) return;
        const alreadyOnTop = priority.every((card, i) => cards[i] === card);
        if (alreadyOnTop) return;
        const anchor = container.firstChild;
        priority.forEach(card => container.insertBefore(card, anchor));
    }

    let scheduled = false;
    new MutationObserver(() => {
        if (scheduled) return;
        scheduled = true;
        requestAnimationFrame(() => { scheduled = false; pinPriorityCards(); });
    }).observe(container, { childList: true });
})();
