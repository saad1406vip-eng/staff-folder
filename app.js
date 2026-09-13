// app.js

const employeeGrid = document.getElementById('employeeGrid');
const searchInput = document.getElementById('searchInput');
const modal = document.getElementById('modal');
const modalBody = document.getElementById('modalBody');
const printModal = document.getElementById('printModal');
const printArea = document.getElementById('printArea');
const selectedCountEl = document.getElementById('selectedCount');
const printScopeText = document.getElementById('printScopeText');

let selectedEmployees = []; // قائمة الموظفين المحددين
let isPrintingSelected = false; // هل نطبع المحددين أم الكل

// ===== عرض الموظفين =====
function renderEmployees(data) {
    employeeGrid.innerHTML = '';
    
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
            <img src="${emp.avatar}" alt="${emp.name}">
            <h3>${emp.name}</h3>
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

// ===== تحديد الموظفين =====
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

// ===== الحصول على الموظفين الظاهرين حالياً (بعد البحث) =====
function getVisibleEmployees() {
    const term = searchInput.value.toLowerCase();
    if (!term) return employees;
    return employees.filter(emp => 
        emp.name.toLowerCase().includes(term) || 
        emp.id.includes(term) ||
        (emp.nationalId && emp.nationalId.includes(term))
    );
}

// ===== فتح ملف الموظف =====
function openModal(id) {
    const emp = employees.find(e => e.id === id);
    if (!emp) return;

    modalBody.innerHTML = `
        <h2><i class="fas fa-user-circle"></i> ${emp.name}</h2>
        <div class="info-row"><span>الرقم الوظيفي:</span> <span>${emp.id}</span></div>
        <div class="info-row"><span>السجل المدني/الهوية:</span> <span>${emp.nationalId || 'غير محدد'}</span></div>
        <div class="info-row"><span>الجنسية:</span> <span>${emp.nationality || 'غير محدد'}</span></div>
        <div class="info-row"><span>المؤهل العلمي:</span> <span>${emp.qualification || 'غير محدد'}</span></div>
        <div class="info-row"><span>المسمى الوظيفي:</span> <span>${emp.jobTitle || 'فني مختبر'}</span></div>
        <div class="info-row"><span>الإدارة:</span> <span>${emp.department}</span></div>
        <div class="info-row"><span>البريد الإلكتروني:</span> <span>${emp.email}</span></div>
        <div class="info-row"><span>رقم الجوال:</span> <span>${emp.mobile || 'غير محدد'}</span></div>
        <div class="info-row"><span>تاريخ بداية التعيين:</span> <span>${emp.startDate}</span></div>
        <div class="info-row"><span>تاريخ التعيين الحالي:</span> <span>${emp.currentDate}</span></div>
        <div class="modal-actions" style="margin-top: 25px;">
            <button class="btn btn-secondary btn-block" onclick="shareIndividual('${emp.id}')"><i class="fas fa-share-alt"></i> مشاركة</button>
            <button class="btn btn-primary btn-block" onclick="window.print()"><i class="fas fa-print"></i> طباعة A4</button>
        </div>
    `;
    modal.style.display = 'block';
}

function closeModal() { modal.style.display = 'none'; }

// ===== نافذة الطباعة =====
function openPrintModal(printSelected = false) {
    isPrintingSelected = printSelected;
    
    if (printSelected && selectedEmployees.length === 0) {
        alert('الرجاء تحديد موظف واحد على الأقل أولاً.');
        return;
    }
    
    if (printSelected) {
        printScopeText.textContent = `سيتم طباعة ${selectedEmployees.length} موظف محدد. اختر الحقول المطلوبة:`;
    } else {
        printScopeText.textContent = `سيتم طباعة جميع الموظفين (${employees.length}). اختر الحقول المطلوبة:`;
    }
    
    printModal.style.display = 'block';
}

function closePrintModal() { printModal.style.display = 'none'; }

// ===== تنفيذ الطباعة =====
function printSelectedData() {
    const checkboxes = document.querySelectorAll('.print-field:checked');
    const selectedFields = Array.from(checkboxes).map(cb => cb.value);
    
    if (selectedFields.length === 0) {
        alert('الرجاء اختيار حقل واحد على الأقل للطباعة.');
        return;
    }

    // تحديد قائمة الموظفين المطلوب طباعتهم
    let listToPrint = employees;
    if (isPrintingSelected) {
        listToPrint = employees.filter(emp => selectedEmployees.includes(emp.id));
    }

    const fieldNames = {
        id: 'الرقم الوظيفي',
        name: 'الاسم',
        nationalId: 'السجل المدني / الهوية',
        jobTitle: 'المسمى الوظيفي',
        mobile: 'رقم الجوال',
        email: 'البريد الإلكتروني',
        qualification: 'المؤهل العلمي',
        nationality: 'الجنسية',
        startDate: 'تاريخ التعيين',
        department: 'الإدارة'
    };

    let tableHTML = `
        <h2>قائمة بيانات فريق المختبر</h2>
        <p>مستشفى سبت العلايا العام - تاريخ الطباعة: ${new Date().toLocaleDateString('ar-SA')}</p>
        <table>
            <thead>
                <tr>
                    <th>#</th>
                    ${selectedFields.map(field => `<th>${fieldNames[field]}</th>`).join('')}
                </tr>
            </thead>
            <tbody>
    `;

    listToPrint.forEach((emp, index) => {
        tableHTML += `<tr>`;
        tableHTML += `<td>${index + 1}</td>`;
        selectedFields.forEach(field => {
            tableHTML += `<td>${emp[field] || '-'}</td>`;
        });
        tableHTML += `</tr>`;
    });

    tableHTML += `</tbody></table>`;

    printArea.innerHTML = tableHTML;
    closePrintModal();
    printArea.style.display = 'block';
    
    setTimeout(() => {
        window.print();
        setTimeout(() => {
            printArea.style.display = 'none';
        }, 1000);
    }, 300);
}

// ===== تصدير Excel =====
function exportToExcel() {
    exportData(employees);
}

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

    const fieldNames = {
        id: 'الرقم الوظيفي',
        name: 'الاسم',
        nationalId: 'السجل المدني',
        jobTitle: 'المسمى الوظيفي',
        mobile: 'رقم الجوال',
        email: 'البريد الإلكتروني',
        qualification: 'المؤهل العلمي',
        nationality: 'الجنسية',
        startDate: 'تاريخ التعيين',
        department: 'الإدارة'
    };

    let csvContent = "\uFEFF";
    csvContent += selectedFields.map(f => fieldNames[f]).join(",") + "\n";

    list.forEach(emp => {
        const row = selectedFields.map(field => {
            let val = emp[field] || '';
            return `"${val.toString().replace(/"/g, '""')}"`;
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

// ===== البحث =====
searchInput.addEventListener('input', function(e) {
    renderEmployees(getVisibleEmployees());
});

// ===== مشاركة موظف واحد =====
function shareIndividual(id) {
    const emp = employees.find(e => e.id === id);
    if (!emp) return;
    
    const text = `
*بيانات الموظف:*
الاسم: ${emp.name}
الرقم الوظيفي: ${emp.id}
السجل المدني: ${emp.nationalId || 'غير محدد'}
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

// ===== مشاركة الكل =====
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

// ===== طباعة موظف واحد =====
function printIndividual(id) {
    openModal(id);
    setTimeout(() => { window.print(); }, 500);
}

// ===== إغلاق النوافذ =====
window.onclick = function(event) {
    if (event.target == modal) closeModal();
    if (event.target == printModal) closePrintModal();
}

// ===== التشغيل =====
renderEmployees(employees);
updateSelectionUI();
