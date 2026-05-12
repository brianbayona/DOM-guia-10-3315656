const API_URL = "http://localhost:3000";

const userIdInput = document.getElementById('userId');
const btnSearch = document.getElementById('btnSearch');
const userInfo = document.getElementById('userInfo');
const taskFormContainer = document.getElementById('taskFormContainer');
const taskForm = document.getElementById('taskForm');
const taskTableBody = document.getElementById('taskTableBody');
const taskCount = document.getElementById('taskCount');
const emptyState = document.getElementById('emptyState');

let currentUser = null;
let tasks = [];

function getCurrentTimestamp() {
    const now = new Date();
    return now.toLocaleString('es-CO', {
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit'
    });
}

function isValidInput(value) {
    return value && value.trim().length > 0;
}

function showUserInfo(user) {
    userInfo.innerHTML = `
        <div style="background: #d4edda; border: 1px solid #c3e6cb; padding: 15px; border-radius: 5px; margin-top: 10px;">
            <strong>✅ Usuario encontrado:</strong><br>
            <strong>Nombre:</strong> ${user.name}<br>
            <strong>Rol:</strong> ${user.rol}<br>
            <strong>Ficha:</strong> ${user.ficha}
        </div>
    `;
}

function showUserNotFound() {
    userInfo.innerHTML = `
        <div style="background: #f8d7da; border: 1px solid #f5c6cb; padding: 15px; border-radius: 5px; margin-top: 10px; color: #721c24;">
            ❌ El usuario no está registrado en el sistema.
        </div>
    `;
    taskFormContainer.style.display = 'none';
}

function showValidationError(message) {
    userInfo.innerHTML = `
        <div style="background: #f8d7da; border: 1px solid #f5c6cb; padding: 15px; border-radius: 5px; margin-top: 10px; color: #721c24;">
            ⚠️ ${message}
        </div>
    `;
}

function clearUserInfo() {
    userInfo.innerHTML = '';
    taskFormContainer.style.display = 'none';
    currentUser = null;
    tasks = [];
    taskTableBody.innerHTML = '';
    updateTaskCount();
    showEmptyState();
}

function enableTaskForm() {
    taskFormContainer.style.display = 'block';
}

function hideEmptyState() {
    emptyState.style.display = 'none';
}

function showEmptyState() {
    if (tasks.length === 0) {
        emptyState.style.display = 'block';
    }
}

function updateTaskCount() {
    taskCount.textContent = tasks.length === 1 ? "1 tarea" : `${tasks.length} tareas`;
}

function createTaskElement(task) {
    const row = document.createElement('tr');
    row.style.borderBottom = '1px solid #dee2e6';
    row.style.animation = 'fadeIn 0.3s ease';
    
    const statusColors = {
        'Pendiente': '#ffc107',
        'En progreso': '#17a2b8',
        'Completada': '#28a745'
    };
    
    row.innerHTML = `
        <td style="padding: 12px;">${task.title}</td>
        <td style="padding: 12px;">${task.description}</td>
        <td style="padding: 12px;">
            <span style="background: ${statusColors[task.status]}; color: white; padding: 4px 8px; border-radius: 3px; font-size: 12px;">
                ${task.status}
            </span>
        </td>
    `;
    
    taskTableBody.appendChild(row);
}

async function searchUser() {
    const userId = userIdInput.value;
    
    if (!isValidInput(userId)) {
        showValidationError("Por favor ingresa un documento/ID válido");
        return;
    }
    
    btnSearch.disabled = true;
    btnSearch.textContent = 'Buscando...';
    userInfo.innerHTML = '';
    taskFormContainer.style.display = 'none';
    
    try {
        const response = await fetch(`${API_URL}/users`);
        const users = await response.json();
        
        console.log("Users desde API:", users);
        console.log("Buscando ID:", userId);
        
        const user = users.find(u => u.id.trim() === userId.trim());
        
        console.log("Usuario encontrado:", user);
        
        if (user) {
            currentUser = user;
            showUserInfo(user);
            enableTaskForm();
            
            const tasksResponse = await fetch(`${API_URL}/tasks?userId=${userId}`);
            const savedTasks = await tasksResponse.json();
            
            tasks = savedTasks;
            taskTableBody.innerHTML = '';
            
            if (tasks.length > 0) {
                hideEmptyState();
                tasks.forEach(task => createTaskElement(task));
            } else {
                showEmptyState();
            }
            
            updateTaskCount();
        } else {
            showUserNotFound();
        }
    } catch (error) {
        console.error("Error:", error);
        showValidationError("Error de conexión: " + error.message + ". Verifica que el servidor esté corriendo.");
    } finally {
        btnSearch.disabled = false;
        btnSearch.textContent = 'Buscar';
    }
}

async function registerTask(event) {
    event.preventDefault();
    
    const titleInput = document.getElementById('taskTitle');
    const descriptionInput = document.getElementById('taskDescription');
    const statusInput = document.getElementById('taskStatus');
    
    const title = titleInput.value.trim();
    const description = descriptionInput.value.trim();
    const status = statusInput.value;
    
    if (!title || !description) {
        alert("Por favor completa todos los campos");
        return;
    }
    
    const task = {
        userId: currentUser.id,
        userName: currentUser.name,
        title: title,
        description: description,
        status: status,
        createdAt: getCurrentTimestamp()
    };
    
    try {
        const response = await fetch(`${API_URL}/tasks`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(task)
        });
        
        if (response.ok) {
            const savedTask = await response.json();
            tasks.push(savedTask);
            createTaskElement(savedTask);
            hideEmptyState();
            updateTaskCount();
            taskForm.reset();
            console.log('Tarea guardada en backend:', savedTask);
        } else {
            alert('Error al guardar la tarea');
        }
    } catch (error) {
        console.error('Error:', error);
        alert('Error de conexión');
    }
}

btnSearch.addEventListener('click', searchUser);

userIdInput.addEventListener('keypress', function(e) {
    if (e.key === 'Enter') {
        searchUser();
    }
});

taskForm.addEventListener('submit', registerTask);

document.addEventListener('DOMContentLoaded', function() {
    console.log('✅ DOM cargado - Sistema de gestión de tareas activo');
    showEmptyState();
});