const express = require('express');
const path = require('path');
const app = express();

// Dosyaları kök dizinden çekmesini zorunlu kılıyoruz
app.use(express.static(__dirname));

// Her türlü istekte index.html'i fırlat
app.get('*', (req, res) => {
    res.sendFile(path.resolve(__dirname, 'index.html'));
});

const PORT = process.env.PORT || 10000;
app.listen(PORT, '0.0.0.0', () => {
    console.log(`Site hazır: ${PORT}`);
});
