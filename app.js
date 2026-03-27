// -------------------------------------------------------------
// LÓGICA DE LOGIN (GATEKEEPER FRONT-END)
// -------------------------------------------------------------
const loginForm = document.getElementById('loginForm');
const passwordInput = document.getElementById('passwordInput');
const loginError = document.getElementById('loginError');
const loginScreen = document.getElementById('loginScreen');
const mainApp = document.getElementById('mainApp');
const logoutBtn = document.getElementById('logoutBtn');

const SENHA_DE_ACESSO = "admin123";

if(loginForm) {
    loginForm.addEventListener('submit', (e) => {
        e.preventDefault(); 
        if (passwordInput.value === SENHA_DE_ACESSO) {
            loginScreen.style.display = 'none';
            mainApp.style.display = 'block';
            passwordInput.value = ''; 
            loginError.style.display = 'none';
        } else {
            loginError.style.display = 'block';
            passwordInput.focus();
        }
    });
}

if(logoutBtn) {
    logoutBtn.addEventListener('click', () => {
        mainApp.style.display = 'none';
        loginScreen.style.display = 'flex';
    });
}

// -------------------------------------------------------------
// INJETANDO O MODAL NO DOM DINAMICAMENTE (LIGHTBOX)
// -------------------------------------------------------------
const modalHTML = `
<div id="lightboxModal" class="lightbox-modal">
    <span id="lightboxClose" class="lightbox-close">&times;</span>
    <span id="lightboxPrev" class="lightbox-nav lightbox-prev">&#10094;</span>
    <img id="lightboxImg" class="lightbox-content" src="">
    <div id="lightboxCaption" class="lightbox-caption"></div>
    <span id="lightboxNext" class="lightbox-nav lightbox-next">&#10095;</span>
</div>`;
document.body.insertAdjacentHTML('beforeend', modalHTML);

const lightboxModal = document.getElementById('lightboxModal');
const lightboxImg = document.getElementById('lightboxImg');
const lightboxCaption = document.getElementById('lightboxCaption');
const lightboxClose = document.getElementById('lightboxClose');
const lightboxPrev = document.getElementById('lightboxPrev');
const lightboxNext = document.getElementById('lightboxNext');

window.evidenceGalleries = {}; 
let currentGalleryId = null;
let currentImageIndex = 0;

window.openLightbox = function(galleryId, index) {
    currentGalleryId = galleryId;
    currentImageIndex = index;
    updateLightbox();
    lightboxModal.classList.add('active');
};

function updateLightbox() {
    const gallery = window.evidenceGalleries[currentGalleryId];
    if(!gallery || gallery.length === 0) return;
    const img = gallery[currentImageIndex];
    lightboxImg.src = img.url;
    lightboxCaption.textContent = `${img.nome} (${currentImageIndex + 1} de ${gallery.length})`;
}

// Controles do Lightbox
lightboxClose.addEventListener('click', () => lightboxModal.classList.remove('active'));
lightboxModal.addEventListener('click', (e) => { if(e.target === lightboxModal) lightboxModal.classList.remove('active'); });

lightboxPrev.addEventListener('click', (e) => {
    e.stopPropagation();
    const gallery = window.evidenceGalleries[currentGalleryId];
    currentImageIndex = (currentImageIndex - 1 + gallery.length) % gallery.length;
    updateLightbox();
});
lightboxNext.addEventListener('click', (e) => {
    e.stopPropagation();
    const gallery = window.evidenceGalleries[currentGalleryId];
    currentImageIndex = (currentImageIndex + 1) % gallery.length;
    updateLightbox();
});

// Suporte a Teclado
document.addEventListener('keydown', (e) => {
    if (!lightboxModal.classList.contains('active')) return;
    if (e.key === 'Escape') lightboxModal.classList.remove('active');
    if (e.key === 'ArrowLeft') lightboxPrev.click();
    if (e.key === 'ArrowRight') lightboxNext.click();
});

// -------------------------------------------------------------
// MOTOR PRINCIPAL - DRAG & DROP E PROCESSAMENTO
// -------------------------------------------------------------
const dropZone = document.getElementById('dropZone');
const fileInput = document.getElementById('fileInput');
const uploadBtn = document.getElementById('uploadBtn');

uploadBtn.addEventListener('click', () => fileInput.click());
dropZone.addEventListener('click', (e) => { if(e.target !== uploadBtn) fileInput.click(); });

['dragenter', 'dragover', 'dragleave', 'drop'].forEach(eventName => { dropZone.addEventListener(eventName, preventDefaults, false); });
function preventDefaults(e) { e.preventDefault(); e.stopPropagation(); }

['dragenter', 'dragover'].forEach(eventName => { dropZone.addEventListener(eventName, () => dropZone.classList.add('drag-active'), false); });
['dragleave', 'drop'].forEach(eventName => { dropZone.addEventListener(eventName, () => dropZone.classList.remove('drag-active'), false); });

dropZone.addEventListener('drop', (e) => { const dt = e.dataTransfer; if (dt.files && dt.files.length > 0) processFiles(dt.files); });
fileInput.addEventListener('change', function() { if(this.files && this.files.length > 0) processFiles(this.files); });

async function processFiles(files) {
    const container = document.getElementById("resultsContainer");
    container.innerHTML = `<div class="empty-state"><p>Processando ${files.length} arquivo(s)... ⚡</p></div>`;
    let htmlFinal = "";

    for (let i = 0; i < files.length; i++) {
        const file = files[i];
        try {
            const jsZip = new JSZip();
            const zip = await jsZip.loadAsync(file);
            const fileNames = Object.keys(zip.files);
            
            const htmlFileName = fileNames.find(name => name.toLowerCase().endsWith('.html') && !name.includes('__MACOSX'));
            if (!htmlFileName) continue;

            const htmlContent = await zip.file(htmlFileName).async("string");
            
            const htmlBlob = new Blob([htmlContent], { type: 'text/html' });
            const htmlBlobUrl = URL.createObjectURL(htmlBlob);

            const { metadata, resultados } = analyzeFvpLogs(htmlContent);
            const evidencias = await checkNokEvidences(zip, fileNames);
            
            htmlFinal += generateFileBlock(file.name, metadata, resultados, evidencias, htmlBlobUrl);

        } catch (error) {
            console.error(`Erro no arquivo ${file.name}:`, error);
        }
    }
    
    container.innerHTML = htmlFinal || `<div class="empty-state"><p>Nenhum log válido encontrado.</p></div>`;
}

// -------------------------------------------------------------
// EXTRAÇÃO DE EVIDÊNCIAS E GERAÇÃO DE MINIATURAS
// -------------------------------------------------------------
async function checkNokEvidences(zip, filePaths) {
    const imagensExtraidas = [];
    let indicioDeNok = false; 
    
    for (let path of filePaths) {
        if (path.includes('__MACOSX') || path.endsWith('/')) continue;
        const pathLower = path.toLowerCase();
        
        if (pathLower.match(/\.(jpg|jpeg|png|pdf)$/)) {
            const fileName = path.split('/').pop();
            const blob = await zip.file(path).async("blob");
            const objectUrl = URL.createObjectURL(blob);
            
            imagensExtraidas.push({ nome: fileName, url: objectUrl, isPdf: pathLower.endsWith('.pdf') });
        }
    }

    const normalize = (str) => str.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase();
    let temSaldo = false, temVersaoApp = false, temErro = false;
    const imagensRelevantes = [];

    imagensExtraidas.forEach(imgObj => {
        const imgLimpa = normalize(imgObj.nome);
        let ehRelevante = false;
        
        if (imgLimpa.includes('evidencia')) { indicioDeNok = true; ehRelevante = true; }
        if (imgLimpa.includes('saldo')) { temSaldo = true; ehRelevante = true; }
        if (imgLimpa.includes('versao') || imgLimpa.includes('app')) { temVersaoApp = true; ehRelevante = true; }
        if (imgLimpa.includes('erro')) { temErro = true; ehRelevante = true; }
        
        if (ehRelevante) imagensRelevantes.push(imgObj);
    });

    if (imagensRelevantes.length > 0) indicioDeNok = true;

    return {
        mostrarPainel: indicioDeNok,
        imagens: imagensRelevantes.length > 0 ? imagensRelevantes : imagensExtraidas,
        checklist: { saldo: temSaldo, versaoApp: temVersaoApp, erro: temErro }
    };
}

// -------------------------------------------------------------
// EXTRATOR DE METADADOS E MOTOR DE FALHAS
// -------------------------------------------------------------
function extractMetadata(htmlString) {
    const extractJson = (key) => {
        const regex = new RegExp(`(?:\"|&quot;)${key}(?:\"|&quot;)\\s*:\\s*(?:\"|&quot;)([^\"&]+)(?:\"|&quot;)`, 'i');
        const match = htmlString.match(regex);
        return match ? match[1].trim() : "Não encontrado";
    };

    let aliasMatch = htmlString.match(/<td class="more-key">alias<\/td>[\s\S]*?<pre[^>]*>([^<]+)<\/pre>/i);
    let alias = aliasMatch ? aliasMatch[1].trim() : extractJson("alias");
    let asId = extractJson("AuthorisationServerId");
    
    let institutionName = extractJson("OrganisationName");
    if (institutionName === "Não encontrado") institutionName = extractJson("CustomerFriendlyName");

    let cnpjDaInstituicao = extractJson("brazilCNPJ");
    if (cnpjDaInstituicao === "Não encontrado") {
        const regexNested = /(?:"|&quot;)businessEntity(?:"|&quot;)\s*:\s*\{[\s\S]*?(?:"|&quot;)identification(?:"|&quot;)\s*:\s*(?:"|&quot;)([^"&]+)(?:"|&quot;)/i;
        const matchNested = htmlString.match(regexNested);
        if (matchNested) cnpjDaInstituicao = matchNested[1].trim();
    }

    // USER-AGENT (Identificação visual por SVGs nativos)
    let userAgentMatch = htmlString.match(/<td class="more-key">user-agent<\/td>[\s\S]*?<pre[^>]*>([^<]+)<\/pre>/i);
    let userAgentRaw = userAgentMatch ? userAgentMatch[1].trim() : extractJson("user-agent");
    
    // SVGs Inline para logos das marcas
    const iconApple = `<svg width="18" height="18" viewBox="0 0 384 512" fill="currentColor" style="margin-right: 6px;"><path d="M318.7 268.7c-.2-36.7 16.4-64.4 50-84.8-18.8-26.9-47.2-41.7-84.7-44.6-35.5-2.8-74.3 20.7-88.5 20.7-15 0-49.4-19.7-76.4-19.7C63.3 141.2 4 184.8 4 273.5q0 39.3 14.4 81.2c12.8 36.7 59 126.7 107.2 125.2 25.2-.6 43-17.9 75.8-17.9 31.8 0 48.3 17.9 76.4 17.9 48.6-.7 90.4-82.5 102.6-119.3-65.2-30.7-61.7-90-61.7-91.9zm-56.6-164.2c27.3-32.4 24.8-61.9 24-72.5-24.1 1.4-52 16.4-67.9 34.9-17.5 19.8-27.8 44.3-25.6 71.9 26.1 2 49.9-11.4 69.5-34.3z"/></svg>`;
    const iconAndroid = `<svg width="18" height="18" viewBox="0 0 576 512" fill="currentColor" style="margin-right: 6px;"><path d="M420.22 135.78l34.46-59.69c3.08-5.35 1.25-12.19-4.11-15.28-5.36-3.09-12.2-1.26-15.28 4.1L400 126.85c-33.86-15.35-71.32-23.85-111.99-23.85-40.68 0-78.14 8.5-112 23.85l-35.29-61.94c-3.08-5.36-9.92-7.19-15.28-4.1-5.36 3.09-7.19 9.93-4.11 15.28l34.46 59.69C69.05 186.73 10.96 270.81 1.22 368h573.55c-9.74-97.19-67.83-181.27-154.55-232.22zM157.23 282.68c-14.13 0-25.59-11.46-25.59-25.59s11.46-25.59 25.59-25.59 25.59 11.46 25.59 25.59-11.46 25.59-25.59 25.59zm261.54 0c-14.13 0-25.59-11.46-25.59-25.59s11.46-25.59 25.59-25.59 25.59 11.46 25.59 25.59-11.46 25.59-25.59 25.59zM1.22 400h573.55v48C574.77 483.35 546.12 512 510.77 512H65.23c-35.35 0-64-28.65-64-64v-48z"/></svg>`;
    const iconWindows = `<svg width="18" height="18" viewBox="0 0 448 512" fill="currentColor" style="margin-right: 6px;"><path d="M0 93.6l183.6-25.3v177.4H0V93.6zm0 324.6l183.6 25.3V268.4H0v149.8zm203.8 28L448 480V268.4H203.8v177.8zm0-380.6v180.1H448V32L203.8 65.6z"/></svg>`;
    const iconApi = `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="margin-right: 6px;"><path d="M12 2v20M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/></svg>`;
    const iconOther = `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="margin-right: 6px;"><circle cx="12" cy="12" r="10"></circle><line x1="12" y1="16" x2="12" y2="12"></line><line x1="12" y1="8" x2="12.01" y2="8"></line></svg>`;

    let deviceLabel = `${iconOther} Outro`;
    if (userAgentRaw !== "Não encontrado") {
        let ua = userAgentRaw.toLowerCase();
        if (ua.includes("android")) deviceLabel = `${iconAndroid} Android`;
        else if (ua.includes("iphone") || ua.includes("ipad") || ua.includes("ios") || ua.includes("darwin")) deviceLabel = `${iconApple} iOS`;
        else if (ua.includes("windows") || ua.includes("macintosh") || ua.includes("linux")) deviceLabel = `${iconWindows} Desktop`;
        else if (ua.includes("postman") || ua.includes("insomnia") || ua.includes("axios")) deviceLabel = `${iconApi} API Client`;
    }

    // SANITIZAÇÃO
    let htmlSanitizado = htmlString
        .replace(/63602987000134/g, "")
        .replace(/creditorCpfCnpj/gi, "");

    const temBusinessEntity = /businessEntity/i.test(htmlSanitizado);
    const temBrazilCnpj = /brazilCNPJ/i.test(htmlSanitizado);

    return { 
        alias, asId, cnpj: cnpjDaInstituicao, institutionName, 
        temBusinessEntity, temBrazilCnpj, device: deviceLabel 
    };
}

function analyzeFvpLogs(htmlString) {
    const metadata = extractMetadata(htmlString); 
    const resultados = [];
    const isInterrupted = /Status:\s*(?:<[^>]+>\s*)*INTERRUPTED/i.test(htmlString) || /Result:\s*(?:<[^>]+>\s*)*INTERRUPTED/i.test(htmlString);
    const failureBlockRegex = /<b[^>]*>\s*Failure summary\s*:?\s*<\/b>([\s\S]*?)<\/td>/gi;
    let match;

    while ((match = failureBlockRegex.exec(htmlString)) !== null) {
        let erroLimpo = match[1].replace(/<li[^>]*>/gi, "\n- ").replace(/<\/?[^>]+(>|$)/g, "").trim();
        if (erroLimpo) resultados.push({ summary: erroLimpo });
    }

    // Avaliação do cenário geral do Teste
    if (isInterrupted && resultados.length === 0) {
        resultados.push({ isInterrupted: true, summary: "O módulo de teste foi INTERROMPIDO fatalmente pelo FVP. (Ex: Timeout de requisição ou falha 500 no ambiente)" });
    } else if (resultados.length === 0) {
        resultados.push({ sucesso: true, summary: "" });
    }
    
    return { metadata, resultados };
}

// -------------------------------------------------------------
// VALIDADOR PF/PJ E RENDERIZAÇÃO FINAL
// -------------------------------------------------------------
function generateFileBlock(fileName, meta, resultados, evidencias, htmlBlobUrl) {
    const isPF = meta.alias.toLowerCase().includes('-pf') || fileName.toLowerCase().includes('pf') || meta.alias.toLowerCase().includes('personal');
    const isPJ = meta.alias.toLowerCase().includes('-pj') || fileName.toLowerCase().includes('pj') || meta.alias.toLowerCase().includes('business');
    
    let tipoTesteLabel = "Não Identificado (Validar Manualmente)";
    let validacaoHtml = "";

    const temBusiness = meta.temBusinessEntity;
    const temCnpj = meta.temBrazilCnpj;

    if (isPF) {
        tipoTesteLabel = "Pessoa Física (PF)";
        if (temBusiness || temCnpj) {
            let vazados = [];
            if(temBusiness) vazados.push("BusinessEntity");
            if(temCnpj) vazados.push("BrazilCNPJ");
            validacaoHtml = `<div class="validation-box error">🔴 O teste PF apresenta os campos: ${vazados.join(' e ')}.</div>`;
        } else {
            validacaoHtml = `<div class="validation-box success">✅ Não apresenta Presença do BusinessEntity e BrazilCNPJ.</div>`;
        }
    } else if (isPJ) {
        tipoTesteLabel = "Pessoa Jurídica (PJ)";
        if (!temBusiness || !temCnpj) {
            let faltantes = [];
            if(!temBusiness) faltantes.push("BusinessEntity");
            if(!temCnpj) faltantes.push("BrazilCNPJ");
            validacaoHtml = `<div class="validation-box error">🔴 Falta o campo: ${faltantes.join(' e ')}.</div>`;
        } else {
            validacaoHtml = `<div class="validation-box success">✅ Campos presentes.</div>`;
        }
    }

    // Define a classe da borda baseada no sucesso da execução (Feedback Visual Macro)
    const testPassed = resultados[0].sucesso === true;
    const borderStatusClass = testPassed ? 'report-passed' : 'report-failed';

    let html = `
    <div class="file-report ${borderStatusClass}">
        <h3 class="file-header" style="justify-content: space-between;">
            <div style="display:flex; align-items:center;">
                📄 ${fileName} 
                <span class="badge" style="margin-left: 12px; font-size: 0.65rem;">Modo: ${tipoTesteLabel}</span>
            </div>
            <a href="${htmlBlobUrl}" target="_blank" class="btn-view-log">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"></path><polyline points="15 3 21 3 21 9"></polyline><line x1="10" y1="14" x2="21" y2="3"></line></svg>
                Abrir Log Original
            </a>
        </h3>
        
        ${validacaoHtml}

        <div class="metadata-grid">
            <div class="metadata-item"><span>Dispositivo</span><strong>${meta.device}</strong></div>
            <div class="metadata-item"><span>Alias da Execução</span><strong>${meta.alias}</strong></div>
            <div class="metadata-item"><span>Auth. Server ID</span><strong>${meta.asId}</strong></div>
            <div class="metadata-item"><span>Instituição Transmissora</span><strong>${meta.institutionName}</strong></div>
            ${meta.cnpj && meta.cnpj !== "Não encontrado" ? `<div class="metadata-item"><span>CNPJ do Ambiente</span><strong>${meta.cnpj}</strong></div>` : ""}
        </div>
    `;

    // Renderização dos cards de erro removida a pedido do cliente.

    if (!testPassed || evidencias.mostrarPainel) {
        const c = evidencias.checklist;
        const tudoOk = c.saldo && c.versaoApp && c.erro;
        const cssClass = tudoOk ? "ok" : "nok";
        
        let galeriaHtml = "";
        if (evidencias.imagens.length > 0) {
            const galleryId = 'gal_' + Math.random().toString(36).substr(2, 9);
            const apenasImagens = evidencias.imagens.filter(img => !img.isPdf);
            window.evidenceGalleries[galleryId] = apenasImagens;

            galeriaHtml = `<div class="evidence-gallery">`;
            
            evidencias.imagens.forEach(img => {
                if (img.isPdf) {
                    galeriaHtml += `
                    <div class="evidence-item">
                        <a href="${img.url}" target="_blank" style="display:flex; align-items:center; justify-content:center; width:90px; height:90px; background:#29292E; border-radius:6px; text-decoration:none; border: 1px solid var(--border-color); transition: 0.2s;" onmouseover="this.style.borderColor='#8257E5'" onmouseout="this.style.borderColor='var(--border-color)'">
                            <span style="font-size: 1.8rem;">📄</span>
                        </a>
                        <span class="evidence-name">${img.nome}</span>
                    </div>`;
                } else {
                    const imgIndex = apenasImagens.findIndex(i => i.url === img.url);
                    galeriaHtml += `
                    <div class="evidence-item" onclick="openLightbox('${galleryId}', ${imgIndex})">
                        <img src="${img.url}" class="evidence-thumb" alt="${img.nome}" title="Clique para ampliar" />
                        <span class="evidence-name">${img.nome}</span>
                    </div>`;
                }
            });
            galeriaHtml += `</div>`;
        }

        html += `
            <div class="checklist-box ${cssClass}">
                <strong>📸 Auditoria de Evidências Anexadas:</strong>
                <ul style="margin-bottom: ${evidencias.imagens.length > 0 ? '16px' : '0'}">
                    <li style="color: ${c.saldo ? 'var(--status-success)' : 'var(--text-muted)'}">${c.saldo ? '✓' : '✗'} Comprovante de Saldo</li>
                    <li style="color: ${c.versaoApp ? 'var(--status-success)' : 'var(--text-muted)'}">${c.versaoApp ? '✓' : '✗'} Captura da Versão do App</li>
                    <li style="color: ${c.erro ? 'var(--status-success)' : 'var(--text-muted)'}">${c.erro ? '✓' : '✗'} Evidência do Erro</li>
                </ul>
                ${galeriaHtml}
            </div>
        `;
    }

    html += `</div>`;
    return html;
}