const express = require('express');
const fs = require('fs');
const path = require('path');
const chalk = require('chalk'); // Importa o módulo chalk
// Cria uma instância robusta de chalk para contornar problemas de compatibilidade
const chalkInstance = chalk.default || chalk; 

const app = express();
const PORT = 4000;

app.use(express.json());
app.use(express.static(path.join(__dirname)));

// Endpoint para carregar pendências
app.get('/tasks', (req, res) => {
    fs.readFile('pendencias.json', 'utf8', (err, data) => {
        if (err) {
            // Usando chalkInstance
            console.error(chalkInstance.red('❌ ERRO ao ler o arquivo de pendências:'), err.message);
            return res.status(500).json({ error: 'Erro ao ler o arquivo' });
        }
        res.json(JSON.parse(data || '[]'));
        console.log(chalkInstance.green('📦 Pendências carregadas!'));
    });
});

// Endpoint para deletar uma tarefa
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
            res.status(204).send(); // Sucesso, mas sem conteúdo
        });
    });
});

// Endpoint para limpar todas as tarefas
app.delete('/tasks/clear-all', (req, res) => {
    // Escreve um array vazio no arquivo
    fs.writeFile('pendencias.json', JSON.stringify([], null, 2), (err) => {
        if (err) {
            console.error(chalkInstance.red('❌ ERRO ao limpar todas as pendências:'), err.message);
            return res.status(500).json({ error: 'Erro ao atualizar o arquivo' });
        }
        res.status(204).send(); // Sucesso, mas sem conteúdo
        console.log(chalkInstance.magenta('✨ Todas as Pendências Limpas!'));
    });
});

// Endpoint para atualizar/concluir uma tarefa
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
                return updatedTask;
            }
            return task;
        });

        fs.writeFile('pendencias.json', JSON.stringify(tasks, null, 2), (err) => {
            if (err) {
                console.error(chalkInstance.red('❌ ERRO ao atualizar a tarefa:'), err.message);
                return res.status(500).json({ error: 'Erro ao atualizar a tarefa' });
            }
            if (taskFound) {
                console.log(chalkInstance.blue(`✅ Pendência "${taskName}" marcada como Concluída!"`));
            } else {
                console.log(chalkInstance.red(`⚠️ Tentativa de atualizar pendência não encontrada: "${taskName}"`));
            }
            res.json(updatedTask);
        });
    });
});

// Endpoint para adicionar uma nova pendência
app.post('/tasks', (req, res) => {
    const newTask = req.body;
    fs.readFile('pendencias.json', 'utf8', (err, data) => {
        if (err) {
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
            res.status(201).json(newTask);
            console.log(chalkInstance.cyan(`➕ Nova Pendência Adicionada: ${newTask.name} (${newTask.city})`));
        });
    });
});

app.listen(PORT, () => {
    // Usando chalkInstance na inicialização
    console.log(chalkInstance.green(`\n🚀 Servidor KSS MOTOS rodando em http://localhost:${PORT}\n`));
});