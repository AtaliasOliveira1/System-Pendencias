// Botão de Home - Redireciona para outra página
document.getElementById('home-btn').addEventListener('click', function() {
    window.location.href = 'https://www.google.com'; // Redireciona para Google
});

// Botão de Ações - Mostra/Oculta Submenu
document.getElementById('actions-btn').addEventListener('click', function() {
    const submenu = document.getElementById('actions-submenu');
    submenu.classList.toggle('hidden');
});

// Cartão de Chat - Mostra alerta com contagem de chats
document.getElementById('chat-card').addEventListener('click', function() {
    alert('Você tem 10 chats ativos!');
});

// Botão de Mensagens recebidas - Mostra alerta personalizado
document.getElementById('messages-btn').addEventListener('click', function() {
    alert('Abrindo mensagens recebidas...');
});

// Cartão de IPv4 - Copia o IP para a área de transferência
document.getElementById('ip-card').addEventListener('click', function() {
    const ip = '138.204.243.157';
    navigator.clipboard.writeText(ip).then(() => {
        alert('IP copiado para a área de transferência!');
    }).catch(err => {
        console.error('Erro ao copiar IP: ', err);
    });
});

