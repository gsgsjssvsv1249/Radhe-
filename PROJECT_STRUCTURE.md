# 📁 Структура проекта DogeRat Enhanced

## 🗂️ Обзор файлов и директорий

### 📋 Основные файлы

#### 🚀 Серверные файлы
- **`enhanced_server.js`** - Основной сервер с расширенными функциями
- **`server.js`** - Оригинальный сервер DogeRat (сохранен для совместимости)
- **`start_enhanced.js`** - Интерактивный мастер запуска и настройки

#### 🎯 Демонстрация и примеры
- **`demo.js`** - Демонстрация всех новых функций
- **`examples/api_examples.js`** - Примеры использования API

#### ⚙️ Конфигурация
- **`data.json`** - Основная конфигурация (токен бота, chat ID)
- **`config/enhanced_config.json`** - Расширенная конфигурация системы
- **`package.json`** - Зависимости и скрипты NPM

### 🧩 Модули функций

#### 📁 `modules/` директория
- **`scheduler.js`** - Планировщик задач с автоматическим выполнением
- **`security.js`** - Система безопасности с шифрованием и логированием
- **`fileManager.js`** - Файловый менеджер с полным набором операций
- **`networkTools.js`** - Сетевые инструменты для диагностики

### 📚 Документация

#### 📖 Руководства
- **`README_ENHANCED.md`** - Подробная документация Enhanced версии
- **`INSTALLATION_GUIDE.md`** - Пошаговое руководство по установке
- **`FEATURES_SUMMARY.md`** - Краткий обзор всех новых функций
- **`PROJECT_STRUCTURE.md`** - Этот файл с описанием структуры
- **`README.md`** - Оригинальная документация DogeRat

### 📂 Рабочие директории

#### 💾 Хранилище данных
- **`uploads/`** - Директория для загружаемых файлов
- **`downloads/`** - Директория для скачиваемых файлов
- **`images/`** - Изображения и логотипы проекта

#### 📱 Клиентские приложения
- **`client apps/`** - APK файлы для Android устройств
  - **`CLIENT.apk`** - Клиентское приложение для Android

### 📊 Файлы данных и логов

#### 🗃️ Автоматически создаваемые файлы
- **`scheduled_tasks.json`** - Сохраненные задачи планировщика
- **`security.log`** - Логи событий безопасности
- **`command_history.log`** - История выполненных команд
- **`server.log`** - Логи работы сервера

## 🏗️ Архитектура проекта

### 📊 Диаграмма компонентов

```
DogeRat Enhanced
├── 🖥️  Server Layer
│   ├── enhanced_server.js (Основной сервер)
│   ├── start_enhanced.js (Мастер запуска)
│   └── server.js (Оригинальный сервер)
│
├── 🧩 Modules Layer
│   ├── scheduler.js (Планировщик)
│   ├── security.js (Безопасность)
│   ├── fileManager.js (Файлы)
│   └── networkTools.js (Сеть)
│
├── ⚙️  Configuration Layer
│   ├── data.json (Основная конфигурация)
│   └── config/enhanced_config.json (Расширенная)
│
├── 📱 Client Layer
│   └── client apps/CLIENT.apk (Android клиент)
│
├── 💾 Data Layer
│   ├── uploads/ (Загрузки)
│   ├── downloads/ (Скачивания)
│   └── *.log (Логи)
│
└── 📚 Documentation Layer
    ├── README_ENHANCED.md
    ├── INSTALLATION_GUIDE.md
    └── FEATURES_SUMMARY.md
```

## 🔧 Детальное описание модулей

### 1. **TaskScheduler** (`modules/scheduler.js`)
**Размер:** ~8KB | **Функций:** 15+ | **Возможности:**
- Создание и управление задачами
- Автоматическое выполнение по расписанию
- Сохранение состояния между перезапусками
- Статистика выполнения

**Основные методы:**
```javascript
createTask(name, command, schedule, deviceId)
scheduleTask(task)
executeTask(task)
getAllTasks()
updateTask(id, updates)
deleteTask(id)
```

### 2. **SecurityManager** (`modules/security.js`)
**Размер:** ~12KB | **Функций:** 20+ | **Возможности:**
- AES-256 шифрование данных
- Система логирования событий
- Блокировка подозрительных IP
- Генерация отчетов безопасности

**Основные методы:**
```javascript
encrypt(text)
decrypt(encryptedData, iv)
logSecurityEvent(event, details, severity)
blockIP(ip, reason)
generateSecurityReport()
```

### 3. **FileManager** (`modules/fileManager.js`)
**Размер:** ~15KB | **Функций:** 25+ | **Возможности:**
- Навигация по файловой системе
- Поиск файлов и папок
- Операции с файлами (копирование, перемещение)
- Информация о файлах и дисках

**Основные методы:**
```javascript
listFiles(directoryPath)
searchFiles(searchPath, query)
createDirectory(dirPath)
deleteItem(itemPath)
readTextFile(filePath)
```

### 4. **NetworkTools** (`modules/networkTools.js`)
**Размер:** ~18KB | **Функций:** 15+ | **Возможности:**
- Ping тесты и traceroute
- Сканирование портов
- DNS lookup операции
- Проверка доступности URL

**Основные методы:**
```javascript
ping(host, count)
traceroute(host, maxHops)
portScan(host, ports)
dnsLookup(hostname)
checkUrl(url)
```

## 📊 Статистика проекта

### 📈 Размеры файлов
```
enhanced_server.js     ~25KB  (Основной сервер)
modules/scheduler.js   ~8KB   (Планировщик)
modules/security.js    ~12KB  (Безопасность)
modules/fileManager.js ~15KB  (Файловый менеджер)
modules/networkTools.js ~18KB (Сетевые инструменты)
start_enhanced.js      ~12KB  (Мастер запуска)
demo.js               ~10KB  (Демонстрация)
```

### 🔢 Количество функций
- **Всего функций:** 100+
- **Команд Telegram:** 50+
- **API endpoints:** 20+
- **Конфигурационных параметров:** 40+

### 📦 Зависимости
```json
{
  "production": 13,
  "development": 4,
  "total": 17
}
```

## 🚀 Точки входа

### 1. **Основной запуск**
```bash
npm start                    # Запуск enhanced сервера
node enhanced_server.js      # Прямой запуск
```

### 2. **Интерактивный запуск**
```bash
node start_enhanced.js       # Мастер запуска
npm run setup               # Alias для мастера
```

### 3. **Демонстрация**
```bash
node demo.js                # Демонстрация функций
```

### 4. **Разработка**
```bash
npm run dev                 # Запуск с nodemon
npm run test               # Тестирование
```

## 🔄 Жизненный цикл приложения

### 1. **Инициализация**
```
start_enhanced.js → Проверка зависимостей → Конфигурация → enhanced_server.js
```

### 2. **Загрузка модулей**
```
enhanced_server.js → Загрузка modules/ → Инициализация Socket.IO → Telegram Bot
```

### 3. **Работа**
```
Telegram Commands → enhanced_server.js → Modules → Android Devices → Response
```

### 4. **Логирование**
```
Все действия → security.js → *.log файлы → Отчеты
```

## 🛠️ Кастомизация

### Добавление нового модуля
1. Создайте файл в `modules/your_module.js`
2. Экспортируйте класс с нужными методами
3. Импортируйте в `enhanced_server.js`
4. Добавьте команды в Telegram бот

### Изменение конфигурации
1. Отредактируйте `config/enhanced_config.json`
2. Перезапустите сервер
3. Новые настройки применятся автоматически

### Добавление новых команд
1. Добавьте обработчик в `enhanced_server.js`
2. Создайте соответствующую функцию в модуле
3. Обновите меню Telegram бота

## 📋 Чек-лист для разработчиков

### ✅ Перед началом работы
- [ ] Node.js 14+ установлен
- [ ] NPM зависимости установлены
- [ ] Telegram бот создан и настроен
- [ ] Конфигурация заполнена
- [ ] Тестовое устройство подключено

### ✅ Разработка
- [ ] Код следует архитектуре модулей
- [ ] Добавлено логирование ошибок
- [ ] Функции документированы
- [ ] Тесты написаны (если применимо)
- [ ] Конфигурация обновлена

### ✅ Деплой
- [ ] Код протестирован локально
- [ ] Демонстрация работает
- [ ] Документация обновлена
- [ ] Резервная копия создана
- [ ] Сервер готов к продакшену

---

**📁 Структура проекта DogeRat Enhanced обеспечивает модульность, расширяемость и простоту сопровождения для эффективной разработки и управления Android устройствами.**