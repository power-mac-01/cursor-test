// Initialize data structures with development-specific defaults
let projects = [];
let tasks = [];

// Development task types and labels
const taskTypes = {
    feature: 'Feature',
    bug: 'Bug Fix',
    refactor: 'Refactoring',
    test: 'Testing',
    docs: 'Documentation',
    setup: 'Setup/DevOps'
};

const labels = {
    frontend: 'Frontend',
    backend: 'Backend',
    database: 'Database',
    api: 'API',
    ui: 'UI/UX',
    security: 'Security'
};

// Load data from localStorage
// try {
//     projects = JSON.parse(localStorage.getItem('projects')) || [];
//     tasks = JSON.parse(localStorage.getItem('tasks')) || [];
// } catch (error) {
//     console.error('Error loading data:', error);
//     projects = [];
//     tasks = [];
// }

// Save data to localStorage
function saveData() {
    try {
        const dataToSave = {
            projects: projects.map(p => ({ ...p })), // Create clean copies
            tasks: tasks.map(t => ({ ...t }))
        };
        
        localStorage.setItem('projects', JSON.stringify(dataToSave.projects));
        localStorage.setItem('tasks', JSON.stringify(dataToSave.tasks));
        
        // Backup
        sessionStorage.setItem('projects_backup', JSON.stringify(dataToSave.projects));
        sessionStorage.setItem('tasks_backup', JSON.stringify(dataToSave.tasks));
        
        return true;
    } catch (error) {
        console.error('Error saving data:', error);
        showNotification('Failed to save changes', 'error');
        return false;
    }
}

// Add data compression utility
function compressData(data) {
    try {
        // Remove unnecessary whitespace from JSON
        const minifiedJson = JSON.stringify(data, null, 0);
        
        // Use basic compression by removing common patterns
        return minifiedJson
            .replace(/"id":/g, '"i":')
            .replace(/"text":/g, '"t":')
            .replace(/"status":/g, '"s":')
            .replace(/"createdAt":/g, '"c":')
            .replace(/"description":/g, '"d":')
            .replace(/"projectId":/g, '"p":');
    } catch (error) {
        console.error('Error compressing data:', error);
        return JSON.stringify(data);
    }
}

// Add data recovery function
function recoverData() {
    try {
        // Try to load from localStorage first
        let projectsData = localStorage.getItem('projects');
        let tasksData = localStorage.getItem('tasks');
        
        // If not found, try compressed data
        if (!projectsData || !tasksData) {
            const compressedData = localStorage.getItem('compressed_data');
            if (compressedData) {
                const decompressedData = JSON.parse(compressedData
                    .replace(/"i":/g, '"id":')
                    .replace(/"t":/g, '"text":')
                    .replace(/"s":/g, '"status":')
                    .replace(/"c":/g, '"createdAt":')
                    .replace(/"d":/g, '"description":')
                    .replace(/"p":/g, '"projectId":')
                );
                projectsData = JSON.stringify(decompressedData.projects);
                tasksData = JSON.stringify(decompressedData.tasks);
            }
        }
        
        // If still not found, try backup from sessionStorage
        if (!projectsData || !tasksData) {
            projectsData = sessionStorage.getItem('projects_backup');
            tasksData = sessionStorage.getItem('tasks_backup');
        }
        
        // Parse and validate the data
        projects = projectsData ? JSON.parse(projectsData) : [];
        tasks = tasksData ? JSON.parse(tasksData) : [];
        
        // Validate data structure
        if (!Array.isArray(projects)) projects = [];
        if (!Array.isArray(tasks)) tasks = [];
        
        // Ensure all tasks have valid properties
        tasks = tasks.filter(task => {
            return task && task.id && task.text && task.status;
        });
        
        return true;
    } catch (error) {
        console.error('Error recovering data:', error);
        projects = [];
        tasks = [];
        showNotification('Error loading saved data. Starting fresh.', 'warning');
        return false;
    }
}

// Modal functions
function showModal(modalId) {
    document.getElementById(modalId).style.display = 'block';
}

function closeModal(modalId) {
    document.getElementById(modalId).style.display = 'none';
}

function showNewProjectModal() {
    const form = document.querySelector('.project-form');
    if (form) {
        // Reset form
        form.reset();
        form.dataset.projectId = '';
        form.onsubmit = (e) => createProject(e);
        
        // Reset modal title and button
        document.getElementById('projectModalTitle').textContent = 'New Project';
        const submitButton = form.querySelector('button[type="submit"]');
        if (submitButton) {
            submitButton.textContent = 'Create Project';
        }
        
        // Clear task list
        const taskList = document.querySelector('.project-tasks-list');
        if (taskList) {
            taskList.innerHTML = '<div class="empty-state">Create project to add tasks</div>';
        }
        
        // Clear task input
        const taskInput = form.querySelector('.task-input');
        if (taskInput) {
            taskInput.value = '';
        }
        
        // Initialize and reset task type select
        const typeSelect = form.querySelector('.task-type-select');
        if (typeSelect) {
            typeSelect.innerHTML = '<option value="">Select Type</option>';
            Object.entries(taskTypes).forEach(([value, label]) => {
                const option = document.createElement('option');
                option.value = value;
                option.textContent = label;
                typeSelect.appendChild(option);
            });
            typeSelect.value = '';
        }
        
        // Reset priority select
        const prioritySelect = form.querySelector('.task-priority-select');
        if (prioritySelect) prioritySelect.value = 'low';
    }
    showModal('projectModal');
}

// Project functions
function createProject(event) {
    event.preventDefault();
    
    try {
        const formData = {
            name: document.getElementById('projectName').value,
            description: document.getElementById('projectDescription').value,
            repository: document.getElementById('projectRepo').value,
            techStack: document.getElementById('projectTechStack').value
        };
        
        // Validate required fields
        if (!formData.name.trim()) {
            throw new Error('Project name is required');
        }
        
        // Create new project object with default values
        const project = {
            id: Date.now().toString(),
            name: formData.name.trim(),
            description: formData.description.trim(),
            repository: formData.repository.trim(),
            techStack: formData.techStack ? formData.techStack.split(',').map(tech => tech.trim()).filter(Boolean) : [],
            createdAt: new Date().toISOString(),
            version: '0.1.0',
            sprints: []
        };
        
        // Add project to projects array
        projects.push(project);
        
        // Save to localStorage
        if (saveData()) {
            // Update UI
            updateProjectSelects();
            renderProjects();
            
            // Reset form
            const form = event.target;
            form.reset();
            form.dataset.projectId = '';
            
            // Reset modal title and button
            document.getElementById('projectModalTitle').textContent = 'New Project';
            const submitButton = form.querySelector('button[type="submit"]');
            if (submitButton) {
                submitButton.textContent = 'Create Project';
            }
            
            closeModal('projectModal');
            
            // Show success notification
            showNotification(`Project "${project.name}" created successfully`, 'success');
        }
        
    } catch (error) {
        console.error('Project creation failed:', error);
        showNotification(error.message, 'error');
    }
}

function updateProjectSelects() {
    const projectSelects = ['projectFilter', 'taskProject'];
    
    projectSelects.forEach(selectId => {
        const select = document.getElementById(selectId);
        if (!select) return;
        
        const currentValue = select.value;
        
        // Clear options
        select.innerHTML = '';
        
        // Add default option
        const defaultOption = document.createElement('option');
        if (selectId === 'projectFilter') {
            defaultOption.value = 'all';
            defaultOption.textContent = 'All Projects';
        } else {
            defaultOption.value = '';
            defaultOption.textContent = 'Select Project';
        }
        select.appendChild(defaultOption);
        
        // Add project options
        if (projects.length === 0) {
            const noProjectsOption = document.createElement('option');
            noProjectsOption.disabled = true;
            noProjectsOption.textContent = 'No projects available';
            select.appendChild(noProjectsOption);
            
            if (selectId === 'taskProject') {
                showNotification('Please create a project first', 'warning');
            }
        } else {
            // Sort projects by name
            const sortedProjects = [...projects].sort((a, b) => a.name.localeCompare(b.name));
            
            sortedProjects.forEach(project => {
                const option = document.createElement('option');
                option.value = project.id;
                option.textContent = project.name;
                select.appendChild(option);
            });
            
            // Restore selected value if it still exists and is valid
            if (currentValue) {
                if (currentValue === 'all' || projects.some(p => p.id === currentValue)) {
                    select.value = currentValue;
                } else {
                    // If current value is invalid, reset to default
                    select.value = selectId === 'projectFilter' ? 'all' : '';
                }
            }
        }
        
        // Disable add task button if no projects
        const addTaskBtn = document.querySelector('.add-task .primary-btn');
        if (addTaskBtn) {
            const hasProjects = projects.length > 0;
            addTaskBtn.disabled = !hasProjects;
            addTaskBtn.title = hasProjects ? 'Add new task' : 'Create a project first';
        }
    });
}

// Task functions
function addTask() {
    try {
        const taskInput = document.getElementById('taskInput');
        const projectSelect = document.getElementById('taskProject');
        const prioritySelect = document.getElementById('taskPriority');
        const typeSelect = document.getElementById('addTaskType');
        
        // First check if all form elements exist
        if (!taskInput || !projectSelect || !prioritySelect || !typeSelect) {
            throw new Error('Required form elements not found');
        }
        
        // Validate project selection first
        const projectId = projectSelect.value;
        if (!projectId || projectId === 'all') {
            projectSelect.classList.add('error');
            throw new Error('Please select a project');
        }
        
        // Verify project exists
        const project = projects.find(p => p.id === projectId);
        if (!project) {
            // Try to recover by updating project selects
            updateProjectSelects();
            projectSelect.classList.add('error');
            throw new Error('Project not found. Please select a project again.');
        }
        
        // Remove error class if project is valid
        projectSelect.classList.remove('error');
        
        // Validate task text
        if (!taskInput.value.trim()) {
            taskInput.classList.add('error');
            throw new Error('Task title is required');
        }
        
        // Validate task type
        if (!typeSelect.value) {
            typeSelect.classList.add('error');
            throw new Error('Task type is required');
        }
        
        // Create new task
        const task = {
            id: Date.now().toString(),
            text: taskInput.value.trim(),
            projectId: projectId,
            type: typeSelect.value,
            priority: prioritySelect.value || 'low',
            status: 'todo',
            createdAt: new Date().toISOString(),
            dueDate: null,
            description: '',
            labels: [],
            assignedTo: '',
            estimatedHours: 0,
            dependencies: [],
            commits: [],
            testStatus: 'pending'
        };
        
        // Add task and save
        tasks.push(task);
        
        if (saveData()) {
            renderTasks();
            
            // Clear input fields but keep project selected
            taskInput.value = '';
            typeSelect.value = '';
            prioritySelect.value = 'low';
            
            // Remove any error classes
            taskInput.classList.remove('error');
            typeSelect.classList.remove('error');
            
            // Show success message with project name
            showNotification(`Task added to project "${project.name}"`, 'success');
        }
        
    } catch (error) {
        console.error('Error adding task:', error);
        showNotification(error.message, 'error');
    }
}

function showTaskDetails(taskId) {
    const task = tasks.find(t => t.id === taskId);
    if (!task) {
        showNotification('Task not found', 'error');
        return;
    }
    
    try {
        // Clear any previous errors
        const form = document.querySelector('#taskModal form');
        clearFormErrors(form);
        
        // Ensure all arrays exist with default empty arrays
        task.labels = task.labels || [];
        task.dependencies = task.dependencies || [];
        task.commits = task.commits || [];
        
        // Set form values with safe defaults
        const fields = {
            'taskTitle': task.text || '',
            'taskDescription': task.description || '',
            'taskStatus': task.status || 'todo',
            'editTaskType': task.type || '',
            'taskDueDate': task.dueDate || '',
            'taskEstimate': task.estimatedHours || '',
            'taskAssignee': task.assignedTo || '',
            'taskLabels': task.labels.join(', '),
            'taskDependencies': task.dependencies.join(', '),
            'taskCommits': task.commits.join('\n'),
            'taskTestStatus': task.testStatus || 'pending'
        };

        // Set each field value safely
        Object.entries(fields).forEach(([id, value]) => {
            const element = document.getElementById(id);
            if (element) {
                element.value = value;
                element.classList.remove('error');
            }
        });
        
        // Store task ID for saving
        document.getElementById('taskModal').dataset.taskId = taskId;
        
        // Show modal
        showModal('taskModal');
        
        // Focus first input
        document.getElementById('taskTitle').focus();
        
    } catch (error) {
        console.error('Error showing task details:', error);
        showNotification('Error loading task details', 'error');
    }
}

function saveTaskDetails(event) {
    event.preventDefault();
    
    try {
        const form = event.target;
        form.classList.add('loading');
        clearFormErrors(form);
        
        const modalElement = document.getElementById('taskModal');
        const taskId = modalElement.dataset.taskId;
        const task = tasks.find(t => t.id === taskId);
        
        if (!task) {
            throw new Error('Task not found');
        }

        // Safely handle array fields
        const labelsText = document.getElementById('taskLabels').value || '';
        const dependenciesText = document.getElementById('taskDependencies').value || '';
        const commitsText = document.getElementById('taskCommits').value || '';

        // Validate and collect updates
        const updates = {
            text: validateInput(document.getElementById('taskTitle').value, 'text', {
                required: true,
                minLength: 3,
                maxLength: 200,
                label: 'Task title',
                fieldId: 'taskTitle'
            }),
            description: document.getElementById('taskDescription').value.trim(),
            status: validateInput(document.getElementById('taskStatus').value, 'text', {
                required: true,
                label: 'Status',
                fieldId: 'taskStatus'
            }),
            type: validateInput(document.getElementById('editTaskType').value, 'text', {
                required: true,
                label: 'Task type',
                fieldId: 'editTaskType'
            }),
            dueDate: document.getElementById('taskDueDate').value || null,
            estimatedHours: validateInput(document.getElementById('taskEstimate').value || '0', 'number', {
                min: 0,
                max: 100,
                label: 'Estimated hours',
                fieldId: 'taskEstimate'
            }),
            assignedTo: document.getElementById('taskAssignee').value.trim(),
            // Safely handle arrays with empty string fallbacks
            labels: labelsText ? labelsText.split(',').map(label => label.trim()).filter(Boolean) : [],
            dependencies: dependenciesText ? dependenciesText.split(',').map(dep => dep.trim()).filter(Boolean) : [],
            commits: commitsText ? commitsText.join('\n') : '',
            testStatus: validateInput(document.getElementById('taskTestStatus').value, 'text', {
                required: true,
                label: 'Test status',
                fieldId: 'taskTestStatus'
            })
        };

        // Update task with new values
        Object.assign(task, updates);
        
        if (saveData()) {
            renderTasks();
            closeModal('taskModal');
            showNotification('Task updated successfully', 'success');
        }
        
    } catch (error) {
        console.error('Error saving task:', error);
        showNotification(error.message, 'error');
    } finally {
        form.classList.remove('loading');
    }
}

// Update the task count function with more information
function updateTaskCounts() {
    const columns = ['todo', 'in-progress', 'review', 'done'];
    const totalTasks = tasks.length;
    
    columns.forEach(status => {
        const statusTasks = tasks.filter(task => task.status === status);
        const count = statusTasks.length;
        const percentage = totalTasks ? Math.round((count / totalTasks) * 100) : 0;
        
        const countElement = document.querySelector(`#${status} .task-count`);
        if (countElement) {
            countElement.innerHTML = `
                <div class="count-number">${count}</div>
                <div class="count-bar" style="--progress: ${percentage}%"></div>
            `;
            
            // Update classes based on count
            countElement.className = 'task-count ' + 
                (count > 0 ? 'has-tasks' : '') + 
                (status === 'done' && percentage === 100 ? ' all-completed' : '');
        }
    });
}

// Update renderTasks to not use filters
function renderTasks() {
    // Clear all task containers
    document.querySelectorAll('.tasks-container').forEach(container => {
        container.innerHTML = '';
    });
    
    // Sort tasks by creation date
    const sortedTasks = [...tasks].sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
    
    // Render tasks
    sortedTasks.forEach(task => {
        const project = projects.find(p => p.id === task.projectId);
        const taskElement = createTaskElement(task, project);
        
        const container = document.querySelector(`#${task.status} .tasks-container`);
        if (container) {
            container.appendChild(taskElement);
        }
    });

    // Update task counts
    updateTaskCounts();

    // Initialize drag and drop after rendering tasks
    initializeDragAndDrop();
}

function createTaskElement(task, project) {
    const div = document.createElement('div');
    div.className = `task-item ${task.type || ''}`;
    div.dataset.taskId = task.id;
    
    const typeIcon = getTypeIcon(task.type);
    const testStatusBadge = getTestStatusBadge(task.testStatus);
    const projectName = project ? project.name : 'No Project';
    
    div.innerHTML = `
        <div class="task-header">
            <div class="task-meta">
                ${typeIcon}
                <span class="task-priority priority-${task.priority || 'low'}">${task.priority || 'low'}</span>
                <span class="task-project ${!project ? 'no-project' : ''}">${projectName}</span>
            </div>
            <div class="task-actions">
                ${testStatusBadge}
                <button class="delete-btn" title="Delete task">
                    <span class="icon">🗑️</span>
                </button>
            </div>
        </div>
        <div class="task-text">${task.text || ''}</div>
        <div class="task-footer">
            ${task.dueDate ? `<span class="task-due-date">Due: ${new Date(task.dueDate).toLocaleDateString()}</span>` : ''}
            ${task.assignedTo ? `<span class="task-assignee">@${task.assignedTo}</span>` : ''}
            ${task.estimatedHours ? `<span class="task-estimate">${task.estimatedHours}h</span>` : ''}
        </div>
        <div class="task-labels">
            ${(task.labels || []).map(label => `<span class="label">${label}</span>`).join('')}
        </div>
    `;
    
    // Add click handlers
    div.querySelector('.delete-btn').addEventListener('click', (e) => {
        e.stopPropagation();
        deleteTask(task.id);
    });
    
    div.addEventListener('click', () => showTaskDetails(task.id));
    
    return div;
}

function getTypeIcon(type) {
    const icons = {
        feature: '✨',
        bug: '🐛',
        refactor: '♻️',
        test: '🧪',
        docs: '',
        setup: '🔧'
    };
    return `<span class="task-type-icon" title="${taskTypes[type]}">${icons[type] || '📋'}</span>`;
}

function getTestStatusBadge(status) {
    const badges = {
        passed: '<span class="test-badge passed">✓ Tests Passed</span>',
        failed: '<span class="test-badge failed">✗ Tests Failed</span>',
        pending: '<span class="test-badge pending">○ Tests Pending</span>'
    };
    return badges[status] || badges.pending;
}

// Initialize the app
document.addEventListener('DOMContentLoaded', function() {
    // Recover data first
    recoverData();
    
    // Then initialize the UI
    updateProjectSelects();
    updateTypeSelect();
    updateLabelSelect();
    renderTasks();
    initializeDragAndDrop();
    initializeKeyboardShortcuts();
    initializeSearch();
    renderProjects();
    
    // Add auto-save on window close
    window.addEventListener('beforeunload', function() {
        saveData();
    });
    
    // Add periodic auto-save
    setInterval(saveData, 60000); // Auto-save every minute
    
    // Close modals when clicking outside
    window.onclick = function(event) {
        if (event.target.classList.contains('modal')) {
            event.target.style.display = 'none';
        }
    };
});

// Helper functions for development-specific features
function updateTypeSelect() {
    const addTypeSelect = document.getElementById('addTaskType');
    const editTypeSelect = document.getElementById('editTaskType');
    
    [addTypeSelect, editTypeSelect].forEach(select => {
        if (!select) return;
        
        const currentValue = select.value;
        select.innerHTML = '';
        
        if (select.id === 'addTaskType') {
            const defaultOption = document.createElement('option');
            defaultOption.value = '';
            defaultOption.textContent = 'Select Type';
            select.appendChild(defaultOption);
        }
        
        Object.entries(taskTypes).forEach(([value, label]) => {
            const option = document.createElement('option');
            option.value = value;
            option.textContent = label;
            select.appendChild(option);
        });
        
        // Restore selected value if it exists
        if (currentValue && Object.keys(taskTypes).includes(currentValue)) {
            select.value = currentValue;
        }
    });
}

function updateLabelSelect() {
    const select = document.getElementById('labelSelect');
    if (!select) return;
    
    select.innerHTML = '';
    Object.entries(labels).forEach(([value, label]) => {
        const option = document.createElement('option');
        option.value = value;
        option.textContent = label;
        select.appendChild(option);
    });
}

// Add data validation schemas
const validationSchemas = {
    project: {
        name: { required: true, minLength: 3, maxLength: 50 },
        description: { maxLength: 500 },
        repository: { pattern: /^(https?:\/\/)?([\w\d.-]+)\.([a-z\.]{2,6})(\/[\w\d.-]+)*\/?$/ },
        techStack: { maxItems: 10, maxLength: 20 }
    },
    task: {
        text: { required: true, minLength: 3, maxLength: 200 },
        estimatedHours: { min: 0, max: 100 },
        assignedTo: { pattern: /^[a-zA-Z0-9_-]{3,30}$/ },
        commits: { pattern: /^[a-f0-9]{7,40}$/i }
    }
};

// Enhanced input validation
function validateInput(input, type = 'text', options = {}) {
    const field = document.getElementById(options.fieldId);
    const errorElement = field?.nextElementSibling?.classList.contains('error-message') 
        ? field.nextElementSibling 
        : null;

    try {
        if (!input && options.required) {
            throw new Error(`${options.label || type} is required`);
        }

        if (!input) return '';
        
        const value = input.toString().trim();
        
        // Length validation
        if (options.minLength && value.length < options.minLength) {
            throw new Error(`${options.label || type} must be at least ${options.minLength} characters`);
        }
        if (options.maxLength && value.length > options.maxLength) {
            throw new Error(`${options.label || type} must not exceed ${options.maxLength} characters`);
        }

        // Pattern validation
        if (options.pattern && !options.pattern.test(value)) {
            throw new Error(`${options.label || type} format is invalid`);
        }

        // Type-specific validation
        switch (type) {
            case 'number':
                const num = parseFloat(value);
                if (isNaN(num)) {
                    throw new Error(`${options.label || 'Value'} must be a number`);
                }
                if (options.min !== undefined && num < options.min) {
                    throw new Error(`${options.label || 'Value'} must be at least ${options.min}`);
                }
                if (options.max !== undefined && num > options.max) {
                    throw new Error(`${options.label || 'Value'} must not exceed ${options.max}`);
                }
                return num;

            case 'date':
                const date = new Date(value);
                if (isNaN(date.getTime())) {
                    throw new Error('Invalid date format');
                }
                if (options.minDate && date < new Date(options.minDate)) {
                    throw new Error(`Date cannot be before ${new Date(options.minDate).toLocaleDateString()}`);
                }
                if (options.maxDate && date > new Date(options.maxDate)) {
                    throw new Error(`Date cannot be after ${new Date(options.maxDate).toLocaleDateString()}`);
                }
                return date.toISOString();

            case 'array':
                const array = Array.isArray(value) ? value : value.split(options.separator || ',').map(item => item.trim());
                if (options.maxItems && array.length > options.maxItems) {
                    throw new Error(`Maximum ${options.maxItems} items allowed`);
                }
                return array.filter(Boolean);

            default:
                return value;
        }
    } catch (error) {
        // Show error on field
        if (field) field.classList.add('error');
        if (errorElement) errorElement.textContent = error.message;
        
        throw error;
    }
}

// Add form validation helper
function validateForm(formData, schema) {
    const errors = [];
    
    Object.entries(formData).forEach(([field, value]) => {
        if (schema[field]) {
            try {
                validateInput(value, schema[field].type || 'text', {
                    ...schema[field],
                    label: field.charAt(0).toUpperCase() + field.slice(1)
                });
            } catch (error) {
                errors.push(error);
            }
        }
    });
    
    return errors;
}

// Enhanced error handling for data operations
function handleDataOperation(operation, data) {
    try {
        return operation(data);
    } catch (error) {
        console.error(`Data operation failed:`, error);
        showNotification(error.message, 'error');
        throw error;
    }
}

// Improved notification system
function showNotification(message, type = 'info', duration = 3000) {
    const container = document.querySelector('.notification-container');
    if (!container) return;
    
    // Remove existing notifications of the same type
    container.querySelectorAll(`.notification.${type}`).forEach(notification => {
        notification.remove();
    });
    
    // Limit total notifications
    const maxNotifications = 3;
    while (container.children.length >= maxNotifications) {
        container.firstChild.remove();
    }
    
    const notification = document.createElement('div');
    notification.className = `notification ${type}`;
    
    const icon = {
        success: '✓',
        error: '✕',
        info: 'ℹ',
        warning: '⚠'
    }[type];
    
    notification.innerHTML = `
        <span class="notification-icon">${icon}</span>
        <span class="notification-message">${message}</span>
        <button class="notification-close" aria-label="Close notification">×</button>
    `;
    
    // Add click handler for close button
    notification.querySelector('.notification-close').addEventListener('click', () => {
        notification.remove();
    });
    
    container.appendChild(notification);
    
    // Handle animation end
    notification.addEventListener('animationend', () => {
        notification.classList.add('notification-shown');
    });
    
    // Auto remove after duration
    if (duration > 0) {
        const timeout = setTimeout(() => {
            notification.classList.add('notification-hiding');
            notification.addEventListener('animationend', () => {
                notification.remove();
            }, { once: true });
        }, duration);
        
        // Pause timeout on hover
        notification.addEventListener('mouseenter', () => clearTimeout(timeout));
        notification.addEventListener('mouseleave', () => {
            setTimeout(() => {
                notification.classList.add('notification-hiding');
                notification.addEventListener('animationend', () => {
                    notification.remove();
                }, { once: true });
            }, 1000);
        });
    }
    
    return notification;
}

// Add drag and drop functionality
function initializeDragAndDrop() {
    const draggables = document.querySelectorAll('.task-item');
    const containers = document.querySelectorAll('.tasks-container');

    draggables.forEach(draggable => {
        draggable.setAttribute('draggable', true);
        
        draggable.addEventListener('dragstart', (e) => {
            e.stopPropagation(); // Prevent parent handlers
            draggable.classList.add('dragging');
            draggable.dataset.isDragging = 'true';
            
            // Set drag data
            e.dataTransfer.setData('text/plain', draggable.dataset.taskId);
            e.dataTransfer.effectAllowed = 'move';
        });

        draggable.addEventListener('dragend', () => {
            draggable.classList.remove('dragging');
            document.querySelectorAll('.tasks-container').forEach(container => {
                container.classList.remove('drag-over');
            });
            setTimeout(() => delete draggable.dataset.isDragging, 100);
        });
    });

    containers.forEach(container => {
        container.addEventListener('dragenter', (e) => {
            e.preventDefault();
            container.classList.add('drag-over');
        });

        container.addEventListener('dragleave', (e) => {
            if (!e.relatedTarget?.closest('.tasks-container')) {
                container.classList.remove('drag-over');
            }
        });

        container.addEventListener('dragover', (e) => {
            e.preventDefault();
            e.dataTransfer.dropEffect = 'move';
        });

        container.addEventListener('drop', (e) => {
            e.preventDefault();
            container.classList.remove('drag-over');
            
            const taskId = e.dataTransfer.getData('text/plain');
            const newStatus = container.closest('.column').id;
            
            if (taskId && newStatus) {
                updateTaskStatus(taskId, newStatus);
                renderTasks(); // Re-render to ensure correct order
            }
        });
    });
}

function updateTaskStatus(taskId, newStatus) {
    const task = tasks.find(t => t.id === taskId);
    if (task && task.status !== newStatus) {
        const oldStatus = task.status;
        task.status = newStatus;
        saveData();
        showNotification(
            `Task "${task.text.substring(0, 20)}..." moved to ${newStatus.replace('-', ' ')}`, 
            'success'
        );
        updateTaskCounts();
    }
}

// Add keyboard shortcuts
function initializeKeyboardShortcuts() {
    document.addEventListener('keydown', e => {
        // Ctrl/Cmd + K to focus search
        if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
            e.preventDefault();
            document.getElementById('taskInput').focus();
        }
        
        // Esc to close modals
        if (e.key === 'Escape') {
            const openModal = document.querySelector('.modal[style*="display: block"]');
            if (openModal) {
                closeModal(openModal.id);
            }
        }
        
        // Ctrl/Cmd + N for new task
        if ((e.ctrlKey || e.metaKey) && e.key === 'n') {
            e.preventDefault();
            document.getElementById('taskInput').focus();
        }
    });
}

// Add search functionality
function initializeSearch() {
    const searchInput = document.createElement('input');
    searchInput.type = 'text';
    searchInput.id = 'searchInput';
    searchInput.className = 'form-input search-input';
    searchInput.placeholder = '⌘K to search tasks...';
    searchInput.setAttribute('data-shortcut', '⌘K');
    
    const searchContainer = document.createElement('div');
    searchContainer.className = 'search-container';
    searchContainer.appendChild(searchInput);
    
    const projectControls = document.querySelector('.project-controls');
    if (projectControls.firstChild) {
        projectControls.insertBefore(searchContainer, projectControls.firstChild);
    } else {
        projectControls.appendChild(searchContainer);
    }
    
    searchInput.addEventListener('input', debounce(searchTasks, 300));
}

function searchTasks(e) {
    const searchTerm = e.target.value.toLowerCase();
    const filteredTasks = tasks.filter(task => {
        return task.text.toLowerCase().includes(searchTerm) ||
               task.description.toLowerCase().includes(searchTerm) ||
               task.labels.some(label => label.toLowerCase().includes(searchTerm));
    });
    
    renderFilteredTasks(filteredTasks);
}

function debounce(func, wait) {
    let timeout;
    return function executedFunction(...args) {
        const later = () => {
            clearTimeout(timeout);
            func(...args);
        };
        clearTimeout(timeout);
        timeout = setTimeout(later, wait);
    };
}

// Add this function for search functionality
function renderFilteredTasks(filteredTasks) {
    // Clear all task containers
    document.querySelectorAll('.tasks-container').forEach(container => {
        container.innerHTML = '';
    });
    
    // Render filtered tasks
    filteredTasks.forEach(task => {
        const project = projects.find(p => p.id === task.projectId);
        const taskElement = createTaskElement(task, project);
        
        const container = document.querySelector(`#${task.status} .tasks-container`);
        if (container) {
            container.appendChild(taskElement);
        }
    });
    
    // Update task counts based on filtered tasks
    updateTaskCounts();
}

// Add this helper function to clear form errors
function clearFormErrors(form) {
    form.querySelectorAll('.error-message').forEach(error => {
        error.textContent = '';
    });
    form.querySelectorAll('.form-input').forEach(input => {
        input.classList.remove('error');
    });
}

// Add helper function to validate task fields
function validateTaskField(value, options = {}) {
    try {
        const field = document.getElementById(options.fieldId);
        if (field) {
            field.classList.remove('error');
            const errorElement = field.nextElementSibling;
            if (errorElement?.classList.contains('error-message')) {
                errorElement.textContent = '';
            }
        }

        if (options.required && (!value || value.toString().trim() === '')) {
            throw new Error(`${options.label} is required`);
        }

        return true;
    } catch (error) {
        const field = document.getElementById(options.fieldId);
        if (field) {
            field.classList.add('error');
            const errorElement = field.nextElementSibling;
            if (errorElement?.classList.contains('error-message')) {
                errorElement.textContent = error.message;
            }
        }
        throw error;
    }
}

// Add the delete task function
function deleteTask(taskId) {
    if (confirm('Are you sure you want to delete this task?')) {
        const taskIndex = tasks.findIndex(t => t.id === taskId);
        if (taskIndex !== -1) {
            const task = tasks[taskIndex];
            tasks.splice(taskIndex, 1);
            if (saveData()) {
                renderTasks();
                showNotification(`Task "${task.text}" deleted`, 'success');
            }
        }
    }
}

// Add delete project function
function deleteProject(projectId) {
    if (!projectId) {
        const select = document.getElementById('taskProject');
        projectId = select.value;
    }
    
    if (!projectId) {
        showNotification('No project selected', 'error');
        return;
    }
    
    const project = projects.find(p => p.id === projectId);
    if (!project) {
        showNotification('Project not found', 'error');
        return;
    }
    
    if (confirm(`Are you sure you want to delete project "${project.name}"?\nThis will also delete all tasks in this project.`)) {
        // Remove all tasks associated with this project
        tasks = tasks.filter(task => task.projectId !== projectId);
        
        // Remove the project
        const projectIndex = projects.findIndex(p => p.id === projectId);
        if (projectIndex !== -1) {
            projects.splice(projectIndex, 1);
            
            if (saveData()) {
                updateProjectSelects();
                renderTasks();
                renderProjects();
                closeModal('projectModal');
                showNotification(`Project "${project.name}" deleted`, 'success');
            }
        }
    }
}

// Update the renderProjects function
function renderProjects() {
    const container = document.querySelector('.projects-container');
    if (!container) return;
    
    container.innerHTML = '';
    
    // Sort projects by name
    const sortedProjects = [...projects].sort((a, b) => a.name.localeCompare(b.name));
    
    if (sortedProjects.length === 0) {
        container.innerHTML = '<div class="empty-state">No projects yet</div>';
        return;
    }
    
    sortedProjects.forEach(project => {
        // Ensure project has all required properties
        const projectData = {
            ...project,
            description: project.description || '',
            repository: project.repository || '',
            techStack: project.techStack || [],
            createdAt: project.createdAt || new Date().toISOString()
        };
        
        const projectTasks = tasks.filter(t => t.projectId === projectData.id);
        const completedTasks = projectTasks.filter(t => t.status === 'done').length;
        const totalTasks = projectTasks.length;
        const progress = totalTasks ? Math.round((completedTasks / totalTasks) * 100) : 0;
        
        const card = document.createElement('div');
        card.className = 'project-card';
        card.innerHTML = `
            <div class="project-card-header">
                <h3 class="project-name">${projectData.name}</h3>
                <div class="project-actions">
                    <button class="add-task-btn" title="Add task to project">
                        Add task
                    </button>
                    <button class="delete-btn" title="Delete project">
                        <span class="icon">🗑️</span>
                    </button>
                </div>
            </div>
            <p class="project-description">${projectData.description || 'No description'}</p>
            <div class="project-meta">
                <span class="created-at">Created ${new Date(projectData.createdAt).toLocaleDateString()}</span>
                ${projectData.repository ? `<a href="${projectData.repository}" target="_blank" class="repo-link">Repository</a>` : ''}
            </div>
            ${projectData.techStack.length > 0 ? `
                <div class="project-tech-stack">
                    ${projectData.techStack.map(tech => `<span class="tech-badge">${tech}</span>`).join('')}
                </div>
            ` : ''}
            <div class="project-stats">
                <div class="stat-item" title="Total tasks">
                    <span class="icon">📋</span> ${totalTasks}
                </div>
                <div class="stat-item" title="Completed tasks">
                    <span class="icon">✅</span> ${completedTasks}
                </div>
                <div class="stat-item" title="Progress">
                    <span class="icon">📊</span> ${progress}%
                </div>
            </div>
        `;
        
        // Add click handlers
        card.querySelector('.delete-btn').addEventListener('click', (e) => {
            e.stopPropagation();
            deleteProject(projectData.id);
        });
        
        card.querySelector('.add-task-btn').addEventListener('click', (e) => {
            e.stopPropagation();
            // Set project in task form
            const projectSelect = document.getElementById('taskProject');
            if (projectSelect) {
                projectSelect.value = projectData.id;
            }
            
            // Scroll to task form with highlight effect
            const addTaskSection = document.querySelector('.add-task-section');
            addTaskSection.scrollIntoView({ behavior: 'smooth' });
            addTaskSection.classList.add('highlight');
            
            // Remove highlight after animation
            setTimeout(() => {
                addTaskSection.classList.remove('highlight');
            }, 1000);
            
            // Focus task input
            document.getElementById('taskInput').focus();
        });
        
        // Add click handler for editing project
        card.addEventListener('click', () => {
            showProjectDetails(projectData.id);
        });
        
        container.appendChild(card);
    });
    
    // Update project selects after rendering
    updateProjectSelects();
}

// Add function to handle multiple task creation
function addMultipleTasks(projectId, taskListInput, typeSelect, prioritySelect) {
    try {
        const taskTexts = taskListInput.value.trim().split('\n').filter(text => text.trim());
        
        if (taskTexts.length === 0) {
            taskListInput.classList.add('error');
            throw new Error('Please enter at least one task');
        }
        
        const type = typeSelect.value;
        if (!type) {
            typeSelect.classList.add('error');
            throw new Error('Task type is required');
        }
        
        const newTasks = taskTexts.map(text => ({
            id: Date.now().toString() + Math.random().toString(36).substr(2, 9),
            text: text.trim(),
            projectId: projectId,
            type: type,
            priority: prioritySelect.value || 'low',
            status: 'todo',
            createdAt: new Date().toISOString(),
            dueDate: null,
            description: '',
            labels: [],
            assignedTo: '',
            estimatedHours: 0,
            dependencies: [],
            commits: [],
            testStatus: 'pending'
        }));
        
        tasks.push(...newTasks);
        
        if (saveData()) {
            renderTasks();
            renderProjects();
            
            // Clear inputs
            taskListInput.value = '';
            typeSelect.value = '';
            prioritySelect.value = 'low';
            
            // Remove error classes
            taskListInput.classList.remove('error');
            typeSelect.classList.remove('error');
            
            const project = projects.find(p => p.id === projectId);
            showNotification(`Added ${newTasks.length} tasks to "${project.name}"`, 'success');
            
            // Hide the input area
            taskListInput.closest('.multi-task-input').classList.add('hidden');
        }
        
    } catch (error) {
        console.error('Error adding tasks:', error);
        showNotification(error.message, 'error');
    }
}

// Add new function to handle adding tasks within project cards
function addTaskToProject(projectId, taskInput, typeSelect, prioritySelect) {
    try {
        const text = taskInput.value.trim();
        if (!text) {
            taskInput.classList.add('error');
            throw new Error('Task title is required');
        }
        
        const type = typeSelect.value;
        if (!type) {
            typeSelect.classList.add('error');
            throw new Error('Task type is required');
        }
        
        const task = {
            id: Date.now().toString(),
            text: text,
            projectId: projectId,
            type: type,
            priority: prioritySelect.value || 'low',
            status: 'todo',
            createdAt: new Date().toISOString(),
            dueDate: null,
            description: '',
            labels: [],
            assignedTo: '',
            estimatedHours: 0,
            dependencies: [],
            commits: [],
            testStatus: 'pending'
        };
        
        tasks.push(task);
        
        if (saveData()) {
            renderTasks();
            renderProjects();
            
            // Clear input fields
            taskInput.value = '';
            typeSelect.value = '';
            prioritySelect.value = 'low';
            
            // Remove error classes
            taskInput.classList.remove('error');
            typeSelect.classList.remove('error');
            
            const project = projects.find(p => p.id === projectId);
            showNotification(`Task added to project "${project.name}"`, 'success');
        }
        
    } catch (error) {
        console.error('Error adding task:', error);
        showNotification(error.message, 'error');
    }
}

// Add function to show project details
function showProjectDetails(projectId) {
    const project = projects.find(p => p.id === projectId);
    if (!project) {
        showNotification('Project not found', 'error');
        return;
    }
    
    try {
        // Update modal title
        document.getElementById('projectModalTitle').textContent = 'Edit Project';
        
        // Set form values
        const form = document.querySelector('.project-form');
        form.dataset.projectId = projectId;
        
        // Set field values
        document.getElementById('projectName').value = project.name || '';
        document.getElementById('projectDescription').value = project.description || '';
        document.getElementById('projectRepo').value = project.repository || '';
        document.getElementById('projectTechStack').value = project.techStack ? project.techStack.join(', ') : '';
        
        // Initialize task type select
        const typeSelect = form.querySelector('.task-type-select');
        if (typeSelect) {
            typeSelect.innerHTML = '<option value="">Select Type</option>';
            Object.entries(taskTypes).forEach(([value, label]) => {
                const option = document.createElement('option');
                option.value = value;
                option.textContent = label;
                typeSelect.appendChild(option);
            });
        }
        
        // Add task form handler
        const taskInput = form.querySelector('.task-input');
        const prioritySelect = form.querySelector('.task-priority-select');
        const addTaskBtn = form.querySelector('.add-task-btn');
        
        if (addTaskBtn) {
            addTaskBtn.onclick = () => {
                addTaskToProject(projectId, taskInput, typeSelect, prioritySelect);
            };
        }
        
        if (taskInput) {
            taskInput.onkeypress = (e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault();
                    addTaskToProject(projectId, taskInput, typeSelect, prioritySelect);
                }
            };
        }
        
        // Show project tasks
        renderProjectTasks(projectId);
        
        // Show modal
        showModal('projectModal');
        
    } catch (error) {
        console.error('Error showing project details:', error);
        showNotification('Error loading project details', 'error');
    }
}

// Update the renderProjectTasks function
function renderProjectTasks(projectId) {
    const container = document.querySelector('.project-tasks-list');
    if (!container) return;
    
    const project = projects.find(p => p.id === projectId);
    if (!project) {
        container.innerHTML = '<div class="empty-state">Project not found</div>';
        return;
    }
    
    const projectTasks = tasks.filter(t => t.projectId === projectId);
    
    if (projectTasks.length === 0) {
        container.innerHTML = '<div class="empty-state">No tasks yet</div>';
        return;
    }
    
    container.innerHTML = '';
    projectTasks.forEach(task => {
        const taskElement = createTaskElement(task, project);
        container.appendChild(taskElement);
    });
}

// Add initialization function
function initializeApp() {
    // Load data from localStorage
    try {
        projects = JSON.parse(localStorage.getItem('projects')) || [];
        tasks = JSON.parse(localStorage.getItem('tasks')) || [];
    } catch (error) {
        console.error('Error loading data:', error);
        projects = [];
        tasks = [];
    }

    // Initialize task type select
    const addTaskTypeSelect = document.getElementById('addTaskType');
    if (addTaskTypeSelect) {
        Object.entries(taskTypes).forEach(([value, label]) => {
            const option = document.createElement('option');
            option.value = value;
            option.textContent = label;
            addTaskTypeSelect.appendChild(option);
        });
    }

    // Render initial state
    renderProjects();
    renderTasks();
}

// Call initialization when page loads
document.addEventListener('DOMContentLoaded', initializeApp); 