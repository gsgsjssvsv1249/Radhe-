const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

class FileManager {
    constructor() {
        this.uploadDir = path.join(__dirname, '../uploads');
        this.downloadDir = path.join(__dirname, '../downloads');
        this.maxFileSize = 50 * 1024 * 1024; // 50MB
        this.allowedExtensions = [
            '.txt', '.log', '.json', '.xml', '.csv',
            '.jpg', '.jpeg', '.png', '.gif', '.bmp',
            '.mp3', '.mp4', '.avi', '.mov', '.wav',
            '.pdf', '.doc', '.docx', '.xls', '.xlsx',
            '.zip', '.rar', '.7z', '.tar', '.gz'
        ];
        this.initDirectories();
    }

    // Инициализация директорий
    initDirectories() {
        [this.uploadDir, this.downloadDir].forEach(dir => {
            if (!fs.existsSync(dir)) {
                fs.mkdirSync(dir, { recursive: true });
            }
        });
    }

    // Проверка расширения файла
    isAllowedExtension(filename) {
        const ext = path.extname(filename).toLowerCase();
        return this.allowedExtensions.includes(ext);
    }

    // Генерация безопасного имени файла
    generateSafeFilename(originalName) {
        const ext = path.extname(originalName);
        const name = path.basename(originalName, ext);
        const timestamp = Date.now();
        const random = crypto.randomBytes(4).toString('hex');
        return `${name}_${timestamp}_${random}${ext}`;
    }

    // Получение информации о файле
    getFileInfo(filePath) {
        try {
            const stats = fs.statSync(filePath);
            return {
                name: path.basename(filePath),
                size: stats.size,
                isDirectory: stats.isDirectory(),
                isFile: stats.isFile(),
                modified: stats.mtime,
                created: stats.birthtime,
                permissions: stats.mode,
                extension: path.extname(filePath)
            };
        } catch (error) {
            return null;
        }
    }

    // Форматирование размера файла
    formatFileSize(bytes) {
        if (bytes === 0) return '0 B';
        const k = 1024;
        const sizes = ['B', 'KB', 'MB', 'GB', 'TB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
    }

    // Получение списка файлов в директории
    listFiles(directoryPath, showHidden = false) {
        try {
            const files = fs.readdirSync(directoryPath);
            const fileList = [];

            files.forEach(file => {
                if (!showHidden && file.startsWith('.')) return;

                const filePath = path.join(directoryPath, file);
                const fileInfo = this.getFileInfo(filePath);
                
                if (fileInfo) {
                    fileList.push({
                        ...fileInfo,
                        path: filePath,
                        relativePath: file
                    });
                }
            });

            // Сортировка: сначала папки, потом файлы
            return fileList.sort((a, b) => {
                if (a.isDirectory && !b.isDirectory) return -1;
                if (!a.isDirectory && b.isDirectory) return 1;
                return a.name.localeCompare(b.name);
            });
        } catch (error) {
            console.error('Error listing files:', error);
            return [];
        }
    }

    // Поиск файлов по имени или расширению
    searchFiles(searchPath, query, recursive = true) {
        const results = [];
        
        try {
            const search = (dir) => {
                const files = fs.readdirSync(dir);
                
                files.forEach(file => {
                    const filePath = path.join(dir, file);
                    const stats = fs.statSync(filePath);
                    
                    // Проверка соответствия запросу
                    const matchesName = file.toLowerCase().includes(query.toLowerCase());
                    const matchesExtension = query.startsWith('.') && 
                        path.extname(file).toLowerCase() === query.toLowerCase();
                    
                    if (matchesName || matchesExtension) {
                        results.push({
                            name: file,
                            path: filePath,
                            size: stats.size,
                            isDirectory: stats.isDirectory(),
                            modified: stats.mtime
                        });
                    }
                    
                    // Рекурсивный поиск в подпапках
                    if (recursive && stats.isDirectory()) {
                        search(filePath);
                    }
                });
            };
            
            search(searchPath);
        } catch (error) {
            console.error('Error searching files:', error);
        }
        
        return results;
    }

    // Создание директории
    createDirectory(dirPath) {
        try {
            fs.mkdirSync(dirPath, { recursive: true });
            return { success: true, message: 'Directory created successfully' };
        } catch (error) {
            return { success: false, message: error.message };
        }
    }

    // Удаление файла или директории
    deleteItem(itemPath) {
        try {
            const stats = fs.statSync(itemPath);
            
            if (stats.isDirectory()) {
                fs.rmSync(itemPath, { recursive: true, force: true });
            } else {
                fs.unlinkSync(itemPath);
            }
            
            return { success: true, message: 'Item deleted successfully' };
        } catch (error) {
            return { success: false, message: error.message };
        }
    }

    // Копирование файла
    copyFile(sourcePath, destPath) {
        try {
            fs.copyFileSync(sourcePath, destPath);
            return { success: true, message: 'File copied successfully' };
        } catch (error) {
            return { success: false, message: error.message };
        }
    }

    // Перемещение файла
    moveFile(sourcePath, destPath) {
        try {
            fs.renameSync(sourcePath, destPath);
            return { success: true, message: 'File moved successfully' };
        } catch (error) {
            return { success: false, message: error.message };
        }
    }

    // Чтение текстового файла
    readTextFile(filePath, maxSize = 1024 * 1024) { // 1MB max
        try {
            const stats = fs.statSync(filePath);
            
            if (stats.size > maxSize) {
                return { 
                    success: false, 
                    message: `File too large (${this.formatFileSize(stats.size)}). Max size: ${this.formatFileSize(maxSize)}` 
                };
            }
            
            const content = fs.readFileSync(filePath, 'utf8');
            return { success: true, content };
        } catch (error) {
            return { success: false, message: error.message };
        }
    }

    // Запись в текстовый файл
    writeTextFile(filePath, content) {
        try {
            fs.writeFileSync(filePath, content, 'utf8');
            return { success: true, message: 'File written successfully' };
        } catch (error) {
            return { success: false, message: error.message };
        }
    }

    // Получение информации о диске
    getDiskUsage(dirPath) {
        try {
            const stats = fs.statSync(dirPath);
            // Примерная реализация - в реальности нужно использовать системные вызовы
            return {
                total: 'N/A',
                used: 'N/A',
                free: 'N/A',
                path: dirPath
            };
        } catch (error) {
            return null;
        }
    }

    // Архивирование файлов (базовая реализация)
    createArchive(files, archivePath) {
        // Здесь должна быть реализация создания архива
        // Для простоты возвращаем заглушку
        return { 
            success: false, 
            message: 'Archive creation not implemented yet' 
        };
    }

    // Извлечение архива
    extractArchive(archivePath, extractPath) {
        // Здесь должна быть реализация извлечения архива
        return { 
            success: false, 
            message: 'Archive extraction not implemented yet' 
        };
    }

    // Получение хеша файла
    getFileHash(filePath, algorithm = 'md5') {
        try {
            const data = fs.readFileSync(filePath);
            const hash = crypto.createHash(algorithm).update(data).digest('hex');
            return { success: true, hash };
        } catch (error) {
            return { success: false, message: error.message };
        }
    }

    // Форматирование списка файлов для Telegram
    formatFileListForTelegram(files, currentPath = '') {
        if (files.length === 0) {
            return '📁 <b>Empty Directory</b>\n\nNo files found.';
        }

        let message = `📁 <b>Files in: ${currentPath || 'Root'}</b>\n\n`;
        
        // Показываем только первые 15 файлов
        const displayFiles = files.slice(0, 15);
        
        displayFiles.forEach((file, index) => {
            const icon = file.isDirectory ? '📁' : this.getFileIcon(file.extension);
            const size = file.isDirectory ? '' : ` (${this.formatFileSize(file.size)})`;
            const modified = file.modified.toLocaleDateString();
            
            message += `${index + 1}. ${icon} <b>${file.name}</b>${size}\n`;
            message += `   📅 ${modified}\n\n`;
        });

        if (files.length > 15) {
            message += `... and ${files.length - 15} more items\n\n`;
        }

        message += `📊 Total: ${files.length} items`;
        
        return message;
    }

    // Получение иконки для файла по расширению
    getFileIcon(extension) {
        const iconMap = {
            '.txt': '📄',
            '.log': '📋',
            '.json': '📋',
            '.xml': '📋',
            '.csv': '📊',
            '.jpg': '🖼️',
            '.jpeg': '🖼️',
            '.png': '🖼️',
            '.gif': '🖼️',
            '.bmp': '🖼️',
            '.mp3': '🎵',
            '.wav': '🎵',
            '.mp4': '🎬',
            '.avi': '🎬',
            '.mov': '🎬',
            '.pdf': '📕',
            '.doc': '📘',
            '.docx': '📘',
            '.xls': '📗',
            '.xlsx': '📗',
            '.zip': '📦',
            '.rar': '📦',
            '.7z': '📦',
            '.tar': '📦',
            '.gz': '📦'
        };

        return iconMap[extension?.toLowerCase()] || '📄';
    }

    // Форматирование результатов поиска для Telegram
    formatSearchResultsForTelegram(results, query) {
        if (results.length === 0) {
            return `🔍 <b>Search Results</b>\n\nNo files found for query: "${query}"`;
        }

        let message = `🔍 <b>Search Results for: "${query}"</b>\n\n`;
        
        const displayResults = results.slice(0, 10);
        
        displayResults.forEach((file, index) => {
            const icon = file.isDirectory ? '📁' : this.getFileIcon(path.extname(file.name));
            const size = file.isDirectory ? '' : ` (${this.formatFileSize(file.size)})`;
            
            message += `${index + 1}. ${icon} <b>${file.name}</b>${size}\n`;
            message += `   📂 ${path.dirname(file.path)}\n`;
            message += `   📅 ${file.modified.toLocaleDateString()}\n\n`;
        });

        if (results.length > 10) {
            message += `... and ${results.length - 10} more results\n\n`;
        }

        message += `📊 Total found: ${results.length} items`;
        
        return message;
    }

    // Очистка старых файлов
    cleanupOldFiles(directory, maxAge = 7 * 24 * 60 * 60 * 1000) { // 7 дней
        try {
            const files = fs.readdirSync(directory);
            let deletedCount = 0;
            
            files.forEach(file => {
                const filePath = path.join(directory, file);
                const stats = fs.statSync(filePath);
                
                if (Date.now() - stats.mtime.getTime() > maxAge) {
                    fs.unlinkSync(filePath);
                    deletedCount++;
                }
            });
            
            return { success: true, deletedCount };
        } catch (error) {
            return { success: false, message: error.message };
        }
    }
}

module.exports = FileManager;