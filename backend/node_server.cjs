const express = require('express');
const fs = require('fs');
const app = express();

app.use(express.json()); 

app.post('/register-kiosk', (req, res) => {
    const { kiosk_id, public_key } = req.body;
    const fileData = fs.readFileSync('kiosks.json', 'utf8');
    const kiosks = JSON.parse(fileData);

    kiosks.push({ kiosk_id: kiosk_id, public_key: public_key });
    fs.writeFileSync('kiosks.json', JSON.stringify(kiosks, null, 2));

    res.send({ message: "Kiosk registered successfully!" });
});

const PORT = process.env.PORT || 3001;
app.listen(PORT, () => {
    console.log(`Server is running on http://localhost:${PORT}`);
});