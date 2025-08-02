const crypto = require('crypto');
const fs = require('fs');
const path = require('path');

class SecurityManager {
    constructor() {
        this.encryptionKey = this.generateEncryptionKey();
        this.securityLogs = [];
        this.blockedIPs = new Set();
        this.failedAttempts = new Map();
        this.maxFailedAttempts = 5;
        this.blockDuration = 30 * 60 * 1000; // 30 минут
    }

    // Генерация ключа шифрования
    generateEncryptionKey() {
        return crypto.randomBytes(32);
    }

    // Шифрование данных
    encrypt(text) {
        try {
            const iv = crypto.randomBytes(16);
            const cipher = crypto.createCipheriv('aes-256-cbc', this.encryptionKey, iv);
            let encrypted = cipher.update(text, 'utf8', 'hex');
            encrypted += cipher.final('hex');
            return {
                iv: iv.toString('hex'),
                encryptedData: encrypted
            };
        } catch (error) {
            console.error('Encryption error:', error);
            return null;
        }
    }

    // Расшифровка данных
    decrypt(encryptedData, ivHex) {
        try {
            const iv = Buffer.from(ivHex, 'hex');
            const decipher = crypto.createDecipheriv('aes-256-cbc', this.encryptionKey, iv);
            let decrypted = decipher.update(encryptedData, 'hex', 'utf8');
            decrypted += decipher.final('utf8');
            return decrypted;
        } catch (error) {
            console.error('Decryption error:', error);
            return null;
        }
    }

    // Генерация безопасного токена
    generateSecureToken(length = 32) {
        return crypto.randomBytes(length).toString('hex');
    }

    // Хеширование пароля
    hashPassword(password) {
        const salt = crypto.randomBytes(16).toString('hex');
        const hash = crypto.pbkdf2Sync(password, salt, 10000, 64, 'sha512').toString('hex');
        return { salt, hash };
    }

    // Проверка пароля
    verifyPassword(password, salt, hash) {
        const hashToVerify = crypto.pbkdf2Sync(password, salt, 10000, 64, 'sha512').toString('hex');
        return hash === hashToVerify;
    }

    // Логирование событий безопасности
    logSecurityEvent(event, details, severity = 'info') {
        const logEntry = {
            timestamp: new Date(),
            event,
            details,
            severity,
            id: crypto.randomUUID()
        };

        this.securityLogs.push(logEntry);

        // Ограничиваем размер логов
        if (this.securityLogs.length > 1000) {
            this.securityLogs.shift();
        }

        // Сохраняем критические события в файл
        if (severity === 'critical' || severity === 'warning') {
            this.saveSecurityLog(logEntry);
        }

        console.log(`[SECURITY ${severity.toUpperCase()}] ${event}: ${details}`);
    }

    // Сохранение логов безопасности
    saveSecurityLog(logEntry) {
        try {
            const logFile = path.join(__dirname, '../security.log');
            const logLine = `${logEntry.timestamp.toISOString()} | ${logEntry.severity.toUpperCase()} | ${logEntry.event} | ${logEntry.details}\n`;
            fs.appendFileSync(logFile, logLine);
        } catch (error) {
            console.error('Error saving security log:', error);
        }
    }

    // Проверка IP на блокировку
    isIPBlocked(ip) {
        return this.blockedIPs.has(ip);
    }

    // Блокировка IP
    blockIP(ip, reason = 'Security violation') {
        this.blockedIPs.add(ip);
        this.logSecurityEvent('IP_BLOCKED', `IP ${ip} blocked: ${reason}`, 'warning');

        // Автоматическая разблокировка через время
        setTimeout(() => {
            this.unblockIP(ip);
        }, this.blockDuration);
    }

    // Разблокировка IP
    unblockIP(ip) {
        if (this.blockedIPs.delete(ip)) {
            this.logSecurityEvent('IP_UNBLOCKED', `IP ${ip} unblocked`, 'info');
        }
    }

    // Отслеживание неудачных попыток
    recordFailedAttempt(ip) {
        const attempts = this.failedAttempts.get(ip) || 0;
        const newAttempts = attempts + 1;
        
        this.failedAttempts.set(ip, newAttempts);
        this.logSecurityEvent('FAILED_ATTEMPT', `Failed attempt from ${ip} (${newAttempts}/${this.maxFailedAttempts})`, 'warning');

        if (newAttempts >= this.maxFailedAttempts) {
            this.blockIP(ip, 'Too many failed attempts');
            this.failedAttempts.delete(ip);
        }

        // Очистка счетчика через время
        setTimeout(() => {
            this.failedAttempts.delete(ip);
        }, 15 * 60 * 1000); // 15 минут
    }

    // Сброс неудачных попыток (при успешной авторизации)
    resetFailedAttempts(ip) {
        this.failedAttempts.delete(ip);
    }

    // Проверка подозрительной активности
    detectSuspiciousActivity(deviceId, command) {
        const suspiciousCommands = [
            'self_destruct',
            'format_device',
            'delete_all_data',
            'factory_reset'
        ];

        if (suspiciousCommands.includes(command)) {
            this.logSecurityEvent('SUSPICIOUS_COMMAND', 
                `Suspicious command '${command}' sent to device ${deviceId}`, 'critical');
            return true;
        }

        return false;
    }

    // Генерация отчета безопасности
    generateSecurityReport() {
        const now = new Date();
        const last24h = new Date(now.getTime() - 24 * 60 * 60 * 1000);
        
        const recentLogs = this.securityLogs.filter(log => log.timestamp >= last24h);
        const criticalEvents = recentLogs.filter(log => log.severity === 'critical').length;
        const warningEvents = recentLogs.filter(log => log.severity === 'warning').length;
        const blockedIPsCount = this.blockedIPs.size;
        const failedAttemptsCount = this.failedAttempts.size;

        return {
            timestamp: now,
            period: '24 hours',
            totalEvents: recentLogs.length,
            criticalEvents,
            warningEvents,
            blockedIPs: blockedIPsCount,
            activeFailedAttempts: failedAttemptsCount,
            recentEvents: recentLogs.slice(-10) // Последние 10 событий
        };
    }

    // Форматирование отчета для Telegram
    formatSecurityReportForTelegram() {
        const report = this.generateSecurityReport();
        
        let message = '🔒 <b>Security Report (24h)</b>\n\n';
        message += `📊 <b>Events:</b> ${report.totalEvents}\n`;
        message += `🚨 <b>Critical:</b> ${report.criticalEvents}\n`;
        message += `⚠️ <b>Warnings:</b> ${report.warningEvents}\n`;
        message += `🚫 <b>Blocked IPs:</b> ${report.blockedIPs}\n`;
        message += `🔄 <b>Failed Attempts:</b> ${report.activeFailedAttempts}\n\n`;

        if (report.recentEvents.length > 0) {
            message += '<b>Recent Events:</b>\n';
            report.recentEvents.slice(-5).forEach((event, index) => {
                const time = event.timestamp.toLocaleTimeString();
                message += `${index + 1}. [${time}] ${event.event}\n`;
            });
        }

        return message;
    }

    // Проверка целостности файлов
    checkFileIntegrity(filePath) {
        try {
            const data = fs.readFileSync(filePath);
            const hash = crypto.createHash('sha256').update(data).digest('hex');
            return hash;
        } catch (error) {
            this.logSecurityEvent('FILE_INTEGRITY_ERROR', 
                `Error checking file integrity: ${filePath}`, 'warning');
            return null;
        }
    }

    // Создание резервной копии критических файлов
    createBackup(filePath) {
        try {
            const backupPath = filePath + '.backup.' + Date.now();
            fs.copyFileSync(filePath, backupPath);
            this.logSecurityEvent('BACKUP_CREATED', `Backup created: ${backupPath}`, 'info');
            return backupPath;
        } catch (error) {
            this.logSecurityEvent('BACKUP_ERROR', 
                `Error creating backup for ${filePath}: ${error.message}`, 'warning');
            return null;
        }
    }

    // Очистка старых логов
    cleanupOldLogs() {
        const cutoffDate = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000); // 7 дней
        const initialLength = this.securityLogs.length;
        
        this.securityLogs = this.securityLogs.filter(log => log.timestamp >= cutoffDate);
        
        const removedCount = initialLength - this.securityLogs.length;
        if (removedCount > 0) {
            this.logSecurityEvent('LOGS_CLEANED', `Removed ${removedCount} old log entries`, 'info');
        }
    }

    // Получение статистики безопасности
    getSecurityStats() {
        return {
            totalLogs: this.securityLogs.length,
            blockedIPs: this.blockedIPs.size,
            failedAttempts: this.failedAttempts.size,
            criticalEvents: this.securityLogs.filter(log => log.severity === 'critical').length,
            warningEvents: this.securityLogs.filter(log => log.severity === 'warning').length
        };
    }
}

module.exports = SecurityManager;