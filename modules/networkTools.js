const { exec } = require('child_process');
const { promisify } = require('util');
const execAsync = promisify(exec);

class NetworkTools {
    constructor() {
        this.defaultTimeout = 5000; // 5 секунд
    }

    // Ping тест
    async ping(host, count = 4) {
        try {
            const command = process.platform === 'win32' 
                ? `ping -n ${count} ${host}`
                : `ping -c ${count} ${host}`;
            
            const { stdout, stderr } = await execAsync(command);
            
            if (stderr) {
                return { success: false, error: stderr };
            }
            
            return this.parsePingOutput(stdout, host);
        } catch (error) {
            return { success: false, error: error.message };
        }
    }

    // Парсинг вывода ping
    parsePingOutput(output, host) {
        const lines = output.split('\n');
        const results = {
            success: true,
            host: host,
            packets: {
                sent: 0,
                received: 0,
                lost: 0,
                lossPercent: 0
            },
            times: [],
            avgTime: 0,
            minTime: 0,
            maxTime: 0
        };

        // Извлечение статистики пакетов
        const packetLine = lines.find(line => 
            line.includes('packets transmitted') || 
            line.includes('Packets: Sent')
        );
        
        if (packetLine) {
            const matches = packetLine.match(/(\d+)/g);
            if (matches && matches.length >= 3) {
                results.packets.sent = parseInt(matches[0]);
                results.packets.received = parseInt(matches[1]);
                results.packets.lost = results.packets.sent - results.packets.received;
                results.packets.lossPercent = Math.round(
                    (results.packets.lost / results.packets.sent) * 100
                );
            }
        }

        // Извлечение времени отклика
        lines.forEach(line => {
            const timeMatch = line.match(/time[<=](\d+\.?\d*)/);
            if (timeMatch) {
                results.times.push(parseFloat(timeMatch[1]));
            }
        });

        // Вычисление статистики времени
        if (results.times.length > 0) {
            results.avgTime = results.times.reduce((a, b) => a + b, 0) / results.times.length;
            results.minTime = Math.min(...results.times);
            results.maxTime = Math.max(...results.times);
        }

        return results;
    }

    // Traceroute
    async traceroute(host, maxHops = 30) {
        try {
            const command = process.platform === 'win32'
                ? `tracert -h ${maxHops} ${host}`
                : `traceroute -m ${maxHops} ${host}`;
            
            const { stdout, stderr } = await execAsync(command, { timeout: 30000 });
            
            if (stderr && !stdout) {
                return { success: false, error: stderr };
            }
            
            return this.parseTracerouteOutput(stdout, host);
        } catch (error) {
            return { success: false, error: error.message };
        }
    }

    // Парсинг вывода traceroute
    parseTracerouteOutput(output, host) {
        const lines = output.split('\n').filter(line => line.trim());
        const hops = [];
        
        lines.forEach(line => {
            // Пропускаем заголовки
            if (line.includes('traceroute') || line.includes('Tracing route')) {
                return;
            }
            
            // Извлечение информации о хопе
            const hopMatch = line.match(/^\s*(\d+)/);
            if (hopMatch) {
                const hopNumber = parseInt(hopMatch[1]);
                const ipMatch = line.match(/(\d+\.\d+\.\d+\.\d+)/);
                const timeMatches = line.match(/(\d+\.?\d*)\s*ms/g);
                
                const hop = {
                    number: hopNumber,
                    ip: ipMatch ? ipMatch[1] : null,
                    hostname: null,
                    times: []
                };
                
                if (timeMatches) {
                    hop.times = timeMatches.map(match => 
                        parseFloat(match.replace(' ms', ''))
                    );
                }
                
                // Извлечение hostname
                const hostnameMatch = line.match(/\s+([a-zA-Z0-9.-]+)\s+\(/);
                if (hostnameMatch) {
                    hop.hostname = hostnameMatch[1];
                }
                
                hops.push(hop);
            }
        });
        
        return {
            success: true,
            host: host,
            hops: hops,
            totalHops: hops.length
        };
    }

    // Сканирование портов
    async portScan(host, ports = [21, 22, 23, 25, 53, 80, 110, 443, 993, 995]) {
        const results = {
            success: true,
            host: host,
            openPorts: [],
            closedPorts: [],
            filteredPorts: []
        };

        const scanPromises = ports.map(port => this.scanPort(host, port));
        const scanResults = await Promise.allSettled(scanPromises);
        
        scanResults.forEach((result, index) => {
            const port = ports[index];
            
            if (result.status === 'fulfilled') {
                const portResult = result.value;
                if (portResult.open) {
                    results.openPorts.push({
                        port: port,
                        service: this.getServiceName(port),
                        responseTime: portResult.responseTime
                    });
                } else {
                    results.closedPorts.push(port);
                }
            } else {
                results.filteredPorts.push(port);
            }
        });

        return results;
    }

    // Сканирование одного порта
    async scanPort(host, port, timeout = 3000) {
        return new Promise((resolve) => {
            const net = require('net');
            const socket = new net.Socket();
            const startTime = Date.now();
            
            socket.setTimeout(timeout);
            
            socket.on('connect', () => {
                const responseTime = Date.now() - startTime;
                socket.destroy();
                resolve({ open: true, responseTime });
            });
            
            socket.on('timeout', () => {
                socket.destroy();
                resolve({ open: false, responseTime: timeout });
            });
            
            socket.on('error', () => {
                socket.destroy();
                resolve({ open: false, responseTime: Date.now() - startTime });
            });
            
            socket.connect(port, host);
        });
    }

    // Получение имени сервиса по порту
    getServiceName(port) {
        const services = {
            21: 'FTP',
            22: 'SSH',
            23: 'Telnet',
            25: 'SMTP',
            53: 'DNS',
            80: 'HTTP',
            110: 'POP3',
            143: 'IMAP',
            443: 'HTTPS',
            993: 'IMAPS',
            995: 'POP3S',
            3389: 'RDP',
            5432: 'PostgreSQL',
            3306: 'MySQL',
            1433: 'MSSQL',
            6379: 'Redis',
            27017: 'MongoDB'
        };
        
        return services[port] || 'Unknown';
    }

    // Получение информации о DNS
    async dnsLookup(hostname) {
        try {
            const dns = require('dns');
            const lookupAsync = promisify(dns.lookup);
            const resolveAsync = promisify(dns.resolve);
            
            const result = {
                success: true,
                hostname: hostname,
                ipv4: [],
                ipv6: [],
                mx: [],
                txt: [],
                ns: []
            };
            
            // IPv4 lookup
            try {
                const ipv4 = await lookupAsync(hostname, { family: 4 });
                result.ipv4.push(ipv4.address);
            } catch (e) {
                // IPv4 не найден
            }
            
            // IPv6 lookup
            try {
                const ipv6 = await lookupAsync(hostname, { family: 6 });
                result.ipv6.push(ipv6.address);
            } catch (e) {
                // IPv6 не найден
            }
            
            // MX records
            try {
                const mx = await resolveAsync(hostname, 'MX');
                result.mx = mx.map(record => ({
                    exchange: record.exchange,
                    priority: record.priority
                }));
            } catch (e) {
                // MX записи не найдены
            }
            
            // TXT records
            try {
                const txt = await resolveAsync(hostname, 'TXT');
                result.txt = txt.flat();
            } catch (e) {
                // TXT записи не найдены
            }
            
            // NS records
            try {
                const ns = await resolveAsync(hostname, 'NS');
                result.ns = ns;
            } catch (e) {
                // NS записи не найдены
            }
            
            return result;
        } catch (error) {
            return { success: false, error: error.message };
        }
    }

    // Проверка доступности URL
    async checkUrl(url, timeout = 10000) {
        try {
            const https = require('https');
            const http = require('http');
            const urlModule = require('url');
            
            const parsedUrl = urlModule.parse(url);
            const client = parsedUrl.protocol === 'https:' ? https : http;
            
            return new Promise((resolve) => {
                const startTime = Date.now();
                
                const req = client.request({
                    hostname: parsedUrl.hostname,
                    port: parsedUrl.port,
                    path: parsedUrl.path,
                    method: 'HEAD',
                    timeout: timeout
                }, (res) => {
                    const responseTime = Date.now() - startTime;
                    
                    resolve({
                        success: true,
                        url: url,
                        statusCode: res.statusCode,
                        statusMessage: res.statusMessage,
                        responseTime: responseTime,
                        headers: res.headers
                    });
                });
                
                req.on('error', (error) => {
                    resolve({
                        success: false,
                        url: url,
                        error: error.message,
                        responseTime: Date.now() - startTime
                    });
                });
                
                req.on('timeout', () => {
                    req.destroy();
                    resolve({
                        success: false,
                        url: url,
                        error: 'Request timeout',
                        responseTime: timeout
                    });
                });
                
                req.end();
            });
        } catch (error) {
            return { success: false, url: url, error: error.message };
        }
    }

    // Получение информации о сети
    async getNetworkInfo() {
        try {
            const os = require('os');
            const interfaces = os.networkInterfaces();
            const result = {
                success: true,
                interfaces: {},
                hostname: os.hostname(),
                platform: os.platform(),
                arch: os.arch()
            };
            
            Object.keys(interfaces).forEach(name => {
                result.interfaces[name] = interfaces[name].map(iface => ({
                    address: iface.address,
                    netmask: iface.netmask,
                    family: iface.family,
                    mac: iface.mac,
                    internal: iface.internal
                }));
            });
            
            return result;
        } catch (error) {
            return { success: false, error: error.message };
        }
    }

    // Форматирование результатов ping для Telegram
    formatPingForTelegram(result) {
        if (!result.success) {
            return `🏓 <b>Ping Failed</b>\n\n❌ Error: ${result.error}`;
        }
        
        let message = `🏓 <b>Ping Results - ${result.host}</b>\n\n`;
        message += `📊 <b>Packets:</b>\n`;
        message += `   • Sent: ${result.packets.sent}\n`;
        message += `   • Received: ${result.packets.received}\n`;
        message += `   • Lost: ${result.packets.lost} (${result.packets.lossPercent}%)\n\n`;
        
        if (result.times.length > 0) {
            message += `⏱️ <b>Response Times:</b>\n`;
            message += `   • Average: ${result.avgTime.toFixed(1)}ms\n`;
            message += `   • Minimum: ${result.minTime}ms\n`;
            message += `   • Maximum: ${result.maxTime}ms\n`;
        }
        
        return message;
    }

    // Форматирование результатов traceroute для Telegram
    formatTracerouteForTelegram(result) {
        if (!result.success) {
            return `🛣️ <b>Traceroute Failed</b>\n\n❌ Error: ${result.error}`;
        }
        
        let message = `🛣️ <b>Traceroute to ${result.host}</b>\n\n`;
        
        result.hops.slice(0, 10).forEach(hop => {
            const avgTime = hop.times.length > 0 
                ? (hop.times.reduce((a, b) => a + b, 0) / hop.times.length).toFixed(1)
                : 'N/A';
            
            message += `${hop.number}. `;
            
            if (hop.hostname) {
                message += `${hop.hostname} `;
            }
            
            if (hop.ip) {
                message += `(${hop.ip}) `;
            }
            
            message += `${avgTime}ms\n`;
        });
        
        if (result.hops.length > 10) {
            message += `\n... and ${result.hops.length - 10} more hops`;
        }
        
        return message;
    }

    // Форматирование результатов сканирования портов для Telegram
    formatPortScanForTelegram(result) {
        if (!result.success) {
            return `🔍 <b>Port Scan Failed</b>\n\n❌ Error: ${result.error}`;
        }
        
        let message = `🔍 <b>Port Scan - ${result.host}</b>\n\n`;
        
        if (result.openPorts.length > 0) {
            message += `🟢 <b>Open Ports:</b>\n`;
            result.openPorts.forEach(port => {
                message += `   • ${port.port} (${port.service}) - ${port.responseTime}ms\n`;
            });
            message += '\n';
        }
        
        if (result.closedPorts.length > 0) {
            message += `🔴 <b>Closed Ports:</b> ${result.closedPorts.join(', ')}\n\n`;
        }
        
        if (result.filteredPorts.length > 0) {
            message += `🟡 <b>Filtered Ports:</b> ${result.filteredPorts.join(', ')}\n\n`;
        }
        
        message += `📊 <b>Summary:</b> ${result.openPorts.length} open, ${result.closedPorts.length} closed, ${result.filteredPorts.length} filtered`;
        
        return message;
    }

    // Форматирование DNS информации для Telegram
    formatDnsForTelegram(result) {
        if (!result.success) {
            return `🌐 <b>DNS Lookup Failed</b>\n\n❌ Error: ${result.error}`;
        }
        
        let message = `🌐 <b>DNS Lookup - ${result.hostname}</b>\n\n`;
        
        if (result.ipv4.length > 0) {
            message += `📍 <b>IPv4:</b> ${result.ipv4.join(', ')}\n`;
        }
        
        if (result.ipv6.length > 0) {
            message += `📍 <b>IPv6:</b> ${result.ipv6.join(', ')}\n`;
        }
        
        if (result.mx.length > 0) {
            message += `📧 <b>Mail Servers:</b>\n`;
            result.mx.forEach(mx => {
                message += `   • ${mx.exchange} (priority: ${mx.priority})\n`;
            });
        }
        
        if (result.ns.length > 0) {
            message += `🌐 <b>Name Servers:</b> ${result.ns.join(', ')}\n`;
        }
        
        if (result.txt.length > 0) {
            message += `📝 <b>TXT Records:</b>\n`;
            result.txt.slice(0, 3).forEach(txt => {
                message += `   • ${txt.substring(0, 50)}${txt.length > 50 ? '...' : ''}\n`;
            });
        }
        
        return message;
    }
}

module.exports = NetworkTools;