const express = require('express');
const multer = require('multer');
const ffmpeg = require('fluent-ffmpeg');
const path = require('path');
const fs = require('fs');

const app = express();
const PORT = process.env.PORT || 3000;

// Настройка хранилища для multer
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, 'uploads/');
    },
    filename: (req, file, cb) => {
        cb(null, Date.now() + path.extname(file.originalname)); // добавляем timestamp к имени файла
    },
});

const upload = multer({ storage: storage });

// API для загрузки и конвертации видео
app.post('/upload', upload.single('video'), (req, res) => {
    const file = req.file;

    if (!file || path.extname(file.originalname) !== '.mov') {
        return res.status(400).json({ error: 'Please upload a valid .mov file.' });
    }

    const outputFileName = '123.mp4';
    const outputPath = path.join(__dirname, 'converted', outputFileName);

    ffmpeg(file.path)
        .output(outputPath)
        .on('end', () => {
            // Удаляем временный файл после конвертации
            fs.unlinkSync(file.path);
            res.json({ downloadLink: '${req.protocol}://${req.get(host)}/download/${outputFileName}' });
        })
        .on('error', (err) => {
                fs.unlinkSync(file.path); // Удаляем временный файл в случае ошибки
                return res.status(500).json({ error: 'Error during conversion: ' + err.message });
            })
                .run();
        })

// API для скачивания файла
    app.get('/download/:filename', (req, res) => {
        const filename = req.params.filename;
        const filePath = path.join(__dirname, 'converted', filename);

        if (!fs.existsSync(filePath)) {
            return res.status(404).json({ error: 'File not found.' });
        }

        res.download(filePath, (err) => {
            if (err) {
                return res.status(500).json({ error: 'Error while downloading the file.' });
            }
            // Удаляем файл после скачивания
            fs.unlinkSync(filePath);
        });
    });

// Запуск сервера
    app.listen(PORT, () => {
        console.log('Server is running on http://localhost:' + PORT);
    });
