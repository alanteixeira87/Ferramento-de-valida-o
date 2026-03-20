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

    // USER-AGENT (Dispositivo)
    let userAgentMatch = htmlString.match(/<td class="more-key">user-agent<\/td>[\s\S]*?<pre[^>]*>([^<]+)<\/pre>/i);
    let userAgentRaw = userAgentMatch ? userAgentMatch[1].trim() : extractJson("user-agent");
    
    let deviceLabel = "Não detetado";
    if (userAgentRaw !== "Não encontrado") {
        let ua = userAgentRaw.toLowerCase();
        if (ua.includes("android")) deviceLabel = "🤖 Android";
        else if (ua.includes("iphone") || ua.includes("ipad") || ua.includes("ios") || ua.includes("darwin")) deviceLabel = "🍎 iOS";
        else if (ua.includes("windows") || ua.includes("macintosh") || ua.includes("linux")) deviceLabel = "💻 Desktop";
        else if (ua.includes("postman") || ua.includes("insomnia") || ua.includes("axios")) deviceLabel = "⚙️ API Client";
        else deviceLabel = "🌐 Outro";
    }

    // SANITIZAÇÃO (Bloqueia o CNPJ de credor conflitante)
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

    // Avaliação de Status Simplificada (Sucesso, Falha ou Interrompido)
    if (isInterrupted && resultados.length === 0) {
        resultados.push({ isInterrupted: true, summary: "O módulo de teste foi INTERROMPIDO fatalmente pelo FVP. (Ex: Timeout de requisição ou falha 500 no ambiente)" });
    } else if (resultados.length === 0) {
        resultados.push({ sucesso: true, summary: "Execução limpa. Nenhum erro localizado no log." });
    }
    
    return { metadata, resultados };
}

// -------------------------------------------------------------
// VALIDADOR PF/PJ E RENDERIZAÇÃO FINAL (TEXTOS ORIGINAIS APLICADOS)
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

    let html = `
    <div class="file-report">
        <h3 class="file-header" style="justify-content: space-between;">
            <div style="display:flex; align-items:center;">
                📄 ${fileName} 
                <span class="badge" style="margin-left: 12px; background: #333; font-size: 0.65rem;">Modo: ${tipoTesteLabel}</span>
            </div>
            <a href="${htmlBlobUrl}" target="_blank" class="btn-view-log">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"></path><polyline points="15 3 21 3 21 9"></polyline><line x1="10" y1="14" x2="21" y2="3"></line></svg>
                Abrir Log Original
            </a>
        </h3>
        
        ${validacaoHtml}

        <div class="metadata-grid">
            <div class="metadata-item"><span>Dispositivo de Teste</span><strong>${meta.device}</strong></div>
            <div class="metadata-item"><span>Alias da Execução</span><strong>${meta.alias}</strong></div>
            <div class="metadata-item"><span>Auth. Server ID</span><strong>${meta.asId}</strong></div>
            <div class="metadata-item"><span>Instituição Transmissora</span><strong>${meta.institutionName}</strong></div>
            ${meta.cnpj && meta.cnpj !== "Não encontrado" ? `<div class="metadata-item"><span>CNPJ do Ambiente</span><strong>${meta.cnpj}</strong></div>` : ""}
        </div>
    `;

    resultados.forEach(r => {
        if (r.sucesso) {
            html += `
            <div class="card sucesso">
                <h3 class="card-title">✓ Status da Execução: Sucesso</h3>
                <p style="margin:0; color: var(--text-base);">${r.summary}</p>
            </div>`;
        } else if (r.isInterrupted) {
            html += `
            <div class="card interrompido">
                <h3 class="card-title">⚠ Status da Execução: Interrompido</h3>
                <div class="card-content" style="margin-top: 10px;">${r.summary}</div>
            </div>`;
        } else {
            html += `
            <div class="card falha">
                <h3 class="card-title">✕ Status da Execução: Falhou</h3>
                <div class="card-content" style="margin-top: 10px;">${r.summary}</div>
            </div>`;
        }
    });

    if (!resultados[0].sucesso || evidencias.mostrarPainel) {
        const c = evidencias.checklist;
        const tudoOk = c.saldo && c.versaoApp && c.erro;
        const cssClass = tudoOk ? "ok" : "nok";
        
        let galeriaHtml = "";
        if (evidencias.imagens.length > 0) {
            const galleryId = 'gal_' + Math.random().toString(36).substr(2, 9);
            const apenasImagens = evidencias.imagens.filter(img => !img.isPdf);
            window.evidenceGalleries[galleryId] = apenasImagens;

            galeriaHtml = `<div class="evidence-gallery" style="display: flex; flex-wrap: wrap; gap: 12px; margin-top: 12px; padding-top: 12px; border-top: 1px solid var(--border-color);">`;
            
            evidencias.imagens.forEach(img => {
                if (img.isPdf) {
                    galeriaHtml += `
                    <div class="evidence-item" style="display: flex; flex-direction: column; align-items: center; gap: 6px; width: 90px;">
                        <a href="${img.url}" target="_blank" style="display:flex; align-items:center; justify-content:center; width:90px; height:90px; background:#29292E; border-radius:6px; text-decoration:none; border: 1px solid var(--border-color); transition: 0.2s;" onmouseover="this.style.borderColor='#8257E5'" onmouseout="this.style.borderColor='var(--border-color)'">
                            <span style="font-size: 1.8rem;">📄</span>
                        </a>
                        <span class="evidence-name" style="font-size: 0.65rem; color: var(--text-muted); text-align: center; word-break: break-all; line-height: 1.2;">${img.nome}</span>
                    </div>`;
                } else {
                    const imgIndex = apenasImagens.findIndex(i => i.url === img.url);
                    galeriaHtml += `
                    <div class="evidence-item" style="display: flex; flex-direction: column; align-items: center; gap: 6px; width: 90px; cursor: pointer;" onclick="openLightbox('${galleryId}', ${imgIndex})">
                        <img src="${img.url}" class="evidence-thumb" alt="${img.nome}" title="Clique para ampliar" style="width: 90px; height: 90px; object-fit: cover; border-radius: 6px; border: 1px solid var(--border-color);" />
                        <span class="evidence-name" style="font-size: 0.65rem; color: var(--text-muted); text-align: center; word-break: break-all; line-height: 1.2;">${img.nome}</span>
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