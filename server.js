const express = require('express');
const fs = require('fs');
const path = require('path');
const app = express();
const PORT = 4000;

app.use(express.json());
app.use(express.static(path.join(__dirname)));

// Endpoint para carregar pendências
app.get('/tasks', (req, res) => {
    fs.readFile('pendencias.json', 'utf8', (err, data) => {
        if (err) {
            return res.status(500).json({ error: 'Erro ao ler o arquivo' });
        }
        res.json(JSON.parse(data || '[]'));
    });
});

// Endpoint para deletar uma tarefa
app.delete('/tasks/:name', (req, res) => {
    const taskName = req.params.name;

    fs.readFile('pendencias.json', 'utf8', (err, data) => {
        if (err) {
            return res.status(500).json({ error: 'Erro ao ler o arquivo' });
        }
        let tasks = JSON.parse(data || '[]');
        tasks = tasks.filter(task => task.name !== taskName);
        fs.writeFile('pendencias.json', JSON.stringify(tasks, null, 2), (err) => {
            if (err) {
                return res.status(500).json({ error: 'Erro ao deletar a tarefa' });
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
            return res.status(500).json({ error: 'Erro ao atualizar o arquivo' });
        }
        res.status(204).send(); // Sucesso, mas sem conteúdo
    });
});

app.put('/tasks/:name', (req, res) => {
    const taskName = req.params.name;
    const updatedTask = req.body;

    fs.readFile('pendencias.json', 'utf8', (err, data) => {
        if (err) {
            return res.status(500).json({ error: 'Erro ao ler o arquivo' });
        }
        let tasks = JSON.parse(data || '[]');
        tasks = tasks.map(task => task.name === taskName ? updatedTask : task);
        fs.writeFile('pendencias.json', JSON.stringify(tasks, null, 2), (err) => {
            if (err) {
                return res.status(500).json({ error: 'Erro ao atualizar a tarefa' });
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
            return res.status(500).json({ error: 'Erro ao ler o arquivo' });
        }
        const tasks = JSON.parse(data || '[]');
        tasks.push(newTask);
        fs.writeFile('pendencias.json', JSON.stringify(tasks, null, 2), (err) => {
            if (err) {
                return res.status(500).json({ error: 'Erro ao salvar a tarefa' });
            }
            res.status(201).json(newTask);
        });
    });
});

app.listen(PORT, () => {
    console.log(`Servidor rodando em http://localhost:${PORT}`);
});