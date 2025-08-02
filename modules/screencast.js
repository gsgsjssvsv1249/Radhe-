const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

class ScreencastManager {
    constructor() {
        this.activeSessions = new Map();
        this.screenshotDir = path.join(__dirname, '../screenshots');
        this.videoDir = path.join(__dirname, '../videos');
        this.maxScreenshots = 100;
        this.defaultQuality = 80;
        this.initDirectories();
    }

    // Инициализация директорий
    initDirectories() {
        [this.screenshotDir, this.videoDir].forEach(dir => {
            if (!fs.existsSync(dir)) {
                fs.mkdirSync(dir, { recursive: true });
            }
        });
    }

    // Создание сессии трансляции
    createSession(deviceId, options = {}) {
        const sessionId = this.generateSessionId();
        const session = {
            id: sessionId,
            deviceId: deviceId,
            startTime: new Date(),
            isActive: true,
            frameCount: 0,
            quality: options.quality || this.defaultQuality,
            interval: options.interval || 1000, // миллисекунды
            resolution: options.resolution || 'auto',
            format: options.format || 'jpeg',
            lastFrame: null,
            viewers: new Set(),
            stats: {
                totalFrames: 0,
                droppedFrames: 0,
                avgFps: 0,
                dataTransferred: 0
            }
        };

        this.activeSessions.set(sessionId, session);
        console.log(`📺 Screen session created: ${sessionId} for device ${deviceId}`);
        
        return session;
    }

    // Остановка сессии трансляции
    stopSession(sessionId) {
        const session = this.activeSessions.get(sessionId);
        if (session) {
            session.isActive = false;
            session.endTime = new Date();
            session.duration = session.endTime - session.startTime;
            
            console.log(`📺 Screen session stopped: ${sessionId}`);
            console.log(`   Duration: ${Math.round(session.duration / 1000)}s`);
            console.log(`   Frames: ${session.stats.totalFrames}`);
            
            // Сохраняем статистику
            this.saveSessionStats(session);
            
            // Удаляем из активных сессий через 5 минут
            setTimeout(() => {
                this.activeSessions.delete(sessionId);
            }, 5 * 60 * 1000);
            
            return session;
        }
        return null;
    }

    // Получение активных сессий
    getActiveSessions() {
        return Array.from(this.activeSessions.values()).filter(s => s.isActive);
    }

    // Получение сессии по ID
    getSession(sessionId) {
        return this.activeSessions.get(sessionId);
    }

    // Добавление зрителя к сессии
    addViewer(sessionId, viewerId) {
        const session = this.activeSessions.get(sessionId);
        if (session) {
            session.viewers.add(viewerId);
            return true;
        }
        return false;
    }

    // Удаление зрителя
    removeViewer(sessionId, viewerId) {
        const session = this.activeSessions.get(sessionId);
        if (session) {
            session.viewers.delete(viewerId);
            return true;
        }
        return false;
    }

    // Обработка нового кадра
    processFrame(sessionId, frameData) {
        const session = this.activeSessions.get(sessionId);
        if (!session || !session.isActive) {
            return false;
        }

        try {
            // Обновляем статистику
            session.frameCount++;
            session.stats.totalFrames++;
            session.stats.dataTransferred += frameData.length;
            
            // Вычисляем FPS
            const elapsed = (Date.now() - session.startTime) / 1000;
            session.stats.avgFps = session.stats.totalFrames / elapsed;
            
            // Сохраняем последний кадр
            session.lastFrame = {
                data: frameData,
                timestamp: new Date(),
                size: frameData.length
            };

            // Сохраняем кадр как скриншот (опционально)
            if (session.saveFrames) {
                this.saveFrame(sessionId, frameData);
            }

            return true;
        } catch (error) {
            console.error('Error processing frame:', error);
            session.stats.droppedFrames++;
            return false;
        }
    }

    // Сохранение кадра как скриншот
    saveFrame(sessionId, frameData) {
        try {
            const session = this.activeSessions.get(sessionId);
            if (!session) return false;

            const filename = `${sessionId}_frame_${session.frameCount}_${Date.now()}.${session.format}`;
            const filepath = path.join(this.screenshotDir, filename);
            
            fs.writeFileSync(filepath, frameData);
            
            // Ограничиваем количество сохраненных скриншотов
            this.cleanupOldScreenshots();
            
            return filepath;
        } catch (error) {
            console.error('Error saving frame:', error);
            return null;
        }
    }

    // Создание скриншота
    async takeScreenshot(deviceId, options = {}) {
        try {
            const filename = `screenshot_${deviceId}_${Date.now()}.${options.format || 'png'}`;
            const filepath = path.join(this.screenshotDir, filename);
            
            // Здесь должна быть логика получения скриншота с устройства
            // Возвращаем информацию о скриншоте
            return {
                success: true,
                filename: filename,
                filepath: filepath,
                deviceId: deviceId,
                timestamp: new Date(),
                size: 0, // Будет заполнено после получения данных
                format: options.format || 'png',
                quality: options.quality || this.defaultQuality
            };
        } catch (error) {
            return {
                success: false,
                error: error.message
            };
        }
    }

    // Запись экрана в видео
    startRecording(deviceId, options = {}) {
        try {
            const recordingId = this.generateSessionId();
            const filename = `recording_${deviceId}_${Date.now()}.${options.format || 'mp4'}`;
            const filepath = path.join(this.videoDir, filename);
            
            const recording = {
                id: recordingId,
                deviceId: deviceId,
                filename: filename,
                filepath: filepath,
                startTime: new Date(),
                isRecording: true,
                duration: options.duration || 60, // секунды
                quality: options.quality || this.defaultQuality,
                resolution: options.resolution || 'auto',
                format: options.format || 'mp4',
                frameRate: options.frameRate || 30,
                stats: {
                    framesRecorded: 0,
                    fileSize: 0
                }
            };
            
            // Автоматическая остановка записи
            if (recording.duration > 0) {
                setTimeout(() => {
                    this.stopRecording(recordingId);
                }, recording.duration * 1000);
            }
            
            console.log(`🎬 Recording started: ${recordingId} for device ${deviceId}`);
            return recording;
        } catch (error) {
            return {
                success: false,
                error: error.message
            };
        }
    }

    // Остановка записи
    stopRecording(recordingId) {
        try {
            // Здесь должна быть логика остановки записи
            console.log(`🎬 Recording stopped: ${recordingId}`);
            
            return {
                success: true,
                recordingId: recordingId,
                endTime: new Date()
            };
        } catch (error) {
            return {
                success: false,
                error: error.message
            };
        }
    }

    // Получение списка скриншотов
    getScreenshots(deviceId = null, limit = 20) {
        try {
            const files = fs.readdirSync(this.screenshotDir);
            let screenshots = files
                .filter(file => file.startsWith('screenshot_'))
                .map(file => {
                    const filepath = path.join(this.screenshotDir, file);
                    const stats = fs.statSync(filepath);
                    
                    return {
                        filename: file,
                        filepath: filepath,
                        size: stats.size,
                        created: stats.birthtime,
                        modified: stats.mtime,
                        deviceId: this.extractDeviceIdFromFilename(file)
                    };
                })
                .sort((a, b) => b.created - a.created);
            
            // Фильтрация по устройству
            if (deviceId) {
                screenshots = screenshots.filter(s => s.deviceId === deviceId);
            }
            
            return screenshots.slice(0, limit);
        } catch (error) {
            console.error('Error getting screenshots:', error);
            return [];
        }
    }

    // Получение списка записей
    getRecordings(deviceId = null, limit = 10) {
        try {
            const files = fs.readdirSync(this.videoDir);
            let recordings = files
                .filter(file => file.startsWith('recording_'))
                .map(file => {
                    const filepath = path.join(this.videoDir, file);
                    const stats = fs.statSync(filepath);
                    
                    return {
                        filename: file,
                        filepath: filepath,
                        size: stats.size,
                        created: stats.birthtime,
                        modified: stats.mtime,
                        deviceId: this.extractDeviceIdFromFilename(file),
                        duration: this.getVideoDuration(filepath)
                    };
                })
                .sort((a, b) => b.created - a.created);
            
            // Фильтрация по устройству
            if (deviceId) {
                recordings = recordings.filter(r => r.deviceId === deviceId);
            }
            
            return recordings.slice(0, limit);
        } catch (error) {
            console.error('Error getting recordings:', error);
            return [];
        }
    }

    // Удаление старых скриншотов
    cleanupOldScreenshots() {
        try {
            const screenshots = this.getScreenshots();
            
            if (screenshots.length > this.maxScreenshots) {
                const toDelete = screenshots.slice(this.maxScreenshots);
                
                toDelete.forEach(screenshot => {
                    try {
                        fs.unlinkSync(screenshot.filepath);
                    } catch (error) {
                        console.error('Error deleting screenshot:', error);
                    }
                });
                
                console.log(`🧹 Cleaned up ${toDelete.length} old screenshots`);
            }
        } catch (error) {
            console.error('Error cleaning up screenshots:', error);
        }
    }

    // Получение статистики трансляций
    getStats() {
        const activeSessions = this.getActiveSessions();
        const totalSessions = this.activeSessions.size;
        const screenshots = this.getScreenshots();
        const recordings = this.getRecordings();
        
        return {
            activeSessions: activeSessions.length,
            totalSessions: totalSessions,
            totalScreenshots: screenshots.length,
            totalRecordings: recordings.length,
            diskUsage: this.calculateDiskUsage(),
            sessions: activeSessions.map(s => ({
                id: s.id,
                deviceId: s.deviceId,
                duration: Date.now() - s.startTime,
                frameCount: s.frameCount,
                viewers: s.viewers.size,
                avgFps: s.stats.avgFps
            }))
        };
    }

    // Вычисление использования диска
    calculateDiskUsage() {
        try {
            let totalSize = 0;
            
            // Размер скриншотов
            const screenshots = fs.readdirSync(this.screenshotDir);
            screenshots.forEach(file => {
                const filepath = path.join(this.screenshotDir, file);
                const stats = fs.statSync(filepath);
                totalSize += stats.size;
            });
            
            // Размер записей
            const recordings = fs.readdirSync(this.videoDir);
            recordings.forEach(file => {
                const filepath = path.join(this.videoDir, file);
                const stats = fs.statSync(filepath);
                totalSize += stats.size;
            });
            
            return {
                totalBytes: totalSize,
                totalMB: Math.round(totalSize / 1024 / 1024),
                screenshots: screenshots.length,
                recordings: recordings.length
            };
        } catch (error) {
            return { totalBytes: 0, totalMB: 0, screenshots: 0, recordings: 0 };
        }
    }

    // Форматирование статистики для Telegram
    formatStatsForTelegram() {
        const stats = this.getStats();
        
        let message = '📺 <b>Screen Sharing Statistics</b>\n\n';
        message += `🔴 <b>Active Sessions:</b> ${stats.activeSessions}\n`;
        message += `📊 <b>Total Sessions:</b> ${stats.totalSessions}\n`;
        message += `📸 <b>Screenshots:</b> ${stats.totalScreenshots}\n`;
        message += `🎬 <b>Recordings:</b> ${stats.totalRecordings}\n`;
        message += `💾 <b>Disk Usage:</b> ${stats.diskUsage.totalMB} MB\n\n`;
        
        if (stats.activeSessions > 0) {
            message += '<b>Active Sessions:</b>\n';
            stats.sessions.forEach((session, index) => {
                const duration = Math.round(session.duration / 1000);
                message += `${index + 1}. Device: ${session.deviceId}\n`;
                message += `   ⏱️ Duration: ${duration}s\n`;
                message += `   🖼️ Frames: ${session.frameCount}\n`;
                message += `   👥 Viewers: ${session.viewers}\n`;
                message += `   📊 FPS: ${session.avgFps.toFixed(1)}\n\n`;
            });
        }
        
        return message;
    }

    // Форматирование списка скриншотов для Telegram
    formatScreenshotsForTelegram(screenshots) {
        if (screenshots.length === 0) {
            return '📸 <b>Screenshots</b>\n\nNo screenshots found.';
        }
        
        let message = '📸 <b>Recent Screenshots</b>\n\n';
        
        screenshots.slice(0, 10).forEach((screenshot, index) => {
            const size = this.formatFileSize(screenshot.size);
            const time = screenshot.created.toLocaleString();
            
            message += `${index + 1}. <b>${screenshot.filename}</b>\n`;
            message += `   📱 Device: ${screenshot.deviceId}\n`;
            message += `   📏 Size: ${size}\n`;
            message += `   📅 Created: ${time}\n\n`;
        });
        
        if (screenshots.length > 10) {
            message += `... and ${screenshots.length - 10} more screenshots`;
        }
        
        return message;
    }

    // Форматирование списка записей для Telegram
    formatRecordingsForTelegram(recordings) {
        if (recordings.length === 0) {
            return '🎬 <b>Recordings</b>\n\nNo recordings found.';
        }
        
        let message = '🎬 <b>Recent Recordings</b>\n\n';
        
        recordings.slice(0, 5).forEach((recording, index) => {
            const size = this.formatFileSize(recording.size);
            const time = recording.created.toLocaleString();
            
            message += `${index + 1}. <b>${recording.filename}</b>\n`;
            message += `   📱 Device: ${recording.deviceId}\n`;
            message += `   📏 Size: ${size}\n`;
            message += `   ⏱️ Duration: ${recording.duration || 'Unknown'}\n`;
            message += `   📅 Created: ${time}\n\n`;
        });
        
        if (recordings.length > 5) {
            message += `... and ${recordings.length - 5} more recordings`;
        }
        
        return message;
    }

    // Вспомогательные методы
    generateSessionId() {
        return 'screen_' + Date.now() + '_' + crypto.randomBytes(4).toString('hex');
    }

    extractDeviceIdFromFilename(filename) {
        const match = filename.match(/_(.*?)_\d+\./);
        return match ? match[1] : 'unknown';
    }

    formatFileSize(bytes) {
        if (bytes === 0) return '0 B';
        const k = 1024;
        const sizes = ['B', 'KB', 'MB', 'GB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
    }

    getVideoDuration(filepath) {
        // Здесь должна быть логика получения длительности видео
        // Для простоты возвращаем заглушку
        return 'Unknown';
    }

    saveSessionStats(session) {
        try {
            const statsFile = path.join(__dirname, '../screencast_stats.json');
            let allStats = [];
            
            if (fs.existsSync(statsFile)) {
                allStats = JSON.parse(fs.readFileSync(statsFile, 'utf8'));
            }
            
            allStats.push({
                sessionId: session.id,
                deviceId: session.deviceId,
                startTime: session.startTime,
                endTime: session.endTime,
                duration: session.duration,
                stats: session.stats
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

    // Очистка всех данных
    cleanup() {
        try {
            // Останавливаем все активные сессии
            this.activeSessions.forEach((session, sessionId) => {
                if (session.isActive) {
                    this.stopSession(sessionId);
                }
            });
            
            // Очищаем старые файлы
            this.cleanupOldScreenshots();
            
            console.log('📺 Screencast cleanup completed');
        } catch (error) {
            console.error('Error during cleanup:', error);
        }
    }
}

module.exports = ScreencastManager;