// app.js

const employeeGrid = document.getElementById('employeeGrid');
const searchInput = document.getElementById('searchInput');
const modal = document.getElementById('modal');
const modalBody = document.getElementById('modalBody');
const printModal = document.getElementById('printModal');
const printArea = document.getElementById('printArea');
const selectedCountEl = document.getElementById('selectedCount');
const printScopeText = document.getElementById('printScopeText');
const generatorModal = document.getElementById('generatorModal');
const documentArea = document.getElementById('documentArea');

let selectedEmployees = [];
let isPrintingSelected = false;

const OFFICIAL_LOGO = "logo.svg";

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
    const term = searchInput.value.toLowerCase();
    if (!term) return employees;
    return employees.filter(emp => 
        emp.name.toLowerCase().includes(term) || 
        emp.id.includes(term) ||
        (emp.nationalId && emp.nationalId.includes(term))
    );
}

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

function printSelectedData() {
    const checkboxes = document.querySelectorAll('.print-field:checked');
    const selectedFields = Array.from(checkboxes).map(cb => cb.value);
    
    if (selectedFields.length === 0) {
        alert('الرجاء اختيار حقل واحد على الأقل للطباعة.');
        return;
    }

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
        <div class="print-header">
            <img src="${OFFICIAL_LOGO}" alt="شعار تجمع عسير الصحي" class="print-logo">
            <div class="print-header-text">
                <p>المملكة العربية السعودية</p>
                <p>وزارة الصحة</p>
                <p>تجمع عسير الصحي</p>
                <p>مستشفى سبت العلايا العام - قسم المختبر</p>
            </div>
        </div>
        <h2>قائمة بيانات فريق المختبر</h2>
        <p>تاريخ الطباعة: ${new Date().toLocaleDateString('ar-SA')}</p>
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

function exportToExcel() { exportData(employees); }

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

function printIndividual(id) {
    openModal(id);
    setTimeout(() => { window.print(); }, 500);
}

function openGeneratorModal() {
    const select = document.getElementById('formEmployee');
    select.innerHTML = '<option value="">-- اختر الموظف --</option>';
    employees.forEach(emp => {
        const option = document.createElement('option');
        option.value = emp.id;
        option.textContent = `${emp.name} - ${emp.id}`;
        select.appendChild(option);
    });
    
    document.getElementById('formType').value = 'training';
    toggleFormFields();
    
    generatorModal.style.display = 'block';
}

function closeGeneratorModal() { generatorModal.style.display = 'none'; }

function toggleFormFields() {
    const type = document.getElementById('formType').value;
    document.getElementById('fieldTraining').style.display = (type === 'training') ? 'block' : 'none';
    document.getElementById('fieldWarning').style.display = (type === 'warning') ? 'block' : 'none';
    document.getElementById('fieldAssignment').style.display = (type === 'assignment') ? 'block' : 'none';
    document.getElementById('fieldAbsence').style.display = (type === 'absence') ? 'block' : 'none';
    document.getElementById('fieldWithdrawal').style.display = (type === 'withdrawal') ? 'block' : 'none';
    document.getElementById('fieldSickLeave').style.display = (type === 'sick_leave') ? 'block' : 'none';
}

function formatDateTime(datetimeStr) {
    if (!datetimeStr) return '';
    const date = new Date(datetimeStr);
    const options = { year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit' };
    return date.toLocaleString('ar-SA', options);
}

function generateDocument() {
    const formType = document.getElementById('formType').value;
    const employeeId = document.getElementById('formEmployee').value;
    
    if (!employeeId) {
        alert('الرجاء اختيار الموظف أولاً.');
        return;
    }
    
    const emp = employees.find(e => e.id === employeeId);
    if (!emp) return;
    
    const docHeader = `
        <div class="doc-header">
            <img src="${OFFICIAL_LOGO}" alt="شعار تجمع عسير الصحي" class="doc-logo">
            <div class="header-text">
                <p>المملكة العربية السعودية</p>
                <p>وزارة الصحة</p>
                <p>تجمع عسير الصحي</p>
                <p>مستشفى سبت العلايا العام</p>
                <p>قسم المختبر</p>
            </div>
        </div>
    `;
    
    let docHTML = '';
    
    if (formType === 'training') {
        const dept = document.getElementById('trainingDept').value;
        const days = document.getElementById('trainingDays').value;
        
        if (!dept || !days) {
            alert('الرجاء إكمال جميع الحقول المطلوبة (القسم/الجهاز والمدة).');
            return;
        }
        
        docHTML = `
            ${docHeader}
            <h1 class="doc-title">محضر تدريب داخلي</h1>
            <table class="doc-table">
                <thead><tr><th>الاسم</th><th>القسم</th><th>الرقم الوظيفي</th></tr></thead>
                <tbody><tr><td>${emp.name}</td><td>${dept}</td><td>${emp.id}</td></tr></tbody>
            </table>
            <div class="doc-body">
                <p><strong>المكرم /</strong> ${emp.name} &nbsp;&nbsp;&nbsp; <strong>الرقم الوظيفي:</strong> ${emp.id}</p>
                <p>السلام عليكم ورحمة الله وبركاته وبعد ..</p>
                <p>نظراً لتجويد العمل والإرتقاء بمهارات الموظفين العاملين بقسم المختبر.</p>
                <p>عليه نأمل منكم التدريب على رأس العمل في القسم الموضح اعلاه لمده <strong>(${days})</strong> يوماً من تاريخه.</p>
            </div>
            <div class="doc-copies">
                <p><strong>نسخه للموظف</strong></p>
                <p><strong>نسخه لادارة التدريب</strong></p>
                <p><strong>نسخه بملف الموظف</strong></p>
                <p><strong>نسخه بملف التدريب بالمختبر</strong></p>
            </div>
            <div class="doc-signatures">
                <div class="signature"><p>رئيس قسم المختبر</p><div class="line">سعد علي سعد القرني</div></div>
            </div>
        `;
    } else if (formType === 'warning') {
        const dept = document.getElementById('warningDept').value;
        const points = document.getElementById('warningPoints').value;
        
        if (!dept || !points) {
            alert('الرجاء إكمال جميع الحقول المطلوبة (القسم ونقاط التقصير).');
            return;
        }
        
        const pointsList = points.split('\n').filter(p => p.trim() !== '').map(p => `<li>${p}</li>`).join('');
        
        docHTML = `
            ${docHeader}
            <h1 class="doc-title">إنذار داخلي</h1>
            <table class="doc-table">
                <thead><tr><th>الاسم</th><th>القسم</th><th>الرقم الوظيفي</th></tr></thead>
                <tbody><tr><td>${emp.name}</td><td>${dept}</td><td>${emp.id}</td></tr></tbody>
            </table>
            <div class="doc-body">
                <p><strong>المكرم /</strong> ${emp.name} &nbsp;&nbsp;&nbsp; <strong>الرقم الوظيفي:</strong> ${emp.id}</p>
                <p>السلام عليكم ورحمة الله وبركاته وبعد ..</p>
                <p>نظراً لما لوحظ من تقصير في مهام العمل الموكله اليك بالقسم الموضح اعلاه ، حيث لم يتم عمل التالي:</p>
                <ol>${pointsList}</ol>
                <p>عليه نوجه هذا الانذار اليكم لمعالجة التقصير الحاصل فوراً وعدم تكراره مستقبلاً.</p>
            </div>
            <div class="doc-note"><p>ملاحظة: الانذارات تؤخذ بعين الاعتبار في التقييم الوظيفي للموظف.</p></div>
            <div class="doc-copies">
                <p><strong>نسخه للموظف</strong></p>
                <p><strong>نسخه لاداره المتابعه</strong></p>
                <p><strong>نسخه بملف الموظف</strong></p>
                <p><strong>نسخه بملف الانذارات والجزاءات بالمختبر</strong></p>
            </div>
            <div class="doc-signatures">
                <div class="signature"><p>رئيس قسم المختبر</p><div class="line">سعد علي سعد القرني</div></div>
            </div>
        `;
    } else if (formType === 'assignment') {
        const dept = document.getElementById('assignmentDept').value;
        
        if (!dept) {
            alert('الرجاء اختيار القسم أو الجهاز.');
            return;
        }
        
        docHTML = `
            ${docHeader}
            <h1 class="doc-title">تكليف داخلي</h1>
            <table class="doc-table">
                <thead><tr><th>الاسم</th><th>الرقم الوظيفي</th><th>القسم</th></tr></thead>
                <tbody><tr><td>${emp.name}</td><td>${emp.id}</td><td>${dept}</td></tr></tbody>
            </table>
            <div class="doc-body">
                <p><strong>المكرم /</strong> ${emp.name} &nbsp;&nbsp;&nbsp; <strong>الرقم الوظيفي:</strong> ${emp.id}</p>
                <p>السلام عليكم ورحمة الله وبركاته وبعد ..</p>
                <p>إن مدير مختبر مستشفى سبت العلايه، وبناءً على الصلاحيات الممنوحه له ، وبناءً على ما تقتضيه مصلحه العمل، ولثقتنا فيكم اعتمدنا تكليفكم نظاماً بالعمل بقسم <strong>(${dept})</strong> اعتباراً من تاريخه حتى اشعار لاحق.</p>
            </div>
            <div class="doc-copies">
                <p><strong>نسخه للموظف</strong></p>
                <p><strong>نسخه بملف الموظف بالمختبر</strong></p>
                <p><strong>نسخه بملف التكاليف بالمختبر</strong></p>
                <p><strong>نسخه لادارة الحفظ والإرشيف</strong></p>
            </div>
            <div class="doc-signatures">
                <div class="signature"><p>رئيس قسم المختبر</p><div class="line">سعد علي سعد القرني</div></div>
                <div class="signature"><p>مدير مستشفى سبت العلايه العام للمصادقه</p><div class="line">محمد بن سعيد القرني</div></div>
            </div>
        `;
    } else if (formType === 'absence') {
        const datetime = document.getElementById('absenceDateTime').value;
        const notes = document.getElementById('absenceNotes').value;
        
        if (!datetime) {
            alert('الرجاء إدخال تاريخ ووقت الغياب.');
            return;
        }
        
        const formattedDateTime = formatDateTime(datetime);
        const notesSection = notes ? `<p><strong>ملاحظات:</strong> ${notes}</p>` : '';
        
        docHTML = `
            ${docHeader}
            <h1 class="doc-title">خطاب غياب عن العمل</h1>
            <p style="text-align:center; font-size:1rem; margin-bottom:15px;"><strong>إلى:</strong> إدارة مراقبة انتظام الموارد البشرية</p>
            <table class="doc-table">
                <thead><tr><th>الاسم</th><th>الرقم الوظيفي</th><th>القسم</th></tr></thead>
                <tbody><tr><td>${emp.name}</td><td>${emp.id}</td><td>قسم المختبر</td></tr></tbody>
            </table>
            <div class="doc-body">
                <p><strong>الموضوع:</strong> غياب عن العمل بتاريخ <strong>${formattedDateTime}</strong></p>
                <p>السلام عليكم ورحمة الله وبركاته وبعد ..</p>
                <p>نفيدكم بأن الموظف الموضح بياناته أعلاه قد تغيب عن العمل خلال فترة عمله المجدولة بتاريخ <strong>${formattedDateTime}</strong>، دون إشعار مسبق أو عذر مقبول، مما ترتب عليه نقص مفاجئ في القوى العاملة خلال فترة العمل.</p>
                <p>وقد استدعى ذلك إعادة توزيع الموظفين الموجودين وتغطية مهام الموظف المذكور، الأمر الذي أثر على التوزيع التشغيلي للمختبر وأوجد إرباكاً في خطة العمل المعتمدة، وحمّل بقية الفريق مهام إضافية لتغطية النقص لضمان استمرارية العمل وعدم تأثر الخدمة المقدمة للمرضى والمراجعين.</p>
                ${notesSection}
                <p>عليه نأمل من إدارتكم اتخاذ الإجراءات النظامية اللازمة حيال هذا الغياب وفقاً للوائح والأنظمة المعمول بها.</p>
            </div>
            <div class="doc-copies">
                <p><strong>نسخه للموظف</strong></p>
                <p><strong>نسخه لادارة مراقبة انتظام الموارد البشرية</strong></p>
                <p><strong>نسخه بملف الموظف</strong></p>
                <p><strong>نسخه بملف المختبر</strong></p>
            </div>
            <div class="doc-signatures">
                <div class="signature"><p>رئيس قسم المختبر</p><div class="line">سعد علي سعد القرني</div></div>
            </div>
        `;
    } else if (formType === 'withdrawal') {
        const datetime = document.getElementById('withdrawalDateTime').value;
        const notes = document.getElementById('withdrawalNotes').value;
        
        if (!datetime) {
            alert('الرجاء إدخال تاريخ ووقت الانسحاب.');
            return;
        }
        
        const formattedDateTime = formatDateTime(datetime);
        const notesSection = notes ? `<p><strong>ملاحظات:</strong> ${notes}</p>` : '';
        
        docHTML = `
            ${docHeader}
            <h1 class="doc-title">خطاب انسحاب عن العمل</h1>
            <p style="text-align:center; font-size:1rem; margin-bottom:15px;"><strong>إلى:</strong> إدارة مراقبة انتظام الموارد البشرية</p>
            <table class="doc-table">
                <thead><tr><th>الاسم</th><th>الرقم الوظيفي</th><th>القسم</th></tr></thead>
                <tbody><tr><td>${emp.name}</td><td>${emp.id}</td><td>قسم المختبر</td></tr></tbody>
            </table>
            <div class="doc-body">
                <p><strong>الموضوع:</strong> انسحاب من العمل بتاريخ <strong>${formattedDateTime}</strong></p>
                <p>السلام عليكم ورحمة الله وبركاته وبعد ..</p>
                <p>نفيدكم بأن الموظف الموضح بياناته أعلاه قد انسحب من العمل خلال فترة عمله المجدولة بتاريخ <strong>${formattedDateTime}</strong>، دون إذن مسبق أو عذر مقبول، مما ترتب عليه نقص مفاجئ في القوى العاملة خلال فترة العمل.</p>
                <p>وقد استدعى ذلك إعادة توزيع الموظفين الموجودين وتغطية مهام الموظف المذكور، الأمر الذي أثر على التوزيع التشغيلي للمختبر وأوجد إرباكاً في خطة العمل المعتمدة، وحمّل بقية الفريق مهام إضافية لتغطية النقص لضمان استمرارية العمل وعدم تأثر الخدمة المقدمة للمرضى والمراجعين.</p>
                ${notesSection}
                <p>عليه نأمل من إدارتكم اتخاذ الإجراءات النظامية اللازمة حيال هذا الانسحاب وفقاً للوائح والأنظمة المعمول بها.</p>
            </div>
            <div class="doc-copies">
                <p><strong>نسخه للموظف</strong></p>
                <p><strong>نسخه لادارة مراقبة انتظام الموارد البشرية</strong></p>
                <p><strong>نسخه بملف الموظف</strong></p>
                <p><strong>نسخه بملف المختبر</strong></p>
            </div>
            <div class="doc-signatures">
                <div class="signature"><p>رئيس قسم المختبر</p><div class="line">سعد علي سعد القرني</div></div>
            </div>
        `;
    } else if (formType === 'sick_leave') {
        const datetime = document.getElementById('sickLeaveDateTime').value;
        const notes = document.getElementById('sickLeaveNotes').value;
        
        if (!datetime) {
            alert('الرجاء إدخال تاريخ ووقت الغياب.');
            return;
        }
        
        const formattedDateTime = formatDateTime(datetime);
        const notesSection = notes ? `<p><strong>ملاحظات:</strong> ${notes}</p>` : '';
        
        docHTML = `
            ${docHeader}
            <h1 class="doc-title">خطاب غياب مع إجازة مرضية (تحتاج للتحقق)</h1>
            <p style="text-align:center; font-size:1rem; margin-bottom:15px;"><strong>إلى:</strong> إدارة مراقبة انتظام الموارد البشرية</p>
            <table class="doc-table">
                <thead><tr><th>الاسم</th><th>الرقم الوظيفي</th><th>القسم</th></tr></thead>
                <tbody><tr><td>${emp.name}</td><td>${emp.id}</td><td>قسم المختبر</td></tr></tbody>
            </table>
            <div class="doc-body">
                <p><strong>الموضوع:</strong> غياب مع إجازة مرضية تحتاج للتحقق بتاريخ <strong>${formattedDateTime}</strong></p>
                <p>السلام عليكم ورحمة الله وبركاته وبعد ..</p>
                <p>نفيدكم بأن الموظف الموضح بياناته أعلاه قد تغيب عن العمل خلال فترة عمله المجدولة بتاريخ <strong>${formattedDateTime}</strong>، وقد أفاد بوجود إجازة مرضية، إلا أن الإجازة المرضية المقدمة تحتاج إلى التحقق من صحتها من قبل الجهات المختصة.</p>
                <p>ونظراً لأن غياب الموظف حدث خلال فترة عمله المجدولة، وما ترتب عليه من نقص مفاجئ في القوى العاملة وإعادة توزيع الموظفين الموجودين لضمان استمرارية العمل، فقد أثر ذلك على خطة التوزيع التشغيلي المعتمدة للمختبر، وحمّل بقية الفريق مهام إضافية لتغطية النقص وعدم تأثر الخدمة المقدمة للمرضى والمراجعين.</p>
                ${notesSection}
                <p>عليه نأمل من إدارتكم التحقق من الإجازة المرضية واتخاذ الإجراءات النظامية اللازمة وفقاً للوائح والأنظمة المعمول بها.</p>
            </div>
            <div class="doc-copies">
                <p><strong>نسخه للموظف</strong></p>
                <p><strong>نسخه لادارة مراقبة انتظام الموارد البشرية</strong></p>
                <p><strong>نسخه بملف الموظف</strong></p>
                <p><strong>نسخه بملف المختبر</strong></p>
            </div>
            <div class="doc-signatures">
                <div class="signature"><p>رئيس قسم المختبر</p><div class="line">سعد علي سعد القرني</div></div>
            </div>
        `;
    }
    
    documentArea.innerHTML = docHTML;
    closeGeneratorModal();
    documentArea.style.display = 'block';
    
    setTimeout(() => {
        window.print();
        setTimeout(() => {
            documentArea.style.display = 'none';
        }, 1000);
    }, 500);
}

window.onclick = function(event) {
    if (event.target == modal) closeModal();
    if (event.target == printModal) closePrintModal();
    if (event.target == generatorModal) closeGeneratorModal();
}

renderEmployees(employees);
updateSelectionUI();
