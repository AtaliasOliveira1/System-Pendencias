const express = require('express');
const fs = require('fs');
const path = require('path');
const chalk = require('chalk');
const multer = require('multer');

const chalkInstance = chalk.default || chalk;

const app = express();
const PORT = 4000;

const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        const uploadPath = path.join(__dirname, 'uploads');
        if (!fs.existsSync(uploadPath)) {
            fs.mkdirSync(uploadPath);
        }
        cb(null, uploadPath);
    },
    filename: (req, file, cb) => {
        // Garante nomes únicos, mas preserva a extensão
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        cb(null, uniqueSuffix + '-' + file.originalname);
    }
});
// ⬅️ MUDANÇA: Usando upload.array() para aceitar múltiplos arquivos. 
// O nome do campo será 'attachments' (plural).
const upload = multer({ storage: storage });

app.use((req, res, next) => {
    // Aplica express.json() se não for uma requisição de upload de arquivo
    if (req.method === 'POST' && (req.url === '/tasks-with-file' || req.url.startsWith('/tasks/'))) {
        next(); 
    } else {
        express.json()(req, res, next);
    }
});

app.use(express.static(path.join(__dirname)));
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// ... (GET, DELETE, CLEAR-ALL, e PUT permanecem como estão) ...
// (GET /tasks)
app.get('/tasks', (req, res) => {
    fs.readFile('pendencias.json', 'utf8', (err, data) => {
        if (err) {
            console.error(chalkInstance.red('❌ ERRO ao ler o arquivo de pendências:'), err.message);
            return res.status(500).json({ error: 'Erro ao ler o arquivo' });
        }
        res.json(JSON.parse(data || '[]'));
        console.log(chalkInstance.green('📦 Pendências carregadas!'));
    });
});

// (DELETE /tasks/:name)
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
            } else {
                 console.log(chalkInstance.red(`⚠️ Tentativa de deletar pendência não encontrada: "${taskName}"`));
            }
            res.status(204).send();
        });
    });
});

// (DELETE /tasks/clear-all)
app.delete('/tasks/clear-all', (req, res) => {
    fs.writeFile('pendencias.json', JSON.stringify([], null, 2), (err) => {
        if (err) {
            console.error(chalkInstance.red('❌ ERRO ao limpar todas as pendências:'), err.message);
            return res.status(500).json({ error: 'Erro ao atualizar o arquivo' });
        }
        res.status(204).send();
        console.log(chalkInstance.magenta('✨ Todas as Pendências Limpas!'));
    });
});

// (PUT /tasks/:name) - Sem mudanças, o spread operator (...) no updatedTask preserva os anexos
app.put('/tasks/:name', (req, res) => {
    const taskName = req.params.name;
    const updatedTask = req.body;

    fs.readFile('pendencias.json', 'utf8', (err, data) => {
        if (err) {
            console.error(chalkInstance.red('❌ ERRO ao ler o arquivo para atualizar:'), err.message);
            return res.status(500).json({ error: 'Erro ao ler o arquivo' });
        }
        let tasks = JSON.parse(data || '[]');
        let taskFound = false;

        tasks = tasks.map(task => {
            if (task.name === taskName) {
                taskFound = true;
                return { ...task, ...updatedTask }; // Atualiza todos os campos fornecidos
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
            } else {
                console.log(chalkInstance.red(`⚠️ Tentativa de atualizar pendência não encontrada: "${taskName}"`));
            }
            res.json(updatedTask);
        });
    });
});


// ⬅️ MUDANÇA: Endpoint para adicionar pendência agora usa upload.array('attachments')
app.post('/tasks-with-file', upload.array('attachments', 10), (req, res) => {
    const files = req.files; // ⬅️ 'files' é um ARRAY
    const body = req.body;

    // Mapeia os arquivos para um formato de objeto
    const attachments = files ? files.map(file => ({
        path: `/uploads/${file.filename}`,
        filename: file.originalname // Salva o nome original
    })) : [];

    const newTask = {
        name: body.taskName,
        city: body.cityName,
        requester: body.requesterName,
        completed: false,
        timestamp: new Date().toISOString(),
        attachments: attachments // ⬅️ Salva o array de anexos
    };

    fs.readFile('pendencias.json', 'utf8', (err, data) => {
        if (err) {
            // ... (tratamento de erro)
            console.error(chalkInstance.red('❌ ERRO ao ler o arquivo para adicionar:'), err.message);
            return res.status(500).json({ error: 'Erro ao ler o arquivo' });
        }
        const tasks = JSON.parse(data || '[]');
        tasks.push(newTask);
        
        fs.writeFile('pendencias.json', JSON.stringify(tasks, null, 2), (err) => {
            // ... (tratamento de erro)
            if (err) {
                console.error(chalkInstance.red('❌ ERRO ao salvar a tarefa:'), err.message);
                return res.status(500).json({ error: 'Erro ao salvar a tarefa' });
            }
            res.status(201).json(newTask);
            console.log(chalkInstance.cyan(`➕ Nova Pendência Adicionada: ${newTask.name} (${newTask.city}) com ${attachments.length} Anexo(s)`));
        });
    });
});

// ⬅️ MUDANÇA: Endpoint para anexar a uma pendência existente
app.post('/tasks/:name/attach', upload.array('attachments', 10), (req, res) => {
    const taskName = req.params.name;
    const files = req.files; // ⬅️ 'files' é um ARRAY

    if (!files || files.length === 0) {
        return res.status(400).json({ error: 'Nenhum arquivo enviado.' });
    }

    // Mapeia os novos arquivos
    const newAttachments = files.map(file => ({
        path: `/uploads/${file.filename}`,
        filename: file.originalname
    }));

    fs.readFile('pendencias.json', 'utf8', (err, data) => {
        if (err) {
            // ... (tratamento de erro)
            console.error(chalkInstance.red('❌ ERRO ao ler o arquivo para anexar:'), err.message);
            return res.status(500).json({ error: 'Erro ao ler o arquivo' });
        }
        let tasks = JSON.parse(data || '[]');
        let taskFound = false;
        let updatedTask = null;

        tasks = tasks.map(task => {
            if (task.name === taskName) {
                taskFound = true;
                // ⬅️ MUDANÇA: Concatena o array existente com os novos anexos
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
                // ... (tratamento de erro)
                console.error(chalkInstance.red('❌ ERRO ao anexar arquivo à tarefa:'), err.message);
                return res.status(500).json({ error: 'Erro ao salvar o anexo.' });
            }
            console.log(chalkInstance.blue(`📎 ${newAttachments.length} anexo(s) adicionados à pendência "${taskName}"`));
            res.status(200).json(updatedTask); // Retorna a tarefa atualizada
        });
    });
});


app.listen(PORT, () => {
    console.log(chalkInstance.green(`\n🚀 Servidor KSS MOTOS rodando em http://localhost:${PORT}\n`));
});