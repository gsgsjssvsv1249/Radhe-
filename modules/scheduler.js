const fs = require('fs');
const path = require('path');

class TaskScheduler {
    constructor() {
        this.tasks = new Map();
        this.intervals = new Map();
        this.loadTasks();
    }

    // Загрузка задач из файла
    loadTasks() {
        try {
            const tasksFile = path.join(__dirname, '../scheduled_tasks.json');
            if (fs.existsSync(tasksFile)) {
                const data = JSON.parse(fs.readFileSync(tasksFile, 'utf8'));
                data.forEach(task => {
                    this.tasks.set(task.id, task);
                    if (task.enabled) {
                        this.scheduleTask(task);
                    }
                });
            }
        } catch (error) {
            console.error('Error loading tasks:', error);
        }
    }

    // Сохранение задач в файл
    saveTasks() {
        try {
            const tasksFile = path.join(__dirname, '../scheduled_tasks.json');
            const tasksArray = Array.from(this.tasks.values());
            fs.writeFileSync(tasksFile, JSON.stringify(tasksArray, null, 2));
        } catch (error) {
            console.error('Error saving tasks:', error);
        }
    }

    // Создание новой задачи
    createTask(name, command, schedule, deviceId = 'all', enabled = true) {
        const task = {
            id: this.generateId(),
            name,
            command,
            schedule, // в минутах
            deviceId,
            enabled,
            createdAt: new Date(),
            lastRun: null,
            runCount: 0
        };

        this.tasks.set(task.id, task);
        
        if (enabled) {
            this.scheduleTask(task);
        }
        
        this.saveTasks();
        return task;
    }

    // Планирование задачи
    scheduleTask(task) {
        if (this.intervals.has(task.id)) {
            clearInterval(this.intervals.get(task.id));
        }

        const interval = setInterval(() => {
            this.executeTask(task);
        }, task.schedule * 60 * 1000); // конвертация в миллисекунды

        this.intervals.set(task.id, interval);
    }

    // Выполнение задачи
    executeTask(task) {
        console.log(`Executing scheduled task: ${task.name}`);
        
        task.lastRun = new Date();
        task.runCount++;
        
        // Здесь должна быть логика отправки команды устройству
        // Это будет интегрировано с основным сервером
        if (this.onTaskExecute) {
            this.onTaskExecute(task);
        }
        
        this.saveTasks();
    }

    // Получение всех задач
    getAllTasks() {
        return Array.from(this.tasks.values());
    }

    // Получение задачи по ID
    getTask(id) {
        return this.tasks.get(id);
    }

    // Обновление задачи
    updateTask(id, updates) {
        const task = this.tasks.get(id);
        if (!task) return null;

        Object.assign(task, updates);
        
        if (task.enabled) {
            this.scheduleTask(task);
        } else {
            this.stopTask(id);
        }
        
        this.saveTasks();
        return task;
    }

    // Удаление задачи
    deleteTask(id) {
        this.stopTask(id);
        const deleted = this.tasks.delete(id);
        if (deleted) {
            this.saveTasks();
        }
        return deleted;
    }

    // Остановка задачи
    stopTask(id) {
        if (this.intervals.has(id)) {
            clearInterval(this.intervals.get(id));
            this.intervals.delete(id);
        }
    }

    // Включение/выключение задачи
    toggleTask(id) {
        const task = this.tasks.get(id);
        if (!task) return null;

        task.enabled = !task.enabled;
        
        if (task.enabled) {
            this.scheduleTask(task);
        } else {
            this.stopTask(id);
        }
        
        this.saveTasks();
        return task;
    }

    // Генерация уникального ID
    generateId() {
        return 'task_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
    }

    // Форматирование задач для отображения
    formatTasksForDisplay() {
        const tasks = this.getAllTasks();
        
        if (tasks.length === 0) {
            return 'No scheduled tasks found.';
        }

        let message = '📋 <b>Scheduled Tasks</b>\n\n';
        
        tasks.forEach((task, index) => {
            const status = task.enabled ? '✅' : '❌';
            const lastRun = task.lastRun ? task.lastRun.toLocaleString() : 'Never';
            
            message += `${index + 1}. ${status} <b>${task.name}</b>\n`;
            message += `   📱 Device: ${task.deviceId}\n`;
            message += `   ⚙️ Command: ${task.command}\n`;
            message += `   ⏰ Every: ${task.schedule} minutes\n`;
            message += `   🔄 Runs: ${task.runCount}\n`;
            message += `   📅 Last run: ${lastRun}\n\n`;
        });

        return message;
    }

    // Остановка всех задач при завершении
    shutdown() {
        this.intervals.forEach((interval, id) => {
            clearInterval(interval);
        });
        this.intervals.clear();
    }
}

module.exports = TaskScheduler;