const express = require('express');
const path = require('path');
const fs = require('fs');

const app = express();
const PORT = 3000;

// Раздаем статику
app.use(express.static(path.join(__dirname, '../client')));
app.use(express.json());

// Получение рекорда
app.get('/api/score', (req, res) => {
    const dbPath = path.join(__dirname, 'db.json');
    if (fs.existsSync(dbPath)) {
        const data = JSON.parse(fs.readFileSync(dbPath));
        res.json({ highScore: data.highScore || 0 });
    } else {
        res.json({ highScore: 0 });
    }
});

// Сохранение рекорда
app.post('/api/score', (req, res) => {
    const { score } = req.body;
    const dbPath = path.join(__dirname, 'db.json');
    
    let data = { highScore: 0 };
    if (fs.existsSync(dbPath)) {
        data = JSON.parse(fs.readFileSync(dbPath));
    }
    
    let isNewRecord = false;
    if (score > data.highScore) {
        data.highScore = score;
        fs.writeFileSync(dbPath, JSON.stringify(data));
        isNewRecord = true;
        console.log(`🏆 Новый рекорд: ${score}`);
    }
    
    res.json({ success: true, newRecord: isNewRecord });
});

// Главная страница
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, '../client/index.html'));
});

app.listen(PORT, () => {
    console.log(`🚀 Сервер запущен: http://localhost:${PORT}`);
    console.log(`📱 Откройте в браузере: http://localhost:${PORT}`);
});