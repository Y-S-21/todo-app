// ============================================
// ToDo PWA - Complete Application
// ============================================

class TodoApp {
  constructor() {
    this.tasks = [];
    this.showCompleted = true;
    this.editingTaskId = null;
    this.deletedTask = null;
    this.draggedItem = null;
    
    this.init();
  }

  // ============================================
  // Initialization
  // ============================================
  init() {
    this.loadTasks();
    this.loadTheme();
    this.bindEvents();
    this.render();
    this.registerServiceWorker();
    this.requestNotificationPermission();
    this.checkReminders();
    
    // Check reminders every minute
    setInterval(() => this.checkReminders(), 60000);
  }

  // ============================================
  // Local Storage
  // ============================================
  loadTasks() {
    const saved = localStorage.getItem('todo-tasks');
    this.tasks = saved ? JSON.parse(saved) : [];
  }

  saveTasks() {
    localStorage.setItem('todo-tasks', JSON.stringify(this.tasks));
  }

  loadTheme() {
    const theme = localStorage.getItem('todo-theme') || 
      (window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light');
    document.documentElement.setAttribute('data-theme', theme);
  }

  toggleTheme() {
    const current = document.documentElement.getAttribute('data-theme');
    const next = current === 'dark' ? 'light' : 'dark';
    document.documentElement.setAttribute('data-theme', next);
    localStorage.setItem('todo-theme', next);
  }

  // ============================================
  // Event Binding
  // ============================================
  bindEvents() {
    // Theme toggle
    document.getElementById('theme-toggle').addEventListener('click', () => this.toggleTheme());
    
    // Toggle completed visibility
    document.getElementById('toggle-completed').addEventListener('click', (e) => {
      this.showCompleted = !this.showCompleted;
      e.currentTarget.classList.toggle('active', !this.showCompleted);
      this.render();
    });
    
    // Add button
    document.getElementById('add-btn').addEventListener('click', () => this.openModal());
    
    // Modal backdrop
    document.querySelector('.modal-backdrop').addEventListener('click', () => this.closeModal());
    
    // Cancel button
    document.getElementById('cancel-btn').addEventListener('click', () => this.closeModal());
    
    // Form submit
    document.getElementById('task-form').addEventListener('submit', (e) => {
      e.preventDefault();
      this.saveTask();
    });
    
    // Priority buttons
    document.querySelectorAll('.priority-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        document.querySelectorAll('.priority-btn').forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        document.getElementById('task-priority').value = btn.dataset.priority;
      });
    });
    
    // Clear reminder button
    const reminderInput = document.getElementById('task-reminder');
    const clearBtn = document.getElementById('clear-reminder');
    
    reminderInput.addEventListener('input', () => {
      clearBtn.classList.toggle('visible', reminderInput.value !== '');
    });
    
    clearBtn.addEventListener('click', () => {
      reminderInput.value = '';
      clearBtn.classList.remove('visible');
    });
    
    // Keyboard shortcuts
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape') this.closeModal();
      if (e.key === 'n' && (e.ctrlKey || e.metaKey)) {
        e.preventDefault();
        this.openModal();
      }
    });
  }

  // ============================================
  // Task CRUD Operations
  // ============================================
  addTask(task) {
    const newTask = {
      id: Date.now().toString(),
      title: task.title,
      description: task.description || '',
      date: task.date,
      reminder: task.reminder || null,
      priority: task.priority || 'medium',
      completed: false,
      createdAt: new Date().toISOString(),
      order: this.getNextOrder(task.date)
    };
    
    this.tasks.push(newTask);
    this.saveTasks();
    this.scheduleNotification(newTask);
    this.render();
    this.showToast('Task added');
  }

  updateTask(id, updates) {
    const index = this.tasks.findIndex(t => t.id === id);
    if (index !== -1) {
      this.tasks[index] = { ...this.tasks[index], ...updates };
      this.saveTasks();
      this.scheduleNotification(this.tasks[index]);
      this.render();
      this.showToast('Task updated');
    }
  }

  deleteTask(id) {
    const index = this.tasks.findIndex(t => t.id === id);
    if (index !== -1) {
      this.deletedTask = { ...this.tasks[index], index };
      this.tasks.splice(index, 1);
      this.saveTasks();
      this.render();
      this.showToast('Task deleted', true);
    }
  }

  undoDelete() {
    if (this.deletedTask) {
      this.tasks.splice(this.deletedTask.index, 0, this.deletedTask);
      delete this.deletedTask.index;
      this.deletedTask = null;
      this.saveTasks();
      this.render();
    }
  }

  toggleComplete(id) {
    const task = this.tasks.find(t => t.id === id);
    if (task) {
      task.completed = !task.completed;
      this.saveTasks();
      this.render();
    }
  }

  moveTaskToDate(id, newDate) {
    const task = this.tasks.find(t => t.id === id);
    if (task) {
      task.date = newDate;
      task.order = this.getNextOrder(newDate);
      this.saveTasks();
      this.render();
      this.showToast('Task moved');
    }
  }

  getNextOrder(date) {
    const sameDateTasks = this.tasks.filter(t => t.date === date);
    return sameDateTasks.length;
  }

  // ============================================
  // Modal Operations
  // ============================================
  openModal(taskId = null) {
    const modal = document.getElementById('modal');
    const form = document.getElementById('task-form');
    const title = document.getElementById('modal-title');
    
    form.reset();
    this.editingTaskId = taskId;
    
    // Set default date to today
    const today = new Date().toISOString().split('T')[0];
    document.getElementById('task-date').value = today;
    
    // Reset priority
    document.querySelectorAll('.priority-btn').forEach(b => b.classList.remove('active'));
    document.querySelector('.priority-btn[data-priority="medium"]').classList.add('active');
    document.getElementById('task-priority').value = 'medium';
    document.getElementById('clear-reminder').classList.remove('visible');
    
    if (taskId) {
      const task = this.tasks.find(t => t.id === taskId);
      if (task) {
        title.textContent = 'Edit Task';
        document.getElementById('task-title').value = task.title;
        document.getElementById('task-desc').value = task.description || '';
        document.getElementById('task-date').value = task.date;
        document.getElementById('task-reminder').value = task.reminder || '';
        document.getElementById('task-priority').value = task.priority;
        document.getElementById('task-id').value = task.id;
        
        if (task.reminder) {
          document.getElementById('clear-reminder').classList.add('visible');
        }
        
        document.querySelectorAll('.priority-btn').forEach(b => b.classList.remove('active'));
        document.querySelector(`.priority-btn[data-priority="${task.priority}"]`).classList.add('active');
      }
    } else {
      title.textContent = 'New Task';
      document.getElementById('task-id').value = '';
    }
    
    modal.classList.add('open');
    setTimeout(() => document.getElementById('task-title').focus(), 100);
  }

  closeModal() {
    document.getElementById('modal').classList.remove('open');
    this.editingTaskId = null;
  }

  saveTask() {
    const title = document.getElementById('task-title').value.trim();
    const description = document.getElementById('task-desc').value.trim();
    const date = document.getElementById('task-date').value;
    const reminder = document.getElementById('task-reminder').value || null;
    const priority = document.getElementById('task-priority').value;
    const id = document.getElementById('task-id').value;
    
    if (!title) return;
    
    if (id) {
      this.updateTask(id, { title, description, date, reminder, priority });
    } else {
      this.addTask({ title, description, date, reminder, priority });
    }
    
    this.closeModal();
  }

  // ============================================
  // Rendering
  // ============================================
  render() {
    const container = document.getElementById('task-list');
    const emptyState = document.getElementById('empty-state');
    const pendingCount = document.getElementById('pending-count');
    
    // Group tasks by date
    const grouped = this.groupTasksByDate();
    const dates = Object.keys(grouped).sort();
    
    // Count pending
    const pending = this.tasks.filter(t => !t.completed).length;
    pendingCount.textContent = pending;
    
    // Filter based on showCompleted
    let hasVisibleTasks = false;
    
    container.innerHTML = '';
    
    dates.forEach(date => {
      let tasks = grouped[date];
      
      if (!this.showCompleted) {
        tasks = tasks.filter(t => !t.completed);
      }
      
      if (tasks.length === 0) return;
      
      hasVisibleTasks = true;
      
      // Sort by order
      tasks.sort((a, b) => a.order - b.order);
      
      const section = document.createElement('div');
      section.className = 'date-section';
      section.innerHTML = `
        <div class="date-header">
          <span class="date-badge ${this.getDateClass(date)}">${this.formatDate(date)}</span>
          <span class="date-count">${tasks.filter(t => !t.completed).length} tasks</span>
        </div>
        <div class="date-tasks" data-date="${date}">
          ${tasks.map(task => this.renderTask(task)).join('')}
        </div>
      `;
      
      container.appendChild(section);
    });
    
    // Show/hide empty state
    emptyState.classList.toggle('visible', !hasVisibleTasks);
    
    // Bind task events
    this.bindTaskEvents();
  }

  renderTask(task) {
    const priorityColor = {
      low: 'var(--priority-low)',
      medium: 'var(--priority-medium)',
      high: 'var(--priority-high)'
    }[task.priority];
    
    return `
      <div class="task-item ${task.completed ? 'completed' : ''}" 
           data-id="${task.id}" 
           draggable="true"
           style="--task-priority-color: ${priorityColor}">
        <div class="task-checkbox" data-action="toggle">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3">
            <polyline points="20 6 9 17 4 12"></polyline>
          </svg>
        </div>
        <div class="task-content" data-action="edit">
          <div class="task-title">${this.escapeHtml(task.title)}</div>
          ${task.description ? `<div class="task-desc">${this.escapeHtml(task.description)}</div>` : ''}
          ${task.reminder ? `
            <div class="task-reminder">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <circle cx="12" cy="12" r="10"></circle>
                <polyline points="12 6 12 12 16 14"></polyline>
              </svg>
              ${this.formatTime(task.reminder)}
            </div>
          ` : ''}
        </div>
        <div class="task-actions">
          <button class="task-action-btn" data-action="move" title="Move to date">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect>
              <line x1="16" y1="2" x2="16" y2="6"></line>
              <line x1="8" y1="2" x2="8" y2="6"></line>
              <line x1="3" y1="10" x2="21" y2="10"></line>
            </svg>
          </button>
          <button class="task-action-btn delete" data-action="delete" title="Delete">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <polyline points="3 6 5 6 21 6"></polyline>
              <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
            </svg>
          </button>
        </div>
      </div>
    `;
  }

  bindTaskEvents() {
    // Task actions
    document.querySelectorAll('.task-item').forEach(item => {
      const id = item.dataset.id;
      
      item.querySelector('[data-action="toggle"]').addEventListener('click', (e) => {
        e.stopPropagation();
        this.toggleComplete(id);
      });
      
      item.querySelector('[data-action="edit"]').addEventListener('click', () => {
        this.openModal(id);
      });
      
      item.querySelector('[data-action="move"]').addEventListener('click', (e) => {
        e.stopPropagation();
        this.showDatePicker(id);
      });
      
      item.querySelector('[data-action="delete"]').addEventListener('click', (e) => {
        e.stopPropagation();
        this.deleteTask(id);
      });
      
      // Drag and drop
      item.addEventListener('dragstart', (e) => this.handleDragStart(e, item));
      item.addEventListener('dragend', () => this.handleDragEnd(item));
      item.addEventListener('dragover', (e) => this.handleDragOver(e));
      item.addEventListener('drop', (e) => this.handleDrop(e, item));
    });
  }

  // ============================================
  // Drag and Drop
  // ============================================
  handleDragStart(e, item) {
    this.draggedItem = item;
    item.classList.add('dragging');
    e.dataTransfer.effectAllowed = 'move';
  }

  handleDragEnd(item) {
    item.classList.remove('dragging');
    this.draggedItem = null;
  }

  handleDragOver(e) {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
  }

  handleDrop(e, targetItem) {
    e.preventDefault();
    if (!this.draggedItem || this.draggedItem === targetItem) return;
    
    const draggedId = this.draggedItem.dataset.id;
    const targetId = targetItem.dataset.id;
    
    const draggedTask = this.tasks.find(t => t.id === draggedId);
    const targetTask = this.tasks.find(t => t.id === targetId);
    
    if (draggedTask && targetTask) {
      // Swap orders
      const tempOrder = draggedTask.order;
      draggedTask.order = targetTask.order;
      targetTask.order = tempOrder;
      
      // If different dates, move to target date
      if (draggedTask.date !== targetTask.date) {
        draggedTask.date = targetTask.date;
      }
      
      this.saveTasks();
      this.render();
    }
  }

  // ============================================
  // Date Picker for Moving Tasks
  // ============================================
  showDatePicker(taskId) {
    const task = this.tasks.find(t => t.id === taskId);
    if (!task) return;
    
    // Create a temporary date input
    const input = document.createElement('input');
    input.type = 'date';
    input.value = task.date;
    input.style.position = 'fixed';
    input.style.opacity = '0';
    input.style.pointerEvents = 'none';
    document.body.appendChild(input);
    
    input.addEventListener('change', () => {
      if (input.value) {
        this.moveTaskToDate(taskId, input.value);
      }
      document.body.removeChild(input);
    });
    
    input.addEventListener('blur', () => {
      setTimeout(() => {
        if (document.body.contains(input)) {
          document.body.removeChild(input);
        }
      }, 100);
    });
    
    input.showPicker();
  }

  // ============================================
  // Helper Functions
  // ============================================
  groupTasksByDate() {
    const grouped = {};
    this.tasks.forEach(task => {
      if (!grouped[task.date]) {
        grouped[task.date] = [];
      }
      grouped[task.date].push(task);
    });
    return grouped;
  }

  formatDate(dateStr) {
    const date = new Date(dateStr + 'T00:00:00');
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);
    
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);
    
    const taskDate = new Date(date);
    taskDate.setHours(0, 0, 0, 0);
    
    if (taskDate.getTime() === today.getTime()) return 'Today';
    if (taskDate.getTime() === tomorrow.getTime()) return 'Tomorrow';
    if (taskDate.getTime() === yesterday.getTime()) return 'Yesterday';
    
    const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    
    return `${days[date.getDay()]}, ${date.getDate()} ${months[date.getMonth()]}`;
  }

  getDateClass(dateStr) {
    const date = new Date(dateStr + 'T00:00:00');
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    const taskDate = new Date(date);
    taskDate.setHours(0, 0, 0, 0);
    
    if (taskDate.getTime() === today.getTime()) return 'today';
    if (taskDate < today) return 'overdue';
    return '';
  }

  formatTime(timeStr) {
    const [hours, minutes] = timeStr.split(':');
    const h = parseInt(hours);
    const period = h >= 12 ? 'PM' : 'AM';
    const hour = h > 12 ? h - 12 : (h === 0 ? 12 : h);
    return `${hour}:${minutes} ${period}`;
  }

  escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
  }

  // ============================================
  // Toast Notifications
  // ============================================
  showToast(message, showUndo = false) {
    const toast = document.getElementById('toast');
    toast.innerHTML = message + (showUndo ? 
      `<button class="toast-undo" onclick="app.undoDelete()">Undo</button>` : '');
    toast.classList.add('visible');
    
    clearTimeout(this.toastTimeout);
    this.toastTimeout = setTimeout(() => {
      toast.classList.remove('visible');
    }, 3000);
  }

  // ============================================
  // Notifications & Reminders
  // ============================================
  async requestNotificationPermission() {
    if ('Notification' in window && Notification.permission === 'default') {
      await Notification.requestPermission();
    }
  }

  scheduleNotification(task) {
    if (!task.reminder || task.completed) return;
    if (!('Notification' in window) || Notification.permission !== 'granted') return;
    
    // Store scheduled notifications
    const scheduled = JSON.parse(localStorage.getItem('todo-notifications') || '{}');
    scheduled[task.id] = {
      date: task.date,
      time: task.reminder,
      title: task.title
    };
    localStorage.setItem('todo-notifications', JSON.stringify(scheduled));
  }

  checkReminders() {
    if (!('Notification' in window) || Notification.permission !== 'granted') return;
    
    const now = new Date();
    const currentDate = now.toISOString().split('T')[0];
    const currentTime = now.toTimeString().slice(0, 5);
    
    this.tasks.forEach(task => {
      if (task.completed || !task.reminder) return;
      
      if (task.date === currentDate && task.reminder === currentTime) {
        new Notification('⏰ Reminder', {
          body: task.title,
          icon: 'icons/icon-192.png',
          badge: 'icons/icon-192.png',
          tag: task.id,
          requireInteraction: true
        });
      }
    });
  }

  // ============================================
  // Service Worker
  // ============================================
  async registerServiceWorker() {
    if ('serviceWorker' in navigator) {
      try {
        await navigator.serviceWorker.register('sw.js');
        console.log('Service Worker registered');
      } catch (err) {
        console.log('Service Worker registration failed:', err);
      }
    }
  }
}

// Initialize app
const app = new TodoApp();