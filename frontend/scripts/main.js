const API_BASE = "/";

let retailerNames = ["AR", "MM", "jana", "ashok", "SKI", "Ranga", "iqbal", "PVS"];
let filterRetailerNames = [
    ...retailerNames,
    "Monthu", "Inchu", "Manju", "Abuta", "Hussaian"
];
let retailers = [];
let savedFirst = false;


// --- Approximate M/J tracking ---
let initialApproxM = null;
let initialApproxJ = null;
let approxBaseM = 0;
let approxBaseJ = 0;

// --- Half Commission Accounts Section ---
const halfCommissionNames = [
  "UK", "sundara", "ragu", "muddu", "Ravi","Sanjeeva", "Ramesh", "Sukesh", "Rajesh", "Anni", "HS", "Arun"
];
let halfCommissionRows = halfCommissionNames.map(name => ({
    name,
    m: "",
    j: ""
}));

// --- AUTOSAVE/RESTORE/RESET LOGIC ---
function saveDistributionToLocal() {
    const data = {
        retailers,
        savedFirst,
        initialApproxM,
        initialApproxJ,
        approxBaseM,
        approxBaseJ
    };
    localStorage.setItem('distribution_autosave', JSON.stringify(data));
}

function loadDistributionFromLocal() {
    const data = localStorage.getItem('distribution_autosave');
    if (data) {
        try {
            const parsed = JSON.parse(data);
            if (parsed.retailers && Array.isArray(parsed.retailers)) {
                retailers = parsed.retailers;
            }
            if (typeof parsed.savedFirst === "boolean") savedFirst = parsed.savedFirst;
            if (typeof parsed.initialApproxM !== "undefined") initialApproxM = parsed.initialApproxM;
            if (typeof parsed.initialApproxJ !== "undefined") initialApproxJ = parsed.initialApproxJ;
            if (typeof parsed.approxBaseM !== "undefined") approxBaseM = parsed.approxBaseM;
            if (typeof parsed.approxBaseJ !== "undefined") approxBaseJ = parsed.approxBaseJ;
        } catch (e) {
            // ignore parse errors
        }
    }
}

function resetDistribution() {
    localStorage.removeItem('distribution_autosave');
    retailers = retailerNames.map(name => ({
        name,
        mFrozen: '',
        jFrozen: '',
        mNew: '',
        jNew: ''
    }));
    savedFirst = false;
    initialApproxM = null;
    initialApproxJ = null;
    approxBaseM = 0;
    approxBaseJ = 0;
    renderRetailers();
    updateTotals();
}
window.resetDistribution = resetDistribution;
// --- END AUTOSAVE/RESTORE/RESET LOGIC ---

function sum(str) {
    if (!str) return 0;
    return str
        .split('+')
        .map(v => parseFloat(v.trim()) || 0)
        .reduce((a, b) => a + b, 0);
}

// Render all retailer rows
function renderRetailers() {
    const retailersDiv = document.getElementById('retailers');
    retailersDiv.innerHTML = '';
    retailers.forEach((r, i) => {
        const container = document.createElement('div');
        container.className = 'retailer-box';
        container.innerHTML = `
    <div class="retailer-name">${r.name}</div>
    <div class="expression-input">
        M: <input type="text" id="m_${i}" value="${r.mFrozen + (r.mNew ? '+' + r.mNew : '')}" oninput="handleInput(${i}, 'm')" ${savedFirst ? '' : ''}/>
        = <span class="sum-pill" id="m_sum_${i}"><span class="sum-icon">🧮</span>${sum(r.mFrozen + (r.mNew ? '+' + r.mNew : ''))}</span>
    </div>
    <div class="expression-input">
        J: <input type="text" id="j_${i}" value="${r.jFrozen + (r.jNew ? '+' + r.jNew : '')}" oninput="handleInput(${i}, 'j')" ${savedFirst ? '' : ''}/>
        = <span class="sum-pill" id="j_sum_${i}"><span class="sum-icon">🧮</span>${sum(r.jFrozen + (r.jNew ? '+' + r.jNew : ''))}</span>
    </div>
`;
        retailersDiv.appendChild(container);
    });
    updateTotals();
}
window.renderRetailers = renderRetailers;

function updateTotals() {
    let totalM1 = 0, totalJ1 = 0, totalM2 = 0, totalJ2 = 0;
    retailers.forEach((r, i) => {
        // 1st Distribution sum
        totalM1 += sum(r.mFrozen);
        totalJ1 += sum(r.jFrozen);
        // 2nd Distribution sum
        totalM2 += sum(r.mNew);
        totalJ2 += sum(r.jNew);

        // Update input box and sum display
        const mInput = document.getElementById(`m_${i}`);
        const jInput = document.getElementById(`j_${i}`);
        if (mInput) mInput.value = r.mFrozen + (r.mNew ? '+' + r.mNew : '');
        if (jInput) jInput.value = r.jFrozen + (r.jNew ? '+' + r.jNew : '');
        const mSum = document.getElementById(`m_sum_${i}`);
        const jSum = document.getElementById(`j_sum_${i}`);
        if (mSum) mSum.innerHTML = `<span class="sum-icon">🧮</span>${sum(r.mFrozen + (r.mNew ? '+' + r.mNew : ''))}`;
        if (jSum) jSum.innerHTML = `<span class="sum-icon">🧮</span>${sum(r.jFrozen + (r.jNew ? '+' + r.jNew : ''))}`;
    });

    document.getElementById('firstM').value = totalM1;
    document.getElementById('firstJ').value = totalJ1;
    document.getElementById('secondM').value = totalM2;
    document.getElementById('secondJ').value = totalJ2;
    document.getElementById('totalM').innerText = totalM1 + totalM2;
    document.getElementById('totalJ').innerText = totalJ1 + totalJ2;

    const approxMInput = document.getElementById('approxM');
    const approxJInput = document.getElementById('approxJ');
    const totalDistributedM = totalM1 + totalM2;
    const totalDistributedJ = totalJ1 + totalJ2;

    if (approxMInput && initialApproxM !== null) {
        let remainM = initialApproxM - (totalDistributedM - approxBaseM);
        if (remainM < 0) remainM = 0;
        approxMInput.value = remainM;
    }
    if (approxJInput && initialApproxJ !== null) {
        let remainJ = initialApproxJ - (totalDistributedJ - approxBaseJ);
        if (remainJ < 0) remainJ = 0;
        approxJInput.value = remainJ;
    }
}

function handleInput(id, type) {
    let input = document.getElementById(`${type}_${id}`);
    let value = input.value;

    if (!savedFirst) {
        retailers[id][type + 'Frozen'] = value;
        retailers[id][type + 'New'] = '';
    } else {
        let frozen = retailers[id][type + 'Frozen'];
        if (!value.startsWith(frozen)) {
            input.value = frozen + (retailers[id][type + 'New'] ? '+' + retailers[id][type + 'New'] : '');
            return;
        }
        let newPart = value.slice(frozen.length);
        if (newPart.startsWith('+')) newPart = newPart.slice(1);
        retailers[id][type + 'New'] = newPart;
    }
    updateTotals();
    saveDistributionToLocal();
}
window.handleInput = handleInput;

function addRetailer(name = '') {
    if (!name) {
        name = prompt("Enter retailer name:");
        if (!name) return;
    }
    // Prevent duplicate names
    if (
        retailers.some(r => r.name === name)
    ) {
        alert("Retailer already exists!");
        return;
    }
    retailers.push({ name, mFrozen: '', jFrozen: '', mNew: '', jNew: '' });
    renderRetailers();
    updateAccountsTable();
    saveDistributionToLocal();
}
window.addRetailer = addRetailer;

// --- THIS IS THE KEY FIX: permanent retailers always at the top, in order ---
window.onload = function() {
    loadDistributionFromLocal();
    // If retailers is empty (first load), initialize with permanent names
    if (retailers.length === 0) {
        retailers = retailerNames.map(name => ({
            name,
            mFrozen: '',
            jFrozen: '',
            mNew: '',
            jNew: ''
        }));
    } else {
        // Always keep permanent retailers at the top, in order, and preserve any added retailers below
        const added = retailers.filter(r => !retailerNames.includes(r.name));
        retailers = retailerNames.map(name => {
            const existing = retailers.find(r => r.name === name);
            return existing ? existing : { name, mFrozen: '', jFrozen: '', mNew: '', jNew: '' };
        });
        retailers = retailers.concat(added);
    }
    renderRetailers();
    populateRetailerDropdown();
    let section = "distribution";
    if (window.location.hash) {
        section = window.location.hash.substring(1);
    }
    showSection(section);
};
// --- END KEY FIX ---

function saveFirstDistribution() {
    if (savedFirst) return;
    retailers.forEach((r, i) => {
        r.mFrozen = document.getElementById(`m_${i}`).value;
        r.jFrozen = document.getElementById(`j_${i}`).value;
        r.mNew = '';
        r.jNew = '';
        document.getElementById(`m_${i}`).value = r.mFrozen;
        document.getElementById(`j_${i}`).value = r.jFrozen;
    });
    savedFirst = true;
    renderRetailers();
    updateTotals();
    saveDistributionToLocal();
}

function unsaveFirstDistribution() {
    if (!savedFirst) return;
    retailers.forEach((r, i) => {
        r.mNew = '';
        r.jNew = '';
    });
    savedFirst = false;
    renderRetailers();
    updateTotals();
    saveDistributionToLocal();
}
window.unsaveFirstDistribution = unsaveFirstDistribution;

// --- Half Commission Accounts Section ---
function updateHalfAccountsTable() {
    const rateM = parseFloat(document.getElementById('halfRateM').value) || 0;
    const rateJ = parseFloat(document.getElementById('halfRateJ').value) || 0;
    const tbody = document.getElementById('half-accounts-tbody');
    tbody.innerHTML = '';
    halfCommissionRows.forEach((row, i) => {
        const mQty = parseFloat(row.m) || 0;
        const jQty = parseFloat(row.j) || 0;
        const mTotal = mQty * rateM;
        const jTotal = jQty * rateJ;
        const total = mTotal + jTotal;
        const isPermanent = i < halfCommissionNames.length;
        tbody.innerHTML += `
          <tr>
            <td>
              ${isPermanent
                ? `<span>${row.name}</span>`
                : `<input type="text" value="${row.name}" onchange="handleHalfNameInput(${i}, this.value)" style="width:100px">`
              }
            </td>
            <td><input type="number" step="any" value="${row.m}" onchange="handleHalfInput(${i}, 'm', this.value)" style="width:70px"></td>
            <td><input type="number" step="any" value="${row.j}" onchange="handleHalfInput(${i}, 'j', this.value)" style="width:70px"></td>
            <td>${rateM}</td>
            <td>${rateJ}</td>
            <td>${mTotal}</td>
            <td>${jTotal}</td>
            <td>${total}</td>
          </tr>
        `;
    });
}
window.updateHalfAccountsTable = updateHalfAccountsTable;

function handleHalfInput(i, type, value) {
    halfCommissionRows[i][type] = value;
    updateHalfAccountsTable();
}
window.handleHalfInput = handleHalfInput;

function addHalfCommissionRow() {
    halfCommissionRows.push({ name: "New", m: "", j: "" });
    updateHalfAccountsTable();
}
window.addHalfCommissionRow = addHalfCommissionRow;

function saveHalfAccounts() {
    const date = document.getElementById('halfAccountsDate').value;
    const rateM = parseFloat(document.getElementById('halfRateM').value) || 0;
    const rateJ = parseFloat(document.getElementById('halfRateJ').value) || 0;
    if (!date) {
        alert("Please select a date for the account.");
        return;
    }
    const rows = halfCommissionRows.map(row => {
        const mQty = parseFloat(row.m) || 0;
        const jQty = parseFloat(row.j) || 0;
        const mTotal = mQty * rateM;
        const jTotal = jQty * rateJ;
        return {
            retailer: row.name,
            m_qty: mQty,
            j_qty: jQty,
            m_rate: rateM,
            j_rate: rateJ,
            m_total: mTotal,
            j_total: jTotal,
            total: mTotal + jTotal
        };
    });
    fetch("/api/accounts", {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ date, rows })
    }).then(res => {
        if (res.ok) {
            alert("Half Commission Accounts saved!");
        } else {
            alert("Failed to save accounts.");
        }
    });
}
window.saveHalfAccounts = saveHalfAccounts;

function showSection(section) {
    document.getElementById('distribution-section').style.display = section === 'distribution' ? '' : 'none';
    document.getElementById('accounts-section').style.display = section === 'accounts' ? '' : 'none';
    document.getElementById('filter-section').style.display = section === 'filter' ? '' : 'none';
    document.getElementById('half-commission-section').style.display = section === 'half-commission' ? '' : 'none';
    document.getElementById('filter-half-commission-section').style.display = section === 'filter-half-commission' ? '' : 'none';
    document.getElementById('rate-acc-section').style.display = section === 'rate-acc' ? '' : 'none'; // <-- Add this line
    if (section === 'accounts') {
        updateAccountsTable();
        const dateInput = document.getElementById('accountsDate');
        if (dateInput && !dateInput.value) {
            dateInput.valueAsDate = new Date();
        }
    }
    if (section === 'distribution') renderRetailers();
    if (section === 'half-commission') {
        updateHalfAccountsTable();
        const dateInput = document.getElementById('halfAccountsDate');
        if (dateInput && !dateInput.value) {
            dateInput.valueAsDate = new Date();
        }
    }
    if (section === 'filter-half-commission') {
        populateHalfCommissionDropdown();
    }
    if (section === 'rate-acc') updateRateAccTable(); // <-- Add this line
}
window.showSection = showSection;

// --- End Half Commission Section ---

function updateAccountsTable() {
    const rateM = parseFloat(document.getElementById('rateM').value) || 0;
    const rateJ = parseFloat(document.getElementById('rateJ').value) || 0;
    const tbody = document.getElementById('accounts-tbody');
    tbody.innerHTML = '';
    retailers.forEach((r, i) => {
        const mQty = sum(r.mFrozen + (r.mNew ? '+' + r.mNew : ''));
        const jQty = sum(r.jFrozen + (r.jNew ? '+' + r.jNew : ''));
        const mTotal = mQty * rateM;
        const jTotal = jQty * rateJ;
        const total = mTotal + jTotal;
        tbody.innerHTML += `
          <tr>
            <td>${r.name}</td>
            <td>${mQty}</td>
            <td>${jQty}</td>
            <td>${rateM}</td>
            <td>${rateJ}</td>
            <td>${mTotal}</td>
            <td>${jTotal}</td>
            <td>${total}</td>
          </tr>
        `;
    });
}
window.updateAccountsTable = updateAccountsTable;

async function filterBills() {
    const from = document.getElementById('filterFrom').value;
    const till = document.getElementById('filterTill').value;
    const retailer = document.getElementById('filterRetailer').value;
    if (!from || !till) {
        alert("Please select both dates.");
        return;
    }
    let url = `/api/filter-bills?from=${from}&till=${till}`;
    if (retailer) {
        url += `&retailer=${encodeURIComponent(retailer)}`;
    }
    const res = await fetch(url);
    const data = await res.json();
    renderFilterResults(data);
}

let lastBillText = "";

function renderFilterResults(data) {
    const container = document.getElementById('filter-results');
    const shareBtn = document.getElementById('shareBillsButton');
    if (!data.length) {
        container.innerHTML = "<div style='text-align:center;color:#888;padding:18px;'>No data found for selected dates.</div>";
        if (shareBtn) shareBtn.style.display = "none";
        lastBillText = "";
        return;
    }
    let text = "Date\tRetailer\tM\tM.Rate\tJ\tJ.Rate\tM.Total\tJ.Total\tTotal\n";
    let html = `<div class="filter-table-container"><table class="filter-table">
        <thead>
            <tr>
                <th>Date</th>
                <th>Retailer</th>
                <th>M</th>
                <th>M.Rate</th>
                <th>J</th>
                <th>J.Rate</th>
                <th>M.Total</th>
                <th>J.Total</th>
                <th>Total</th>
            </tr>
        </thead>
        <tbody>`;
    let grandTotal = 0;
    data.forEach(row => {
        html += `<tr>
            <td>${row.date}</td>
            <td>${row.retailer}</td>
            <td>${row.m_qty}</td>
            <td>${row.m_rate}</td>
            <td>${row.j_qty}</td>
            <td>${row.j_rate}</td>
            <td>${row.m_total}</td>
            <td>${row.j_total}</td>
            <td>${row.total}</td>
        </tr>`;
        text += `${row.date}\t${row.retailer}\t${row.m_qty}\t${row.m_rate}\t${row.j_qty}\t${row.j_rate}\t${row.m_total}\t${row.j_total}\t${row.total}\n`;
        grandTotal += row.total;
    });
    html += `</tbody>
        <tfoot>
            <tr>
                <td colspan="8" style="text-align:right;">Grand Total =</td>
                <td>${grandTotal}</td>
            </tr>
        </tfoot>
    </table></div>`;
    container.innerHTML = html;
    text += `Grand Total:\t${grandTotal}`;
    lastBillText = text;
    if (shareBtn) shareBtn.style.display = "";
}

function shareBills() {
    const tableDiv = document.querySelector('#filter-results .filter-table-container');
    if (!tableDiv) {
        alert("No bill to share!");
        return;
    }
    // Add a mobile-friendly class
    tableDiv.classList.add('mobile-share');
    setTimeout(() => {
        html2canvas(tableDiv, {
            scale: 2,
            backgroundColor: "#fff"
        }).then(canvas => {
            tableDiv.classList.remove('mobile-share');
            canvas.toBlob(blob => {
                if (navigator.canShare && navigator.canShare({ files: [new File([blob], "bill.png", { type: blob.type })] })) {
                    const file = new File([blob], "bill.png", { type: blob.type });
                    navigator.share({
                        files: [file],
                        title: "Mallige & Jaji Bill",
                        text: "Mallige & Jaji Bill"
                    });
                } else {
                    const url = URL.createObjectURL(blob);
                    const a = document.createElement('a');
                    a.href = url;
                    a.download = "bill.png";
                    document.body.appendChild(a);
                    a.click();
                    document.body.removeChild(a);
                    URL.revokeObjectURL(url);
                    alert("Image downloaded! You can now share it via WhatsApp or any other app.");
                }
            }, 'image/png');
        });
    }, 100);
}
window.shareBills = shareBills;

async function saveAccounts() {
    const date = document.getElementById('accountsDate').value;
    const rateM = parseFloat(document.getElementById('rateM').value) || 0;
    const rateJ = parseFloat(document.getElementById('rateJ').value) || 0;
    if (!date) {
        alert("Please select a date for the account.");
        return;
    }
    const rows = retailers.map(r => {
        const mQty = sum(r.mFrozen + (r.mNew ? '+' + r.mNew : ''));
        const jQty = sum(r.jFrozen + (r.jNew ? '+' + r.jNew : ''));
        const mTotal = mQty * rateM;
        const jTotal = jQty * rateJ;
        return {
            retailer: r.name,
            m_qty: mQty,
            j_qty: jQty,
            m_rate: rateM,
            j_rate: rateJ,
            m_total: mTotal,
            j_total: jTotal,
            total: mTotal + jTotal
        };
    });
    try {
        const res = await fetch("/api/accounts", {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ date, rows })
        });
        if (res.ok) {
            alert("Accounts saved!");
        } else {
            const err = await res.text();
            alert("Failed to save accounts: " + err);
        }
    } catch (e) {
        alert("Network error: " + e.message);
    }
}
window.saveAccounts = saveAccounts;

function populateRetailerDropdown() {
    const select = document.getElementById('filterRetailer');
    select.innerHTML = '<option value="">All</option>';
    filterRetailerNames.forEach(name => {
        select.innerHTML += `<option value="${name}">${name}</option>`;
    });
}

function setInitialApprox(type) {
    let totalM = 0, totalJ = 0;
    retailers.forEach(r => {
        totalM += sum(r.mFrozen) + sum(r.mNew);
        totalJ += sum(r.jFrozen) + sum(r.jNew);
    });

    if (type === 'M') {
        const approxMInput = document.getElementById('approxM');
        if (approxMInput.value === "" || isNaN(parseFloat(approxMInput.value))) {
            initialApproxM = null;
        } else {
            initialApproxM = parseFloat(approxMInput.value);
            approxBaseM = totalM; // Record base at the moment of setting
        }
    } else if (type === 'J') {
        const approxJInput = document.getElementById('approxJ');
        if (approxJInput.value === "" || isNaN(parseFloat(approxJInput.value))) {
            initialApproxJ = null;
        } else {
            initialApproxJ = parseFloat(approxJInput.value);
            approxBaseJ = totalJ; // Record base at the moment of setting
        }
    }
    updateTotals();
    saveDistributionToLocal();
}
function clearFilter() {
    document.getElementById('filterFrom').value = '';
    document.getElementById('filterTill').value = '';
    document.getElementById('filterRetailer').value = '';
    document.getElementById('filter-results').innerHTML = '';
}

function handleHalfNameInput(i, value) {
    halfCommissionRows[i].name = value;
}
window.handleHalfNameInput = handleHalfNameInput;

function populateHalfCommissionDropdown() {
    const select = document.getElementById('filterHalfRetailer');
    select.innerHTML = '<option value="">All</option>';
    halfCommissionNames.forEach(name => {
        select.innerHTML += `<option value="${name}">${name}</option>`;
    });
}

async function filterHalfCommission() {
    const from = document.getElementById('filterHalfFrom').value;
    const till = document.getElementById('filterHalfTill').value;
    const retailer = document.getElementById('filterHalfRetailer').value;
    if (!from || !till) {
        alert("Please select both dates.");
        return;
    }
    let url = `/api/filter-bills?from=${from}&till=${till}`;
    if (retailer) {
        url += `&retailer=${encodeURIComponent(retailer)}`;
    }
    const res = await fetch(url);
    const data = await res.json();
    renderFilterHalfResults(data);
}
window.filterHalfCommission = filterHalfCommission;

function renderFilterHalfResults(data) {
    const container = document.getElementById('filter-half-results');
    if (!data.length) {
        container.innerHTML = "<div style='text-align:center;color:#888;padding:18px;'>No data found for selected dates.</div>";
        return;
    }
    let html = `<div class="filter-table-container"><table class="filter-table">
        <thead>
            <tr>
                <th>Date</th>
                <th>Name</th>
                <th>M</th>
                <th>M.Rate</th>
                <th>J</th>
                <th>J.Rate</th>
                <th>M.Total</th>
                <th>J.Total</th>
                <th>Total</th>
            </tr>
        </thead>
        <tbody>`;
    let grandTotal = 0;
    data.forEach(row => {
        html += `<tr>
            <td>${row.date}</td>
            <td>${row.retailer}</td>
            <td>${row.m_qty}</td>
            <td>${row.m_rate}</td>
            <td>${row.j_qty}</td>
            <td>${row.j_rate}</td>
            <td>${row.m_total}</td>
            <td>${row.j_total}</td>
            <td>${row.total}</td>
        </tr>`;
        grandTotal += row.total;
    });
    html += `</tbody>
        <tfoot>
            <tr>
                <td colspan="8" style="text-align:right;">Grand Total =</td>
                <td>${grandTotal}</td>
            </tr>
        </tfoot>
    </table></div>`;
    container.innerHTML = html;
}
window.renderFilterHalfResults = renderFilterHalfResults;

function clearFilterHalfCommission() {
    document.getElementById('filterHalfFrom').value = '';
    document.getElementById('filterHalfTill').value = '';
    document.getElementById('filterHalfRetailer').value = '';
    document.getElementById('filter-half-results').innerHTML = '';
}
window.clearFilterHalfCommission = clearFilterHalfCommission;


// --- Rate Acc Section ---
const rateAccNames = ["Monthu", "Inchu", "Manju", "Abuta", "Hussaian"];
let rateAccRows = rateAccNames.map(name => ({
    name,
    givenM: "",
    takenM: "",
    givenJ: "",
    takenJ: ""
}));

function updateRateAccTable() {
    const rateM = parseFloat(document.getElementById('rateAccM').value) || 0;
    const rateJ = parseFloat(document.getElementById('rateAccJ').value) || 0;
    const tbody = document.getElementById('rate-acc-tbody');
    let grandGivenM = 0, grandTakenM = 0, grandGivenJ = 0, grandTakenJ = 0;
    tbody.innerHTML = '';
    rateAccRows.forEach((row, i) => {
        const givenM = parseFloat(row.givenM) || 0;
        const takenM = parseFloat(row.takenM) || 0;
        const givenJ = parseFloat(row.givenJ) || 0;
        const takenJ = parseFloat(row.takenJ) || 0;
        const givenMTotal = givenM * rateM;
        const takenMTotal = takenM * rateM;
        const givenJTotal = givenJ * rateJ;
        const takenJTotal = takenJ * rateJ;
        grandGivenM += givenMTotal;
        grandTakenM += takenMTotal;
        grandGivenJ += givenJTotal;
        grandTakenJ += takenJTotal;
        tbody.innerHTML += `
          <tr>
            <td>${row.name}</td>
            <td><input type="number" step="any" value="${row.givenM}" onchange="handleRateAccInput(${i}, 'givenM', this.value)" style="width:70px"></td>
            <td><input type="number" step="any" value="${row.takenM}" onchange="handleRateAccInput(${i}, 'takenM', this.value)" style="width:70px"></td>
            <td><input type="number" step="any" value="${row.givenJ}" onchange="handleRateAccInput(${i}, 'givenJ', this.value)" style="width:70px"></td>
            <td><input type="number" step="any" value="${row.takenJ}" onchange="handleRateAccInput(${i}, 'takenJ', this.value)" style="width:70px"></td>
            <td>${rateM}</td>
            <td>${rateJ}</td>
            <td style="color:green;font-weight:600">${givenMTotal}</td>
            <td style="color:red;font-weight:600">${takenMTotal}</td>
            <td style="color:green;font-weight:600">${givenJTotal}</td>
            <td style="color:red;font-weight:600">${takenJTotal}</td>
          </tr>
        `;
    });
    // Grand totals
    document.getElementById('grandGivenMTotal').innerHTML = `<span style="color:green">${grandGivenM}</span>`;
    document.getElementById('grandTakenMTotal').innerHTML = `<span style="color:red">${grandTakenM}</span>`;
    document.getElementById('grandGivenJTotal').innerHTML = `<span style="color:green">${grandGivenJ}</span>`;
    document.getElementById('grandTakenJTotal').innerHTML = `<span style="color:red">${grandTakenJ}</span>`;

    // Net totals
    const mNet = grandGivenM - grandTakenM;
    const jNet = grandGivenJ - grandTakenJ;
    document.getElementById('grandMNet').innerHTML = `<span style="color:${mNet>=0?'green':'red'};font-weight:700">${mNet}</span>`;
    document.getElementById('grandJNet').innerHTML = `<span style="color:${jNet>=0?'green':'red'};font-weight:700">${jNet}</span>`;

    // Overall
    const overall = mNet + jNet;
    document.getElementById('overallBillTotal').innerHTML = `<span style="color:${overall>=0?'green':'red'};font-weight:700">${overall}</span>`;
}
window.updateRateAccTable = updateRateAccTable;

function handleRateAccInput(i, type, value) {
    rateAccRows[i][type] = value;
    updateRateAccTable();
}
window.handleRateAccInput = handleRateAccInput;

function saveRateAcc() {
    const date = document.getElementById('rateAccDate').value;
    const rateM = parseFloat(document.getElementById('rateAccM').value) || 0;
    const rateJ = parseFloat(document.getElementById('rateAccJ').value) || 0;
    if (!date) {
        alert("Please select a date for the account.");
        return;
    }
    const rows = rateAccRows.map(row => {
        const givenM = parseFloat(row.givenM) || 0;
        const takenM = parseFloat(row.takenM) || 0;
        const givenJ = parseFloat(row.givenJ) || 0;
        const takenJ = parseFloat(row.takenJ) || 0;
        const givenMTotal = givenM * rateM;
        const takenMTotal = takenM * rateM;
        const givenJTotal = givenJ * rateJ;
        const takenJTotal = takenJ * rateJ;
        return {
            name: row.name,
            givenM,
            takenM,
            givenJ,
            takenJ,
            mRate: rateM,
            jRate: rateJ,
            givenMTotal,
            takenMTotal,
            givenJTotal,
            takenJTotal
        };
    });
    fetch("/api/rate-acc", {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ date, rows })
    }).then(res => {
        if (res.ok) {
            alert("Rate Acc saved!");
        } else {
            alert("Failed to save Rate Acc.");
        }
    });
}
window.saveRateAcc = saveRateAcc;


async function filterRateAcc() {
    const from = document.getElementById('filterRateAccFrom').value;
    const till = document.getElementById('filterRateAccTill').value;
    const name = document.getElementById('filterRateAccName').value;
    if (!from || !till) {
        alert("Please select both dates.");
        return;
    }
    let url = `/api/rate-acc?from=${from}&till=${till}`;
    if (name) {
        url += `&name=${encodeURIComponent(name)}`;
    }
    const res = await fetch(url);
    const data = await res.json();
    renderRateAccFilterResults(data);
}
window.filterRateAcc = filterRateAcc;

function clearFilterRateAcc() {
    document.getElementById('filterRateAccFrom').value = '';
    document.getElementById('filterRateAccTill').value = '';
    document.getElementById('filterRateAccName').value = '';
    document.getElementById('rate-acc-filter-results').innerHTML = '';
}
window.clearFilterRateAcc = clearFilterRateAcc;

function renderRateAccFilterResults(data) {
    const container = document.getElementById('rate-acc-filter-results');
    if (!data.length) {
        container.innerHTML = "<div style='text-align:center;color:#888;padding:18px;'>No data found for selected dates.</div>";
        return;
    }
    let html = `<div class="filter-table-container"><table class="filter-table">
        <thead>
            <tr>
                <th>Date</th>
                <th>Name</th>
                <th>Given M</th>
                <th>Taken M</th>
                <th>Given J</th>
                <th>Taken J</th>
                <th>M Rate</th>
                <th>J Rate</th>
                <th>Given M Total</th>
                <th>Taken M Total</th>
                <th>Given J Total</th>
                <th>Taken J Total</th>
            </tr>
        </thead>
        <tbody>`;
    let grandGivenM = 0, grandTakenM = 0, grandGivenJ = 0, grandTakenJ = 0;
    data.forEach(row => {
        html += `<tr>
            <td>${row.date}</td>
            <td>${row.name}</td>
            <td>${row.givenM}</td>
            <td>${row.takenM}</td>
            <td>${row.givenJ}</td>
            <td>${row.takenJ}</td>
            <td>${row.mRate}</td>
            <td>${row.jRate}</td>
            <td style="color:green;font-weight:600">${row.givenMTotal}</td>
            <td style="color:red;font-weight:600">${row.takenMTotal}</td>
            <td style="color:green;font-weight:600">${row.givenJTotal}</td>
            <td style="color:red;font-weight:600">${row.takenJTotal}</td>
        </tr>`;
        grandGivenM += row.givenMTotal;
        grandTakenM += row.takenMTotal;
        grandGivenJ += row.givenJTotal;
        grandTakenJ += row.takenJTotal;
    });
    // Grand totals and net/overall
    const mNet = grandGivenM - grandTakenM;
    const jNet = grandGivenJ - grandTakenJ;
    const overall = mNet + jNet;
    html += `</tbody>
        <tfoot>
            <tr>
                <td colspan="8" style="text-align:right;">Grand Total M:</td>
                <td style="color:green">${grandGivenM}</td>
                <td style="color:red">${grandTakenM}</td>
                <td style="color:green">${grandGivenJ}</td>
                <td style="color:red">${grandTakenJ}</td>
            </tr>
            <tr>
                <td colspan="8" style="text-align:right;">Grand Total M (Net):</td>
                <td colspan="2" style="color:${mNet>=0?'green':'red'};font-weight:700">${mNet}</td>
                <td colspan="2" style="color:${jNet>=0?'green':'red'};font-weight:700">${jNet}</td>
            </tr>
            <tr>
                <td colspan="8" style="text-align:right;">Overall Bill Total:</td>
                <td colspan="4" style="color:${overall>=0?'green':'red'};font-weight:700">${overall}</td>
            </tr>
        </tfoot>
    </table></div>`;
    container.innerHTML = html;
}