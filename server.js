const express = require('express');
const path = require('path');
const app = express();

// Dosyaların bulunduğu klasörü tanıt
app.use(express.static(path.join(__dirname, '.')));

// Ana sayfa isteği geldiğinde index.html'i gönder
app.get('*', (req, res) => {
    res.sendFile(path.join(__dirname, 'index.html'));
});

// Port ayarı (Render için kritik)
const PORT = process.env.PORT || 10000;
app.listen(PORT, '0.0.0.0', () => {
    console.log(`Sunucu ${PORT} portunda canavar gibi çalışıyor!`);
});
