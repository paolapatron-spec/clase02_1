const API_BASE = 'http://127.0.0.1:8000';

const state = {
    userEmail: null,
    services: [],
};

function $(selector, parent = document) {
    return parent.querySelector(selector);
}

function $all(selector, parent = document) {
    return Array.from(parent.querySelectorAll(selector));
}

function createAlert(message, type = 'success') {
    const alert = document.createElement('div');
    alert.className = `alert alert-${type}`;
    alert.textContent = message;
    return alert;
}

function showAlert(message, type = 'success', container = document.body) {
    const alert = createAlert(message, type);
    alert.style.margin = '0 0 1rem 0';
    container.insertBefore(alert, container.firstChild);

    setTimeout(() => {
        alert.remove();
    }, 3500);
}

function setUserState(email) {
    state.userEmail = email;
    const badge = $('.user-badge span');
    const logoutButton = $('.sidebar-footer button');

    if (email) {
        badge.textContent = email;
        logoutButton.style.display = 'block';
        unlockProtectedTabs();
    } else {
        badge.textContent = 'Usuario';
        logoutButton.style.display = 'none';
        lockProtectedTabs();
    }
}

function lockProtectedTabs() {
    const protectedTabs = ['servicios', 'mascotas', 'reporte'];

    $all('.sidebar-nav a').forEach((link) => {
        const tab = link.dataset.tab;
        if (protectedTabs.includes(tab)) {
            link.closest('li')?.classList.add('locked');
            link.dataset.locked = 'true';
        } else {
            link.closest('li')?.classList.remove('locked');
            delete link.dataset.locked;
        }
    });
}

function unlockProtectedTabs() {
    $all('.sidebar-nav a').forEach((link) => {
        link.closest('li')?.classList.remove('locked');
        delete link.dataset.locked;
    });
}

function setActiveNav(tabName) {
    $all('.sidebar-nav a').forEach((link) => {
        if (link.dataset.tab === tabName) {
            link.classList.add('active');
        } else {
            link.classList.remove('active');
        }
    });
}

function switchTab(tabName) {
    const targetSection = document.getElementById(tabName);
    const protectedTabs = ['servicios', 'mascotas', 'reporte'];

    if (!targetSection) {
        return;
    }

    if (protectedTabs.includes(tabName) && !state.userEmail) {
        showAlert('Debes iniciar sesión para acceder a esta sección.', 'error', $('#acceso'));
        return;
    }

    $all('.section').forEach((section) => {
        section.classList.remove('active');
    });
    targetSection.classList.add('active');
    setActiveNav(tabName);

    if (tabName === 'reporte' && state.userEmail) {
        $('#report-email').value = state.userEmail;
    }

    if (tabName === 'servicios') {
        loadServices();
    }
}

async function fetchJson(url, options = {}) {
    const response = await fetch(url, options);
    if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        let message = errorData.mensaje || errorData.detail || errorData.message || 'Ocurrió un error en el servidor.';

        if (typeof message === 'object' && message !== null) {
            if (Array.isArray(message)) {
                message = message.map((item) => (typeof item === 'string' ? item : JSON.stringify(item))).join(' | ');
            } else {
                const values = Object.values(message).filter(Boolean);
                message = values.length ? values[0] : JSON.stringify(message);
            }
        }

        throw new Error(message);
    }
    return response.json();
}

async function loadServices() {
    try {
        const data = await fetchJson(`${API_BASE}/servicios`);
        state.services = data.servicios || [];
        renderServicesList();
        renderServiceOptions();
    } catch (error) {
        showAlert(error.message, 'error', $('.services-list'));
    }
}

function renderServicesList() {
    const servicesUl = $('#services-ul');
    servicesUl.innerHTML = '';

    if (!state.services.length) {
        const emptyItem = document.createElement('li');
        emptyItem.textContent = 'No hay servicios registrados.';
        servicesUl.appendChild(emptyItem);
        return;
    }

    state.services.forEach((service) => {
        const item = document.createElement('li');
        item.textContent = `${service.nombre} — $${Number(service.precio).toFixed(2)}`;
        servicesUl.appendChild(item);
    });
}

function renderServiceOptions() {
    const select = $('#pet-service');
    const existingSelection = select.value;
    select.innerHTML = '<option value="">Seleccionar servicio</option>';

    state.services.forEach((service) => {
        const option = document.createElement('option');
        option.value = service.nombre;
        option.textContent = service.nombre;
        select.appendChild(option);
    });

    if (state.services.some((service) => service.nombre === existingSelection)) {
        select.value = existingSelection;
    }
}

function renderPetCards(pets = []) {
    let container = $('#pet-results');
    if (!container) {
        container = document.createElement('div');
        container.id = 'pet-results';
        container.style.display = 'grid';
        container.style.gap = '1rem';
        container.style.marginTop = '1.5rem';
        $('.pet-search').after(container);
    }

    container.innerHTML = '';

    if (!pets.length) {
        const emptyState = document.createElement('div');
        emptyState.className = 'card';
        emptyState.textContent = 'No se encontraron mascotas para este correo.';
        container.appendChild(emptyState);
        return;
    }

    pets.forEach((pet) => {
        const card = document.createElement('article');
        card.className = 'card';
        card.style.padding = '1.5rem';
        card.innerHTML = `
            <h3>${pet.nombre || 'Nombre no disponible'}</h3>
            <p><strong>Correo:</strong> ${pet.correo || '-'}</p>
            <p><strong>Servicio:</strong> ${pet.tipo_servicio || '-'}</p>
            <p><strong>Fecha:</strong> ${pet.fecha || '-'}</p>
        `;
        container.appendChild(card);
    });
}

function renderReport(report) {
    const content = $('#report-results-content');
    content.innerHTML = '';

    const statsGrid = document.createElement('div');
    statsGrid.style.display = 'grid';
    statsGrid.style.gridTemplateColumns = 'repeat(auto-fit, minmax(180px, 1fr))';
    statsGrid.style.gap = '1rem';
    statsGrid.style.marginBottom = '1.5rem';

    const statBoxes = [
        { label: 'Cantidad de servicios', value: report.cantidad_servicios },
        { label: 'Total gastado', value: `$${Number(report.total_gastado).toFixed(2)}` },
        { label: 'Correo', value: report.correo },
    ];

    statBoxes.forEach((stat) => {
        const box = document.createElement('div');
        box.className = 'card';
        box.style.padding = '1.25rem';
        box.innerHTML = `<p style="margin:0 0 0.5rem 0;color:var(--muted);">${stat.label}</p><strong>${stat.value}</strong>`;
        statsGrid.appendChild(box);
    });

    content.appendChild(statsGrid);

    const tagsContainer = document.createElement('div');
    tagsContainer.style.display = 'flex';
    tagsContainer.style.flexWrap = 'wrap';
    tagsContainer.style.gap = '0.65rem';

    if (Array.isArray(report.servicios) && report.servicios.length) {
        report.servicios.forEach((service) => {
            const tag = document.createElement('span');
            tag.textContent = service;
            tag.style.display = 'inline-flex';
            tag.style.padding = '0.55rem 0.85rem';
            tag.style.borderRadius = '999px';
            tag.style.background = 'rgba(14, 165, 160, 0.12)';
            tag.style.color = 'var(--accent-dark)';
            tag.style.fontSize = '0.9rem';
            tagsContainer.appendChild(tag);
        });
    } else {
        const fallback = document.createElement('p');
        fallback.textContent = 'No se encontraron servicios en este reporte.';
        tagsContainer.appendChild(fallback);
    }

    content.appendChild(tagsContainer);
}

async function registerUser(event) {
    event.preventDefault();

    const correo = $('#register-email').value.trim();
    const contrasena = $('#register-password').value.trim();
    const form = $('.register-form');

    if (!correo || !contrasena) {
        showAlert('Completa todos los campos del registro.', 'error', form);
        return;
    }

    try {
        const payload = { correo, "contraseña": contrasena };
        await fetchJson(`${API_BASE}/register`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload),
        });

        showAlert('Registro exitoso. Ya puedes iniciar sesión.', 'success', form);
        form.reset();
    } catch (error) {
        showAlert(error.message, 'error', form);
    }
}

async function loginUser(event) {
    event.preventDefault();

    const correo = $('#login-email').value.trim();
    const contrasena = $('#login-password').value.trim();
    const form = $('.login-form');

    if (!correo || !contrasena) {
        showAlert('Completa correo y contraseña.', 'error', form);
        return;
    }

    try {
        await fetchJson(`${API_BASE}/login`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ correo, "contraseña": contrasena }),
        });

        setUserState(correo);
        showAlert('Ingreso exitoso. Bienvenido.', 'success', form);
        form.reset();
        switchTab('servicios');
    } catch (error) {
        showAlert(error.message, 'error', form);
    }
}

async function welcomeUser(event) {
    event.preventDefault();

    const nombre = $('#user-name').value.trim();
    const form = $('.greeting-form');

    if (!nombre) {
        showAlert('Por favor ingresa tu nombre.', 'error', form);
        return;
    }

    try {
        const data = await fetchJson(`${API_BASE}/bienvenido/${encodeURIComponent(nombre)}`);
        showAlert(data.mensaje || '¡Bienvenido a PetCare!', 'success', form);
        form.reset();
    } catch (error) {
        showAlert(error.message, 'error', form);
    }
}

async function addService(event) {
    event.preventDefault();

    const nombre = $('#service-name').value.trim();
    const precio = $('#service-price').value.trim();
    const form = $('.add-service-form');

    if (!nombre || !precio) {
        showAlert('Ingresa nombre y precio del servicio.', 'error', form);
        return;
    }

    try {
        await fetchJson(`${API_BASE}/agregar-servicio`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ nombre, precio: Number(precio) }),
        });

        showAlert('Servicio agregado correctamente.', 'success', form);
        form.reset();
        await loadServices();
    } catch (error) {
        showAlert(error.message, 'error', form);
    }
}

async function registerPet(event) {
    event.preventDefault();

    const correo = $('#pet-email').value.trim();
    const nombre = $('#pet-name').value.trim();
    const tipo_servicio = $('#pet-service').value;
    const fecha = $('#pet-date').value;
    const form = $('.register-pet-form');

    if (!correo || !nombre || !tipo_servicio || !fecha) {
        showAlert('Completa todos los campos de la mascota.', 'error', form);
        return;
    }

    try {
        await fetchJson(`${API_BASE}/registrar-mascota`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ correo, nombre, tipo_servicio, fecha }),
        });

        showAlert('Mascota registrada correctamente.', 'success', form);
        form.reset();
    } catch (error) {
        showAlert(error.message, 'error', form);
    }
}

async function searchPets() {
    const query = $('#search-pet').value.trim() || state.userEmail;
    const container = $('.pet-search');

    if (!query) {
        showAlert('Ingresa un correo para buscar mascotas.', 'error', container);
        return;
    }

    try {
        const data = await fetchJson(`${API_BASE}/mascotas/${encodeURIComponent(query)}`);
        const pets = data.mascotas || [];
        renderPetCards(pets);
    } catch (error) {
        showAlert(error.message, 'error', container);
    }
}

async function loadReport() {
    const correo = $('#report-email').value.trim();
    const container = $('.report-search');

    if (!correo) {
        showAlert('Ingresa un correo para ver el reporte.', 'error', container);
        return;
    }

    try {
        const data = await fetchJson(`${API_BASE}/reporte/${encodeURIComponent(correo)}`);
        renderReport(data);
    } catch (error) {
        showAlert(error.message, 'error', container);
    }
}

function logout() {
    setUserState(null);
    switchTab('acceso');
    showAlert('Has cerrado sesión.', 'success', $('.sidebar-footer'));
}

function attachListeners() {
    $all('.sidebar-nav a').forEach((link) => {
        link.addEventListener('click', (event) => {
            event.preventDefault();
            const tabName = link.dataset.tab;
            if (link.dataset.locked === 'true') {
                showAlert('Este tab está bloqueado hasta iniciar sesión.', 'error', $('.sidebar-nav'));
                return;
            }
            switchTab(tabName);
        });
    });

    $('.register-form')?.addEventListener('submit', registerUser);
    $('.login-form')?.addEventListener('submit', loginUser);
    $('.greeting-form')?.addEventListener('submit', welcomeUser);
    $('.add-service-form')?.addEventListener('submit', addService);
    $('.register-pet-form')?.addEventListener('submit', registerPet);
    $('#search-pet-btn')?.addEventListener('click', searchPets);
    $('#report-search-btn')?.addEventListener('click', loadReport);
    $('.sidebar-footer button')?.addEventListener('click', logout);
}

function initializeUI() {
    setUserState(null);
    loadServices();
    switchTab('inicio');
}

document.addEventListener('DOMContentLoaded', () => {
    attachListeners();
    initializeUI();
});
