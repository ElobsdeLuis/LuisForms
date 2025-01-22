let currentUser = null;
const users = JSON.parse(localStorage.getItem('users') || '{}');
const forms = JSON.parse(localStorage.getItem('forms') || '{}');
const responses = JSON.parse(localStorage.getItem('responses') || '{}');

// Inicialización
document.addEventListener('DOMContentLoaded', () => {
    checkFormUrl();
});

function showToast(message, duration = 3000) {
    const toast = document.createElement('div');
    toast.className = 'toast';
    toast.textContent = message;
    document.body.appendChild(toast);
    
    setTimeout(() => toast.classList.add('show'), 100);
    setTimeout(() => {
        toast.classList.remove('show');
        setTimeout(() => toast.remove(), 300);
    }, duration);
}

function checkFormUrl() {
    const urlParams = new URLSearchParams(window.location.search);
    const formId = urlParams.get('form');

    if (formId && forms[formId]) {
        showFormViewer(formId);
    }
}

function register() {
    const email = document.getElementById('email').value;
    const password = document.getElementById('password').value;
    
    if (!email || !password) {
        showToast('Por favor, completa todos los campos');
        return;
    }
    
    if (users[email]) {
        showToast('Este usuario ya existe');
        return;
    }

    users[email] = { password, forms: [] };
    localStorage.setItem('users', JSON.stringify(users));
    login();
}

function login() {
    const email = document.getElementById('email').value;
    const password = document.getElementById('password').value;

    if (users[email]?.password === password) {
        currentUser = email;
        document.getElementById('auth').style.display = 'none';
        document.getElementById('dashboard').style.display = 'block';
        document.getElementById('userInfo').style.display = 'flex';
        document.getElementById('userEmail').textContent = email;
        loadForms();
        showToast('Bienvenido ' + email);
    } else {
        showToast('Credenciales incorrectas');
    }
}

function logout() {
    currentUser = null;
    document.getElementById('auth').style.display = 'block';
    document.getElementById('dashboard').style.display = 'none';
    document.getElementById('userInfo').style.display = 'none';
    document.getElementById('email').value = '';
    document.getElementById('password').value = '';
    showToast('Sesión cerrada');
}

function loadForms() {
    const formsList = document.getElementById('formsList');
    formsList.innerHTML = '';
    
    users[currentUser].forms.forEach(formId => {
        const form = forms[formId];
        const div = document.createElement('div');
        div.className = 'bg-white rounded-lg shadow-md p-6';
        const formUrl = `${window.location.origin}${window.location.pathname}?form=${formId}`;
        
        div.innerHTML = `
            <h3 class="text-xl font-semibold mb-4">${form.title}</h3>
            <div class="form-link">
                <p class="text-sm text-gray-600 mb-1">Enlace para compartir:</p>
                <p class="text-sm">${formUrl}</p>
            </div>
            <div class="flex justify-between mt-4">
                <button onclick="viewResults('${formId}')" 
                    class="bg-indigo-600 text-white px-4 py-2 rounded hover:bg-indigo-700 transition-colors">
                    Ver Resultados
                </button>
                <button onclick="deleteForm('${formId}')" 
                    class="bg-red-600 text-white px-4 py-2 rounded hover:bg-red-700 transition-colors">
                    Eliminar
                </button>
            </div>
        `;
        formsList.appendChild(div);
    });
}

function showFormBuilder() {
    document.getElementById('dashboard').style.display = 'none';
    document.getElementById('formBuilder').style.display = 'block';
    document.getElementById('fields').innerHTML = '';
    document.getElementById('formTitle').value = '';
}

function addField() {
    const fieldsDiv = document.getElementById('fields');
    const fieldDiv = document.createElement('div');
    fieldDiv.className = 'field-container';
    fieldDiv.innerHTML = `
        <div class="flex items-center justify-between mb-4">
            <input type="text" placeholder="Pregunta" class="question w-2/3 px-4 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500">
            <select class="type w-1/4 px-4 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500">
                <option value="text">Texto</option>
                <option value="number">Número</option>
                <option value="select">Opción Múltiple</option>
            </select>
        </div>
        <div class="options hidden">
            <input type="text" placeholder="Opciones (separadas por coma)" 
                class="w-full px-4 py-2 border rounded-md mb-4 focus:outline-none focus:ring-2 focus:ring-indigo-500">
        </div>
        <button onclick="this.parentElement.remove()" 
            class="bg-red-600 text-white px-4 py-2 rounded hover:bg-red-700 transition-colors">
            Eliminar Campo
        </button>
    `;

    fieldDiv.querySelector('.type').addEventListener('change', function(e) {
        const optionsDiv = fieldDiv.querySelector('.options');
        optionsDiv.style.display = e.target.value === 'select' ? 'block' : 'none';
    });

    fieldsDiv.appendChild(fieldDiv);
}

function saveForm() {
    const title = document.getElementById('formTitle').value;
    if (!title) {
        showToast('Por favor, añade un título al formulario');
        return;
    }

    const fields = Array.from(document.getElementsByClassName('field-container')).map(field => ({
        question: field.querySelector('.question').value,
        type: field.querySelector('.type').value,
        options: field.querySelector('.type').value === 'select' ? 
            field.querySelector('.options input').value.split(',').map(o => o.trim()) : []
    }));

    if (fields.length === 0) {
        showToast('Por favor, añade al menos un campo al formulario');
        return;
    }

    const formId = uuid.v4();
    forms[formId] = { title, fields, creator: currentUser };
    users[currentUser].forms.push(formId);

    localStorage.setItem('forms', JSON.stringify(forms));
    localStorage.setItem('users', JSON.stringify(users));

    showToast('Formulario guardado con éxito');
    document.getElementById('formBuilder').style.display = 'none';
    document.getElementById('dashboard').style.display = 'block';
    loadForms();
}

function deleteForm(formId) {
    if (!confirm('¿Estás seguro de que deseas eliminar este formulario?')) {
        return;
    }

    users[currentUser].forms = users[currentUser].forms.filter(id => id !== formId);
    delete forms[formId];
    delete responses[formId];

    localStorage.setItem('forms', JSON.stringify(forms));
    localStorage.setItem('users', JSON.stringify(users));
    localStorage.setItem('responses', JSON.stringify(responses));

    loadForms();
    showToast('Formulario eliminado con éxito');
}

function showFormViewer(formId) {
    const form = forms[formId];
    document.getElementById('auth').style.display = 'none';
    document.getElementById('dashboard').style.display = 'none';
    document.getElementById('formViewer').style.display = 'block';
    
    document.getElementById('viewerTitle').textContent = form.title;
    const viewerFields = document.getElementById('viewerFields');
    viewerFields.innerHTML = '';
    
    form.fields.forEach(field => {
        const fieldDiv = document.createElement('div');
        fieldDiv.className = 'field-container';
        fieldDiv.innerHTML = `<label class="block mb-2 font-medium">${field.question}</label>`;

        if (field.type === 'select') {
            const select = document.createElement('select');
            select.className = 'w-full px-4 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500';
            field.options.forEach(option => {
                const optionEl = document.createElement('option');
                optionEl.value = option;
                optionEl.textContent = option;
                select.appendChild(optionEl);
            });
            fieldDiv.appendChild(select);
        } else {
            const input = document.createElement('input');
            input.type = field.type;
            input.className = 'w-full px-4 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500';
            fieldDiv.appendChild(input);
        }

        viewerFields.appendChild(fieldDiv);
    });
}

function submitResponse() {
    const urlParams = new URLSearchParams(window.location.search);
    const formId = urlParams.get('form');
    const formResponse = {};
    const fields = document.getElementById('viewerFields').getElementsByClassName('field-container');
    
    Array.from(fields).forEach(field => {
        const question = field.querySelector('label').textContent;
        const input = field.querySelector('input, select');
        formResponse[question] = input.value;
    });

    if (!responses[formId]) {
        responses[formId] = [];
    }
    responses[formId].push(formResponse);
    localStorage.setItem('responses', JSON.stringify(responses));

    document.getElementById('formViewer').innerHTML = `
        <div class="text-center py-8">
            <h2 class="text-2xl font-bold text-green-600 mb-4">¡Gracias por tu respuesta!</h2>
            <p class="text-gray-600">Tu respuesta ha sido registrada correctamente.</p>
        </div>
    `;
    showToast('Respuesta enviada con éxito');
}

function viewResults(formId) {
    const formResponses = responses[formId] || [];
    const resultsDiv = document.getElementById('resultsData');
    resultsDiv.innerHTML = '';

    if (formResponses.length === 0) {
        resultsDiv.innerHTML = `
            <div class="text-center py-8">
                <p class="text-gray-600">Aún no hay respuestas para este formulario</p>
            </div>
        `;
    } else {
        formResponses.forEach((response, index) => {
            const responseDiv = document.createElement('div');
            responseDiv.className = 'response-card';
            responseDiv.innerHTML = `<h4 class="text-lg font-semibold mb-4">Respuesta ${index + 1}</h4>`;
            
            Object.entries(response).forEach(([question, answer]) => {
                responseDiv.innerHTML += `
                    <div class="mb-2">
                        <span class="font-medium">${question}:</span>
                        <span class="ml-2">${answer}</span>
                    </div>
                `;
            });

            resultsDiv.appendChild(responseDiv);
        });
    }

    document.getElementById('dashboard').style.display = 'none';
    document.getElementById('results').style.display = 'block';
}

function backToDashboard() {
    document.getElementById('results').style.display = 'none';
    document.getElementById('dashboard').style.display = 'block';
}

window.addEventListener('load', () => {
    const urlParams = new URLSearchParams(window.location.search);
    const formId = urlParams.get('form');
    
    if (formId && forms[formId]) {
        showFormViewer(formId);
    }
});