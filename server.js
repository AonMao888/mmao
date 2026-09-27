require('dotenv').config({ debug: true });
const express = require('express');
const cors = require('cors');
var admin = require('firebase-admin');
const { cert } = require('firebase-admin/app');
const { getFirestore, FieldValue } = require('firebase-admin/firestore');

const app = express();
app.use(express.json());
app.use(express.urlencoded({ extended: false }))
app.use(cors({
    origin: '*'
}));

let serviceAccount;
if (process.env.FIREBASE_SERVICE_ACCOUNT) {
    serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT);
}else{
    serviceAccount = require('./mmao-6395-firebase-adminsdk-fbsvc-1ac9271187.json')
}

admin.initializeApp({
    credential: cert(serviceAccount)
});
const db = getFirestore();

//map for encrypt and decrypt dictionary
let en_data = {
    'a': '8n', 'b': '37', 'c': 'Q8', 'd': 'zT', 'e': '1Z', 'f': '2Y', 'g': 'pj', 'h': '9wt', 'i': 'kz', 'j': '3s', 'k': 'rX', 'l': 'zb', 'm': 'sE', 'n': 'Mg', 'o': 'Ke', 'p': 'hP', 'q': 'nE', 'r': 'yB', 's': 'Pw', 't': 'xq', 'u': 'uT', 'v': '6v', 'w': 'T7', 'x': 'yI', 'y': 'CmW', 'z': 'R1',
    '0': 'Tk', '1': 'kV', '2': 'Bw', '3': 'zP', '4': 'Yo', '5': '4c', '6': 'Ar', '7': 'Dm', '8': 'U7', '9': 'Fw', ' ': 'qN', '.': 'vi', ',': 'Pq', ':': '3E'
}
const de_data = {};
for (const [key, value] of Object.entries(en_data)) {
    de_data[value] = key;
}
//encrypt function
function encrypt(e) {
    let encrypted = '';
    const normalizedText = e.toLowerCase();
    for (const char of normalizedText) {
        const substitution = en_data[char];
        if (substitution) {
            encrypted += substitution + 'a';
        } else {
            encrypted += char
        }
    }
    return encrypted.endsWith('a') ? encrypted.slice(0, -'a'.length) : encrypted
}
//decrypt function
function decrypt(e) {
    let text = '';
    const encrypt = e.split('a');
    for (const char of encrypt) {
        const origin = de_data[char];
        if (origin) {
            text += origin;
        } else {
            text += char
        }
    }
    return text
}

//generate time
function getdate(e) {
    let jsdate = e.toDate();
    const formattedDate = jsdate.toLocaleString('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit'
    });
    return formattedDate;
}

app.get('/', (req, res) => {
    res.send('Home')
})

//new course form
app.post('/submit/course/form', async (req, res) => {
    let recv = req.body;
    if (recv) {
        try {
            await db.collection('forms').add({
                firstName: recv.firstName,
                lastName: recv.lastName,
                emailAddress: recv.emailAddress,
                address: recv.address,
                city: recv.city,
                country: recv.country,
                role: recv.role,
                age: recv.age,
                interesting: recv.interesting,
                comskill: recv.comskill,
                gender: recv.gender,
                expectations: recv.expectations,
                submission: recv.submission,
                course: recv.course,
                time: FieldValue.serverTimestamp()
            }).then(() => {
                res.json({
                    status: 'success',
                    text: 'Form was submmited.',
                    data: []
                })
            }).catch(error => {
                console.log(error);
                res.json({
                    status: 'fail',
                    text: 'Something went wrong while submiting form!',
                    data: []
                })
            })
        } catch (e) {
            console.log(e);
            res.json({
                status: 'fail',
                text: 'Something went wrong to submit form!',
                data: []
            })
        }
    } else {
        res.json({
            status: 'fail',
            text: 'Something went wrong!',
            data: []
        })
    }
})

app.listen(80, () => {
    console.log('Server was started on port 80.');
})