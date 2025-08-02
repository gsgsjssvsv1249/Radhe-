const { spawn } = require('child_process');
const crypto = require('crypto');
const fs = require('fs');
const path = require('path');

class ShellManager {
    constructor() {
        this.activeSessions = new Map();
        this.commandHistory = [];
        this.maxHistorySize = 1000;
        this.sessionTimeout = 30 * 60 * 1000; // 30 минут
        this.allowedCommands = this.loadAllowedCommands();
        this.blockedCommands = this.loadBlockedCommands();
        this.logFile = path.join(__dirname, '../shell_commands.log');
    }

    // Загрузка разрешенных команд
    loadAllowedCommands() {
        return [
            // Системная информация
            'ps', 'top', 'htop', 'free', 'df', 'du', 'uptime', 'whoami', 'id',
            'uname', 'lscpu', 'lsmem', 'lsblk', 'lsusb', 'lspci',
            
            // Файловые операции
            'ls', 'cat', 'head', 'tail', 'find', 'grep', 'awk', 'sed',
            'wc', 'sort', 'uniq', 'cut', 'tr', 'file', 'stat',
            
            // Сетевые команды
            'ping', 'wget', 'curl', 'netstat', 'ss', 'lsof', 'nslookup',
            'dig', 'traceroute', 'iptables', 'ifconfig', 'ip',
            
            // Процессы и сервисы
            'systemctl', 'service', 'jobs', 'nohup', 'screen', 'tmux',
            'kill', 'killall', 'pgrep', 'pkill',
            
            // Архивы и сжатие
            'tar', 'gzip', 'gunzip', 'zip', 'unzip', '7z',
            
            // Разработка
            'git', 'npm', 'node', 'python', 'python3', 'pip', 'pip3',
            'java', 'javac', 'gcc', 'make', 'cmake',
            
            // Android специфичные
            'am', 'pm', 'dumpsys', 'logcat', 'getprop', 'setprop',
            'input', 'screencap', 'screenrecord', 'monkey'
        ];
    }

    // Загрузка заблокированных команд
    loadBlockedCommands() {
        return [
            // Опасные системные команды
            'rm', 'rmdir', 'dd', 'mkfs', 'fdisk', 'parted',
            'format', 'del', 'deltree',
            
            // Изменение системы
            'chmod', 'chown', 'chgrp', 'mount', 'umount',
            'passwd', 'su', 'sudo', 'visudo',
            
            // Сетевая безопасность
            'iptables', 'ufw', 'firewall-cmd', 'netsh',
            
            // Потенциально опасные
            'eval', 'exec', 'source', '.', 'bash', 'sh', 'zsh',
            'crontab', 'at', 'batch'
        ];
    }

    // Создание новой shell сессии
    createSession(deviceId, userId, options = {}) {
        const sessionId = this.generateSessionId();
        
        const session = {
            id: sessionId,
            deviceId: deviceId,
            userId: userId,
            startTime: new Date(),
            lastActivity: new Date(),
            isActive: true,
            shell: options.shell || '/system/bin/sh',
            workingDirectory: options.workingDirectory || '/',
            environment: options.environment || {},
            commandCount: 0,
            outputBuffer: [],
            maxBufferSize: options.maxBufferSize || 1000,
            timeout: options.timeout || this.sessionTimeout,
            permissions: options.permissions || 'limited'
        };

        this.activeSessions.set(sessionId, session);
        
        // Автоматическое закрытие сессии по таймауту
        setTimeout(() => {
            this.closeSession(sessionId, 'timeout');
        }, session.timeout);

        this.logCommand(sessionId, 'SESSION_CREATED', `Shell session created for device ${deviceId}`);
        console.log(`🐚 Shell session created: ${sessionId} for device ${deviceId}`);
        
        return session;
    }

    // Выполнение команды
    async executeCommand(sessionId, command, options = {}) {
        const session = this.activeSessions.get(sessionId);
        if (!session || !session.isActive) {
            return {
                success: false,
                error: 'Session not found or inactive',
                sessionId: sessionId
            };
        }

        // Обновляем время последней активности
        session.lastActivity = new Date();
        session.commandCount++;

        // Проверка безопасности команды
        const securityCheck = this.checkCommandSecurity(command);
        if (!securityCheck.allowed) {
            this.logCommand(sessionId, 'BLOCKED_COMMAND', command, 'security');
            return {
                success: false,
                error: `Command blocked: ${securityCheck.reason}`,
                command: command,
                sessionId: sessionId
            };
        }

        try {
            // Логируем команду
            this.logCommand(sessionId, 'EXECUTE', command);

            // Выполняем команду
            const result = await this.runCommand(command, {
                cwd: session.workingDirectory,
                env: { ...process.env, ...session.environment },
                timeout: options.timeout || 30000,
                maxBuffer: options.maxBuffer || 1024 * 1024 // 1MB
            });

            // Сохраняем результат в буфер сессии
            this.addToBuffer(session, {
                command: command,
                timestamp: new Date(),
                result: result,
                success: result.success
            });

            this.logCommand(sessionId, 'COMPLETED', command, result.success ? 'success' : 'error');

            return {
                success: true,
                command: command,
                result: result,
                sessionId: sessionId,
                executionTime: result.executionTime
            };

        } catch (error) {
            this.logCommand(sessionId, 'ERROR', command, 'error', error.message);
            
            return {
                success: false,
                error: error.message,
                command: command,
                sessionId: sessionId
            };
        }
    }

    // Выполнение команды в системе
    runCommand(command, options = {}) {
        return new Promise((resolve) => {
            const startTime = Date.now();
            const parts = command.trim().split(' ');
            const cmd = parts[0];
            const args = parts.slice(1);

            const child = spawn(cmd, args, {
                cwd: options.cwd || process.cwd(),
                env: options.env || process.env,
                timeout: options.timeout || 30000
            });

            let stdout = '';
            let stderr = '';

            child.stdout.on('data', (data) => {
                stdout += data.toString();
                if (stdout.length > options.maxBuffer) {
                    child.kill();
                    resolve({
                        success: false,
                        error: 'Output buffer exceeded',
                        stdout: stdout.substring(0, options.maxBuffer),
                        stderr: stderr,
                        executionTime: Date.now() - startTime
                    });
                }
            });

            child.stderr.on('data', (data) => {
                stderr += data.toString();
            });

            child.on('close', (code) => {
                resolve({
                    success: code === 0,
                    exitCode: code,
                    stdout: stdout,
                    stderr: stderr,
                    executionTime: Date.now() - startTime
                });
            });

            child.on('error', (error) => {
                resolve({
                    success: false,
                    error: error.message,
                    stdout: stdout,
                    stderr: stderr,
                    executionTime: Date.now() - startTime
                });
            });
        });
    }

    // Проверка безопасности команды
    checkCommandSecurity(command) {
        const cmd = command.trim().split(' ')[0].toLowerCase();
        
        // Проверка на заблокированные команды
        if (this.blockedCommands.includes(cmd)) {
            return {
                allowed: false,
                reason: 'Command is in blocked list'
            };
        }

        // Проверка на опасные паттерны
        const dangerousPatterns = [
            /rm\s+-rf\s+\//, // rm -rf /
            />\s*\/dev\//, // redirect to device files
            /mkfs/, // format filesystem
            /dd\s+if=.*of=\/dev/, // dd to device
            /chmod\s+777/, // dangerous permissions
            /wget.*\|\s*sh/, // download and execute
            /curl.*\|\s*bash/, // download and execute
        ];

        for (const pattern of dangerousPatterns) {
            if (pattern.test(command)) {
                return {
                    allowed: false,
                    reason: 'Command matches dangerous pattern'
                };
            }
        }

        // Проверка длины команды
        if (command.length > 1000) {
            return {
                allowed: false,
                reason: 'Command too long'
            };
        }

        return { allowed: true };
    }

    // Получение истории команд сессии
    getSessionHistory(sessionId, limit = 20) {
        const session = this.activeSessions.get(sessionId);
        if (!session) {
            return [];
        }

        return session.outputBuffer
            .slice(-limit)
            .map(entry => ({
                command: entry.command,
                timestamp: entry.timestamp,
                success: entry.success,
                output: entry.result.stdout ? entry.result.stdout.substring(0, 200) : '',
                error: entry.result.stderr ? entry.result.stderr.substring(0, 200) : ''
            }));
    }

    // Получение активных сессий
    getActiveSessions() {
        return Array.from(this.activeSessions.values())
            .filter(session => session.isActive)
            .map(session => ({
                id: session.id,
                deviceId: session.deviceId,
                userId: session.userId,
                startTime: session.startTime,
                lastActivity: session.lastActivity,
                commandCount: session.commandCount,
                workingDirectory: session.workingDirectory,
                uptime: Date.now() - session.startTime
            }));
    }

    // Закрытие сессии
    closeSession(sessionId, reason = 'manual') {
        const session = this.activeSessions.get(sessionId);
        if (session) {
            session.isActive = false;
            session.endTime = new Date();
            session.closeReason = reason;

            this.logCommand(sessionId, 'SESSION_CLOSED', `Session closed: ${reason}`);
            console.log(`🐚 Shell session closed: ${sessionId} (${reason})`);

            // Сохраняем статистику сессии
            this.saveSessionStats(session);

            // Удаляем из активных сессий через 5 минут
            setTimeout(() => {
                this.activeSessions.delete(sessionId);
            }, 5 * 60 * 1000);

            return true;
        }
        return false;
    }

    // Изменение рабочей директории
    changeDirectory(sessionId, directory) {
        const session = this.activeSessions.get(sessionId);
        if (session && session.isActive) {
            session.workingDirectory = directory;
            session.lastActivity = new Date();
            
            this.logCommand(sessionId, 'CHANGE_DIR', directory);
            return true;
        }
        return false;
    }

    // Установка переменной окружения
    setEnvironmentVariable(sessionId, key, value) {
        const session = this.activeSessions.get(sessionId);
        if (session && session.isActive) {
            session.environment[key] = value;
            session.lastActivity = new Date();
            
            this.logCommand(sessionId, 'SET_ENV', `${key}=${value}`);
            return true;
        }
        return false;
    }

    // Получение статистики
    getStats() {
        const activeSessions = this.getActiveSessions();
        const totalCommands = this.commandHistory.length;
        const recentCommands = this.commandHistory.slice(-100);
        
        return {
            activeSessions: activeSessions.length,
            totalSessions: this.activeSessions.size,
            totalCommands: totalCommands,
            recentCommands: recentCommands.length,
            sessions: activeSessions
        };
    }

    // Форматирование статистики для Telegram
    formatStatsForTelegram() {
        const stats = this.getStats();
        
        let message = '🐚 <b>Shell Statistics</b>\n\n';
        message += `🔴 <b>Active Sessions:</b> ${stats.activeSessions}\n`;
        message += `📊 <b>Total Sessions:</b> ${stats.totalSessions}\n`;
        message += `⌨️ <b>Total Commands:</b> ${stats.totalCommands}\n`;
        message += `📝 <b>Recent Commands:</b> ${stats.recentCommands}\n\n`;
        
        if (stats.activeSessions > 0) {
            message += '<b>Active Sessions:</b>\n';
            stats.sessions.forEach((session, index) => {
                const uptime = Math.round(session.uptime / 1000);
                const lastActivity = Math.round((Date.now() - session.lastActivity) / 1000);
                
                message += `${index + 1}. <b>${session.id}</b>\n`;
                message += `   📱 Device: ${session.deviceId}\n`;
                message += `   ⏱️ Uptime: ${uptime}s\n`;
                message += `   🕐 Last activity: ${lastActivity}s ago\n`;
                message += `   ⌨️ Commands: ${session.commandCount}\n`;
                message += `   📁 Directory: ${session.workingDirectory}\n\n`;
            });
        }
        
        return message;
    }

    // Форматирование истории команд для Telegram
    formatHistoryForTelegram(sessionId, limit = 10) {
        const history = this.getSessionHistory(sessionId, limit);
        
        if (history.length === 0) {
            return '📝 <b>Command History</b>\n\nNo commands executed yet.';
        }
        
        let message = `📝 <b>Command History - ${sessionId}</b>\n\n`;
        
        history.forEach((entry, index) => {
            const status = entry.success ? '✅' : '❌';
            const time = entry.timestamp.toLocaleTimeString();
            
            message += `${index + 1}. ${status} <code>${entry.command}</code>\n`;
            message += `   🕐 ${time}\n`;
            
            if (entry.output) {
                const output = entry.output.length > 100 
                    ? entry.output.substring(0, 100) + '...'
                    : entry.output;
                message += `   📤 ${output}\n`;
            }
            
            if (entry.error) {
                const error = entry.error.length > 100 
                    ? entry.error.substring(0, 100) + '...'
                    : entry.error;
                message += `   ❌ ${error}\n`;
            }
            
            message += '\n';
        });
        
        return message;
    }

    // Получение списка доступных команд
    getAvailableCommands() {
        return {
            allowed: this.allowedCommands,
            blocked: this.blockedCommands,
            categories: {
                system: ['ps', 'top', 'free', 'df', 'uptime', 'uname'],
                files: ['ls', 'cat', 'find', 'grep', 'head', 'tail'],
                network: ['ping', 'wget', 'curl', 'netstat', 'nslookup'],
                android: ['am', 'pm', 'dumpsys', 'logcat', 'getprop']
            }
        };
    }

    // Форматирование списка команд для Telegram
    formatCommandsForTelegram() {
        const commands = this.getAvailableCommands();
        
        let message = '⌨️ <b>Available Commands</b>\n\n';
        
        Object.entries(commands.categories).forEach(([category, cmds]) => {
            const categoryNames = {
                system: '🖥️ System',
                files: '📁 Files',
                network: '🌐 Network',
                android: '📱 Android'
            };
            
            message += `${categoryNames[category] || category}:\n`;
            message += `<code>${cmds.join(', ')}</code>\n\n`;
        });
        
        message += `📊 <b>Total allowed:</b> ${commands.allowed.length}\n`;
        message += `🚫 <b>Total blocked:</b> ${commands.blocked.length}`;
        
        return message;
    }

    // Вспомогательные методы
    generateSessionId() {
        return 'shell_' + Date.now() + '_' + crypto.randomBytes(4).toString('hex');
    }

    addToBuffer(session, entry) {
        session.outputBuffer.push(entry);
        
        // Ограничиваем размер буфера
        if (session.outputBuffer.length > session.maxBufferSize) {
            session.outputBuffer.shift();
        }
    }

    logCommand(sessionId, action, command, status = 'info', details = '') {
        const logEntry = {
            timestamp: new Date(),
            sessionId: sessionId,
            action: action,
            command: command,
            status: status,
            details: details
        };

        this.commandHistory.push(logEntry);

        // Ограничиваем размер истории
        if (this.commandHistory.length > this.maxHistorySize) {
            this.commandHistory.shift();
        }

        // Сохраняем в файл
        try {
            const logLine = `${logEntry.timestamp.toISOString()} | ${sessionId} | ${action} | ${command} | ${status} | ${details}\n`;
            fs.appendFileSync(this.logFile, logLine);
        } catch (error) {
            console.error('Error writing to shell log:', error);
        }

        console.log(`🐚 [${sessionId}] ${action}: ${command} (${status})`);
    }

    saveSessionStats(session) {
        try {
            const statsFile = path.join(__dirname, '../shell_stats.json');
            let allStats = [];
            
            if (fs.existsSync(statsFile)) {
                allStats = JSON.parse(fs.readFileSync(statsFile, 'utf8'));
            }
            
            allStats.push({
                sessionId: session.id,
                deviceId: session.deviceId,
                userId: session.userId,
                startTime: session.startTime,
                endTime: session.endTime,
                duration: session.endTime - session.startTime,
                commandCount: session.commandCount,
                closeReason: session.closeReason
            });
            
            // Ограничиваем количество сохраненных статистик
            if (allStats.length > 100) {
                allStats = allStats.slice(-100);
            }
            
            fs.writeFileSync(statsFile, JSON.stringify(allStats, null, 2));
        } catch (error) {
            console.error('Error saving session stats:', error);
        }
    }

    // Очистка неактивных сессий
    cleanup() {
        const now = Date.now();
        let cleanedCount = 0;

        this.activeSessions.forEach((session, sessionId) => {
            const inactiveTime = now - session.lastActivity.getTime();
            
            if (inactiveTime > session.timeout) {
                this.closeSession(sessionId, 'timeout');
                cleanedCount++;
            }
        });

        if (cleanedCount > 0) {
            console.log(`🐚 Cleaned up ${cleanedCount} inactive shell sessions`);
        }
    }
}

module.exports = ShellManager;