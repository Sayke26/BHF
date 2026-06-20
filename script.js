/* ==========================================================================
   GLOBAL TELEMETRY CORE REGISTER & CONTEXT ब्लू प्रिंट
   ========================================================================== */
const branches = [
    "SDC (Globe)", "SDC (PLDT)", "Pawnshop Bonifacio", "Pawnshop Kayang",
    "Pawnshop La Trinidad", "Pawnshop Leonard", "Pawnshop Main", "Gemline Main",
    "Gemline SM", "Bloomfield Hotel", "Patch Cafe", "217 Bonifacio Residences",
    "Lemon and Olives", "BHF Lending", "Human Resource Department", "BHF Admin"
];

function generateMockDatabase() {
    const defaultData = {};
    const brands = ["Dell OptiPlex", "HP ProDesk", "Lenovo ThinkCentre"];
    const processors = ["Intel Core i7-12700 (4.9 GHz)", "Intel Core i5-12400 (4.4 GHz)", "AMD Ryzen 5 5600G (4.4 GHz)"];
    const storages = ["M.2 NVMe SSD", "SATA SSD"];
    const capacities = ["256GB", "512GB"];
    const statuses = ["Healthy", "Healthy", "Healthy", "Warning", "Healthy", "Healthy", "Critical", "Healthy", "Healthy", "Warning"];

    branches.forEach(branch => {
        defaultData[branch] = [];
        for (let i = 1; i <= 10; i++) {
            const healthStatus = statuses[i - 1];
            const capacity = capacities[Math.floor(Math.random() * capacities.length)];
            let pcTemp, processorTemp, boardTemp;

            if (healthStatus === "Healthy") {
                pcTemp = Math.floor(Math.random() * 8) + 34;
                processorTemp = Math.floor(Math.random() * 10) + 42;
                boardTemp = Math.floor(Math.random() * 7) + 32;
            } else if (healthStatus === "Warning") {
                pcTemp = Math.floor(Math.random() * 10) + 58;
                processorTemp = Math.floor(Math.random() * 8) + 68;
                boardTemp = Math.floor(Math.random() * 10) + 48;
            } else {
                pcTemp = Math.floor(Math.random() * 10) + 74;
                processorTemp = Math.floor(Math.random() * 10) + 84;
                boardTemp = Math.floor(Math.random() * 10) + 61;
            }

            defaultData[branch].push({
                pcName: `PC-${i < 10 ? '0' + i : i}`,
                state: "Active", 
                health: healthStatus,
                pcProcessor: processors[Math.floor(Math.random() * processors.length)],
                pcTemp: pcTemp,
                brand: brands[Math.floor(Math.random() * brands.length)],
                storage: storages[Math.floor(Math.random() * storages.length)],
                capacity: capacity,
                freeSpace: capacity === "256GB" ? "45GB" : "190GB",
                processorTemp: processorTemp,
                boardTemp: boardTemp
            });
        }
    });
    return defaultData;
}

// Global scope loading checks local storage cache or falls back to standard generation blueprint
let pcData = JSON.parse(localStorage.getItem("pcData")) || generateMockDatabase();
let remarks = JSON.parse(localStorage.getItem("remarks")) || [];
let currentBranch = "";
let editingIndex = -1;
let branchChart = null;
let overallChart = null;

window.onload = () => {
    createBranchButtons();
    populateBranchDropdowns();
    loadHomeRemarks();
    syncBroadcastPCSelection();
    
    const adminSelect = document.getElementById("adminBranchSelect");
    if (adminSelect) {
        if (!adminSelect.value) {
            adminSelect.value = branches[0];
        }
        loadAdminBranch();
    }
};

function createBranchButtons(){
    const grid = document.getElementById("branchGrid");
    if (!grid) return; 
    grid.innerHTML = "";
    branches.forEach((branch) => {
        const btn = document.createElement("button");
        btn.innerHTML = `<i class="fas fa-building" style="margin-right:10px; color:var(--bhf-blue);"></i> ${branch}`;
        btn.onclick = () => loadBranchDashboard(branch);
        grid.appendChild(btn);
    });
}

function populateBranchDropdowns(){
    const adminSelect = document.getElementById("adminBranchSelect");
    const branchInput = document.getElementById("branchInput");
    const remarkBranch = document.getElementById("remarkBranch");

    if(adminSelect) adminSelect.innerHTML = "";
    if(branchInput) branchInput.innerHTML = "";
    if(remarkBranch) remarkBranch.innerHTML = "";

    branches.forEach(branch => {
        const opt = `<option value="${branch}">${branch}</option>`;
        if(adminSelect) adminSelect.innerHTML += opt;
        if(branchInput) branchInput.innerHTML += opt;
        if(remarkBranch) remarkBranch.innerHTML += opt;
    });
}

function syncBroadcastPCSelection() {
    const container = document.getElementById("broadcastPcCheckboxContainer");
    const remarkBranchSelect = document.getElementById("remarkBranch");
    if(!container || !remarkBranchSelect) return;
    
    const selectedBranch = remarkBranchSelect.value;
    if(!selectedBranch) return;
    
    container.innerHTML = "";
    const workstations = pcData[selectedBranch] || [];
    
    if(workstations.length === 0) {
        container.innerHTML = `<span style="font-size:12px; color:#64748b;">No active nodes found inside this branch.</span>`;
        return;
    }
    
    workstations.forEach(pc => {
        container.innerHTML += `
            <label class="pc-checkbox-label">
                <input type="checkbox" name="broadcastPCs" value="${pc.pcName}">
                <span>${pc.pcName}</span>
            </label>
        `;
    });
}

// ==========================================================================
// ENGINE ROUTING MANAGER
// ==========================================================================
function navigateTo(targetPageId) {
    document.querySelectorAll('.page').forEach(p => { p.classList.remove('active'); p.classList.add('hidden'); });
    const target = document.getElementById(targetPageId);
    if(target) { 
        target.classList.remove('hidden'); 
        setTimeout(() => { target.classList.add('active'); }, 50); 
    }
}
function goHome(){ navigateTo("homePage"); loadHomeRemarks(); }
function showOverallSummary(){ navigateTo("overallPage"); loadOverallSummary(); }

function showAdminPanel() {
    const modal = document.getElementById("pinModalOverlay");
    if(modal) { 
        document.getElementById("securePassField").value = ""; 
        modal.classList.remove("hidden"); 
        document.getElementById("securePassField").focus(); 
    }
}
function closeAdminPinModal() { document.getElementById("pinModalOverlay").classList.add("hidden"); }
function verifyAdminPinCode() {
    const pass = document.getElementById("securePassField").value;
    if(pass === "123456" || pass === "12345") {
        closeAdminPinModal(); 
        navigateTo("adminPage"); 
        loadAdminBranch();
        loadRemarksList();
    } else {
        alert("Access Denied.");
    }
}

// ==========================================================================
// RENDERING ENGINES & DASHBOARD OPERATIONS
// ==========================================================================
function loadBranchDashboard(branch){
    currentBranch = branch; 
    navigateTo("dashboardPage");
    document.getElementById("selectedBranchTitle").innerText = branch + " Asset Telemetry";
    const recs = pcData[branch] || [];
    const h = recs.filter(p => p.health === "Healthy").length;
    const w = recs.filter(p => p.health === "Warning").length;
    const c = recs.filter(p => p.health === "Critical").length;

    document.getElementById("totalPCs").innerText = recs.length;
    document.getElementById("healthyPCs").innerText = h;
    document.getElementById("warningPCs").innerText = w;
    document.getElementById("criticalPCs").innerText = c;

    loadBranchTable(branch); 
    loadBranchRemarks(branch);
    
    if(branchChart) branchChart.destroy();
    const ctx = document.getElementById("branchChart");
    if(ctx && typeof Chart !== "undefined") {
        branchChart = new Chart(ctx, { 
            type: "doughnut", 
            data: { 
                labels: ["Healthy", "Warning", "Critical"], 
                datasets: [{ data: [h, w, c], backgroundColor: ["#2ebd59", "#ff9f00", "#ff3b30"] }] 
            }, 
            options: { responsive: true, maintainAspectRatio: false, plugins: { legend: { display: false } } } 
        });
    }
}

function loadBranchTable(branch){
    const tbody = document.getElementById("branchTableBody"); 
    if(!tbody) return; 
    tbody.innerHTML = "";
    (pcData[branch] || []).forEach(pc => {
        const stateBadge = pc.state === "Down" ? `<span class="badge badge-down">Down</span>` : `<span class="badge badge-active">Active</span>`;
        tbody.innerHTML += `
            <tr>
                <td><b>${pc.pcName}</b></td>
                <td>${stateBadge}</td>
                <td><span class="badge badge-${pc.health.toLowerCase()}">${pc.health}</span></td>
                <td><i class="fas fa-microchip" style="color:#475569;"></i> <small style="font-weight:600;">${pc.pcProcessor}</small></td>
                <td>${pc.brand}</td><td>${pc.storage}</td><td>${pc.capacity}</td><td>${pc.freeSpace}</td>
                <td>${pc.pcTemp}°C</td><td>${pc.processorTemp}°C</td><td>${pc.boardTemp}°C</td>
            </tr>
        `;
    });
}

function loadOverallSummary(){
    const tbody = document.getElementById("overallTableBody"); 
    if(!tbody) return; 
    tbody.innerHTML = "";
    let globalPcs = 0, globalH = 0, globalW = 0, globalC = 0;
    const labels = [], values = [];

    branches.forEach(b => {
        const recs = pcData[b] || [];
        const h = recs.filter(p => p.health === "Healthy").length;
        const w = recs.filter(p => p.health === "Warning").length;
        const c = recs.filter(p => p.health === "Critical").length;

        globalPcs += recs.length; globalH += h; globalW += w; globalC += c;
        labels.push(b); values.push(recs.length);

        tbody.innerHTML += `<tr><td><b>${b}</b></td><td><b>${recs.length}</b></td><td class="healthy">${h}</td><td class="warning">${w}</td><td class="critical">${c}</td></tr>`;
    });

    document.getElementById("overallBranches").innerText = branches.length;
    document.getElementById("overallPCs").innerText = globalPcs;
    document.getElementById("overallHealthy").innerText = globalH;
    document.getElementById("overallMaintenance").innerText = globalW; 
    document.getElementById("overallIssues").innerText = globalC; 

    if(overallChart) overallChart.destroy();
    const ctx = document.getElementById("overallChart");
    if(ctx && typeof Chart !== "undefined") {
        overallChart = new Chart(ctx, { 
            type: "bar", 
            data: { 
                labels: labels.map(l => l.split(" ")[0]), 
                datasets: [{ label: "Nodes", data: values, backgroundColor: "#0d47a1" }] 
            }, 
            options: { responsive: true, maintainAspectRatio: false } 
        });
    }
}

// ==========================================================================
// ADMINISTRATION DATA RECORD HANDLERS
// ==========================================================================
function loadAdminBranch(){
    const select = document.getElementById("adminBranchSelect"); 
    if(!select) return;
    const branch = select.value;
    const tbody = document.getElementById("adminTableBody"); 
    if(!tbody) return; 
    tbody.innerHTML = "";
    
    (pcData[branch] || []).forEach((pc, idx) => {
        const stateBadge = pc.state === "Down" ? `<span class="badge badge-down">Down</span>` : `<span class="badge badge-active">Active</span>`;
        tbody.innerHTML += `
            <tr>
                <td><b>${pc.pcName}</b></td>
                <td>${stateBadge}</td>
                <td><span class="badge badge-${pc.health.toLowerCase()}">${pc.health}</span></td>
                <td><small style="font-weight:700; color:#475569;"><i class="fas fa-microchip"></i> ${pc.pcProcessor}</small></td>
                <td><small>${pc.brand}</small></td><td><small>${pc.storage}</small></td><td><b>${pc.capacity}</b></td><td>${pc.freeSpace}</td>
                <td>${pc.pcTemp}°C</td><td>${pc.processorTemp}°C</td><td>${pc.boardTemp}°C</td>
                <td>
                    <div style="display:flex; gap:4px; justify-content:center;">
                        <button class="edit-btn" onclick="editPC('${branch}', ${idx})">Edit</button>
                        <button class="delete-btn" onclick="deletePC('${branch}', ${idx})">Delete</button>
                    </div>
                </td>
            </tr>
        `;
    });
}

function showAddPCForm(){ 
    editingIndex = -1; 
    document.getElementById("formTitleHeader").innerText = "Register New Node Infrastructure Asset"; 
    document.getElementById("pcFormContainer").classList.remove("hidden"); 
    document.getElementById("pcForm").reset();
    document.getElementById("pcState").value = "Active";
}

function editPC(branch, idx) {
    editingIndex = idx;
    document.getElementById("editingIndex").value = idx;
    const pc = pcData[branch][idx];
    const modal = document.getElementById("pcModalOverlay");

    document.getElementById("modalPcState").value = pc.state;
    document.getElementById("modalHealth").value = pc.health;
    document.getElementById("modalProcessor").value = pc.pcProcessor || "";
    document.getElementById("modalBrand").value = pc.brand || "";
    document.getElementById("modalStorage").value = pc.storage || "";
    document.getElementById("modalCapacity").value = pc.capacity || "";
    document.getElementById("modalFreeSpace").value = pc.freeSpace || "";
    document.getElementById("modalPcTemp").value = pc.pcTemp || "";

    modal.classList.remove("hidden");
}

function closePcModal() {
    const modal = document.getElementById("pcModalOverlay");
    if(modal) modal.classList.add("hidden");
}

function deletePC(branch, idx){ 
    if(confirm("Delete record?")) { 
        const pcName = pcData[branch][idx].pcName;
        pcData[branch].splice(idx,1); 
        localStorage.setItem("pcData", JSON.stringify(pcData)); 
        addHistoryEntry("DECOMMISSION", `Removed node asset tracking for ${pcName} at ${branch}`);
        loadAdminBranch(); 
        syncBroadcastPCSelection();
    } 
}

// Initialization of main inline creation form submission event pipeline handler
document.addEventListener("DOMContentLoaded", () => {
    const f = document.getElementById("pcForm");
    if(f) f.addEventListener("submit", function(e){
        e.preventDefault();
        const branch = document.getElementById("branchInput").value;
        const pcNameVal = document.getElementById("pcName").value;
        
        const pc = {
            pcName: pcNameVal, 
            state: document.getElementById("pcState").value, 
            health: document.getElementById("health").value,
            pcProcessor: document.getElementById("pcProcessor").value, 
            pcTemp: Number(document.getElementById("pcTemp").value) || 0,
            brand: document.getElementById("brand").value, 
            storage: document.getElementById("storage").value,
            capacity: document.getElementById("capacity").value, 
            freeSpace: document.getElementById("freeSpace").value,
            processorTemp: Number(document.getElementById("processorTemp").value) || 0, 
            boardTemp: Number(document.getElementById("boardTemp").value) || 0
        };
        
        if(editingIndex === -1) {
            if(!pcData[branch]) pcData[branch] = [];
            pcData[branch].push(pc); 
            addHistoryEntry("REGISTER", `Appended new endpoint system node maps: ${pcNameVal} to ${branch}`);
        } else {
            pcData[branch][editingIndex] = pc;
            addHistoryEntry("UPDATE", `Modified operational parameter specifications for: ${pcNameVal}`);
        }
        
        localStorage.setItem("pcData", JSON.stringify(pcData)); 
        f.reset(); 
        document.getElementById("pcFormContainer").classList.add("hidden");
        editingIndex = -1;
        loadAdminBranch(); 
        syncBroadcastPCSelection();
    });
});

function commitPcChanges() {
    const branch = document.getElementById("adminBranchSelect").value;
    const idx = document.getElementById("editingIndex").value;
    if(!pcData[branch] || !pcData[branch][idx]) return;
    
    const pcName = pcData[branch][idx].pcName;

    pcData[branch][idx] = {
        ...pcData[branch][idx],
        state: document.getElementById("modalPcState").value,
        health: document.getElementById("modalHealth").value,
        pcProcessor: document.getElementById("modalProcessor").value,
        brand: document.getElementById("modalBrand").value,
        storage: document.getElementById("modalStorage").value,
        capacity: document.getElementById("modalCapacity").value,
        freeSpace: document.getElementById("modalFreeSpace").value,
        pcTemp: Number(document.getElementById("modalPcTemp").value) || 0
    };

    localStorage.setItem("pcData", JSON.stringify(pcData));
    addHistoryEntry("UPDATE", `Modified properties via overlay matrix for ${pcName} at ${branch}`);
    
    closePcModal();
    loadAdminBranch(); 
}

// ==========================================================================
// INCIDENT DISPATCH BROADCAST ENGINE WITH ASSET FILTERS
// ==========================================================================
function saveRemark() {
    const textVal = document.getElementById("remarkText").value.trim();
    if(!textVal) {
        alert("Payload broadcast details cannot be empty.");
        return;
    }

    const checkedBoxes = document.querySelectorAll('input[name="broadcastPCs"]:checked');
    const targetedPCsArray = Array.from(checkedBoxes).map(cb => cb.value);

    const remark = {
        branch: document.getElementById("remarkBranch").value,
        category: document.getElementById("remarkCategory").value,
        text: textVal,
        targetedPCs: targetedPCsArray,
        replies: []
    };

    remarks.push(remark);
    localStorage.setItem("remarks", JSON.stringify(remarks));

    document.getElementById("remarkText").value = "";
    
    // Clear selection checkboxes
    document.querySelectorAll('input[name="broadcastPCs"]').forEach(cb => cb.checked = false);

    loadRemarksList();
    loadHomeRemarks();
    if (currentBranch) loadBranchRemarks(currentBranch);
}

function buildScopeBadgeInfo(targetedPCsArray) {
    if(!targetedPCsArray || targetedPCsArray.length === 0) {
        return `<span class="badge" style="background:#f1f5f9; color:#475569; border:1px solid #cbd5e1;"><i class="fas fa-globe"></i> General Branch Announcement</span>`;
    }
    return `<span class="badge" style="background:#eff6ff; color:#1e40af; border:1px solid #bfdbfe;"><i class="fas fa-desktop"></i> Scope: ${targetedPCsArray.join(', ')}</span>`;
}

function loadHomeRemarks(){
    const container = document.getElementById("homeRemarks"); 
    if(!container) return; 
    container.innerHTML = "";
    if(remarks.length === 0){ 
        container.innerHTML = "<p style='color:#94a3b8; font-size:13px;'>No active broadcasts.</p>"; 
        return; 
    }

    remarks.slice().reverse().slice(0, 5).forEach((r, originalIndex) => {
        const actualIndex = remarks.length - 1 - originalIndex;
        container.innerHTML += `
        <div class="remark-card border-${r.category.toLowerCase()}">
            <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:6px;">
                <div class="remark-category text-${r.category.toLowerCase()}">${r.category}</div>
                ${buildScopeBadgeInfo(r.targetedPCs)}
            </div>
            <div style="font-size:13px; font-weight:700;">${r.branch}</div>
            <div style="font-size:13px; color:#475569; margin-top:2px;">${r.text}</div>
            <div class="transmission-controls">
                <button class="btn-link-action" onclick="toggleReplyAccordion('home', ${actualIndex})"><i class="far fa-comment-alt"></i> Thread (${r.replies ? r.replies.length : 0})</button>
            </div>
            <div id="accordion-home-${actualIndex}" class="reply-thread-accordion hidden">
                <div id="replies-home-${actualIndex}" class="reply-stream-box">${renderInlineReplyBubbles(r.replies)}</div>
                <div class="reply-input-inline">
                    <input type="text" id="input-home-${actualIndex}" placeholder="Type reply...">
                    <button type="button" onclick="submitInlineReply('home', ${actualIndex})">Reply</button>
                </div>
            </div>
        </div>`;
    });
}

function loadRemarksList(){
    const container = document.getElementById("remarksList"); 
    if(!container) return; 
    container.innerHTML = "";
    if(remarks.length === 0) {
        container.innerHTML = "<p style='color:#94a3b8; font-size:13px; padding:10px;'>No current network logs deployed.</p>";
        return;
    }
    
    remarks.forEach((r, index) => {
        container.innerHTML += `
        <div class="remark-card border-${r.category.toLowerCase()}">
            <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:6px;">
                <div class="remark-category text-${r.category.toLowerCase()}">${r.category}</div>
                ${buildScopeBadgeInfo(r.targetedPCs)}
            </div>
            <div><b>Location:</b> ${r.branch}</div>
            <div style="margin:4px 0; font-size:13px;">${r.text}</div>
            <div class="transmission-controls">
                <button class="btn-link-action" onclick="toggleReplyAccordion('admin', ${index})"><i class="far fa-comment-alt"></i> Thread (${r.replies ? r.replies.length : 0})</button>
                <button class="delete-btn" style="padding:2px 6px; font-size:10px; margin-left:auto;" onclick="deleteRemark(${index})">Remove</button>
            </div>
            <div id="accordion-admin-${index}" class="reply-thread-accordion hidden">
                <div id="replies-admin-${index}" class="reply-stream-box">${renderInlineReplyBubbles(r.replies)}</div>
                <div class="reply-input-inline">
                    <input type="text" id="input-admin-${index}" placeholder="Type operational log response...">
                    <button type="button" onclick="submitInlineReply('admin', ${index})">Reply</button>
                </div>
            </div>
        </div>`;
    });
}

function loadBranchRemarks(branch){
    const container = document.getElementById("branchRemarks"); 
    if(!container) return; 
    container.innerHTML = "";
    
    remarks.forEach((r, index) => {
        if(r.branch === branch) {
            container.innerHTML += `
            <div class="remark-card border-${r.category.toLowerCase()}">
                <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:6px;">
                    <div class="remark-category text-${r.category.toLowerCase()}">${r.category}</div>
                    ${buildScopeBadgeInfo(r.targetedPCs)}
                </div>
                <div style="font-size:13px;">${r.text}</div>
                <div class="transmission-controls">
                    <button class="btn-link-action" onclick="toggleReplyAccordion('branch', ${index})"><i class="far fa-comment-alt"></i> Thread (${r.replies ? r.replies.length : 0})</button>
                </div>
                <div id="accordion-branch-${index}" class="reply-thread-accordion hidden">
                    <div id="replies-branch-${index}" class="reply-stream-box">${renderInlineReplyBubbles(r.replies)}</div>
                    <div class="reply-input-inline">
                        <input type="text" id="input-branch-${index}" placeholder="Type response...">
                        <button type="button" onclick="submitInlineReply('branch', ${index})">Reply</button>
                    </div>
                </div>
            </div>`;
        }
    });
    if(container.innerHTML === "") container.innerHTML = "<p style='color:#94a3b8; font-size:13px;'>No ongoing logs.</p>";
}

function toggleReplyAccordion(prefix, index) { 
    const el = document.getElementById(`accordion-${prefix}-${index}`); 
    if(el) el.classList.toggle("hidden"); 
}

function renderInlineReplyBubbles(arr) {
    if(!arr || arr.length === 0) return `<span style="font-size:11px; color:#94a3b8; padding:4px; display:block;">No response logs found in thread.</span>`;
    return arr.map(rep => `<div class="single-reply-bubble"><div>${rep.text}</div><small><i class="far fa-clock"></i> ${rep.date}</small></div>`).join('');
}

function submitInlineReply(prefix, index) {
    const input = document.getElementById(`input-${prefix}-${index}`); 
    if(!input || input.value.trim() === "") return;
    
    if(!remarks[index].replies) remarks[index].replies = [];
    remarks[index].replies.push({ text: input.value.trim(), date: new Date().toLocaleTimeString() });
    
    localStorage.setItem("remarks", JSON.stringify(remarks)); 
    input.value = "";
    
    loadHomeRemarks(); 
    loadRemarksList(); 
    if(currentBranch) loadBranchRemarks(currentBranch);
}

function deleteRemark(idx){ 
    remarks.splice(idx,1); 
    localStorage.setItem("remarks", JSON.stringify(remarks)); 
    loadRemarksList(); 
    loadHomeRemarks(); 
    if (currentBranch) loadBranchRemarks(currentBranch);
}

// ==========================================================================
// AUDIT LOG MANAGEMENT PIPELINE
// ==========================================================================
function toggleHistoryPane() {
    const pane = document.getElementById("historyContainer");
    if(!pane) return;
    pane.classList.toggle("hidden");
    if (!pane.classList.contains("hidden")) {
        renderHistory();
    }
}

function addHistoryEntry(action, description) {
    const history = JSON.parse(localStorage.getItem("systemHistory")) || [];
    const entry = {
        id: Math.floor(100000 + Math.random() * 900000),
        action,
        description,
        timestamp: new Date().toLocaleTimeString()
    };
    history.push(entry);
    localStorage.setItem("systemHistory", JSON.stringify(history));
    renderHistory();
}

function renderHistory() {
    const tbody = document.getElementById("historyLogBody");
    if (!tbody) return;
    
    const history = JSON.parse(localStorage.getItem("systemHistory")) || [];
    tbody.innerHTML = history.slice().reverse().map(entry => `
        <tr>
            <td>#${entry.id}</td>
            <td><span class="badge" style="background:#e2e8f0; color:#475569">${entry.action}</span></td>
            <td>${entry.description} <small style="color:#64748b; margin-left:5px;">[${entry.timestamp}]</small></td>
            <td style="text-align:center;">
                <button class="delete-btn" onclick="deleteLog(${entry.id})">Remove</button>
            </td>
        </tr>
    `).join("");
}

function deleteLog(id) {
    let history = JSON.parse(localStorage.getItem("systemHistory")) || [];
    history = history.filter(entry => entry.id !== id);
    localStorage.setItem("systemHistory", JSON.stringify(history));
    renderHistory();
}

function clearAllAuditLogs() {
    if (!confirm("Delete all history logs?")) return;
    localStorage.removeItem("systemHistory");
    renderHistory();
}