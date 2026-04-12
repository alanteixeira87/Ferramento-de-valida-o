// -------------------------------------------------------------
// LÓGICA DE LOGIN E NAVEGAÇÃO SPA (DASHBOARD)
// -------------------------------------------------------------
const loginForm = document.getElementById('loginForm');
const passwordInput = document.getElementById('passwordInput');
const loginError = document.getElementById('loginError');
const loginScreen = document.getElementById('loginScreen');
const mainApp = document.getElementById('mainApp');
const logoutBtn = document.getElementById('logoutBtn');

const btnNavTests = document.getElementById('btnNavTests');
const btnNavDocs = document.getElementById('btnNavDocs');
const viewTests = document.getElementById('viewTests');
const viewDocs = document.getElementById('viewDocs');

if(loginForm) {
    loginForm.addEventListener('submit', (e) => {
        e.preventDefault(); 
        if (passwordInput.value === "admin123") {
            loginScreen.style.display = 'none';
            mainApp.style.display = 'flex';
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

if(btnNavTests && btnNavDocs && viewTests && viewDocs) {
    btnNavTests.addEventListener('click', () => {
        btnNavTests.classList.add('active');
        btnNavDocs.classList.remove('active');
        viewTests.classList.add('active');
        viewDocs.classList.remove('active');
    });

    btnNavDocs.addEventListener('click', () => {
        btnNavDocs.classList.add('active');
        btnNavTests.classList.remove('active');
        viewDocs.classList.add('active');
        viewTests.classList.remove('active');
    });
}

// -------------------------------------------------------------
// BANCO DE DADOS EMBUTIDO (AS-ID -> MARCA TRANSMISSORA)
// -------------------------------------------------------------
const dbAsId = {
    "22edf759-2e70-4ed3-a720-6baf7e5dafd4": { "nome": "99Pay", "conglomerado": "18a5f8fd-836e-4a7f-8db3-32d0c98da989" },
    "c42307b0-461f-4242-a72c-0694a05ca199": { "nome": "ACCREDITO-SCD", "conglomerado": "12db6790-1ec9-4199-b20a-2820b7ec22c2" },
    "6ca7c7a8-cfc5-43ba-b478-64e0014e5e98": { "nome": "ADIQ AS", "conglomerado": "94a7df48-32d7-5c26-82e1-ad9ae54590a6" },
    "0ff2d23d-792c-4398-a404-005313b556c1": { "nome": "Agibank", "conglomerado": "b6e68e03-c85d-54e8-8649-6e9bf9bb5dd8" },
    "283ed41d-7844-4151-8036-1b5ce76eb6fc": { "nome": "Ágora Investimentos", "conglomerado": "0481f9fe-c01b-51c8-88d2-9a18d32b19b3" },
    "71dee9d4-f089-4935-b860-caf2ee46a3be": { "nome": "AILOS", "conglomerado": "f7817b3c-c319-575f-8896-727c1b12cfda" },
    "0b86e761-c797-4247-82be-8c6037d723c5": { "nome": "Alfa", "conglomerado": "e0d17755-eb2b-539d-b90c-a765cdeefc2b" },
    "3659d95a-9916-4b5f-a47a-df37f4dfe7d3": { "nome": "AME DIGITAL", "conglomerado": "17bcf6a1-4249-45cf-a2f1-db0fbcdbecad" },
    "ead802ba-72ce-4e31-866f-463e03e4b4b1": { "nome": "Antrak Bank", "conglomerado": "e1d52399-a2a1-53be-a84b-085c1a94aac5" },
    "268a7fa9-c764-493f-be0d-d6a0abf703bd": { "nome": "Asaas", "conglomerado": "7e780f5a-c95e-4e5e-a4e7-66a4fa43dc6c" },
    "acc11cea-cd64-47e8-9af0-f9d40368cf2a": { "nome": "Azimut Brasil", "conglomerado": "79717d71-0cf4-58f6-b2d0-370d5404d383" },
    "0bd96437-1521-4443-b5a4-92441cdf38cb": { "nome": "Banco ABC Brasil", "conglomerado": "6029b5af-4c13-52ee-b33d-2bc9fd938bdd" },
    "eca0b435-cb2d-45d9-b35a-7e22968b3a68": { "nome": "Banco Arbi S/A", "conglomerado": "65a9cfe4-b7a1-5b59-8e10-3ce0e271b0a5" },
    "cf6aca04-eba7-40f3-beec-fb35cd0ff223": { "nome": "Banco Bari", "conglomerado": "d8ffa2e6-eb03-51fc-b594-6c45275c8391" },
    "cc26199f-4949-4efd-9e1e-f21a34fd0239": { "nome": "Banco Bmg S.A", "conglomerado": "4ae2cefb-e3c1-5624-9448-b3aa4777c539" },
    "baaaf803-04a5-4d0f-8de1-ec4c1adfd27e": { "nome": "BANCO BS2", "conglomerado": "8360e812-a665-5575-b32d-184cebe50e9d" },
    "965a0520-a103-495b-86c1-7e6b4cc4e1f2": { "nome": "Banco BV", "conglomerado": "062c5edb-4e83-5002-9981-e2a96c5ad41e" },
    "e5355a94-5218-4314-82f9-1a5cabdde134": { "nome": "Banco BV Private", "conglomerado": "062c5edb-4e83-5002-9981-e2a96c5ad41e" },
    "4831632d-07f1-472a-a402-ecc4f37b5727": { "nome": "Banco BV Corporate", "conglomerado": "062c5edb-4e83-5002-9981-e2a96c5ad41e" },
    "d16973c6-254d-4c81-a7aa-7a5dbb95073b": { "nome": "Banco BV Web", "conglomerado": "062c5edb-4e83-5002-9981-e2a96c5ad41e" },
    "498f0d4f-3ff7-4010-a43f-f59c63680f27": { "nome": "Banco da Amazônia", "conglomerado": "9ff5e023-dcfe-595b-8be9-4a1b9c1597d6" },
    "f4889d2e-5d68-4c70-81eb-10add5281ea0": { "nome": "Banco Digimais", "conglomerado": "36404f3b-743d-5b87-92a0-ddda3618e7a1" },
    "f9cabb03-876d-4eea-974c-0d8ce4bd4860": { "nome": "Banco Digio", "conglomerado": "27aea8f6-2119-55f8-9553-5ad4b08eeb17" },
    "75db457a-612d-4d62-b557-ba9d32b05216": { "nome": "Banco do Brasil", "conglomerado": "9415f224-9f58-56b5-af4c-085b4438e4eb" },
    "6370a748-6bda-4a37-9e88-5e68cc4cf100": { "nome": "Banco do Nordeste do Brasil S.A.", "conglomerado": "a60b7fb5-f7f3-5536-a41f-1bff137f47d1" },
    "4e984f7b-e7a2-4f61-ba42-f8f85fc15afb": { "nome": "Banco Fibra", "conglomerado": "f8993e33-8f0c-5530-9207-2d9cf8454ee3" },
    "c308d06e-65d1-4aab-997d-4e9f0e8f3129": { "nome": "Banco Genial", "conglomerado": "8292c33e-d95a-5fe7-8f27-dd7a95c68b55" },
    "10efab32-f7f1-41de-84b3-6c7607041474": { "nome": "Banco Guanabara", "conglomerado": "611fbe39-0dc5-521f-8065-0fe780dd90e0" },
    "c8ee6463-eadf-4868-ab6f-af45508f2262": { "nome": "BANCO INDUSTRIAL DO BRASIL", "conglomerado": "d6d2f28d-b019-506c-a438-b11fb1172812" },
    "fcef8e3a-1a48-4a43-9946-0737b029c0c5": { "nome": "Banco Inter - Dados", "conglomerado": "31ee4f72-8769-5136-83e4-03f2dd4c935e" },
    "d7e27a98-ef6c-4b79-b2d8-c2527eba8d84": { "nome": "Banco Inter - Pagamento", "conglomerado": "31ee4f72-8769-5136-83e4-03f2dd4c935e" },
    "6534a862-047e-46c8-9c63-649a5c1bb836": { "nome": "BANCO KEB HANA DO BRASIL S.A.", "conglomerado": "f37149e6-e033-5f11-af23-c5c161794a93" },
    "fddcd293-b518-4b19-a5ca-6a52bc0f151d": { "nome": "Banco Master S.A.", "conglomerado": "1e6aeb44-8b00-5e2a-bcf7-e3db7f3b7e6f" },
    "d58911b5-9c4c-4570-ba32-d0bd0dbc2816": { "nome": "Banco Mercantil", "conglomerado": "5d249486-c697-5295-a856-9955ed3ac332" },
    "3dd83d5d-52cd-43a4-ae23-02f5c5caec38": { "nome": "Banco Original", "conglomerado": "d3f8a4f7-7b6e-5b82-bdbe-bd90414650f0" },
    "612da9a3-ee82-4f9e-9919-fa8ba88800f9": { "nome": "Banco PAN", "conglomerado": "b6a214c7-6332-5a41-8464-a281fb9a4ca0" },
    "3ee8118f-7a93-4e98-871e-653be017ab31": { "nome": "Banco Paulista", "conglomerado": "99aff3b0-5617-5fad-bc6e-66e320a217fc" },
    "a0fe7f9c-91b4-4eab-a0fe-77eb55037d33": { "nome": "Banco RCI - Brasil", "conglomerado": "67a8b715-9318-5a6d-b3cd-3d2e8f2b6cb8" },
    "4719b9dc-8bf0-4ea3-a70d-c85ef8b11682": { "nome": "Banco Ribeirão Preto", "conglomerado": "52d0905b-0a8d-5fcb-a0d1-92ab96ab789e" },
    "aaacb9cf-e8c3-402b-93b8-cf4d3e2ec497": { "nome": "Banco Santander", "conglomerado": "b8d20b1b-e8a7-5099-8174-05ea48bcb566" },
    "e510f7b9-6c52-49e4-8245-8a0eda504001": { "nome": "BANCO SEMEAR", "conglomerado": "abad7f92-1528-5bbf-93fe-1e630e4cb913" },
    "2cac58c2-f9e5-48a3-b981-7263a0641645": { "nome": "Banco Sofisa S.A.", "conglomerado": "bb3b0993-554d-5ea4-91ee-13af4ffe988d" },
    "a0acc9e7-9d32-4f7a-8ddf-a51ea9590285": { "nome": "BANCO TOPAZIO", "conglomerado": "c7b11d9f-05a9-5cca-bfc7-2f103fdfbf99" },
    "9c77c82e-b2e9-46f8-82ee-cc56eb5fb7bc": { "nome": "Banco Voiter SA", "conglomerado": "b23de9c7-5c58-5ca2-867c-74cc65a2b435" },
    "8dd11bd5-165e-4662-9eaa-112ef0d499c0": { "nome": "Banco XP S.A.", "conglomerado": "79717d71-0cf4-58f6-b2d0-370d5404d383" },
    "8d92e794-7e32-43d2-a80e-8e19c3931bf4": { "nome": "Banco XP S.A. (Rico)", "conglomerado": "79717d71-0cf4-58f6-b2d0-370d5404d383" },
    "d0056aca-6180-4ae4-95fa-2e30a08b4a9a": { "nome": "Banco XP S.A. (XP Empresas)", "conglomerado": "79717d71-0cf4-58f6-b2d0-370d5404d383" },
    "d9dbbb94-3595-4e37-8166-055d55110715": { "nome": "BANESE", "conglomerado": "2d8829d2-4784-5a8a-9243-abd4a579000e" },
    "18ce9615-81de-4aaa-8671-e8a95d570fb8": { "nome": "Banestes AS", "conglomerado": "56d70da7-b73c-5b59-801a-54fb418e95ed" },
    "f2d8fb8a-9fa7-4810-8acb-f9e1cfe5319d": { "nome": "Bank Universal", "conglomerado": "e1d52399-a2a1-53be-a84b-085c1a94aac5" },
    "42b54bec-08c3-4d0c-8292-f9391d2a95ea": { "nome": "Bankly", "conglomerado": "e1d52399-a2a1-53be-a84b-085c1a94aac5" },
    "15712c2b-e8eb-4e2f-b84d-656c20d7ef0c": { "nome": "Banpará", "conglomerado": "0663f6ea-2dd2-5b19-9194-dda6763dca7f" },
    "a9395de2-1a63-46d8-b68e-90843cac23ae": { "nome": "banQi", "conglomerado": "1dd7da04-b620-462c-9587-86391979bf57" },
    "88dc57a4-1dab-4493-8b02-b8f0c15a2d89": { "nome": "Banrisul", "conglomerado": "2a01e202-e8f0-5f5a-9651-ebc257371e6e" },
    "c22b2b54-ba1e-41fe-a795-d04f218dcafe": { "nome": "Beeteller Bank", "conglomerado": "84cb10cd-0dd6-4906-8f7e-06c4356f266c" },
    "534cb72a-c838-4a05-ba1b-92b9d961f9a4": { "nome": "Belvo", "conglomerado": "5883e379-43b1-4184-8304-df32a018620e" },
    "401eed26-3e2c-49c4-b5a7-7cbb5d6bfc38": { "nome": "BNDES", "conglomerado": "7d1cf083-fae2-559b-b6ed-d01a7230062f" },
    "702595cb-d881-40b7-8ba7-17db7843f499": { "nome": "BOCOM BBM", "conglomerado": "4a7250ec-eac5-5d8f-b7eb-dc0e8e880203" },
    "828df264-8889-4943-8315-8cbf923224a8": { "nome": "BONUSPAGO SCD S.A.", "conglomerado": "855a97b0-4e20-4379-8fc1-a2954b344637" },
    "579d1186-f64c-4ebb-8530-2c6db9f2a10f": { "nome": "BPP", "conglomerado": "b20c07c6-ec63-5add-bdef-e1023017f166" },
    "95793a20-8c97-4ee3-8685-a62b175bf4e9": { "nome": "Bradescard", "conglomerado": "b2cf16dd-b545-5676-a8eb-76980bd72315" },
    "242885d5-30a1-4e0c-aac4-627d4a1af77b": { "nome": "Bradesco Cartões", "conglomerado": "a72a6d4f-79be-5362-afb6-f8d9c9c39cf5" },
    "b1517256-b39f-4b5a-9418-8d961bbfc2a7": { "nome": "Bradesco Empresas e Negócios", "conglomerado": "a72a6d4f-79be-5362-afb6-f8d9c9c39cf5" },
    "1085e482-4aad-4761-9515-35f364f8f5f3": { "nome": "Bradesco Financiamentos", "conglomerado": "21d26a33-f1bc-5a9e-956c-0bfe048608da" },
    "c6b15844-e748-4408-abb6-e71fd59d71c5": { "nome": "Bradesco Net Empresas", "conglomerado": "a72a6d4f-79be-5362-afb6-f8d9c9c39cf5" },
    "439a9b5c-2cfb-4e57-b60b-20eea83899ca": { "nome": "Bradesco", "conglomerado": "a72a6d4f-79be-5362-afb6-f8d9c9c39cf5" },
    "53b9dd3a-1dc4-4891-9b97-f0a5422532b3": { "nome": "BRASILCARD", "conglomerado": "713a6187-0765-43a8-8c08-df41c5cae389" },
    "6ec597a9-facd-4513-b168-7b8358314c06": { "nome": "BRB - Banco de Brasilia - Dados", "conglomerado": "effb6cae-e6d6-5f0b-8f31-ee7922850300" },
    "40463326-a162-4b44-9afe-7803a6554e31": { "nome": "BRB - Banco de Brasilia - Pagamento", "conglomerado": "effb6cae-e6d6-5f0b-8f31-ee7922850300" },
    "b397dd9c-62b2-4632-bce7-85f56666c083": { "nome": "BTG Banking", "conglomerado": "0bd0b05e-ce18-5105-bbe9-ddf16a79eff9" },
    "ecfee7e8-733e-4bf4-af2a-e72f97d6591e": { "nome": "BTG Corporate", "conglomerado": "0bd0b05e-ce18-5105-bbe9-ddf16a79eff9" },
    "2d641a88-4441-44d9-b39a-a864d1ce8890": { "nome": "BTG Empresas", "conglomerado": "0bd0b05e-ce18-5105-bbe9-ddf16a79eff9" },
    "2caec6e4-9ee2-402d-ad73-465198bd9250": { "nome": "BTG Investimentos", "conglomerado": "0bd0b05e-ce18-5105-bbe9-ddf16a79eff9" },
    "699d679e-3932-493e-88b9-9c5d46eb98cf": { "nome": "BTG Wealth Management", "conglomerado": "0bd0b05e-ce18-5105-bbe9-ddf16a79eff9" },
    "6a0ec228-70b7-4292-9e64-8fa731b2a730": { "nome": "C6 Bank", "conglomerado": "b024cf43-9ce6-52c4-8820-9b5d0bccb74c" },
    "221601a9-6e70-4698-9ea3-1bb28ceb4269": { "nome": "CAIXA", "conglomerado": "c160a6f5-e5df-5067-9e97-ec6fba62fd87" },
    "e69c25b5-c63a-4c25-8564-81f57436481c": { "nome": "CAIXA Tem", "conglomerado": "c160a6f5-e5df-5067-9e97-ec6fba62fd87" },
    "5681c2ff-fcca-475e-a925-95d5cb4f16e0": { "nome": "Cartão Luiza", "conglomerado": "9001a505-f134-534b-aa67-57a462507c61" },
    "6cc863fe-fc77-434a-a585-378ba0788e3f": { "nome": "Cartos SCD", "conglomerado": "ea5f58d1-b363-58ef-9d09-46ae53398b5d" },
    "8823ead9-54e3-421b-973d-1606e21b9945": { "nome": "Caruana SCFI", "conglomerado": "97b71d05-05bc-5f97-9097-1ae718b8b683" },
    "cbca1a1f-84b3-4914-b24d-4f46b8bf57cd": { "nome": "casadocredito", "conglomerado": "796fa4b9-5321-4515-b35b-5de27ae9f7dc" },
    "4461caea-0ec0-4f90-a3f6-016d17b62f55": { "nome": "CIELO", "conglomerado": "d96d6def-7f8f-5623-b15a-0bb5910920d1" },
    "a23ae936-13c2-4220-b20b-bcd8753b2619": { "nome": "CITI", "conglomerado": "df49c2b5-0de6-5a66-a05a-233f1d3cce65" },
    "1daa59f5-920c-4a51-a6ec-3dffdc9682a9": { "nome": "Citibank Distribuidora De TVM", "conglomerado": "df49c2b5-0de6-5a66-a05a-233f1d3cce65" },
    "f78a4da9-7060-43da-a774-9613103415f7": { "nome": "Citibank N.A.", "conglomerado": "df49c2b5-0de6-5a66-a05a-233f1d3cce65" },
    "d3d5e2a1-5448-4d04-ad40-a63003f07e62": { "nome": "Citigroup Global Markets Brasil CCTVM", "conglomerado": "df49c2b5-0de6-5a66-a05a-233f1d3cce65" },
    "0334b3ad-d466-4a5d-bb88-fa12caff07bb": { "nome": "Clear Corretora", "conglomerado": "79717d71-0cf4-58f6-b2d0-370d5404d383" },
    "87f64a5a-474c-4189-80a0-d3cd55718223": { "nome": "Clear Corretora - Nativo", "conglomerado": "79717d71-0cf4-58f6-b2d0-370d5404d383" },
    "6e3b6f08-23c5-4284-ae5e-e6428e317a86": { "nome": "Cora Auth Server", "conglomerado": "19f45346-a153-584d-b10f-3f57a20c4a75" },
    "17a729fb-97f2-450f-90f6-b4d918e47e4a": { "nome": "CRB Bank", "conglomerado": "e1d52399-a2a1-53be-a84b-085c1a94aac5" },
    "66d1ea35-f2eb-4e76-a6b3-477369064045": { "nome": "Credi Nissan", "conglomerado": "67a8b715-9318-5a6d-b3cd-3d2e8f2b6cb8" },
    "f7720aec-5448-4e11-bb5f-72a5f24d06a5": { "nome": "CrediAliança", "conglomerado": "3f0dcd58-52ba-5907-b1e5-e523d37fa458" },
    "165dda80-d894-4a0a-82c6-1b06d7485bf5": { "nome": "Credicard", "conglomerado": "b6b68aba-7b89-5981-8679-28a4244df514" },
    "4e1775d2-d552-47a0-8cd4-38e95a536a4d": { "nome": "Credicoamo", "conglomerado": "2b72d01e-4469-5cdf-a408-c91732b2f772" },
    "732e5d11-11dd-4d63-8483-58bf66ac053b": { "nome": "Credicoopavel", "conglomerado": "5702d43c-be28-5b7b-921e-ab8ab9ea3048" },
    "16047ce9-f130-4450-a73a-44c2b2e1d99b": { "nome": "CREDISAN", "conglomerado": "669dde76-c7a6-535b-8e9b-a8d8ef6b34d6" },
    "fe1bd3c6-8252-4d03-8d65-03ebd34c678f": { "nome": "CrediSIS", "conglomerado": "c0a5427f-2e13-5723-a80e-308e7c31e112" },
    "12532faa-fb28-4534-81a6-8aad89b59887": { "nome": "Credsystem", "conglomerado": "f1d2b054-dc92-4beb-9a9e-0a3607e8d3b7" },
    "d0a262b8-e097-4e53-b5c1-7c26d064afbd": { "nome": "Crefisa", "conglomerado": "9294c0e8-ab01-5614-942d-97f261fe3454" },
    "577885e8-a376-46e7-bbc5-3b41ae992490": { "nome": "CREHNOR LARANJEIRAS", "conglomerado": "37ec98b8-55de-5abe-8928-9d3540d1bbae" },
    "58cd46f4-278d-4ba1-9d8f-82135530d86d": { "nome": "creserv", "conglomerado": "e3dcda74-fe45-5c56-8df6-467657300a33" },
    "408f1bc6-4c6e-4938-8082-003a085f86f6": { "nome": "Cresol", "conglomerado": "7f1d4439-d1d5-5cf8-84a9-fd05305db9c2" },
    "051a52a4-711d-49a9-8452-0f4b35871482": { "nome": "Daycoval", "conglomerado": "af6ca85f-e197-5bfa-9202-35a1be4dee60" },
    "a949b528-44a4-4793-afa9-89bd659c5a23": { "nome": "dLocal", "conglomerado": "2af3b0a1-b810-4e6d-95f0-95f1a9fd8097" },
    "d8268cae-e69d-4b8b-866c-66281ddb3819": { "nome": "EBANX", "conglomerado": "61d294e0-7dce-5ef3-97db-aebe989df40c" },
    "ebbed125-5cd7-42e3-965d-2e7af8e3b7ae": { "nome": "Efí S.A.", "conglomerado": "b43131be-6a7f-5bfb-b436-c3ac5c5c2dac" },
    "895826af-c01b-4805-8a90-e0aea0f6f909": { "nome": "Ella Bank", "conglomerado": "e1d52399-a2a1-53be-a84b-085c1a94aac5" },
    "77f28126-03fa-48fa-9ae6-0f3d2995b99c": { "nome": "EMCASH", "conglomerado": "e1d52399-a2a1-53be-a84b-085c1a94aac5" },
    "0e3b4087-7b5e-4d27-ad8f-06acab7b0b73": { "nome": "Empréstimo Sim", "conglomerado": "f83bee4f-26df-53d7-8335-a8a6edd7e340" },
    "c002faf0-e6ba-439a-8079-3299c0026e05": { "nome": "EQI", "conglomerado": "0bd0b05e-ce18-5105-bbe9-ddf16a79eff9" },
    "4dec626e-a458-49ef-9191-38560c4b354f": { "nome": "Ewally", "conglomerado": "7bf9806a-b7f5-4515-9ac7-5c155e3cf068" },
    "72f143e8-4f65-423e-ad72-0428791194b6": { "nome": "Fast", "conglomerado": "e1d52399-a2a1-53be-a84b-085c1a94aac5" },
    "50e27c13-8e0d-498a-8f3a-e463b34d59fb": { "nome": "Fidúcia", "conglomerado": "cee01906-9630-41af-b186-155ef49ba13b" },
    "ca530b71-0e3c-41d0-ae45-7f8836a08a97": { "nome": "Finnet", "conglomerado": "39bf5c68-08b7-4039-9fb3-b211792c5082" },
    "cb9c5532-c649-4268-8a8d-0787a277318e": { "nome": "FitBank", "conglomerado": "46efd0ae-a7d7-4858-a272-fa3790e16795" },
    "f569b097-e5a5-4996-b20d-7ff524287da2": { "nome": "GERU SCD", "conglomerado": "0ca05092-025f-47c4-b878-4a03c150cccf" },
    "ba49bb87-33cb-4f97-b819-b7b8fac06166": { "nome": "Getnet", "conglomerado": "37069280-dd12-5475-b79e-2e434bb8db4b" },
    "9c6d71aa-1106-4e25-a2ac-9203898117b8": { "nome": "Health Cash", "conglomerado": "e1d52399-a2a1-53be-a84b-085c1a94aac5" },
    "2239bcff-58db-4b43-a47d-0d91201bcf62": { "nome": "Hipercard", "conglomerado": "8f25b949-de2d-59c2-967a-2f4ca924890e" },
    "759feeba-2c5e-41b9-81dc-f68d65f69087": { "nome": "Hyundai Financiamentos", "conglomerado": "e5f4ae4a-9732-5a9d-86f6-31509e7dd46a" },
    "f7289672-301a-4053-8716-bdcc671767ad": { "nome": "IBIAM", "conglomerado": "25f7932a-a188-5491-896c-5bda5f4fd789" },
    "ffba6a4b-b8c0-43fe-a802-4cc65f47c7fa": { "nome": "Indigo Investimentos", "conglomerado": "d718ef55-3d7d-4b2f-90be-5db12e91fbcd" },
    "8cdad2fd-c8d5-42c0-9a00-f0f6826470d2": { "nome": "InfinitePay", "conglomerado": "fae29bd3-fac3-4f34-b2e1-139ba63f9440" },
    "a9a63c7c-8a64-41f6-b419-0cfe3579343b": { "nome": "Iniciador", "conglomerado": "0e5ae3f4-ad98-4b40-b603-d9fed2a5f89b" },
    "d2194006-7f15-4356-a689-9b66009fee1a": { "nome": "Investimentos BB", "conglomerado": "9415f224-9f58-56b5-af4c-085b4438e4eb" },
    "80a8f94c-6c7b-4731-9611-952f3bdfd00c": { "nome": "Íon", "conglomerado": "9c721898-9ce0-50f1-bf85-05075557850b" },
    "68308291-ec0d-4398-83ce-68b6b1087e49": { "nome": "Itaú", "conglomerado": "9c721898-9ce0-50f1-bf85-05075557850b" },
    "7c6748a1-2be0-4593-a769-77feb406b3a0": { "nome": "Itaú Empresas", "conglomerado": "9c721898-9ce0-50f1-bf85-05075557850b" },
    "be5d6358-cdbb-47c5-93ff-cb999d992a9a": { "nome": "Itaú Emps", "conglomerado": "9c721898-9ce0-50f1-bf85-05075557850b" },
    "969e8463-c8e5-4074-b467-0b7f1fbe6a28": { "nome": "Itaucard", "conglomerado": "9c721898-9ce0-50f1-bf85-05075557850b" },
    "497accee-16a6-4daa-84a1-83eb8f46fed0": { "nome": "Iti", "conglomerado": "9c721898-9ce0-50f1-bf85-05075557850b" },
    "365ce24f-3873-44ec-a6a5-f6788bb7c9a7": { "nome": "Iugu", "conglomerado": "f1f45e74-57da-43d0-b246-fbb29e348661" },
    "251a15c0-610b-48c2-a9cb-37ed9e4a09d4": { "nome": "J17 Sociedade de Crédito", "conglomerado": "ed159ebc-0757-4964-9b63-c2d52fe58674" },
    "06514173-55e6-4dcd-9177-1c129935b859": { "nome": "JP Morgan", "conglomerado": "5b4514ba-7aec-5ad2-90c7-6c9adf4ed398" },
    "8b11c686-57bf-4000-94c8-e950ae4d7410": { "nome": "Klavi", "conglomerado": "63157678-2559-4c12-a1f8-859a278e408a" },
    "b4c57bee-261d-48d5-97ba-e3599029cd05": { "nome": "LISTO", "conglomerado": "ca146165-ab58-4c91-b023-baedddbf9f16" },
    "6b3e8b90-8c15-49d4-90c4-bb3e87de2f90": { "nome": "Losango", "conglomerado": "ccdce1b1-79f4-5c42-8ba9-13cb23a18b71" },
    "ffb7aac7-b6a8-4091-a0f4-6cf17865ff46": { "nome": "MagaluPay Empresas", "conglomerado": "7eebe017-cb01-498c-81e4-6b4149b18e93" },
    "dcd4560f-574e-43ff-93a3-a4b4e5106899": { "nome": "MEI Fácil", "conglomerado": "6f86d2ab-8ef7-4a9b-8c5f-d081f183c490" },
    "4095c8fe-55d9-4596-a62a-c3bcc04a85db": { "nome": "Méliuz", "conglomerado": "062c5edb-4e83-5002-9981-e2a96c5ad41e" },
    "9326f9b2-ae57-42c4-a0d9-acc4ba434696": { "nome": "Mercado Pago", "conglomerado": "e5a1c7ad-11d4-560d-914c-611003a39219" },
    "7a7a9a8d-f086-44b6-b81e-215d516c27c1": { "nome": "Midway", "conglomerado": "42609b73-82bc-5758-9c12-7e0bcc84885e" },
    "f90732bc-7eb7-4d8f-8e4e-913583d95b6c": { "nome": "Mobilize Financial Services", "conglomerado": "67a8b715-9318-5a6d-b3cd-3d2e8f2b6cb8" },
    "10987c3d-7f6a-4a54-a25d-9eb3e2ab30bf": { "nome": "modalmais Trader", "conglomerado": "79717d71-0cf4-58f6-b2d0-370d5404d383" },
    "6976323f-fe2a-4ac5-a5d6-db3016b70278": { "nome": "MoneyPlus Auth Server", "conglomerado": "f475af96-81d1-5a95-a656-f8a824bb84e3" },
    "778319f3-7593-45ec-a029-8eadbf8ceef7": { "nome": "Monte Bravo", "conglomerado": "79717d71-0cf4-58f6-b2d0-370d5404d383" },
    "6043c568-5ecb-4ee1-a01a-92ad3baf3d05": { "nome": "Necton", "conglomerado": "0bd0b05e-ce18-5105-bbe9-ddf16a79eff9" },
    "3f15766b-4fc1-4d22-b6ee-5eb05d6cec8f": { "nome": "Neon", "conglomerado": "6f86d2ab-8ef7-4a9b-8c5f-d081f183c490" },
    "ba185564-2e26-420e-b6bb-af5bc7102480": { "nome": "next", "conglomerado": "a72a6d4f-79be-5362-afb6-f8d9c9c39cf5" },
    "37c33803-d50b-4308-a5d9-4abc540b9813": { "nome": "Nitybank", "conglomerado": "e1d52399-a2a1-53be-a84b-085c1a94aac5" },
    "06c19499-3412-4125-84b7-d0fbc98b5019": { "nome": "Nubank", "conglomerado": "926e3037-a685-553c-afa3-f7cb46ff8084" },
    "7b11125f-4e15-4a2b-bc8e-2bac790e586b": { "nome": "Numbrs", "conglomerado": "1a7178ab-ed8d-5475-89b7-5f1f9c6a3e25" },
    "7c85a529-958f-4065-bf0d-edf00800b675": { "nome": "Olé Consignado", "conglomerado": "b8d20b1b-e8a7-5099-8174-05ea48bcb566" },
    "baf2de93-5d38-4da9-887a-70b485bc21fb": { "nome": "OMNI BANCO SA", "conglomerado": "0dd36270-d5d6-5bec-86ca-c9b8fcb015dd" },
    "40a9d1b3-4888-4010-af48-937ceac75a01": { "nome": "Ótimo SCD", "conglomerado": "c79aa350-5325-5e8c-bf9d-437a58748090" },
    "3557f9f7-897a-45a2-9b3b-86a9eb8061dd": { "nome": "Ourinvest", "conglomerado": "e22a73ad-dcdd-5e58-b096-3fc785c81d5e" },
    "d28dfafa-41d6-426d-a8d7-5df28db17139": { "nome": "Ourocard", "conglomerado": "9415f224-9f58-56b5-af4c-085b4438e4eb" },
    "649ffe9a-503d-4635-a0fd-41f4b5135b6c": { "nome": "PagBank", "conglomerado": "21f306af-5a9a-5dc6-a8f3-f56ff394e7be" },
    "88d1cadd-caf0-4769-affe-b34e6abd8b7e": { "nome": "PagueVeloz", "conglomerado": "01843746-0350-4758-8647-f8c9c5aa86d8" },
    "66281209-b89c-40c8-9244-82c69ef01add": { "nome": "PARANÁ BANCO", "conglomerado": "9cbed331-1e64-5d5a-84aa-fc64758993ab" },
    "2f5909f4-65d0-4136-a888-ccb999e9ea4d": { "nome": "PARATI CFI", "conglomerado": "3a5ea40d-b088-5118-ac8d-869964bfd67a" },
    "b89b3096-5ff1-491a-b745-b5cc669125a2": { "nome": "Pay4Fun", "conglomerado": "9dbab347-34fb-4c30-a2f9-32e2e67d4b5a" },
    "b7a7ecd2-a93a-4715-b281-e79b0a388143": { "nome": "Pefisa", "conglomerado": "aaa29038-e09c-5210-afe4-132750a6157c" },
    "9d9ff069-de05-4749-bb54-f0b6d4592337": { "nome": "Pernambucanas", "conglomerado": "aaa29038-e09c-5210-afe4-132750a6157c" },
    "756b9782-d9d4-4f9b-9756-997eba0e2cbd": { "nome": "PicPay", "conglomerado": "c0f47d95-78e7-5f20-b0ea-ff8a75a44a76" },
    "be927760-d679-4c60-b5af-de2db2fa7bd6": { "nome": "PicPay Negócios", "conglomerado": "c0f47d95-78e7-5f20-b0ea-ff8a75a44a76" },
    "a553aa7d-b636-4ef8-bf0d-a955b428c9c5": { "nome": "Player’s Bank", "conglomerado": "9c721898-9ce0-50f1-bf85-05075557850b" },
    "3e7b5a81-ecbd-444e-8495-50ea7b954e0e": { "nome": "Porto Bank", "conglomerado": "9c721898-9ce0-50f1-bf85-05075557850b" },
    "10b4f3da-e04e-4904-9988-e93c8f141ab1": { "nome": "QI SCD", "conglomerado": "30e4d3c0-f0a8-53b8-95d3-0af6b2ffddee" },
    "66c11181-42ad-4a3b-894c-8db9b224874d": { "nome": "Quero-Quero PAG", "conglomerado": "486dbae5-2466-4592-9f30-efe1af447903" },
    "f11dd303-5bb9-44fc-b927-52d3346bcc35": { "nome": "RANDON", "conglomerado": "a1868c74-2df8-471e-ac93-ea12ae39eaa5" },
    "1ddc397d-26ef-4afe-b93a-f62502c3789f": { "nome": "Rapidium Bank", "conglomerado": "e1d52399-a2a1-53be-a84b-085c1a94aac5" },
    "fa0b8ff7-f06a-43e8-bb62-5997772a6287": { "nome": "Realize", "conglomerado": "315af131-b651-4d60-884e-ae571774f450" },
    "158dfa02-fa59-4177-9bfb-b614220dd721": { "nome": "RecargaPay", "conglomerado": "63d4b5c5-1a5b-47a8-ac33-36609f934c87" },
    "22abeef9-e5a9-42c3-a9de-80bfa5727522": { "nome": "Rede", "conglomerado": "c5845a52-3db6-540b-b0c1-a8c60bf59637" },
    "dee2fb3b-3e5b-44d7-8c98-d36f56d6a6a7": { "nome": "Rede Celcoin", "conglomerado": "c55ceb2e-c9fb-4989-8ed1-39208d6d7951" },
    "10ee8292-41e0-43a2-a977-12835ace7396": { "nome": "Rendimento", "conglomerado": "3c13ff66-3972-5ce5-9e78-49cac18af52a" },
    "fde63db6-f775-44d3-ad88-406a1fb0a48d": { "nome": "Safra Empresas", "conglomerado": "709138dd-6e9d-5f96-bfff-69a5b2cb3ec0" },
    "98a03835-414b-45fb-af81-ca27f080ee62": { "nome": "Safra Financeira", "conglomerado": "709138dd-6e9d-5f96-bfff-69a5b2cb3ec0" },
    "bfd95599-61c0-45ca-90cb-5d6e71d4cf9a": { "nome": "Safra", "conglomerado": "709138dd-6e9d-5f96-bfff-69a5b2cb3ec0" },
    "6fa3b099-f9bd-4a76-82d4-5a51d3460ff8": { "nome": "SafraPay", "conglomerado": "709138dd-6e9d-5f96-bfff-69a5b2cb3ec0" },
    "134fbccb-d28d-4515-bc1e-7fdfb9b99ae9": { "nome": "Samaha Bank", "conglomerado": "e1d52399-a2a1-53be-a84b-085c1a94aac5" },
    "3e3d765a-9ddc-48ba-96b4-120eca8bc047": { "nome": "Santander Cartões", "conglomerado": "b8d20b1b-e8a7-5099-8174-05ea48bcb566" },
    "f8338227-7036-41b6-a2ef-3dcacdda609a": { "nome": "Santander Corretora", "conglomerado": "9f1959f0-5fa8-54c7-a978-329994ffe3bd" },
    "c0523b75-d0f2-4811-a0e9-5d89ef80beba": { "nome": "Santander Crédito Imobiliário Empresas", "conglomerado": "b8d20b1b-e8a7-5099-8174-05ea48bcb566" },
    "b124508c-8b6f-4b4e-a10e-42920ae18a05": { "nome": "Santander Crédito Imobiliário", "conglomerado": "b8d20b1b-e8a7-5099-8174-05ea48bcb566" },
    "53870d50-ca83-406b-bf09-bf16d75bf632": { "nome": "Santander Financiamentos", "conglomerado": "f83bee4f-26df-53d7-8335-a8a6edd7e340" },
    "3f9a3d01-2445-4399-af36-cf3c5326bb8e": { "nome": "SEARA", "conglomerado": "c7ef81e9-f8e9-54bb-a845-7439ac3f0b7f" },
    "a606d3ac-d6fb-49f8-88af-46ef0326f6e4": { "nome": "Senff", "conglomerado": "9d056db2-97a6-5d55-8728-34923d018a8a" },
    "b35f5047-eaae-47ee-9e66-4ceab834b2fe": { "nome": "Shopee Dados", "conglomerado": "96748716-9b96-448c-a2b7-2abf9762af8e" },
    "99fb53a6-7da8-4482-ad40-209c0111c271": { "nome": "Shopee Pagamento", "conglomerado": "96748716-9b96-448c-a2b7-2abf9762af8e" },
    "c2d48e71-07af-4442-8c7d-c82d0eb45e5f": { "nome": "Sicoob", "conglomerado": "777b3ece-75ea-5fa7-a464-dd29b141e99e" },
    "6c8b9aed-8e24-4ad6-985f-213623a23be3": { "nome": "Sicredi", "conglomerado": "0da3f6e5-a748-55d1-b39f-1653df146729" },
    "3c4a5cda-712b-42df-8389-e9912cc6a6d5": { "nome": "Sisprime do Brasil", "conglomerado": "b185ecfd-53b1-51ac-86bf-51d6cd66d828" },
    "b909f992-301e-455d-a694-e4e806663350": { "nome": "Snob Bank", "conglomerado": "e1d52399-a2a1-53be-a84b-085c1a94aac5" },
    "3d96f9e6-0f14-4d83-afd2-d8f8b8dcb9f5": { "nome": "Socinal S.A. CFI", "conglomerado": "cbabc7d7-249a-448a-8dab-2f82c5488018" },
    "a56e9c89-012a-4197-b0e3-ff37a1b07031": { "nome": "STONE PAGAMENTOS S.A.", "conglomerado": "a3cec8d6-65b1-529d-bac5-9892d0c4efa3" },
    "ba2c2bc8-8543-4113-8ba4-d7e9bf86b491": { "nome": "Sulcredi Abelardo Luz", "conglomerado": "b02ed954-c23f-5d69-a957-f44d4f73e1b1" },
    "b5ad172a-8d79-4640-847e-fa7ec880a26e": { "nome": "Sulcredi amplea", "conglomerado": "12b75f0d-43f5-54fb-a292-36da6141fceb" },
    "878b12a5-08e0-4df2-b248-c83b76937aa6": { "nome": "SumUp", "conglomerado": "50b67cd8-5f86-5f81-99b5-af83dae25c74" },
    "b096d65c-159f-4e3d-b23b-c7e62fc64479": { "nome": "Superdigital", "conglomerado": "bbfdd54c-2a82-5843-b4f0-20e7733ebf0c" },
    "0064406c-573b-4da7-af34-c89069877182": { "nome": "Superlogica SCD SA", "conglomerado": "df9fd49d-d71c-4980-b4d0-b7bb64c1cdea" },
    "d482cb6a-8884-4cdd-8049-4151071a946d": { "nome": "Testing", "conglomerado": "d2d325d6-af6c-45ce-89e3-a8569fed8a8e" },
    "75d4f12d-56ff-4059-9608-b403bc0ccd4b": { "nome": "Toro", "conglomerado": "2ef309cb-7e91-44c5-a426-554fb972a9c2" },
    "05cf863f-b573-4dce-a061-cb67eb78ca17": { "nome": "Travelex", "conglomerado": "6f516cdd-6a2e-5cd8-9a0d-c630a0f80bc8" },
    "10c49138-4774-41b2-9d1d-26b1026a4974": { "nome": "Tribanco", "conglomerado": "357eb23b-f14d-5323-936d-f5b47dcb0eb6" },
    "65065e6b-2154-4b73-bd32-b52a706fd97e": { "nome": "Trinus SCD", "conglomerado": "10cdce05-4d58-4b09-9da8-6637dee369dc" },
    "7f2249e4-8d3d-4133-8c19-4c54c62459fa": { "nome": "U4C", "conglomerado": "23f9e3dd-31a1-4eaf-a440-37711ad34e81" },
    "319b8d3c-ab1d-4c6a-bd6f-4b94faf4beed": { "nome": "Uber Conta by Digio", "conglomerado": "27aea8f6-2119-55f8-9553-5ad4b08eeb17" },
    "0fe513ea-fef1-464a-aa1a-46f3a88d21b4": { "nome": "UltraBank", "conglomerado": "e1d52399-a2a1-53be-a84b-085c1a94aac5" },
    "646b2dc7-3a9e-4d2e-9ded-665e7150d529": { "nome": "Unicred", "conglomerado": "3526aff7-18d3-52f9-9668-ddd4753ea09e" },
    "eaf49708-0c81-46bc-ac42-6b8378485544": { "nome": "Uniprime Central", "conglomerado": "18543a69-338d-5e5b-8aa3-dc640ef5f4a2" },
    "b643fac9-f432-4c67-9e81-cc006c37b1e6": { "nome": "Up.p SEP SA", "conglomerado": "e5b51083-adc2-5775-b0fc-02b263b1c40d" },
    "7586bfae-a239-47ff-b4d6-a22ab99e5964": { "nome": "Uzzipay IP S.A", "conglomerado": "4b6305f8-8060-4d96-920f-13b60b0a88fd" },
    "95b355de-fd37-4004-b726-0624ea736056": { "nome": "Volvo Car Financial Services", "conglomerado": "f83bee4f-26df-53d7-8335-a8a6edd7e340" },
    "45dc7a2e-a2f5-46d8-9eb4-6afac3c0d9c2": { "nome": "WHG", "conglomerado": "79717d71-0cf4-58f6-b2d0-370d5404d383" },
    "d3490ea1-f043-4942-ba79-29906e2bfa1b": { "nome": "Will Bank", "conglomerado": "275e4816-b225-47be-a9c1-a5eb3d0d2969" },
    "74f9cbfb-1016-4558-a78c-5a55814ce52a": { "nome": "Woop", "conglomerado": "0da3f6e5-a748-55d1-b39f-1653df146729" },
    "2ba35e89-a932-469f-85c5-4a0ba8b28304": { "nome": "ZEMA CFI S/A", "conglomerado": "e93badba-7da7-5cb8-8b85-88ddb2fb8bd7" }
};

// -------------------------------------------------------------
// ESTADO GLOBAL & DASHBOARD INTERATIVO
// -------------------------------------------------------------
let dashboardStats = { all: 0, passed: 0, failed: 0 };
let currentFilter = 'all';

const resultsHeader = document.getElementById('resultsHeader');
const countAll = document.getElementById('countAll');
const countPassed = document.getElementById('countPassed');
const countFailed = document.getElementById('countFailed');
const clearBtn = document.getElementById('clearBtn');
const filterBtns = document.querySelectorAll('.filter-btn');

function updateScoreboard() {
    if (dashboardStats.all > 0 && resultsHeader) {
        resultsHeader.style.display = 'flex';
    } else if (resultsHeader) {
        resultsHeader.style.display = 'none';
    }
    
    if(countAll) countAll.textContent = dashboardStats.all;
    if(countPassed) countPassed.textContent = dashboardStats.passed;
    if(countFailed) countFailed.textContent = dashboardStats.failed;
    
    applyFilter();
}

filterBtns.forEach(btn => {
    btn.addEventListener('click', (e) => {
        filterBtns.forEach(b => b.classList.remove('active'));
        const target = e.currentTarget;
        target.classList.add('active');
        currentFilter = target.getAttribute('data-filter');
        applyFilter();
    });
});

function applyFilter() {
    const reports = document.querySelectorAll('.file-report');
    reports.forEach(report => {
        const status = report.getAttribute('data-status');
        if (currentFilter === 'all' || currentFilter === status) {
            report.classList.remove('hidden');
        } else {
            report.classList.add('hidden');
        }
    });
}

if(clearBtn) {
    clearBtn.addEventListener('click', () => {
        document.getElementById('resultsContainer').innerHTML = `<div class="empty-state"><p>Nenhum log processado ainda. Aguardando envio...</p></div>`;
        dashboardStats = { all: 0, passed: 0, failed: 0 };
        updateScoreboard();
        window.evidenceGalleries = {}; 
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

document.addEventListener('keydown', (e) => {
    if (!lightboxModal.classList.contains('active')) return;
    if (e.key === 'Escape') lightboxModal.classList.remove('active');
    if (e.key === 'ArrowLeft') lightboxPrev.click();
    if (e.key === 'ArrowRight') lightboxNext.click();
});

// -------------------------------------------------------------
// MOTOR PRINCIPAL E PROCESSAMENTO DE ARQUIVOS
// -------------------------------------------------------------
const dropZone = document.getElementById('dropZone');
const fileInput = document.getElementById('fileInput');
const uploadBtn = document.getElementById('uploadBtn');

if (uploadBtn && fileInput && dropZone) {
    uploadBtn.addEventListener('click', () => fileInput.click());
    dropZone.addEventListener('click', (e) => { if(e.target !== uploadBtn) fileInput.click(); });

    ['dragenter', 'dragover', 'dragleave', 'drop'].forEach(eventName => { dropZone.addEventListener(eventName, preventDefaults, false); });
    function preventDefaults(e) { e.preventDefault(); e.stopPropagation(); }

    ['dragenter', 'dragover'].forEach(eventName => { dropZone.addEventListener(eventName, () => dropZone.classList.add('drag-active'), false); });
    ['dragleave', 'drop'].forEach(eventName => { dropZone.addEventListener(eventName, () => dropZone.classList.remove('drag-active'), false); });

    dropZone.addEventListener('drop', (e) => { const dt = e.dataTransfer; if (dt.files && dt.files.length > 0) processFiles(dt.files); });
    fileInput.addEventListener('change', function() { if(this.files && this.files.length > 0) processFiles(this.files); });
}

async function processFiles(files) {
    const container = document.getElementById("resultsContainer");
    const emptyState = container.querySelector('.empty-state');
    if (emptyState) emptyState.remove();

    const loadingId = 'loading-' + Date.now();
    container.insertAdjacentHTML('afterbegin', `<div id="${loadingId}" style="text-align:center; padding: 20px; color: var(--color-primary); font-weight: 500;">A extrair ${files.length} arquivo(s)... ⚡</div>`);

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
            
            let testPassed = resultados[0].sucesso === true;

            const blockResult = generateFileBlock(file.name, metadata, resultados, evidencias, htmlBlobUrl, testPassed);
            
            dashboardStats.all++;
            if (blockResult.isPassed) dashboardStats.passed++;
            else dashboardStats.failed++;

            htmlFinal += blockResult.html;

        } catch (error) {
            console.error(`Erro no arquivo ${file.name}:`, error);
            htmlFinal += `
            <div class="file-report report-failed">
                <h3 class="file-header">❌ Falha ao processar o arquivo: ${file.name}</h3>
                <p style="padding: 10px; color: var(--status-danger); font-size: 0.9rem;">
                    Erro técnico na extração do log. <br>
                    <strong>Detalhe:</strong> ${error.message}
                </p>
            </div>`;
        }
    }
    
    document.getElementById(loadingId)?.remove();
    container.insertAdjacentHTML('afterbegin', htmlFinal);
    
    updateScoreboard();
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
// EXTRATOR DE METADADOS
// -------------------------------------------------------------
function extractMetadata(htmlString) {
    const extractJson = (key) => {
        const regex = new RegExp(`(?:\"|&quot;)${key}(?:\"|&quot;)\\s*:\\s*(?:\"|&quot;)([^\"&]+)(?:\"|&quot;)`, 'i');
        const match = htmlString.match(regex);
        return match ? match[1].trim() : "Não encontrado";
    };

    let asId = extractJson("AuthorisationServerId");
    if (asId === "Não encontrado") asId = extractJson("authorisationServerId");
    if (asId === "Não encontrado") asId = extractJson("as_id");
    if (asId === "Não encontrado") asId = extractJson("as-id");
    
    if (asId === "Não encontrado") {
        const asIdMatch = htmlString.match(/(?:AuthorisationServerId|authorisationServerId|as_id|as-id)[\s\S]{0,250}?(?:>|&quot;|")([0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12})(?:<|&quot;|")/i);
        if (asIdMatch) {
            asId = asIdMatch[1].toLowerCase();
        }
    }

    let aliasMatch = htmlString.match(/(?:<td[^>]*>alias<\/td>|<th[^>]*>alias<\/th>)[\s\S]{0,1000}?<pre[^>]*>([^<]+)<\/pre>/i);
    let alias = aliasMatch ? aliasMatch[1].trim() : extractJson("alias");
    
    let institutionName = extractJson("CustomerFriendlyName");
    if (institutionName === "Não encontrado") institutionName = extractJson("OrganisationName");

    let cnpjDaInstituicao = extractJson("brazilCNPJ");
    if (cnpjDaInstituicao === "Não encontrado") {
        const regexNested = /(?:"|&quot;)businessEntity(?:"|&quot;)\s*:\s*\{[\s\S]{0,300}?(?:"|&quot;)identification(?:"|&quot;)\s*:\s*(?:"|&quot;)([^"&]+)(?:"|&quot;)/i;
        const matchNested = htmlString.match(regexNested);
        if (matchNested) cnpjDaInstituicao = matchNested[1].trim();
    }

    let userAgentMatch = htmlString.match(/<td class="more-key">user-agent<\/td>[\s\S]{0,250}?<pre[^>]*>([^<]+)<\/pre>/i);
    let userAgentRaw = userAgentMatch ? userAgentMatch[1].trim() : extractJson("user-agent");
    
    let deviceLabel = `Outro`;
    if (userAgentRaw !== "Não encontrado") {
        let ua = userAgentRaw.toLowerCase();
        if (ua.includes("android")) deviceLabel = `Android`;
        else if (ua.includes("iphone") || ua.includes("ipad") || ua.includes("ios") || ua.includes("darwin")) deviceLabel = `iOS`;
        else if (ua.includes("windows") || ua.includes("macintosh") || ua.includes("linux")) deviceLabel = `Desktop`;
        else if (ua.includes("postman") || ua.includes("insomnia") || ua.includes("axios")) deviceLabel = `API Client`;
    }

    const temBusinessEntity = /businessEntity/i.test(htmlString);
    const temBrazilCnpj = /brazilCNPJ/i.test(htmlString);

    return { 
        alias, asId, cnpj: cnpjDaInstituicao, institutionName, 
        temBusinessEntity, temBrazilCnpj, device: deviceLabel 
    };
}

function analyzeFvpLogs(htmlString) {
    const metadata = extractMetadata(htmlString); 
    const resultados = [];
    const isInterrupted = /Status:\s*(?:<[^>]+>\s*)*INTERRUPTED/i.test(htmlString) || /Result:\s*(?:<[^>]+>\s*)*INTERRUPTED/i.test(htmlString);
    
    const failureBlockRegex = /<b[^>]*>\s*Failure summary\s*:?\s*<\/b>([\s\S]{0,1500}?)<\/td>/gi;
    let match;

    while ((match = failureBlockRegex.exec(htmlString)) !== null) {
        let erroLimpo = match[1].replace(/<li[^>]*>/gi, "\n- ").replace(/<\/?[^>]+(>|$)/g, "").trim();
        if (erroLimpo) resultados.push({ summary: erroLimpo });
    }

    if (isInterrupted && resultados.length === 0) {
        resultados.push({ isInterrupted: true, summary: "O módulo de teste foi INTERROMPIDO fatalmente pelo FVP." });
    } else if (resultados.length === 0) {
        resultados.push({ sucesso: true, summary: "" });
    }
    
    return { metadata, resultados };
}

// -------------------------------------------------------------
// VALIDADOR FINAL (COM ÍCONES SVG DE ALTO NÍVEL)
// -------------------------------------------------------------
function generateFileBlock(fileName, meta, resultados, evidencias, htmlBlobUrl, testPassed) {
    
    let validacaoHtml = "";
    let validacaoInstHtml = "";

    // Ícones SVG Vetorizados
    const iconSuccess = `<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="var(--status-success)" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" style="flex-shrink: 0; margin-top: 2px;"><polyline points="20 6 9 17 4 12"></polyline></svg>`;
    const iconError = `<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="var(--status-danger)" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" style="flex-shrink: 0; margin-top: 2px;"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>`;

    const safeAlias = meta.alias && meta.alias !== "Não encontrado" ? meta.alias.toLowerCase() : "";
    const safeFileName = fileName ? fileName.toLowerCase() : "";

    const isPF = safeAlias.includes('-pf') || safeFileName.includes('pf') || safeAlias.includes('personal');
    const isPJ = safeAlias.includes('-pj') || safeFileName.includes('pj') || safeAlias.includes('business');
    let tipoTesteLabel = "Não Identificado (Validar Manualmente)";

    const temBusiness = meta.temBusinessEntity;
    const temCnpj = meta.temBrazilCnpj;
    
    const isCustomDataUnique = safeFileName.includes('customer_data_unique') || safeAlias.includes('customer_data_unique');

    // 1. Validação de Estrutura PF / PJ 
    if (isPF) {
        tipoTesteLabel = "Pessoa Física (PF)";
        let vazados = [];
        
        if (temBusiness) vazados.push("BusinessEntity");
        if (temCnpj && !isCustomDataUnique) vazados.push("BrazilCNPJ");
        
        if (vazados.length > 0) {
            validacaoHtml = `
            <div class="validation-box error">
                ${iconError}
                <div><strong>Estrutura PF com erro:</strong> O teste apresenta os campos de PJ (${vazados.join(' e ')}).</div>
            </div>`;
            testPassed = false;
        } else {
            let avisoExtra = (temCnpj && isCustomDataUnique) ? "<br><span style='color: var(--status-warning); font-size: 0.85rem; margin-top: 4px; display: block;'>⚠️ <b>Auditoria Automática:</b> A tag 'brazilCnpj' foi detectada no log, mas ignorada pela regra de exceção do teste <i>customer_data_unique</i>.</span>" : "";
            validacaoHtml = `
            <div class="validation-box success">
                ${iconSuccess}
                <div><strong>Estrutura PF Correta:</strong> Arquivo limpo de BusinessEntity indevido.${avisoExtra}</div>
            </div>`;
        }
    } else if (isPJ) {
        tipoTesteLabel = "Pessoa Jurídica (PJ)";
        let faltantes = [];
        if(!temBusiness) faltantes.push("BusinessEntity");
        if(!temCnpj) faltantes.push("BrazilCNPJ");
        
        if (faltantes.length > 0) {
            validacaoHtml = `
            <div class="validation-box error">
                ${iconError}
                <div><strong>Estrutura PJ Incompleta:</strong> Falta o campo ${faltantes.join(' e ')}.</div>
            </div>`;
            testPassed = false;
        } else {
            validacaoHtml = `
            <div class="validation-box success">
                ${iconSuccess}
                <div><strong>Estrutura PJ Correta:</strong> Campos obrigatórios presentes no log.</div>
            </div>`;
        }
    }

    // 2. Inteligência Resolutora de Conflitos
    let transmissoraEncontrada = null;
    const logAsId = meta.asId;
    const logNome = meta.institutionName;
    
    const normalize = str => str.toLowerCase().replace(/[^a-z0-9]/gi, '');
    const logNomeNorm = logNome !== "Não encontrado" ? normalize(logNome) : "";

    let marcaPeloId = dbAsId[logAsId] ? { ...dbAsId[logAsId], id: logAsId } : null;
    let marcaPeloNome = null;

    if (logNomeNorm) {
        for (const key in dbAsId) {
            if (normalize(dbAsId[key].nome) === logNomeNorm) {
                marcaPeloNome = { ...dbAsId[key], id: key };
                break;
            }
        }
        if (!marcaPeloNome && !marcaPeloId) {
            for (const key in dbAsId) {
                if (logNomeNorm.includes(normalize(dbAsId[key].nome))) {
                    marcaPeloNome = { ...dbAsId[key], id: key };
                    break;
                }
            }
        }
    }

    if (marcaPeloNome && marcaPeloId && marcaPeloNome.id !== marcaPeloId.id) {
        transmissoraEncontrada = marcaPeloNome;
    } else {
        transmissoraEncontrada = marcaPeloNome || marcaPeloId;
    }

    if (transmissoraEncontrada) {
        validacaoInstHtml = `
        <div class="validation-box success">
            ${iconSuccess}
            <div><strong>Marca Transmissora Validada:</strong> O log pertence de fato à marca <b>${transmissoraEncontrada.nome}</b>.</div>
        </div>`;
        meta.institutionName = transmissoraEncontrada.nome;
        meta.asId = transmissoraEncontrada.id; 
    } else if (logAsId === "Não encontrado" || !logAsId) {
        validacaoInstHtml = `
        <div class="validation-box error">
            ${iconError}
            <div><strong>Erro Crítico de Leitura:</strong> Cabeçalho FVP não identificado no log. AS-ID não encontrado.</div>
        </div>`;
        testPassed = false;
    } else {
        validacaoInstHtml = `
        <div class="validation-box error">
            ${iconError}
            <div><strong>Erro Crítico:</strong> O log retornou a instituição "<b>${logNome}</b>" (AS-ID: <strong>${logAsId}</strong>), mas ela não está na Tabela do Sistema.</div>
        </div>`;
        testPassed = false;
    }

    const borderStatusClass = testPassed ? 'report-passed' : 'report-failed';
    const dataStatus = testPassed ? 'passed' : 'failed';

    let html = `
    <div class="file-report ${borderStatusClass}" data-status="${dataStatus}">
        <h3 class="file-header" style="justify-content: space-between;">
            <div style="display:flex; align-items:center;">
                📄 ${fileName} 
                <span class="badge" style="margin-left: 12px; font-size: 0.65rem;">Modo: ${tipoTesteLabel}</span>
            </div>
            <a href="${htmlBlobUrl}" target="_blank" class="btn-view-log">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"></path><polyline points="15 3 21 3 21 9"></polyline><line x1="10" y1="14" x2="21" y2="3"></line></svg>
                Abrir Log
            </a>
        </h3>
        
        ${validacaoInstHtml}
        ${validacaoHtml}

        <div class="metadata-grid">
            <div class="metadata-item"><span>Auth. Server ID Oficial</span><strong>${meta.asId}</strong></div>
            <div class="metadata-item"><span>Marca Identificada</span><strong>${meta.institutionName}</strong></div>
            <div class="metadata-item"><span>Alias da Execução</span><strong>${meta.alias}</strong></div>
            <div class="metadata-item"><span>Dispositivo / Client</span><strong>${meta.device}</strong></div>
            ${meta.cnpj && meta.cnpj !== "Não encontrado" ? `<div class="metadata-item"><span>CNPJ Detectado</span><strong>${meta.cnpj}</strong></div>` : ""}
        </div>
    `;

    if (!testPassed || evidencias.mostrarPainel) {
        const c = evidencias.checklist;
        const cssClass = (c.saldo && c.versaoApp && c.erro) ? "ok" : "nok";
        
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
                    <li style="color: ${c.saldo ? 'var(--status-success)' : 'var(--text-muted)'}">${c.saldo ? iconSuccess : iconError} Comprovante de Saldo</li>
                    <li style="color: ${c.versaoApp ? 'var(--status-success)' : 'var(--text-muted)'}">${c.versaoApp ? iconSuccess : iconError} Captura da Versão do App</li>
                    <li style="color: ${c.erro ? 'var(--status-success)' : 'var(--text-muted)'}">${c.erro ? iconSuccess : iconError} Evidência do Erro</li>
                </ul>
                ${galeriaHtml}
            </div>
        `;
    }

    html += `</div>`;
    return { html, isPassed: testPassed };
}