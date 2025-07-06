// API Configuration for Sync AI
// Configure suas chaves de API aqui

const API_CONFIG = {
    primary: {
        endpoint: 'https://api.anthropic.com/v1/messages',
        key: 'YOUR_ANTHROPIC_API_KEY_HERE', // Substitua pela sua chave
        model: 'claude-3-sonnet-20240229',
        headers: {
            'Content-Type': 'application/json',
            'x-api-key': '',
            'anthropic-version': '2023-06-01'
        }
    },
    secondary: {
        endpoint: 'https://api.x.ai/v1/chat/completions',
        key: 'YOUR_GROK_API_KEY_HERE', // Substitua pela sua chave
        model: 'grok-beta',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': 'Bearer '
        }
    }
};

// Sistema de segurança e validação
class SecurityManager {
    constructor() {
        this.rateLimiter = new Map();
        this.maxRequests = 60; // Máximo 60 requests por minuto
        this.timeWindow = 60000; // 1 minuto em millisegundos
        this.bannedWords = ['hack', 'exploit', 'malware', 'virus'];
        this.maxMessageLength = 500;
    }

    validateMessage(message) {
        // Validar tamanho
        if (message.length > this.maxMessageLength) {
            throw new Error('Mensagem muito longa');
        }

        // Validar conteúdo
        const lowerMessage = message.toLowerCase();
        for (const word of this.bannedWords) {
            if (lowerMessage.includes(word)) {
                throw new Error('Conteúdo não permitido');
            }
        }

        // Rate limiting
        const now = Date.now();
        const userKey = this.getUserKey();
        
        if (!this.rateLimiter.has(userKey)) {
            this.rateLimiter.set(userKey, []);
        }

        const requests = this.rateLimiter.get(userKey);
        const validRequests = requests.filter(time => now - time < this.timeWindow);
        
        if (validRequests.length >= this.maxRequests) {
            throw new Error('Muitas requisições. Tente novamente em alguns minutos.');
        }

        validRequests.push(now);
        this.rateLimiter.set(userKey, validRequests);
        
        return true;
    }

    getUserKey() {
        // Gerar chave única por usuário (baseada na sessão)
        if (!sessionStorage.getItem('userKey')) {
            sessionStorage.setItem('userKey', 'user_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9));
        }
        return sessionStorage.getItem('userKey');
    }

    sanitizeInput(input) {
        return input.replace(/[<>]/g, '').trim();
    }
}

// Classe principal para gerenciar o chat
class AIChat {
    constructor() {
        this.security = new SecurityManager();
        this.currentAPI = 'primary';
        this.isOnline = false;
        this.retryCount = 0;
        this.maxRetries = 3;
    }

    async checkStatus() {
        try {
            // Verificar API primária
            const primaryStatus = await this.testAPI('primary');
            if (primaryStatus) {
                this.currentAPI = 'primary';
                this.isOnline = true;
                return { online: true, api: 'primary' };
            }

            // Verificar API secundária
            const secondaryStatus = await this.testAPI('secondary');
            if (secondaryStatus) {
                this.currentAPI = 'secondary';
                this.isOnline = true;
                return { online: true, api: 'secondary' };
            }

            this.isOnline = false;
            return { online: false, api: 'none' };
        } catch (error) {
            this.isOnline = false;
            return { online: false, api: 'none' };
        }
    }

    async testAPI(apiType) {
        const config = API_CONFIG[apiType];
        if (!config.key || config.key.includes('YOUR_')) {
            return false;
        }

        try {
            const response = await fetch(config.endpoint, {
                method: 'POST',
                headers: this.buildHeaders(apiType),
                body: JSON.stringify(this.buildTestPayload(apiType))
            });

            return response.ok;
        } catch (error) {
            return false;
        }
    }

    buildHeaders(apiType) {
        const config = API_CONFIG[apiType];
        const headers = { ...config.headers };
        
        if (apiType === 'primary') {
            headers['x-api-key'] = config.key;
        } else if (apiType === 'secondary') {
            headers['Authorization'] = `Bearer ${config.key}`;
        }
        
        return headers;
    }

    buildTestPayload(apiType) {
        if (apiType === 'primary') {
            return {
                model: API_CONFIG.primary.model,
                max_tokens: 10,
                messages: [
                    {
                        role: 'user',
                        content: 'teste'
                    }
                ]
            };
        } else {
            return {
                model: API_CONFIG.secondary.model,
                max_tokens: 10,
                messages: [
                    {
                        role: 'user',
                        content: 'teste'
                    }
                ]
            };
        }
    }

    async sendMessage(message) {
        try {
            // Validar mensagem
            this.security.validateMessage(message);
            const sanitizedMessage = this.security.sanitizeInput(message);

            // Verificar se está online
            if (!this.isOnline) {
                const status = await this.checkStatus();
                if (!status.online) {
                    throw new Error('Serviço temporariamente indisponível');
                }
            }

            // Tentar enviar mensagem
            const response = await this.callAPI(sanitizedMessage);
            this.retryCount = 0;
            return response;

        } catch (error) {
            if (this.retryCount < this.maxRetries) {
                this.retryCount++;
                
                // Tentar API alternativa
                const alternativeAPI = this.currentAPI === 'primary' ? 'secondary' : 'primary';
                const alternativeStatus = await this.testAPI(alternativeAPI);
                
                if (alternativeStatus) {
                    this.currentAPI = alternativeAPI;
                    return this.callAPI(this.security.sanitizeInput(message));
                }
            }
            
            throw error;
        }
    }

    async callAPI(message) {
        const config = API_CONFIG[this.currentAPI];
        
        const payload = this.currentAPI === 'primary' 
            ? this.buildAnthropicPayload(message)
            : this.buildGrokPayload(message);

        try {
            const response = await fetch(config.endpoint, {
                method: 'POST',
                headers: this.buildHeaders(this.currentAPI),
                body: JSON.stringify(payload)
            });

            if (!response.ok) {
                throw new Error(`API Error: ${response.status}`);
            }

            const data = await response.json();
            return this.parseResponse(data);

        } catch (error) {
            throw new Error('Erro na comunicação com a API');
        }
    }

    buildAnthropicPayload(message) {
        return {
            model: API_CONFIG.primary.model,
            max_tokens: 1024,
            messages: [
                {
                    role: 'user',
                    content: message
                }
            ]
        };
    }

    buildGrokPayload(message) {
        return {
            model: API_CONFIG.secondary.model,
            max_tokens: 1024,
            messages: [
                {
                    role: 'user',
                    content: message
                }
            ]
        };
    }

    parseResponse(data) {
        if (this.currentAPI === 'primary') {
            return data.content?.[0]?.text || 'Desculpe, não consegui processar sua mensagem.';
        } else {
            return data.choices?.[0]?.message?.content || 'Desculpe, não consegui processar sua mensagem.';
        }
    }
}

// Inicializar o sistema
const aiChat = new AIChat();

// Expor interface pública
window.AIChat = {
    sendMessage: (message) => aiChat.sendMessage(message),
    checkStatus: () => aiChat.checkStatus()
};

// Configurações de segurança adicionais
(function() {
    'use strict';
    
    // Ocultar configurações das APIs
    Object.freeze(API_CONFIG);
    
    // Proteger contra manipulação do console
    if (typeof console !== 'undefined') {
        console.warn(' Atenção: Não cole códigos desconhecidos aqui. Isso pode comprometer a segurança.');
    }
    
    // Detectar debug
    let devtools = false;
    const detector = setInterval(() => {
        if (window.outerHeight - window.innerHeight > 200 || window.outerWidth - window.innerWidth > 200) {
            if (!devtools) {
                devtools = true;
                console.clear();
                console.log('%c Modo de desenvolvedor detectado', 'color: red; font-size: 20px;');
            }
        }
    }, 500);
    
})();
