// Webhook Sender
function sendWebhook() {
    const url = document.getElementById('webhookUrl').value;
    const message = document.getElementById('webhookMessage').value;
    const username = document.getElementById('webhookUsername').value;
    const resultDiv = document.getElementById('webhookResult');
    
    if (!url || !message) {
        resultDiv.innerHTML = '<p class="error-message">Por favor, preencha URL e mensagem!</p>';
        return;
    }
    
    const payload = {
        content: message
    };
    
    if (username) {
        payload.username = username;
    }
    
    fetch(url, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload)
    })
    .then(response => {
        if (response.ok) {
            resultDiv.innerHTML = '<p class="success-message">Webhook enviado com sucesso!</p>';
        } else {
            resultDiv.innerHTML = '<p class="error-message">Erro ao enviar webhook. Verifique a URL.</p>';
        }
    })
    .catch(error => {
        resultDiv.innerHTML = '<p class="error-message">Erro de conexão: ' + error.message + '</p>';
    });
}

// Embed Creator
function createEmbed() {
    const title = document.getElementById('embedTitle').value;
    const description = document.getElementById('embedDescription').value;
    const color = document.getElementById('embedColor').value;
    const image = document.getElementById('embedImage').value;
    const resultDiv = document.getElementById('embedResult');
    
    if (!title && !description) {
        resultDiv.innerHTML = '<p class="error-message">Preencha pelo menos título ou descrição!</p>';
        return;
    }
    
    const embed = {
        title: title || undefined,
        description: description || undefined,
        color: parseInt(color.replace('#', ''), 16),
        image: image ? { url: image } : undefined,
        timestamp: new Date().toISOString()
    };
    
    const embedCode = JSON.stringify({ embeds: [embed] }, null, 2);
    
    resultDiv.innerHTML = `
        <p class="success-message">Embed criado com sucesso!</p>
        <pre style="background: #222; padding: 1rem; border-radius: 5px; overflow-x: auto; font-size: 0.8rem;">
${embedCode}
        </pre>
    `;
}

// Token Info
function checkToken() {
    const token = document.getElementById('botToken').value;
    const resultDiv = document.getElementById('tokenInfo');
    
    if (!token) {
        resultDiv.innerHTML = '<p class="error-message">Por favor, insira um token!</p>';
        return;
    }
    
    try {
        const tokenParts = token.split('.');
        if (tokenParts.length !== 3) {
            throw new Error('Token inválido');
        }
        
        const botId = atob(tokenParts[0]);
        const timestamp = parseInt(tokenParts[1]);
        
        resultDiv.innerHTML = `
            <p class="success-message">Token válido!</p>
            <p><strong>Bot ID:</strong> ${botId}</p>
            <p><strong>Timestamp:</strong> ${new Date(timestamp * 1000).toLocaleString()}</p>
            <p><strong>Tipo:</strong> Bot Token</p>
        `;
    } catch (error) {
        resultDiv.innerHTML = '<p class="error-message">Token inválido ou formato incorreto!</p>';
    }
}

// Server Stats (simulado)
function getServerStats() {
    const serverId = document.getElementById('serverId').value;
    const resultDiv = document.getElementById('serverStats');
    
    if (!serverId) {
        resultDiv.innerHTML = '<p class="error-message">Por favor, insira um ID de servidor!</p>';
        return;
    }
    
    if (!/^\d{17,19}$/.test(serverId)) {
        resultDiv.innerHTML = '<p class="error-message">ID de servidor inválido!</p>';
        return;
    }
    
    // Simulação de dados
    const stats = {
        id: serverId,
        name: "Servidor Exemplo",
        members: Math.floor(Math.random() * 10000) + 100,
        channels: Math.floor(Math.random() * 50) + 10,
        roles: Math.floor(Math.random() * 20) + 5,
        created: new Date(Date.now() - Math.random() * 365 * 24 * 60 * 60 * 1000).toLocaleDateString()
    };
    
    resultDiv.innerHTML = `
        <p class="success-message">Estatísticas encontradas!</p>
        <p><strong>Nome:</strong> ${stats.name}</p>
        <p><strong>Membros:</strong> ${stats.members.toLocaleString()}</p>
        <p><strong>Canais:</strong> ${stats.channels}</p>
        <p><strong>Roles:</strong> ${stats.roles}</p>
        <p><strong>Criado em:</strong> ${stats.created}</p>
    `;
}

// Snowflake Decoder
function decodeSnowflake() {
    const snowflake = document.getElementById('snowflakeId').value;
    const resultDiv = document.getElementById('snowflakeResult');
    
    if (!snowflake) {
        resultDiv.innerHTML = '<p class="error-message">Por favor, insira um Snowflake ID!</p>';
        return;
    }
    
    if (!/^\d{17,19}$/.test(snowflake)) {
        resultDiv.innerHTML = '<p class="error-message">Snowflake inválido!</p>';
        return;
    }
    
    try {
        const timestamp = (BigInt(snowflake) >> 22n) + 1420070400000n;
        const workerId = (BigInt(snowflake) & 0x3E0000n) >> 17n;
        const processId = (BigInt(snowflake) & 0x1F000n) >> 12n;
        const increment = BigInt(snowflake) & 0xFFFn;
        
        const date = new Date(Number(timestamp));
        
        resultDiv.innerHTML = `
            <p class="success-message">Snowflake decodificado!</p>
            <p><strong>Timestamp:</strong> ${date.toLocaleString()}</p>
            <p><strong>Worker ID:</strong> ${workerId}</p>
            <p><strong>Process ID:</strong> ${processId}</p>
            <p><strong>Increment:</strong> ${increment}</p>
        `;
    } catch (error) {
        resultDiv.innerHTML = '<p class="error-message">Erro ao decodificar Snowflake!</p>';
    }
}

// Color Picker
function updateColor() {
    const colorPicker = document.getElementById('colorPicker');
    const hexColor = document.getElementById('hexColor');
    const colorPreview = document.getElementById('colorPreview');
    
    let color = colorPicker.value;
    
    if (hexColor.value && hexColor.value.startsWith('#')) {
        color = hexColor.value;
        colorPicker.value = color;
    }
    
    colorPreview.style.backgroundColor = color;
    hexColor.value = color;
    
    // Atualizar também o embed creator se estiver na mesma página
    const embedColor = document.getElementById('embedColor');
    if (embedColor) {
        embedColor.value = color;
    }
}

// Inicializar color picker
document.addEventListener('DOMContentLoaded', function() {
    const colorPicker = document.getElementById('colorPicker');
    const hexColor = document.getElementById('hexColor');
    
    if (colorPicker && hexColor) {
        colorPicker.addEventListener('input', updateColor);
        hexColor.addEventListener('input', updateColor);
        updateColor();
    }
});
