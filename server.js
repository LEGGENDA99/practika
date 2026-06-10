const express = require('express');
const cors = require('cors');
const path = require('path');

const app = express();
const PORT = 3000;

app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

const keywordsDb = {
    "dogs": [
        {
            "title": "Рыжий пес на траве",
            "url": "https://images.unsplash.com/photo-1543466835-00a7907e9de1?w=600&auto=format&fit=crop"
        },
        {
            "title": "Мопс в одежде",
            "url": "https://images.unsplash.com/photo-1583511655857-d19b40a7a54e?w=600&auto=format&fit=crop"
        }
    ],
    "cats": [
        {
            "title": "Милый рыжий кот",
            "url": "https://images.unsplash.com/photo-1514888286974-6c03e2ca1dba?w=600&auto=format&fit=crop"
        },
        {
            "title": "Трехцветный котенок",
            "url": "https://images.unsplash.com/photo-1592194996308-7b43878e84a6?w=600&auto=format&fit=crop"
        }
    ],
    "nature": [
        {
            "title": "Хвойный лес",
            "url": "https://images.unsplash.com/photo-1421789665209-c9b2a435e3dc?w=600&auto=format&fit=crop"
        },
        {
            "title": "Туманный горный пейзаж",
            "url": "https://images.unsplash.com/photo-1470071459604-3b5ec3a7fe05?w=600&auto=format&fit=crop"
        }
    ],
    "anime": [
        {
            "title": "Аниме фигурка на полке",
            "url": "https://images.unsplash.com/photo-1578632767115-351597cf2477?w=600&auto=format&fit=crop"
        },
        {
            "title": "Аниме фото",
            "url": "https://images.unsplash.com/photo-1607604276583-eef5d076aa5f?w=600&auto=format&fit=crop"
        }
    ]
};

app.get('/api/keywords', (req, res) => {
    try {
        res.json(Object.keys(keywordsDb));
    } catch (error) {
        res.status(500).json({ error: "Ошибка сервера при получении ключевых слов" });
    }
});

app.post('/api/get-urls', (req, res) => {
    try {
        const { keyword } = req.body;
        if (!keyword) {
            return res.status(400).json({ error: "Ключевое слово не предоставлено" });
        }
        
        const cleanKeyword = keyword.trim().toLowerCase();
        const urls = keywordsDb[cleanKeyword];
        
        if (!urls || urls.length === 0) {
            return res.status(404).json({ error: "Для данного ключевого слова URL не найдены" });
        }
        
        res.json({ urls });
    } catch (error) {
        res.status(500).json({ error: "Внутренняя ошибка сервера при поиске URL" });
    }
});

app.post('/api/download', (req, res) => {
    const { url, contentType, content, title } = req.body;
    if (!url || !contentType || !content) {
        return res.status(400).json({ error: "Неполные данные для сохранения контента" });
    }
    res.json({ url, contentType, content, title: title || "Без названия" });
});

app.listen(PORT, () => {
    console.log(`Сервер запущен на порту ${PORT}`);
});