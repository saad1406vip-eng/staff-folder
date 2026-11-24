// app.js

const employeeGrid = document.getElementById('employeeGrid');
const searchInput = document.getElementById('searchInput');
const modal = document.getElementById('modal');
const modalBody = document.getElementById('modalBody');
const printModal = document.getElementById('printModal');
const selectedCountEl = document.getElementById('selectedCount');
const printScopeText = document.getElementById('printScopeText');
const generatorModal = document.getElementById('generatorModal');
const employeeSelectGroup = document.getElementById('employeeSelectGroup');

let selectedEmployees = [];
let isPrintingSelected = false;
let absenceRecordCounter = 0;

// ============ مخزن البيانات ============
const STORAGE_KEY = 'labStaff.employees.v1';
const SETTINGS_KEY = 'labStaff.settings.v1';
const LETTERHEAD_SRC = 'BG.PNG';
const FIELD_NAMES = {
    id: 'الرقم الوظيفي', name: 'الاسم', nationalId: 'السجل المدني / الهوية', birthDate: 'تاريخ الميلاد',
    jobTitle: 'المسمى الوظيفي', mobile: 'رقم الجوال', email: 'البريد الإلكتروني', qualification: 'المؤهل العلمي',
    nationality: 'الجنسية', startDate: 'تاريخ التعيين', department: 'الإدارة'
};

function safeGet(key) { try { return localStorage.getItem(key); } catch (e) { return null; } }
function safeSet(key, val) { try { localStorage.setItem(key, val); return true; } catch (e) { return false; } }
function safeRemove(key) { try { localStorage.removeItem(key); } catch (e) {} }

function loadEmployees() {
    const raw = safeGet(STORAGE_KEY);
    if (raw) {
        try { const list = JSON.parse(raw); if (Array.isArray(list)) return list; } catch (e) {}
    }
    return JSON.parse(JSON.stringify(DEFAULT_EMPLOYEES));
}
function isLocalData() { return !!safeGet(STORAGE_KEY); }
function persistEmployees() {
    if (!safeSet(STORAGE_KEY, JSON.stringify(employees))) showToast('تعذّر الحفظ على هذا الجهاز');
}

let employees = loadEmployees();
let SETTINGS = Object.assign({ headName: 'سعد علي سعد القرني', directorName: 'محمد بن سعيد القرني' },
    (() => { try { return JSON.parse(safeGet(SETTINGS_KEY) || '{}'); } catch (e) { return {}; } })());

function esc(v) {
    return String(v == null ? '' : v).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
}
function showToast(msg) {
    const t = document.getElementById('toast');
    t.textContent = msg; t.classList.add('show');
    clearTimeout(showToast._t); showToast._t = setTimeout(() => t.classList.remove('show'), 2200);
}
function isMissing(emp) { return !emp.mobile || !emp.birthDate || !emp.email; }
function avatarColor(name) {
    const colors = ['#2E7D32', '#1565C0', '#6A1B9A', '#E65100', '#00838F', '#AD1457', '#4E342E', '#37474F'];
    let h = 0; for (const ch of String(name)) h = (h * 31 + ch.charCodeAt(0)) >>> 0;
    return colors[h % colors.length];
}
function initials(name) {
    const parts = String(name).trim().split(/\s+/);
    return (parts[0] || '').charAt(0) + ' ' + (parts[parts.length - 1] || '').replace(/^ال/, '').charAt(0);
}

function renderEmployees(data) {
    employeeGrid.innerHTML = '';
    
    const countLabel = document.getElementById('countLabel');
    if (countLabel) countLabel.textContent = `${data.length} من ${employees.length} موظف`;

    if (data.length === 0) {
        employeeGrid.innerHTML = '<p style="text-align:center; width:100%; grid-column: 1 / -1; color: #666;">لا توجد نتائج مطابقة للبحث.</p>';
        return;
    }

    data.forEach(emp => {
        const isChecked = selectedEmployees.includes(emp.id);
        const card = document.createElement('div');
        card.className = `card ${isChecked ? 'selected' : ''}`;
        card.innerHTML = `
            <div class="card-checkbox">
                <input type="checkbox" ${isChecked ? 'checked' : ''} onchange="toggleSelect('${emp.id}', this.checked)">
            </div>
            <div class="avatar-initials" style="background:${avatarColor(emp.name)}">${esc(initials(emp.name))}</div>
            <h3>${esc(emp.name)}${emp.seha ? '<br><span class="seha-badge">منصة صحة</span>' : ''}</h3>
            <div class="job-id"><i class="fas fa-id-badge"></i> ${emp.id}</div>
            <div class="job-title">${emp.jobTitle || 'فني مختبر'}</div>
            <div class="card-actions">
                <button class="btn-view" onclick="openModal('${emp.id}')"><i class="fas fa-eye"></i> عرض</button>
                <button class="btn-print-single" onclick="printIndividual('${emp.id}')"><i class="fas fa-print"></i> طباعة</button>
            </div>
        `;
        employeeGrid.appendChild(card);
    });
}

function toggleSelect(id, checked) {
    if (checked) {
        if (!selectedEmployees.includes(id)) selectedEmployees.push(id);
    } else {
        selectedEmployees = selectedEmployees.filter(e => e !== id);
    }
    updateSelectionUI();
    renderEmployees(getVisibleEmployees());
}

function selectAllVisible() {
    const visible = getVisibleEmployees();
    visible.forEach(emp => {
        if (!selectedEmployees.includes(emp.id)) selectedEmployees.push(emp.id);
    });
    updateSelectionUI();
    renderEmployees(visible);
}

function clearSelection() {
    selectedEmployees = [];
    updateSelectionUI();
    renderEmployees(getVisibleEmployees());
}

function updateSelectionUI() {
    selectedCountEl.textContent = selectedEmployees.length;
    const bar = document.getElementById('selectionBar');
    if (selectedEmployees.length > 0) {
        bar.classList.add('active');
    } else {
        bar.classList.remove('active');
    }
}

function getVisibleEmployees() {
    const term = searchInput.value.trim().toLowerCase();
    const filter = (document.getElementById('filterSelect') || {}).value || 'all';
    return employees.filter(emp => {
        if (filter === 'seha' && !emp.seha) return false;
        if (filter === 'missing' && !isMissing(emp)) return false;
        if (!term) return true;
        return emp.name.toLowerCase().includes(term) ||
            String(emp.id).includes(term) ||
            (emp.nationalId && String(emp.nationalId).includes(term)) ||
            (emp.mobile && String(emp.mobile).includes(term));
    });
}

function openModal(id) {
    const emp = employees.find(e => e.id === id);
    if (!emp) return;

    modalBody.innerHTML = `
        <h2><i class="fas fa-user-circle"></i> ${emp.name}</h2>
        <div class="info-row"><span>الرقم الوظيفي:</span> <span>${emp.id}</span></div>
        <div class="info-row"><span>السجل المدني/الهوية:</span> <span>${emp.nationalId || 'غير محدد'}</span></div>
        <div class="info-row"><span>تاريخ الميلاد:</span> <span>${emp.birthDate ? emp.birthDate + ' هـ' : 'غير محدد'}</span></div>
        <div class="info-row"><span>الجنسية:</span> <span>${emp.nationality || 'غير محدد'}</span></div>
        <div class="info-row"><span>المؤهل العلمي:</span> <span>${emp.qualification || 'غير محدد'}</span></div>
        <div class="info-row"><span>المسمى الوظيفي:</span> <span>${emp.jobTitle || 'فني مختبر'}</span></div>
        <div class="info-row"><span>الإدارة:</span> <span>${emp.department}</span></div>
        <div class="info-row"><span>البريد الإلكتروني:</span> <span>${emp.email}</span></div>
        <div class="info-row"><span>رقم الجوال:</span> <span>${emp.mobile || 'غير محدد'}</span></div>
        <div class="info-row"><span>تاريخ بداية التعيين:</span> <span>${emp.startDate}</span></div>
        <div class="info-row"><span>تاريخ التعيين الحالي:</span> <span>${emp.currentDate || 'غير محدد'}</span></div>
        <div class="info-row"><span>منصة صحة:</span> <span>${emp.seha ? 'معتمد لتوثيق فحص الزواج والإقامات' : '—'}</span></div>
        ${emp.notes ? `<div class="info-row"><span>ملاحظات:</span> <span>${esc(emp.notes)}</span></div>` : ''}
        <div class="modal-actions" style="margin-top: 25px;">
            <button class="btn btn-secondary btn-block" onclick="shareIndividual('${emp.id}')"><i class="fas fa-share-alt"></i> مشاركة</button>
            <button class="btn btn-primary btn-block" onclick="printProfile('${emp.id}')"><i class="fas fa-print"></i> طباعة A4</button>
            <button class="btn btn-light btn-block" onclick="closeModal(); startEditEmployee('${emp.id}')"><i class="fas fa-pen"></i> تعديل البيانات</button>
        </div>
    `;
    modal.style.display = 'block';
}

function closeModal() { modal.style.display = 'none'; }

function openPrintModal(printSelected = false) {
    isPrintingSelected = printSelected;
    
    if (printSelected && selectedEmployees.length === 0) {
        alert('الرجاء تحديد موظف واحد على الأقل أولاً.');
        return;
    }
    
    if (printSelected) {
        printScopeText.textContent = `سيتم طباعة ${selectedEmployees.length} موظف محدد. اختر الحقول المطلوبة:`;
    } else {
        const vis = getVisibleEmployees();
        printScopeText.textContent = `سيتم طباعة ${vis.length === employees.length ? 'جميع الموظفين' : 'الموظفين المعروضين حالياً'} (${vis.length}). اختر الحقول المطلوبة:`;
    }
    
    syncLetterheadOption();
    printModal.style.display = 'block';
}

function syncLetterheadOption() {
    const land = document.getElementById('printOrientation').value === 'landscape';
    const lh = document.getElementById('printLetterhead');
    lh.disabled = land; if (land) lh.checked = false;
}

function closePrintModal() { printModal.style.display = 'none'; }

function printSelectedData() {
    const checkboxes = document.querySelectorAll('.print-field:checked');
    const selectedFields = Array.from(checkboxes).map(cb => cb.value);
    
    if (selectedFields.length === 0) {
        alert('الرجاء اختيار حقل واحد على الأقل للطباعة.');
        return;
    }

    let listToPrint = getVisibleEmployees();
    if (isPrintingSelected) {
        listToPrint = employees.filter(emp => selectedEmployees.includes(emp.id));
    }

    const title = document.getElementById('printTitle').value.trim() || 'قائمة بيانات فريق المختبر';
    const landscape = document.getElementById('printOrientation').value === 'landscape';
    const letterhead = document.getElementById('printLetterhead').checked;
    const ltrFields = ['email', 'mobile', 'nationalId', 'id', 'birthDate', 'startDate'];
    const txtFields = ['name', 'jobTitle', 'department', 'qualification'];

    let html = `
        <div class="print-area">
            <h2>${esc(title)}</h2>
            <p class="print-meta">تاريخ الطباعة: ${new Date().toLocaleDateString('ar-SA')} — العدد: ${listToPrint.length}</p>
            <table class="data-table">
                <thead><tr><th>#</th>${selectedFields.map(f => `<th>${FIELD_NAMES[f]}</th>`).join('')}</tr></thead>
                <tbody>
                ${listToPrint.map((emp, i) => `<tr><td>${i + 1}</td>${selectedFields.map(f => {
                    const cls = (f === 'name' ? 'txt nm' : (txtFields.includes(f) ? 'txt' : (ltrFields.includes(f) ? 'ltr' : '')));
                    return `<td class="${cls}">${esc(emp[f]) || '-'}</td>`;
                }).join('')}</tr>`).join('')}
                </tbody>
            </table>
        </div>`;

    closePrintModal();
    printDocument(html, { letterhead, landscape });
}

function exportToExcel() { exportData(getVisibleEmployees()); }

function exportSelectedToExcel() {
    if (selectedEmployees.length === 0) {
        alert('الرجاء تحديد موظف واحد على الأقل أولاً.');
        return;
    }
    const listToExport = employees.filter(emp => selectedEmployees.includes(emp.id));
    exportData(listToExport);
}

function exportData(list) {
    const checkboxes = document.querySelectorAll('.print-field:checked');
    const selectedFields = Array.from(checkboxes).map(cb => cb.value);
    
    if (selectedFields.length === 0) {
        alert('الرجاء اختيار حقل واحد على الأقل من نافذة الطباعة أولاً.');
        return;
    }

    const fieldNames = FIELD_NAMES;

    let csvContent = "\uFEFF";
    csvContent += selectedFields.map(f => fieldNames[f]).join(",") + "\n";

    list.forEach(emp => {
        const row = selectedFields.map(field => {
            let val = (emp[field] == null ? '' : emp[field]).toString();
            // الحفاظ على الأصفار في البداية (الرقم الوظيفي / الجوال) عند الفتح في Excel
            if (/^\d+$/.test(val)) return `="${val}"`;
            return `"${val.replace(/"/g, '""')}"`;
        }).join(",");
        csvContent += row + "\n";
    });

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement("a");
    const url = URL.createObjectURL(blob);
    link.setAttribute("href", url);
    link.setAttribute("download", `بيانات_الموظفين_${new Date().toISOString().split('T')[0]}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
}

searchInput.addEventListener('input', function(e) {
    renderEmployees(getVisibleEmployees());
});

function shareIndividual(id) {
    const emp = employees.find(e => e.id === id);
    if (!emp) return;
    
    const text = `
*بيانات الموظف:*
الاسم: ${emp.name}
الرقم الوظيفي: ${emp.id}
السجل المدني: ${emp.nationalId || 'غير محدد'}
تاريخ الميلاد: ${emp.birthDate || 'غير محدد'}
المسمى: ${emp.jobTitle || 'فني مختبر'}
الإدارة: ${emp.department}
البريد: ${emp.email}
الجوال: ${emp.mobile || 'غير محدد'}
تاريخ التعيين: ${emp.startDate}
    `;
    
    if (navigator.share) {
        navigator.share({ title: `بيانات ${emp.name}`, text: text }).catch(console.error);
    } else {
        navigator.clipboard.writeText(text).then(() => {
            alert('تم نسخ بيانات الموظف إلى الحافظة!');
        });
    }
}

function shareAll() {
    let text = `*قائمة فريق المختبر - مستشفى سبت العلايا*\n\n`;
    employees.forEach((emp, index) => {
        text += `${index + 1}. ${emp.name} - الرقم الوظيفي: ${emp.id} - السجل المدني: ${emp.nationalId || 'غير محدد'}\n`;
    });
    
    if (navigator.share) {
        navigator.share({ title: 'قائمة فريق المختبر', text: text }).catch(console.error);
    } else {
        navigator.clipboard.writeText(text).then(() => {
            alert('تم نسخ القائمة كاملة إلى الحافظة!');
        });
    }
}

function printIndividual(id) { printProfile(id); }

function printProfile(id) {
    const emp = employees.find(e => e.id === id);
    if (!emp) return;
    const rows = [
        ['الاسم', emp.name], ['الرقم الوظيفي', emp.id], ['السجل المدني / الهوية', emp.nationalId],
        ['تاريخ الميلاد', emp.birthDate ? emp.birthDate + ' هـ' : ''], ['الجنسية', emp.nationality],
        ['المؤهل العلمي', emp.qualification], ['المسمى الوظيفي', emp.jobTitle], ['الإدارة', emp.department],
        ['البريد الإلكتروني', emp.email], ['رقم الجوال', emp.mobile], ['تاريخ بداية التعيين', emp.startDate],
        ['تاريخ التعيين الحالي', emp.currentDate]
    ];
    const html = `
        <div class="document-area">
            <h1 class="doc-title">بطاقة بيانات موظف</h1>
            <table class="profile-table"><tbody>
                ${rows.map(r => `<tr><th>${r[0]}</th><td>${esc(r[1]) || '-'}</td></tr>`).join('')}
            </tbody></table>
            <p style="margin-top:14px;font-size:.85rem;color:#444">تاريخ الطباعة: ${new Date().toLocaleDateString('ar-SA')}</p>
        </div>`;
    closeModal();
    printDocument(html, { letterhead: true });
}

// ============ محرك الطباعة الموحّد ============
// يعرض المحتوى فقط (بدون باقي الصفحة) ويبقيه حتى ينتهي المستخدم من نافذة الطباعة.
function printDocument(innerHTML, opts = {}) {
    const root = document.getElementById('printRoot');
    const landscape = !!opts.landscape;
    const letterhead = opts.letterhead !== false && !landscape;

    let pageStyle = document.getElementById('dynamicPageStyle');
    if (!pageStyle) { pageStyle = document.createElement('style'); pageStyle.id = 'dynamicPageStyle'; document.head.appendChild(pageStyle); }
    pageStyle.textContent = `@media print { @page { size: A4 ${landscape ? 'landscape' : 'portrait'}; margin: 0; } }`;

    root.className = landscape ? 'landscape' : '';
    const top = letterhead ? 'lh-top' : 'plain-top';
    const bottom = letterhead ? 'lh-bottom' : 'plain-bottom';
    const plainHeader = letterhead ? '' : `<div class="plain-header">تجمع عسير الصحي — مستشفى سبت العلايا العام — قسم المختبر وبنك الدم</div>`;

    root.innerHTML = `
        ${letterhead ? `<img class="lh-bg" src="${LETTERHEAD_SRC}" alt="">` : ''}
        <table class="print-frame">
            <thead><tr><td><div class="${top}"></div></td></tr></thead>
            <tbody><tr><td><div class="print-body">${plainHeader}${innerHTML}</div></td></tr></tbody>
            <tfoot><tr><td><div class="${bottom}"></div></td></tr></tfoot>
        </table>`;

    document.body.classList.add('is-printing');

    const go = () => setTimeout(() => window.print(), 150);
    const img = root.querySelector('.lh-bg');
    const fontsReady = (document.fonts && document.fonts.ready) ? document.fonts.ready : Promise.resolve();
    fontsReady.then(() => {
        if (img && !img.complete) { img.onload = go; img.onerror = go; } else { go(); }
    });
}

function finishPrinting() {
    if (!document.body.classList.contains('is-printing')) return;
    document.body.classList.remove('is-printing');
    document.getElementById('printRoot').innerHTML = '';
}
window.addEventListener('afterprint', () => setTimeout(finishPrinting, 300));
// احتياط لبعض المتصفحات: التنظيف عند أول لمسة بعد الرجوع من نافذة الطباعة
document.addEventListener('pointerdown', () => {
    if (document.body.classList.contains('is-printing')) setTimeout(finishPrinting, 0);
}, true);

function openGeneratorModal() {
    const select = document.getElementById('formEmployee');
    select.innerHTML = '<option value="">-- اختر الموظف --</option>';
    employees.forEach(emp => {
        const option = document.createElement('option');
        option.value = emp.id;
        option.textContent = `${emp.name} - ${emp.id}`;
        select.appendChild(option);
    });
    
    const trainerSelect = document.getElementById('trainerSelect');
    trainerSelect.innerHTML = '<option value="">-- اختر المدرب --</option>';
    employees.forEach(emp => {
        const option = document.createElement('option');
        option.value = emp.id;
        option.textContent = `${emp.name} - ${emp.id}`;
        trainerSelect.appendChild(option);
    });
    
    const traineesContainer = document.getElementById('traineesCheckboxes');
    traineesContainer.innerHTML = '';
    employees.forEach(emp => {
        const label = document.createElement('label');
        label.className = 'trainee-checkbox';
        label.innerHTML = `
            <input type="checkbox" value="${emp.id}" data-name="${emp.name}">
            <span>${emp.name} - ${emp.id}</span>
        `;
        traineesContainer.appendChild(label);
    });
    
    document.getElementById('absenceRecords').innerHTML = '';
    absenceRecordCounter = 0;
    
    document.getElementById('formType').value = 'training';
    toggleFormFields();
    
    generatorModal.style.display = 'block';
}

function closeGeneratorModal() { generatorModal.style.display = 'none'; }

function toggleFormFields() {
    const type = document.getElementById('formType').value;
    document.getElementById('fieldTraining').style.display = (type === 'training') ? 'block' : 'none';
    document.getElementById('fieldTrainerAssignment').style.display = (type === 'trainer_assignment') ? 'block' : 'none';
    document.getElementById('fieldWarning').style.display = (type === 'warning') ? 'block' : 'none';
    document.getElementById('fieldAssignment').style.display = (type === 'assignment') ? 'block' : 'none';
    document.getElementById('fieldShiftCover').style.display = (type === 'shift_cover') ? 'block' : 'none';
    document.getElementById('fieldAbsence').style.display = (type === 'absence') ? 'block' : 'none';
    document.getElementById('fieldWithdrawal').style.display = (type === 'withdrawal') ? 'block' : 'none';
    document.getElementById('fieldSickLeave').style.display = (type === 'sick_leave') ? 'block' : 'none';
    document.getElementById('fieldAbsencePattern').style.display = (type === 'absence_pattern') ? 'block' : 'none';
    document.getElementById('fieldIncidentMemo').style.display = (type === 'incident_memo') ? 'block' : 'none';
    document.getElementById('fieldCircular').style.display = (type === 'circular') ? 'block' : 'none';
    
    employeeSelectGroup.style.display = (type === 'circular' || type === 'trainer_assignment') ? 'none' : 'block';
    
    document.getElementById('otherReasonGroup').style.display = 'none';
    document.getElementById('otherReason').value = '';
    document.getElementById('impactOtherGroup').style.display = 'none';
    document.getElementById('impactOther').value = '';
    
    document.getElementById('shiftDeptGroup').style.display = 'block';
    document.getElementById('shiftType').value = '';
    document.getElementById('shiftDay').value = '';
    document.getElementById('shiftDept').value = '';
    document.getElementById('shiftReason').value = '';
    document.getElementById('shiftDate').value = '';
    document.getElementById('shiftFrom').value = '';
    document.getElementById('shiftTo').value = '';
    document.getElementById('shiftNotes').value = '';
}

function toggleOtherReason() {
    const reason = document.getElementById('shiftReason').value;
    document.getElementById('otherReasonGroup').style.display = (reason === 'أخرى') ? 'block' : 'none';
}

function toggleShiftDept() {
    const shiftType = document.getElementById('shiftType').value;
    const shiftDay = document.getElementById('shiftDay').value;
    const deptGroup = document.getElementById('shiftDeptGroup');
    
    const isWeekend = (shiftDay === 'الجمعة' || shiftDay === 'السبت');
    const isEveningOrNight = (shiftType === 'مسائي' || shiftType === 'ليلي');
    
    if (isWeekend || isEveningOrNight) {
        deptGroup.style.display = 'none';
        document.getElementById('shiftDept').value = '';
    } else {
        deptGroup.style.display = 'block';
    }
}

function toggleImpactOther() {
    const impactType = document.getElementById('impactType').value;
    document.getElementById('impactOtherGroup').style.display = (impactType === 'أخرى') ? 'block' : 'none';
}

function addAbsenceRecord() {
    absenceRecordCounter++;
    const container = document.getElementById('absenceRecords');
    
    const recordDiv = document.createElement('div');
    recordDiv.className = 'absence-record-item';
    recordDiv.id = `absence-record-${absenceRecordCounter}`;
    recordDiv.innerHTML = `
        <div class="absence-record-header">
            <strong>حالة غياب رقم ${absenceRecordCounter}</strong>
            <button type="button" class="btn-remove-record" onclick="removeAbsenceRecord(${absenceRecordCounter})">
                <i class="fas fa-times"></i>
            </button>
        </div>
        <div class="absence-record-fields">
            <div class="form-group">
                <label>التاريخ:</label>
                <input type="date" class="form-control absence-date">
            </div>
            <div class="form-group">
                <label>اليوم:</label>
                <select class="form-control absence-day">
                    <option value="">-- اليوم --</option>
                    <option value="الأحد">الأحد</option>
                    <option value="الإثنين">الإثنين</option>
                    <option value="الثلاثاء">الثلاثاء</option>
                    <option value="الأربعاء">الأربعاء</option>
                    <option value="الخميس">الخميس</option>
                    <option value="الجمعة">الجمعة</option>
                    <option value="السبت">السبت</option>
                </select>
            </div>
            <div class="form-group">
                <label>الدوام المجدول:</label>
                <select class="form-control absence-schedule">
                    <option value="">-- الدوام --</option>
                    <option value="صباحي">صباحي</option>
                    <option value="مسائي">مسائي</option>
                    <option value="ليلي">ليلي</option>
                </select>
            </div>
            <div class="form-group">
                <label>نوع الغياب:</label>
                <select class="form-control absence-type">
                    <option value="">-- النوع --</option>
                    <option value="بدون عذر">بدون عذر</option>
                    <option value="بإجازة مرضية">بإجازة مرضية</option>
                    <option value="بإشعار مسبق">بإشعار مسبق</option>
                    <option value="بدون إشعار مسبق">بدون إشعار مسبق</option>
                </select>
            </div>
            <div class="form-group">
                <label>رقم الإجازة / الحالة:</label>
                <input type="text" class="form-control absence-ref" placeholder="مثال: 123456">
            </div>
        </div>
    `;
    container.appendChild(recordDiv);
}

function removeAbsenceRecord(id) {
    const record = document.getElementById(`absence-record-${id}`);
    if (record) record.remove();
}

function updateEmployeeDetails() {
    const empId = document.getElementById('formEmployee').value;
    const emp = employees.find(e => e.id === empId);
    if (emp) {
        document.getElementById('memoJobTitle').value = emp.jobTitle || 'فني مختبر';
    } else {
        document.getElementById('memoJobTitle').value = '';
    }
}

// دوال إظهار الحقول النصية الإضافية في المذكرة
function toggleMemoIncidentOther() {
    const checked = document.querySelector('.memo-incident[value="أخرى"]').checked;
    document.getElementById('memoIncidentOtherText').style.display = checked ? 'block' : 'none';
}
function toggleMemoImpactOther() {
    const checked = document.querySelector('.memo-impact[value="أثر تشغيلي آخر"]').checked;
    document.getElementById('memoImpactOtherText').style.display = checked ? 'block' : 'none';
}
function toggleMemoActionOther() {
    const checked = document.querySelector('.memo-action[value="إجراء تصحيحي آخر"]').checked;
    document.getElementById('memoActionOtherText').style.display = checked ? 'block' : 'none';
}
function toggleMemoAttachOther() {
    const checked = document.querySelector('.memo-attachment[value="مستند آخر"]').checked;
    document.getElementById('memoAttachOtherText').style.display = checked ? 'block' : 'none';
}

function formatDateTime(datetimeStr) {
    if (!datetimeStr) return '';
    const date = new Date(datetimeStr);
    const options = { year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit' };
    return date.toLocaleString('ar-SA', options);
}

function formatDate(dateStr) {
    if (!dateStr) return '';
    const date = new Date(dateStr);
    return `${date.getDate()} / ${date.getMonth() + 1} / ${date.getFullYear()}م`;
}

function formatTime(timeStr) {
    if (!timeStr) return '';
    const [hours, minutes] = timeStr.split(':');
    const h = parseInt(hours);
    const period = h >= 12 ? 'مساءً' : 'صباحاً';
    const h12 = h % 12 || 12;
    return `${h12}:${minutes} ${period}`;
}

function generateDocument() {
    const formType = document.getElementById('formType').value;
    const employeeId = document.getElementById('formEmployee').value;
    
    if (formType !== 'circular' && formType !== 'trainer_assignment' && !employeeId) {
        alert('الرجاء اختيار الموظف أولاً.');
        return;
    }
    
    const emp = employees.find(e => e.id === employeeId);
    
    let docHTML = '';
    
    if (formType === 'training') {
        // ... (كود محضر تدريب داخلي) ...
        const dept = document.getElementById('trainingDept').value;
        const device = document.getElementById('trainingDevice').value;
        const days = document.getElementById('trainingDays').value;
        if (!dept || !days) { alert('الرجاء إكمال الحقول.'); return; }
        const deptDisplay = device ? `${dept} (${device})` : dept;
        docHTML = `
            <h1 class="doc-title">محضر تدريب داخلي</h1>
            <table class="doc-table">
                <thead><tr><th>الاسم</th><th>القسم / الجهاز</th><th>الرقم الوظيفي</th></tr></thead>
                <tbody><tr><td>${emp.name}</td><td>${deptDisplay}</td><td>${emp.id}</td></tr></tbody>
            </table>
            <div class="doc-body">
                <p><strong>المكرم /</strong> ${emp.name} &nbsp;&nbsp;&nbsp; <strong>الرقم الوظيفي:</strong> ${emp.id}</p>
                <p>السلام عليكم ورحمة الله وبركاته وبعد ..</p>
                <p>نظراً لتجويد العمل والإرتقاء بمهارات الموظفين العاملين بقسم المختبر.</p>
                <p>عليه نأمل منكم التدريب على رأس العمل في القسم الموضح اعلاه لمده <strong>(${days})</strong> يوماً من تاريخه.</p>
            </div>
            <div class="doc-copies">
                <p><strong>نسخه للموظف</strong></p><p><strong>نسخه لادارة التدريب</strong></p><p><strong>نسخه بملف الموظف</strong></p><p><strong>نسخه بملف التدريب بالمختبر</strong></p>
            </div>
            <div class="doc-signatures">
                <div class="signature"><p>رئيس قسم المختبر</p><div class="line">${SETTINGS.headName}</div></div>
            </div>
        `;
    } else if (formType === 'trainer_assignment') {
        // ... (كود تكليف بتدريب داخلي) ...
        const trainerId = document.getElementById('trainerSelect').value;
        const dept = document.getElementById('trainerDept').value;
        const tasks = document.getElementById('trainerTasks').value;
        const startDate = document.getElementById('trainerStartDate').value;
        const endDate = document.getElementById('trainerEndDate').value;
        if (!trainerId || !dept || !tasks || !startDate || !endDate) { alert('الرجاء إكمال الحقول.'); return; }
        const trainer = employees.find(e => e.id === trainerId);
        const traineeCheckboxes = document.querySelectorAll('#traineesCheckboxes input[type="checkbox"]:checked');
        if (traineeCheckboxes.length === 0) { alert('الرجاء اختيار متدرب.'); return; }
        const trainees = Array.from(traineeCheckboxes).map(cb => ({ id: cb.value, name: cb.getAttribute('data-name') }));
        const formattedStart = formatDate(startDate);
        const formattedEnd = formatDate(endDate);
        let traineesTable = `<table class="doc-table"><thead><tr><th>#</th><th>اسم المتدرب</th><th>الرقم الوظيفي</th></tr></thead><tbody>`;
        trainees.forEach((t, i) => { traineesTable += `<tr><td>${i + 1}</td><td>${t.name}</td><td>${t.id}</td></tr>`; });
        traineesTable += `</tbody></table>`;
        docHTML = `
            <h1 class="doc-title">تكليف بتدريب داخلي</h1>
            <table class="doc-table"><thead><tr><th>اسم المدرب</th><th>الرقم الوظيفي</th><th>القسم</th></tr></thead><tbody><tr><td>${trainer.name}</td><td>${trainer.id}</td><td>${dept}</td></tr></tbody></table>
            <div class="doc-body">
                <p><strong>المكرم /</strong> ${trainer.name} &nbsp;&nbsp;&nbsp; <strong>الرقم الوظيفي:</strong> ${trainer.id}</p>
                <p>السلام عليكم ورحمة الله وبركاته وبعد ..</p>
                <p>نظراً لحرصنا على رفع كفاءة الموظفين وتطوير مهاراتهم في قسم المختبر، وبناءً على الصلاحيات الممنوحة لنا، تم تكليفكم بتدريب الزملاء الموضح أسماؤهم أدناه على <strong>(${tasks})</strong> في قسم <strong>(${dept})</strong> على رأس العمل، وذلك من تاريخ <strong>${formattedStart}</strong> إلى تاريخ <strong>${formattedEnd}</strong>.</p>
            </div>
            <p style="font-weight: 700; margin: 15px 0;">المتدربون:</p>
            ${traineesTable}
            <div class="doc-body"><p>عليه نأمل منكم الالتزام بتدريبهم وإفادتنا بتقرير عن مستوى تقدمهم في نهاية فترة التدريب، شاكرين لكم تعاونكم وحرصكم.</p></div>
            <div class="doc-copies"><p><strong>نسخه للمدرب</strong></p><p><strong>نسخه للمتدربين</strong></p><p><strong>نسخه بملف التدريب بالمختبر</strong></p><p><strong>نسخه بملف الموظفين</strong></p></div>
            <div class="doc-signatures"><div class="signature"><p>رئيس قسم المختبر</p><div class="line">${SETTINGS.headName}</div></div></div>
        `;
    } else if (formType === 'warning') {
        // ... (كود الإنذار) ...
        const dept = document.getElementById('warningDept').value;
        const points = document.getElementById('warningPoints').value;
        if (!dept || !points) { alert('الرجاء إكمال الحقول.'); return; }
        const pointsList = points.split('\n').filter(p => p.trim() !== '').map(p => `<li>${p}</li>`).join('');
        docHTML = `
            <h1 class="doc-title">إنذار داخلي</h1>
            <table class="doc-table"><thead><tr><th>الاسم</th><th>القسم</th><th>الرقم الوظيفي</th></tr></thead><tbody><tr><td>${emp.name}</td><td>${dept}</td><td>${emp.id}</td></tr></tbody></table>
            <div class="doc-body">
                <p><strong>المكرم /</strong> ${emp.name} &nbsp;&nbsp;&nbsp; <strong>الرقم الوظيفي:</strong> ${emp.id}</p>
                <p>السلام عليكم ورحمة الله وبركاته وبعد ..</p>
                <p>نظراً لما لوحظ من تقصير في مهام العمل الموكله اليك بالقسم الموضح اعلاه ، حيث لم يتم عمل التالي:</p>
                <ol>${pointsList}</ol>
                <p>عليه نوجه هذا الانذار اليكم لمعالجة التقصير الحاصل فوراً وعدم تكراره مستقبلاً.</p>
            </div>
            <div class="doc-note"><p>ملاحظة: الانذارات تؤخذ بعين الاعتبار في التقييم الوظيفي للموظف.</p></div>
            <div class="doc-copies"><p><strong>نسخه للموظف</strong></p><p><strong>نسخه لاداره المتابعه</strong></p><p><strong>نسخه بملف الموظف</strong></p><p><strong>نسخه بملف الانذارات والجزاءات بالمختبر</strong></p></div>
            <div class="doc-signatures"><div class="signature"><p>رئيس قسم المختبر</p><div class="line">${SETTINGS.headName}</div></div></div>
        `;
    } else if (formType === 'assignment') {
        // ... (كود التكليف الداخلي) ...
        const dept = document.getElementById('assignmentDept').value;
        const device = document.getElementById('assignmentDevice').value;
        if (!dept) { alert('الرجاء اختيار القسم.'); return; }
        const deptDisplay = device ? `${dept} (${device})` : dept;
        docHTML = `
            <h1 class="doc-title">تكليف داخلي</h1>
            <table class="doc-table"><thead><tr><th>الاسم</th><th>الرقم الوظيفي</th><th>القسم / الجهاز</th></tr></thead><tbody><tr><td>${emp.name}</td><td>${emp.id}</td><td>${deptDisplay}</td></tr></tbody></table>
            <div class="doc-body">
                <p><strong>المكرم /</strong> ${emp.name} &nbsp;&nbsp;&nbsp; <strong>الرقم الوظيفي:</strong> ${emp.id}</p>
                <p>السلام عليكم ورحمة الله وبركاته وبعد ..</p>
                <p>إن مدير مختبر مستشفى سبت العلايه، وبناءً على الصلاحيات الممنوحه له ، وبناءً على ما تقتضيه مصلحه العمل، ولثقتنا فيكم اعتمدنا تكليفكم نظاماً بالعمل بقسم <strong>(${deptDisplay})</strong> اعتباراً من تاريخه حتى اشعار لاحق.</p>
            </div>
            <div class="doc-copies"><p><strong>نسخه للموظف</strong></p><p><strong>نسخه بملف الموظف بالمختبر</strong></p><p><strong>نسخه بملف التكاليف بالمختبر</strong></p><p><strong>نسخه لادارة الحفظ والإرشيف</strong></p></div>
            <div class="doc-signatures">
                <div class="signature"><p>رئيس قسم المختبر</p><div class="line">${SETTINGS.headName}</div></div>
                <div class="signature"><p>مدير مستشفى سبت العلايه العام للمصادقه</p><div class="line">${SETTINGS.directorName}</div></div>
            </div>
        `;
    } else if (formType === 'shift_cover') {
        // ... (كود تغطية المناوبة) ...
        const shiftType = document.getElementById('shiftType').value;
        const shiftDay = document.getElementById('shiftDay').value;
        const dept = document.getElementById('shiftDept').value;
        const reason = document.getElementById('shiftReason').value;
        const otherReason = document.getElementById('otherReason').value;
        const date = document.getElementById('shiftDate').value;
        const from = document.getElementById('shiftFrom').value;
        const to = document.getElementById('shiftTo').value;
        const notes = document.getElementById('shiftNotes').value;
        if (!shiftType || !shiftDay || !reason || !date || !from || !to) { alert('الرجاء إكمال الحقول.'); return; }
        const isWeekend = (shiftDay === 'الجمعة' || shiftDay === 'السبت');
        const isEveningOrNight = (shiftType === 'مسائي' || shiftType === 'ليلي');
        let deptDisplay = ''; let deptStatement = '';
        if (isWeekend || isEveningOrNight) {
            deptDisplay = (isWeekend && shiftType === 'صباحي') ? `مناوبة صباحية (ويكند)` : `مناوبة ${shiftType}`;
            deptStatement = `بقسم المختبر`;
        } else {
            if (!dept) { alert('الرجاء اختيار القسم.'); return; }
            deptDisplay = dept; deptStatement = `بقسم (${dept})`;
        }
        const reasonDisplay = (reason === 'أخرى') ? otherReason : reason;
        const formattedDate = formatDate(date);
        const formattedFrom = formatTime(from);
        const formattedTo = formatTime(to);
        const notesSection = notes ? `<p><strong>ملاحظات إضافية:</strong> ${notes}</p>` : '';
        docHTML = `
            <h1 class="doc-title">تكليف بتغطية مناوبة</h1>
            <table class="doc-table"><thead><tr><th>الاسم</th><th>الرقم الوظيفي</th><th>القسم</th></tr></thead><tbody><tr><td>${emp.name}</td><td>${emp.id}</td><td>${deptDisplay}</td></tr></tbody></table>
            <div class="doc-body">
                <p><strong>المكرم /</strong> ${emp.name} &nbsp;&nbsp;&nbsp; <strong>الرقم الوظيفي:</strong> ${emp.id}</p>
                <p>السلام عليكم ورحمة الله وبركاته،</p>
                <p>نظراً لوجود عجز طارئ في مناوبة <strong>(${shiftType})</strong> ${deptStatement}، بسبب <strong>(${reasonDisplay})</strong>، وحرصاً على استمرارية تقديم الخدمة للمرضى وعدم تعطّل العمل،</p>
                <p>عليه، تم تكليفكم بتغطية المناوبة المذكورة يوم <strong>(${shiftDay})</strong> بتاريخ <strong>${formattedDate}</strong> من الساعة <strong>(${formattedFrom})</strong> إلى الساعة <strong>(${formattedTo})</strong>، وتشمل التغطية جميع مهام القسم المعتادة خلال فترة المناوبة.</p>
                ${notesSection}
                <p>وتُحتسب لكم هذه المناوبة وفق الأنظمة والتعليمات المتبعة، شاكرين لكم تعاونكم وحرصكم.</p>
            </div>
            <div class="doc-copies"><p><strong>نسخه للموظف</strong></p><p><strong>نسخه بملف الموظف بالمختبر</strong></p><p><strong>نسخه بملف التكاليف بالمختبر</strong></p><p><strong>نسخه لادارة الحفظ والإرشيف</strong></p></div>
            <div class="doc-signatures"><div class="signature"><p>رئيس قسم المختبر</p><div class="line">${SETTINGS.headName}</div><p style="margin-top: 10px;">التوقيع: ....................</p></div></div>
        `;
    } else if (formType === 'absence') {
        // ... (كود الغياب) ...
        const datetime = document.getElementById('absenceDateTime').value;
        const notes = document.getElementById('absenceNotes').value;
        if (!datetime) { alert('الرجاء إدخال التاريخ.'); return; }
        const formattedDateTime = formatDateTime(datetime);
        const notesSection = notes ? `<p><strong>ملاحظات:</strong> ${notes}</p>` : '';
        docHTML = `
            <h1 class="doc-title">خطاب غياب عن العمل</h1>
            <p style="text-align:center; font-size:1rem; margin-bottom:15px;"><strong>إلى:</strong> إدارة مراقبة انتظام الموارد البشرية</p>
            <table class="doc-table"><thead><tr><th>الاسم</th><th>الرقم الوظيفي</th><th>القسم</th></tr></thead><tbody><tr><td>${emp.name}</td><td>${emp.id}</td><td>قسم المختبر</td></tr></tbody></table>
            <div class="doc-body">
                <p><strong>الموضوع:</strong> غياب عن العمل بتاريخ <strong>${formattedDateTime}</strong></p>
                <p>السلام عليكم ورحمة الله وبركاته وبعد ..</p>
                <p>نفيدكم بأن الموظف الموضح بياناته أعلاه قد تغيب عن العمل خلال فترة عمله المجدولة بتاريخ <strong>${formattedDateTime}</strong>، دون إشعار مسبق أو عذر مقبول، مما ترتب عليه نقص مفاجئ في القوى العاملة خلال فترة العمل.</p>
                <p>وقد استدعى ذلك إعادة توزيع الموظفين الموجودين وتغطية مهام الموظف المذكور، الأمر الذي أثر على التوزيع التشغيلي للمختبر وأوجد إرباكاً في خطة العمل المعتمدة، وحمّل بقية الفريق مهام إضافية لتغطية النقص لضمان استمرارية العمل وعدم تأثر الخدمة المقدمة للمرضى والمراجعين.</p>
                ${notesSection}
                <p>عليه نأمل من إدارتكم اتخاذ الإجراءات النظامية اللازمة حيال هذا الغياب وفقاً للوائح والأنظمة المعمول بها.</p>
            </div>
            <div class="doc-copies"><p><strong>نسخه للموظف</strong></p><p><strong>نسخه لادارة مراقبة انتظام الموارد البشرية</strong></p><p><strong>نسخه بملف الموظف</strong></p><p><strong>نسخه بملف المختبر</strong></p></div>
            <div class="doc-signatures"><div class="signature"><p>رئيس قسم المختبر</p><div class="line">${SETTINGS.headName}</div></div></div>
        `;
    } else if (formType === 'withdrawal') {
        // ... (كود الانسحاب) ...
        const datetime = document.getElementById('withdrawalDateTime').value;
        const notes = document.getElementById('withdrawalNotes').value;
        if (!datetime) { alert('الرجاء إدخال التاريخ.'); return; }
        const formattedDateTime = formatDateTime(datetime);
        const notesSection = notes ? `<p><strong>ملاحظات:</strong> ${notes}</p>` : '';
        docHTML = `
            <h1 class="doc-title">خطاب انسحاب عن العمل</h1>
            <p style="text-align:center; font-size:1rem; margin-bottom:15px;"><strong>إلى:</strong> إدارة مراقبة انتظام الموارد البشرية</p>
            <table class="doc-table"><thead><tr><th>الاسم</th><th>الرقم الوظيفي</th><th>القسم</th></tr></thead><tbody><tr><td>${emp.name}</td><td>${emp.id}</td><td>قسم المختبر</td></tr></tbody></table>
            <div class="doc-body">
                <p><strong>الموضوع:</strong> انسحاب من العمل بتاريخ <strong>${formattedDateTime}</strong></p>
                <p>السلام عليكم ورحمة الله وبركاته وبعد ..</p>
                <p>نفيدكم بأن الموظف الموضح بياناته أعلاه قد انسحب من العمل خلال فترة عمله المجدولة بتاريخ <strong>${formattedDateTime}</strong>، دون إذن مسبق أو عذر مقبول، مما ترتب عليه نقص مفاجئ في القوى العاملة خلال فترة العمل.</p>
                <p>وقد استدعى ذلك إعادة توزيع الموظفين الموجودين وتغطية مهام الموظف المذكور، الأمر الذي أثر على التوزيع التشغيلي للمختبر وأوجد إرباكاً في خطة العمل المعتمدة، وحمّل بقية الفريق مهام إضافية لتغطية النقص لضمان استمرارية العمل وعدم تأثر الخدمة المقدمة للمرضى والمراجعين.</p>
                ${notesSection}
                <p>عليه نأمل من إدارتكم اتخاذ الإجراءات النظامية اللازمة حيال هذا الانسحاب وفقاً للوائح والأنظمة المعمول بها.</p>
            </div>
            <div class="doc-copies"><p><strong>نسخه للموظف</strong></p><p><strong>نسخه لادارة مراقبة انتظام الموارد البشرية</strong></p><p><strong>نسخه بملف الموظف</strong></p><p><strong>نسخه بملف المختبر</strong></p></div>
            <div class="doc-signatures"><div class="signature"><p>رئيس قسم المختبر</p><div class="line">${SETTINGS.headName}</div></div></div>
        `;
    } else if (formType === 'sick_leave') {
        // ... (كود الإجازة المرضية) ...
        const datetime = document.getElementById('sickLeaveDateTime').value;
        const notes = document.getElementById('sickLeaveNotes').value;
        if (!datetime) { alert('الرجاء إدخال التاريخ.'); return; }
        const formattedDateTime = formatDateTime(datetime);
        const notesSection = notes ? `<p><strong>ملاحظات:</strong> ${notes}</p>` : '';
        docHTML = `
            <h1 class="doc-title">خطاب غياب مع إجازة مرضية (تحتاج للتحقق)</h1>
            <p style="text-align:center; font-size:1rem; margin-bottom:15px;"><strong>إلى:</strong> إدارة مراقبة انتظام الموارد البشرية</p>
            <table class="doc-table"><thead><tr><th>الاسم</th><th>الرقم الوظيفي</th><th>القسم</th></tr></thead><tbody><tr><td>${emp.name}</td><td>${emp.id}</td><td>قسم المختبر</td></tr></tbody></table>
            <div class="doc-body">
                <p><strong>الموضوع:</strong> غياب مع إجازة مرضية تحتاج للتحقق بتاريخ <strong>${formattedDateTime}</strong></p>
                <p>السلام عليكم ورحمة الله وبركاته وبعد ..</p>
                <p>نفيدكم بأن الموظف الموضح بياناته أعلاه قد تغيب عن العمل خلال فترة عمله المجدولة بتاريخ <strong>${formattedDateTime}</strong>، وقد أفاد بوجود إجازة مرضية، إلا أن الإجازة المرضية المقدمة تحتاج إلى التحقق من صحتها من قبل الجهات المختصة.</p>
                <p>ونظراً لأن غياب الموظف حدث خلال فترة عمله المجدولة، وما ترتب عليه من نقص مفاجئ في القوى العاملة وإعادة توزيع الموظفين الموجودين لضمان استمرارية العمل، فقد أثر ذلك على خطة التوزيع التشغيلي المعتمدة للمختبر، وحمّل بقية الفريق مهام إضافية لتغطية النقص وعدم تأثر الخدمة المقدمة للمرضى والمراجعين.</p>
                ${notesSection}
                <p>عليه نأمل من إدارتكم التحقق من الإجازة المرضية واتخاذ الإجراءات النظامية اللازمة وفقاً للوائح والأنظمة المعمول بها.</p>
            </div>
            <div class="doc-copies"><p><strong>نسخه للموظف</strong></p><p><strong>نسخه لادارة مراقبة انتظام الموارد البشرية</strong></p><p><strong>نسخه بملف الموظف</strong></p><p><strong>نسخه بملف المختبر</strong></p></div>
            <div class="doc-signatures"><div class="signature"><p>رئيس قسم المختبر</p><div class="line">${SETTINGS.headName}</div></div></div>
        `;
    } else if (formType === 'absence_pattern') {
        // ... (كود نمط الغياب) ...
        const patternType = document.getElementById('patternType').value;
        const unreportedCount = document.getElementById('unreportedCount').value;
        const reassignedCount = document.getElementById('reassignedCount').value;
        const impactType = document.getElementById('impactType').value;
        const impactOther = document.getElementById('impactOther').value;
        if (!patternType || !unreportedCount || !reassignedCount || !impactType) { alert('الرجاء إكمال الحقول.'); return; }
        const impactDisplay = (impactType === 'أخرى') ? impactOther : impactType;
        const absenceItems = document.querySelectorAll('.absence-record-item');
        if (absenceItems.length === 0) { alert('الرجاء إضافة حالة غياب.'); return; }
        let absenceTable = `<table class="doc-table" style="font-size: 0.85rem;"><thead><tr><th>#</th><th>التاريخ</th><th>اليوم</th><th>الدوام المجدول</th><th>نوع الغياب</th><th>رقم الإجازة / الحالة</th></tr></thead><tbody>`;
        absenceItems.forEach((item, index) => {
            const date = item.querySelector('.absence-date').value;
            const day = item.querySelector('.absence-day').value;
            const schedule = item.querySelector('.absence-schedule').value;
            const type = item.querySelector('.absence-type').value;
            const ref = item.querySelector('.absence-ref').value;
            absenceTable += `<tr><td>${index + 1}</td><td>${formatDate(date) || '-'}</td><td>${day || '-'}</td><td>${schedule || '-'}</td><td>${type || '-'}</td><td>${ref || '-'}</td></tr>`;
        });
        absenceTable += `</tbody></table>`;
        docHTML = `
            <h1 class="doc-title">طلب دراسة نمط غياب موظف</h1>
            <p style="text-align:center; font-size:1rem; margin-bottom:15px;"><strong>إلى:</strong> إدارة مراقبة انتظام الموارد البشرية</p>
            <table class="doc-table"><thead><tr><th>الاسم</th><th>الرقم الوظيفي</th><th>القسم</th></tr></thead><tbody><tr><td>${emp.name}</td><td>${emp.id}</td><td>قسم المختبر</td></tr></tbody></table>
            <div class="doc-body"><p>السلام عليكم ورحمة الله وبركاته، وبعد..</p><p>نفيدكم بأن الموظف الموضح بياناته أعلاه قد تغيّب عن العمل في التواريخ التالية:</p></div>
            ${absenceTable}
            <div class="doc-body">
                <p>وقد لوحظ أن الغياب يتكرر <strong>(${patternType})</strong>، ولم يُبلغ عنه مسبقًا في <strong>(${unreportedCount})</strong> من الحالات. وترتب عليه نقص في القوى العاملة وإعادة توزيع المهام على <strong>(${reassignedCount})</strong> موظفين، مع أثر على <strong>(${impactDisplay})</strong>.</p>
                <p>عليه نأمل من إدارتكم دراسة نمط الغياب، والتحقق من الإجازات المرضية لدى الجهات المصدرة، وإحالة الحالة للجنة الطبية إن لزم، واتخاذ الإجراءات النظامية وفق اللوائح المعمول بها.</p>
            </div>
            <div class="doc-copies"><p><strong>نسخه للموظف</strong></p><p><strong>نسخه لادارة مراقبة انتظام الموارد البشرية</strong></p><p><strong>نسخه بملف الموظف</strong></p><p><strong>نسخه بملف المختبر</strong></p></div>
            <div class="doc-signatures"><div class="signature"><p>رئيس قسم المختبر</p><div class="line">${SETTINGS.headName}</div></div></div>
        `;
    } else if (formType === 'incident_memo') {
        // كود مذكرة واقعة وطلب اتخاذ اللازم
        const jobTitle = document.getElementById('memoJobTitle').value;
        const dept = document.getElementById('memoDept').value;
        const shift = document.getElementById('memoShift').value;
        
        if (!dept || !shift) {
            alert('الرجاء اختيار القسم والمناوبة.');
            return;
        }

        // جمع موضوع الواقعة
        const incidents = Array.from(document.querySelectorAll('.memo-incident:checked')).map(cb => {
            if(cb.value === 'أخرى') {
                return document.getElementById('memoIncidentOtherText').value;
            }
            return cb.value;
        });
        if (incidents.length === 0) {
            alert('الرجاء اختيار موضوع الواقعة.');
            return;
        }
        let incidentsList = incidents.map(i => `<li>${i}</li>`).join('');

        // التكليف والتوجيه
        const wasAssigned = document.getElementById('memoWasAssigned').value;
        const wasDirected = document.getElementById('memoWasDirected').value;
        const directionDetails = document.getElementById('memoDirectionDetails').value;

        // الأثر
        const impacts = Array.from(document.querySelectorAll('.memo-impact:checked')).map(cb => {
            if(cb.value === 'أثر تشغيلي آخر') {
                return document.getElementById('memoImpactOtherText').value;
            }
            return cb.value;
        });
        let impactsList = impacts.length > 0 ? impacts.map(i => `<li>${i}</li>`).join('') : '<li>لا يوجد أثر بعد التحقق</li>';
        const impactDetails = document.getElementById('memoImpactDetails').value;

        // الإجراء
        const actions = Array.from(document.querySelectorAll('.memo-action:checked')).map(cb => {
            if(cb.value === 'إجراء تصحيحي آخر') {
                return document.getElementById('memoActionOtherText').value;
            }
            return cb.value;
        });
        let actionsList = actions.length > 0 ? actions.map(a => `<li>${a}</li>`).join('') : '';
        const actionDetails = document.getElementById('memoActionDetails').value;

        // المرفقات
        const attachments = Array.from(document.querySelectorAll('.memo-attachment:checked')).map(cb => {
            if(cb.value === 'مستند آخر') {
                return document.getElementById('memoAttachOtherText').value;
            }
            return cb.value;
        });
        let attachmentsList = attachments.length > 0 ? attachments.map(a => `<li>${a}</li>`).join('') : '';

        const today = new Date();
        const formattedDate = `${today.getDate()} / ${today.getMonth() + 1} / ${today.getFullYear()}م`;

        docHTML = `
            <h1 class="doc-title">مذكرة واقعة وطلب اتخاذ اللازم</h1>
            
            <div style="display: flex; justify-content: space-between; margin-bottom: 20px; font-size: 1rem;">
                <p><strong>التاريخ:</strong> ${formattedDate}</p>
            </div>

            <table class="doc-table" style="margin-bottom: 20px;">
                <tbody>
                    <tr><th style="width: 30%;">اسم الموظف المعني</th><td style="text-align: right; padding-right: 15px;">${emp.name}</td></tr>
                    <tr><th>المسمى الوظيفي</th><td style="text-align: right; padding-right: 15px;">${jobTitle}</td></tr>
                    <tr><th>القسم/الوحدة</th><td style="text-align: right; padding-right: 15px;">${dept}</td></tr>
                    <tr><th>المناوبة</th><td style="text-align: right; padding-right: 15px;">${shift}</td></tr>
                </tbody>
            </table>

            <div class="doc-body">
                <h3 style="color: #000; border-bottom: 1px solid #000; padding-bottom: 5px; margin-bottom: 10px;">أولاً: موضوع الواقعة</h3>
                <ul style="margin-right: 20px; margin-bottom: 15px;">${incidentsList}</ul>

                <h3 style="color: #000; border-bottom: 1px solid #000; padding-bottom: 5px; margin-bottom: 10px;">ثانياً: التكليف والتوجيه</h3>
                <p><strong>هل كان الموظف مكلفًا بالمهمة وفق جدول العمل/التكليف؟</strong> (${wasAssigned})</p>
                <p><strong>هل تم توجيه الموظف أو تنبيهه أثناء الواقعة؟</strong> (${wasDirected})</p>
                ${directionDetails ? `<p><strong>الإجراء/التوجيه:</strong> ${directionDetails}</p>` : ''}

                <h3 style="color: #000; border-bottom: 1px solid #000; padding-bottom: 5px; margin-bottom: 10px;">ثالثاً: الأثر الناتج أو المحتمل</h3>
                <ul style="margin-right: 20px; margin-bottom: 15px;">${impactsList}</ul>
                ${impactDetails ? `<p><strong>تفاصيل الأثر:</strong> ${impactDetails}</p>` : ''}

                <h3 style="color: #000; border-bottom: 1px solid #000; padding-bottom: 5px; margin-bottom: 10px;">رابعاً: الإجراء المتخذ</h3>
                ${actionsList ? `<ul style="margin-right: 20px; margin-bottom: 15px;">${actionsList}</ul>` : '<p>لم يتم اتخاذ إجراء بعد.</p>'}
                ${actionDetails ? `<p><strong>تفاصيل الإجراء:</strong> ${actionDetails}</p>` : ''}

                <h3 style="color: #000; border-bottom: 1px solid #000; padding-bottom: 5px; margin-bottom: 10px;">خامساً: المرفقات/المستندات المؤيدة</h3>
                ${attachmentsList ? `<ul style="margin-right: 20px; margin-bottom: 15px;">${attachmentsList}</ul>` : '<p>لا توجد مرفقات.</p>'}

                <p style="margin-top: 20px; text-align: justify;">أرفع لسعادتكم هذه المذكرة لتوثيق الواقعة والتحقق من ملابساتها ومدى الالتزام بالمهام والتكليفات والإجراءات المعتمدة، والتوجيه بما ترونه مناسبًا، وفي حال ثبوت وجود تقصير أو مخالفة، إحالة الموضوع للجهة المختصة لاتخاذ الإجراء النظامي وتحديد المسؤولية عما ترتب على الواقعة، وفق ما يثبت بالتحقيق والمستندات ذات العلاقة.</p>
                <p style="margin-top: 15px;">وتفضلوا بقبول خالص التحية والتقدير،،،</p>
            </div>

            <div class="doc-signatures" style="justify-content: flex-start; margin-top: 40px;">
                <div class="signature" style="text-align: right;">
                    <p><strong>رئيس قسم المختبر</strong></p>
                    <div class="line" style="border-top: none; margin-top: 10px;">${SETTINGS.headName}</div>
                    <p style="margin-top: 5px;">التوقيع: ....................</p>
                </div>
            </div>
        `;
    } else if (formType === 'circular') {
        // ... (كود التعميم) ...
        const subject = document.getElementById('circularSubject').value;
        const body = document.getElementById('circularBody').value;
        if (!subject || !body) { alert('الرجاء إكمال الحقول.'); return; }
        const today = new Date();
        const formattedDate = `${today.getDate()} / ${today.getMonth() + 1} / ${today.getFullYear()}م`;
        const formattedBody = body.split('\n').filter(line => line.trim() !== '').map(line => {
            const trimmed = line.trim();
            if (/^[0-9٠-٩]+[\.\-]/.test(trimmed)) return `<p style="margin-right: 20px;">${trimmed}</p>`;
            if (/^[\-\•\*]/.test(trimmed)) return `<p style="margin-right: 40px;">${trimmed}</p>`;
            return `<p>${trimmed}</p>`;
        }).join('');
        docHTML = `
            <h1 class="doc-title">تعميم داخلي</h1>
            <div style="text-align: center; margin-bottom: 20px;">
                <p style="font-size: 1rem; margin-bottom: 5px;">تجمع عسير الصحي – مستشفى سبت العلاية العام</p>
                <p style="font-size: 1rem; margin-bottom: 15px;">قسم المختبر</p>
            </div>
            <div style="display: flex; justify-content: space-between; margin-bottom: 20px; font-size: 1rem;">
                <p><strong>التاريخ:</strong> ${formattedDate}</p>
                <p><strong>الموضوع:</strong> ${subject}</p>
            </div>
            <div class="doc-body">
                <p>إلى جميع منسوبي قسم المختبر المحترمين،</p>
                <p>السلام عليكم ورحمة الله وبركاته،</p>
                ${formattedBody}
            </div>
            <div class="doc-signatures">
                <div class="signature" style="margin-right: auto; text-align: right;">
                    <p>رئيس قسم المختبر</p><div class="line">${SETTINGS.headName}</div>
                    <p style="margin-top: 10px;">التوقيع: ....................</p>
                </div>
            </div>
        `;
    }
    
    closeGeneratorModal();
    printDocument(`<div class="document-area">${docHTML}</div>`, { letterhead: true });
}

window.onclick = function(event) {
    if (event.target == modal) closeModal();
    if (event.target == printModal) closePrintModal();
    if (event.target == generatorModal) closeGeneratorModal();
    if (event.target == document.getElementById('manageModal')) closeManageModal();
}

// ============ إدارة الموظفين ============
const EF_FIELDS = ['id', 'name', 'nationalId', 'birthDate', 'mobile', 'email', 'jobTitle', 'qualification', 'nationality', 'startDate', 'currentDate', 'department', 'notes'];
const DEFAULT_DEPARTMENT = 'تجمع عسير الصحي - نطاق بيشة - مستشفى سبت العلايا العام - إدارة الخدمات الطبية المساندة - قسم المختبر';

function openManageModal() {
    updateDataStatus();
    document.getElementById('set_headName').value = SETTINGS.headName;
    document.getElementById('set_directorName').value = SETTINGS.directorName;
    switchManageTab('list');
    document.getElementById('manageModal').style.display = 'block';
}
function closeManageModal() { document.getElementById('manageModal').style.display = 'none'; }

function switchManageTab(tab) {
    document.querySelectorAll('.manage-tabs button').forEach(b => b.classList.toggle('active', b.dataset.tab === tab));
    document.querySelectorAll('.manage-pane').forEach(p => p.classList.toggle('active', p.id === 'pane-' + tab));
    if (tab === 'list') renderManageList();
    if (tab === 'form' && !document.getElementById('ef_originalId').value && !document.getElementById('ef_name').value) startAddEmployee(true);
}

function updateDataStatus() {
    const el = document.getElementById('dataStatus');
    if (isLocalData()) {
        el.className = 'data-status local';
        el.innerHTML = '<i class="fas fa-mobile-screen"></i> يوجد تعديلات محفوظة على هذا الجهاز. لتعميمها: أدوات ← تنزيل data.js ورفعه على GitHub.';
    } else {
        el.className = 'data-status default';
        el.innerHTML = '<i class="fas fa-check-circle"></i> البيانات المعروضة هي بيانات ملف data.js الأصلي.';
    }
}

function renderManageList() {
    const term = (document.getElementById('manageSearch').value || '').trim();
    const list = employees.filter(e => !term || e.name.includes(term) || String(e.id).includes(term) || String(e.nationalId || '').includes(term));
    document.getElementById('manageList').innerHTML = list.map(e => `
        <div class="manage-row">
            <div class="mr-info">
                <div class="mr-name">${esc(e.name)}${e.seha ? '<span class="seha-badge">صحة</span>' : ''}${isMissing(e) ? '<span class="missing-badge">ناقص</span>' : ''}</div>
                <div class="mr-sub">${esc(e.id)} — ${esc(e.jobTitle || '')} — ${esc(e.mobile || 'بدون جوال')}</div>
            </div>
            <div class="mr-actions">
                <button class="mr-edit" onclick="startEditEmployee('${esc(e.id)}')"><i class="fas fa-pen"></i> تعديل</button>
                <button class="mr-del" onclick="deleteEmployee('${esc(e.id)}')"><i class="fas fa-trash"></i> حذف</button>
            </div>
        </div>`).join('') || '<p class="hint">لا توجد نتائج.</p>';
}

function fillEmpForm(emp) {
    EF_FIELDS.forEach(f => { document.getElementById('ef_' + f).value = emp[f] || ''; });
    document.getElementById('ef_seha').checked = !!emp.seha;
}

function startAddEmployee(silent) {
    document.getElementById('ef_originalId').value = '';
    fillEmpForm({ nationality: 'سعودي', jobTitle: 'فني مختبر', department: DEFAULT_DEPARTMENT });
    document.getElementById('formModeText').textContent = 'إضافة موظف جديد';
    if (!silent) switchManageTab('form');
}

function startEditEmployee(id) {
    const emp = employees.find(e => e.id === id);
    if (!emp) return;
    if (document.getElementById('manageModal').style.display !== 'block') openManageModal();
    document.getElementById('ef_originalId').value = emp.id;
    fillEmpForm(emp);
    document.getElementById('formModeText').textContent = 'تعديل بيانات: ' + emp.name;
    switchManageTab('form');
}

function normalizeMobile(m) {
    let d = String(m || '').replace(/[^\d]/g, '');
    if (d.startsWith('00966')) d = d.slice(5);
    if (d.startsWith('966')) d = d.slice(3);
    if (d.length === 9 && d.startsWith('5')) d = '0' + d;
    return d;
}
function toEnglishDigits(v) {
    return String(v || '').replace(/[٠-٩]/g, d => '٠١٢٣٤٥٦٧٨٩'.indexOf(d)).replace(/[۰-۹]/g, d => '۰۱۲۳۴۵۶۷۸۹'.indexOf(d));
}
function normalizeHijri(v) {
    v = toEnglishDigits(v).trim();
    const m = v.match(/^(\d{1,4})\s*[\/\-\.]\s*(\d{1,2})\s*[\/\-\.]\s*(\d{1,4})$/);
    if (!m) return v;
    let [a, b, c] = [m[1], m[2], m[3]];
    if (a.length === 4) return `${a}/${b.padStart(2, '0')}/${c.padStart(2, '0')}`;
    if (c.length === 4) return `${c}/${b.padStart(2, '0')}/${a.padStart(2, '0')}`;
    return v;
}

function saveEmployee(ev) {
    ev.preventDefault();
    const originalId = document.getElementById('ef_originalId').value;
    const data = {};
    EF_FIELDS.forEach(f => { data[f] = document.getElementById('ef_' + f).value.trim(); });
    data.id = toEnglishDigits(data.id);
    data.nationalId = toEnglishDigits(data.nationalId);
    data.mobile = normalizeMobile(toEnglishDigits(data.mobile));
    data.birthDate = normalizeHijri(data.birthDate);
    data.seha = document.getElementById('ef_seha').checked;

    if (!data.name || !data.id) { alert('الاسم والرقم الوظيفي مطلوبان.'); return; }
    if (data.nationalId && !/^[12]\d{9}$/.test(data.nationalId)) {
        if (!confirm('رقم السجل/الإقامة لا يبدو صحيحاً (10 أرقام يبدأ بـ 1 أو 2). حفظ على أي حال؟')) return;
    }
    if (data.mobile && !/^05\d{8}$/.test(data.mobile)) {
        if (!confirm('رقم الجوال لا يبدو صحيحاً (05XXXXXXXX). حفظ على أي حال؟')) return;
    }
    const dup = employees.find(e => e.id === data.id && e.id !== originalId);
    if (dup) { alert('الرقم الوظيفي مستخدم لموظف آخر: ' + dup.name); return; }
    const dupEmail = data.email && employees.find(e => e.email && e.email.toLowerCase() === data.email.toLowerCase() && e.id !== originalId);
    if (dupEmail && !confirm('هذا الإيميل مسجل أيضاً للموظف: ' + dupEmail.name + '\nحفظ على أي حال؟')) return;

    if (originalId) {
        const idx = employees.findIndex(e => e.id === originalId);
        employees[idx] = Object.assign({}, employees[idx], data);
        selectedEmployees = selectedEmployees.map(s => s === originalId ? data.id : s);
        showToast('تم حفظ التعديلات');
    } else {
        employees.push(data);
        showToast('تمت إضافة الموظف');
    }
    persistEmployees();
    updateDataStatus();
    renderEmployees(getVisibleEmployees());
    document.getElementById('ef_originalId').value = '';
    document.getElementById('ef_name').value = '';
    switchManageTab('list');
}

function deleteEmployee(id) {
    const emp = employees.find(e => e.id === id);
    if (!emp) return;
    if (!confirm('حذف الموظف: ' + emp.name + '؟')) return;
    employees = employees.filter(e => e.id !== id);
    selectedEmployees = selectedEmployees.filter(s => s !== id);
    persistEmployees();
    updateDataStatus();
    updateSelectionUI();
    renderEmployees(getVisibleEmployees());
    renderManageList();
    showToast('تم الحذف');
}

function downloadFile(name, content, type) {
    const blob = new Blob([content], { type });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url; a.download = name;
    document.body.appendChild(a); a.click(); a.remove();
    setTimeout(() => URL.revokeObjectURL(url), 2000);
}

function downloadDataJs() {
    const header = `// data.js — البيانات الافتراضية للموظفين (آخر تحديث: ${new Date().toLocaleDateString('ar-SA')} - ${new Date().toISOString().slice(0, 10)})\n` +
        `// ملاحظة: التعديلات من داخل التطبيق تُحفظ على الجهاز. لتعميمها على كل الأجهزة\n` +
        `// استخدم (إدارة الموظفين ← أدوات ← تنزيل data.js) وارفع الملف هنا بدل هذا الملف.\n`;
    downloadFile('data.js', header + 'const DEFAULT_EMPLOYEES = ' + JSON.stringify(employees, null, 4) + ';\n', 'text/javascript;charset=utf-8');
    showToast('تم تنزيل data.js — ارفعه على GitHub');
}

function exportBackup() {
    const payload = { app: 'staff-folder', exportedAt: new Date().toISOString(), settings: SETTINGS, employees };
    downloadFile(`نسخة_احتياطية_الموظفين_${new Date().toISOString().slice(0, 10)}.json`, JSON.stringify(payload, null, 2), 'application/json');
}

function importBackup(input) {
    const file = input.files && input.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
        try {
            const data = JSON.parse(reader.result);
            const list = Array.isArray(data) ? data : data.employees;
            if (!Array.isArray(list) || !list.every(e => e && e.id && e.name)) throw new Error('bad');
            if (!confirm(`استبدال البيانات الحالية بـ ${list.length} موظف من النسخة الاحتياطية؟`)) return;
            employees = list;
            if (data.settings) { SETTINGS = Object.assign(SETTINGS, data.settings); safeSet(SETTINGS_KEY, JSON.stringify(SETTINGS)); }
            selectedEmployees = [];
            persistEmployees(); updateDataStatus(); updateSelectionUI();
            renderEmployees(getVisibleEmployees()); renderManageList();
            showToast('تم استيراد النسخة الاحتياطية');
        } catch (e) { alert('الملف غير صالح.'); }
        finally { input.value = ''; }
    };
    reader.readAsText(file);
}

function saveSettings() {
    SETTINGS.headName = document.getElementById('set_headName').value.trim() || SETTINGS.headName;
    SETTINGS.directorName = document.getElementById('set_directorName').value.trim() || SETTINGS.directorName;
    safeSet(SETTINGS_KEY, JSON.stringify(SETTINGS));
    showToast('تم حفظ الإعدادات');
}

function resetToDefault() {
    if (!confirm('سيتم حذف كل التعديلات المحفوظة على هذا الجهاز والرجوع لبيانات data.js. متأكد؟')) return;
    safeRemove(STORAGE_KEY);
    employees = loadEmployees();
    selectedEmployees = [];
    updateDataStatus(); updateSelectionUI();
    renderEmployees(getVisibleEmployees()); renderManageList();
    showToast('تمت الاستعادة');
}

renderEmployees(getVisibleEmployees());
updateSelectionUI();
