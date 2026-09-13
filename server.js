const express = require('express');
const path = require('path');
const app = express();

app.use(express.static(path.join(__dirname, 'public')));
app.use(express.json());

const submissions = {};

app.post('/api/submit', (req, res) => {
    const ip = req.ip;
    const fp = req.body.fingerprint;
    const key = ip + '|' + fp;

    if (submissions[ip]) {
        return res.status(403).json({ error: 'Already submitted from this device'});
    }

    submissions[key] = {
        ip,
        fingerprint: fp,
        type: req.body.type,
        answers: req.body.answers,
        timestamp: req.body.timestamp
    };

    console.log(`New submission: IP=${ip}, Device=${submissions[ip].device}, Type=${type}`);

    res.json({ ok: true});
});

app.listen(3000, () => console.log('Running on http:localhost:3000'));