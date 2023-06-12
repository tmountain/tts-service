require('dotenv').config()

const express = require('express')
const bodyParser = require('body-parser')
const AWS = require('aws-sdk')
const cors = require('cors') // Import the cors middleware
const app = express()

app.use(bodyParser.json())
app.use(cors()) // Use it before all route definitions

const polly = new AWS.Polly({
    accessKeyId: process.env.AWS_ACCESS_KEY_ID,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
    region: process.env.AWS_REGION
})

app.post('/speech', async (req, res) => {
    const { ssml, voice } = req.body;
    // use neural voice (more expensive, but better quality)
    let params = {
        Text: ssml,
        TextType: 'ssml',
        OutputFormat: 'mp3',
        VoiceId: voice,
        Engine: 'neural'
    };

    polly.synthesizeSpeech(params, (err, data) => {
        if (err) {
            console.log(err);
            res.status(500).end();
        } else if (data) {
            if (data.AudioStream instanceof Buffer) {
                res.status(200).send(data);
            }
        }
    });
});

app.post('/visemes', async (req, res) => {
    const { ssml, voice } = req.body;
    let params = {
        OutputFormat: 'json',
        Text: ssml,
        TextType: 'ssml',
        VoiceId: voice,
        SpeechMarkTypes: ['viseme']
    };

    polly.synthesizeSpeech(params, (err, data) => {
        if (err) {
            console.log(err);
            res.status(500).end();
        } else if (data) {
            if (data.AudioStream instanceof Buffer) {
                const audioStreamString = data.AudioStream.toString();
                const lines = audioStreamString.split('\n');
                // filter empty lines and parse the json
                const visemes = lines.filter(line => line.length > 0).map(line => JSON.parse(line));
                res.status(200).json(visemes);
            }
        }
    });
});

app.listen(3000, () => {
    console.log('Server started on port 3000');
});
