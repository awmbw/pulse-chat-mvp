require('dotenv').config();
const { summarizeChat } = require('./controllers/aiController');

async function test() {
    const req = {
        body: {
            transcript: "User: [File: moon-photo.png]\nUser: aap kaise ho\nFriend: Je vais bien, et vous ?"
        }
    };
    const res = {
        status: (code) => {
            console.log("Status:", code);
            return res;
        },
        json: (data) => {
            console.log("JSON:", data);
        }
    };

    await summarizeChat(req, res);
}

test();
