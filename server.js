const express = require('express');
const fs = require('fs');
const path = require('path');
const chalk = require('chalk');
const multer = require('multer');

// ⬅️ NOVO: Imports para Socket.IO
const http = require('http'); 
const { Server } = require('socket.io'); 

const chalkInstance = chalk.default || chalk;

const app = express();
const PORT = 4000;

// ⬅️ NOVO: Cria o servidor HTTP e conecta o Socket.IO
const server = http.createServer(app);
const io = new Server(server, {
    // Permite que o frontend se conecte (necessário se estiver em portas diferentes)
    cors: {
        origin: "*", 
        methods: ["GET", "POST", "PUT", "DELETE"]
    }
});


// ----------------------------------------------------
// Configuração do Multer (Correção de erro anterior)
// ----------------------------------------------------
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        const uploadPath = path.join(__dirname, 'uploads');
        if (!fs.existsSync(uploadPath)) {
            fs.mkdirSync(uploadPath);
        }
        cb(null, uploadPath);
    },
    filename: (req, file, cb) => {
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        cb(null, uniqueSuffix + '-' + file.originalname);
    }
});
const upload = multer({ storage: storage });

app.use((req, res, next) => {
    if (req.method === 'POST' && (req.url === '/tasks-with-file' || req.url.startsWith('/tasks/'))) {
        next(); 
    } else {
        express.json()(req, res, next);
    }
});

app.use(express.static(path.join(__dirname)));
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Log de conexão do Socket.IO
io.on('connection', (socket) => {
    console.log(chalkInstance.magenta('👤 Novo usuário conectado via Socket.IO'));
});

// ----------------------------------------------------
// ROTAS EXISTENTES
// ----------------------------------------------------

// GET /tasks
app.get('/tasks', (req, res) => {
    fs.readFile('pendencias.json', 'utf8', (err, data) => {
        if (err) {
            console.error(chalkInstance.red('❌ ERRO ao ler o arquivo de pendências:'), err.message);
            if (err.code === 'ENOENT') {
                return res.json([]);
            }
            return res.status(500).json({ error: 'Erro ao ler o arquivo' });
        }
        res.json(JSON.parse(data || '[]'));
        console.log(chalkInstance.green('📦 Pendências carregadas!'));
    });
});

// DELETE /tasks/:name
app.delete('/tasks/:name', (req, res) => {
    const taskName = req.params.name;
    fs.readFile('pendencias.json', 'utf8', (err, data) => {
        if (err) {
            console.error(chalkInstance.red('❌ ERRO ao ler o arquivo para deletar:'), err.message);
            return res.status(500).json({ error: 'Erro ao ler o arquivo' });
        }
        let tasks = JSON.parse(data || '[]');
        const initialLength = tasks.length;
        tasks = tasks.filter(task => task.name !== taskName);
        
        fs.writeFile('pendencias.json', JSON.stringify(tasks, null, 2), (err) => {
            if (err) {
                console.error(chalkInstance.red('❌ ERRO ao deletar a tarefa:'), err.message);
                return res.status(500).json({ error: 'Erro ao deletar a tarefa' });
            }
            if (tasks.length < initialLength) {
                console.log(chalkInstance.yellow(`🗑️ Pendência "${taskName}" deletada!`));
                io.emit('task_deleted', taskName); // ⬅️ EMITE
            } else {
                 console.log(chalkInstance.red(`⚠️ Tentativa de deletar pendência não encontrada: "${taskName}"`));
            }
            res.status(204).send();
        });
    });
});

// DELETE /tasks/clear-all
app.delete('/tasks/clear-all', (req, res) => {
    fs.writeFile('pendencias.json', JSON.stringify([], null, 2), (err) => {
        if (err) {
            console.error(chalkInstance.red('❌ ERRO ao limpar todas as pendências:'), err.message);
            return res.status(500).json({ error: 'Erro ao atualizar o arquivo' });
        }
        res.status(204).send();
        console.log(chalkInstance.magenta('✨ Todas as Pendências Limpas!'));
        io.emit('tasks_cleared'); // ⬅️ EMITE
    });
});

// PUT /tasks/:name (usado para concluir/reabrir)
app.put('/tasks/:name', (req, res) => {
    const taskName = req.params.name;
    const updatedTaskData = req.body;

    fs.readFile('pendencias.json', 'utf8', (err, data) => {
        if (err) {
            console.error(chalkInstance.red('❌ ERRO ao ler o arquivo para atualizar:'), err.message);
            return res.status(500).json({ error: 'Erro ao ler o arquivo' });
        }
        let tasks = JSON.parse(data || '[]');
        let taskFound = false;
        let finalUpdatedTask = null;

        tasks = tasks.map(task => {
            if (task.name === taskName) {
                taskFound = true;
                // Mescla os dados existentes com os dados atualizados (como 'completed: true')
                finalUpdatedTask = { ...task, ...updatedTaskData }; 
                return finalUpdatedTask;
            }
            return task;
        });

        fs.writeFile('pendencias.json', JSON.stringify(tasks, null, 2), (err) => {
            if (err) {
                console.error(chalkInstance.red('❌ ERRO ao atualizar a tarefa:'), err.message);
                return res.status(500).json({ error: 'Erro ao atualizar a tarefa' });
            }
            if (taskFound) {
                console.log(chalkInstance.blue(`✅ Pendência "${taskName}" atualizada!`));
                io.emit('task_updated', finalUpdatedTask); // ⬅️ EMITE
            } else {
                console.log(chalkInstance.red(`⚠️ Tentativa de atualizar pendência não encontrada: "${taskName}"`));
            }
            res.json(finalUpdatedTask);
        });
    });
});


// POST /tasks-with-file (Adicionar nova pendência)
app.post('/tasks-with-file', upload.array('attachments', 10), (req, res) => {
    const files = req.files; 
    const body = req.body;

    const attachments = files ? files.map(file => ({
        path: `/uploads/${file.filename}`,
        filename: file.originalname 
    })) : [];

    const newTask = {
        name: body.taskName,
        city: body.cityName,
        requester: body.requesterName,
        completed: false,
        timestamp: new Date().toISOString(),
        attachments: attachments 
    };

    fs.readFile('pendencias.json', 'utf8', (err, data) => {
        if (err && err.code !== 'ENOENT') {
            console.error(chalkInstance.red('❌ ERRO ao ler o arquivo para adicionar:'), err.message);
            return res.status(500).json({ error: 'Erro ao ler o arquivo' });
        }
        const tasks = JSON.parse(data || '[]');
        tasks.push(newTask);
        
        fs.writeFile('pendencias.json', JSON.stringify(tasks, null, 2), (err) => {
            if (err) {
                console.error(chalkInstance.red('❌ ERRO ao salvar a tarefa:'), err.message);
                return res.status(500).json({ error: 'Erro ao salvar a tarefa' });
            }
            
            io.emit('task_created', newTask); // ⬅️ EMITE

            res.status(201).json(newTask);
            console.log(chalkInstance.cyan(`➕ Nova Pendência Adicionada: ${newTask.name} (${newTask.city}) com ${attachments.length} Anexo(s)`));
        });
    });
});

// POST /tasks/:name/attach (Anexar arquivo)
app.post('/tasks/:name/attach', upload.array('attachments', 10), (req, res) => {
    const taskName = req.params.name;
    const files = req.files; 

    const newAttachments = files.map(file => ({
        path: `/uploads/${file.filename}`,
        filename: file.originalname
    }));


    fs.readFile('pendencias.json', 'utf8', (err, data) => {
        if (err) {
            console.error(chalkInstance.red('❌ ERRO ao ler o arquivo para anexar:'), err.message);
            return res.status(500).json({ error: 'Erro ao ler o arquivo' });
        }
        let tasks = JSON.parse(data || '[]');
        let taskFound = false;
        let updatedTask = null;

        tasks = tasks.map(task => {
            if (task.name === taskName) {
                taskFound = true;
                const existingAttachments = task.attachments || [];
                task.attachments = [...existingAttachments, ...newAttachments];
                updatedTask = task;
                return task;
            }
            return task;
        });

        if (!taskFound) {
            return res.status(404).json({ error: 'Pendência não encontrada.' });
        }

        fs.writeFile('pendencias.json', JSON.stringify(tasks, null, 2), (err) => {
            if (err) {
                console.error(chalkInstance.red('❌ ERRO ao anexar arquivo à tarefa:'), err.message);
                return res.status(500).json({ error: 'Erro ao salvar o anexo.' });
            }
            
            io.emit('task_updated', updatedTask); // ⬅️ EMITE

            console.log(chalkInstance.blue(`📎 ${newAttachments.length} anexo(s) adicionados à pendência "${taskName}"`));
            res.status(200).json(updatedTask);
        });
    });
});


// ⬅️ MUDANÇA: Usa server.listen
server.listen(PORT, () => {
    console.log(chalkInstance.green(`\n🚀 Servidor KSS MOTOS rodando em http://localhost:${PORT}\n`));
});