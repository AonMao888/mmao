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
} else {
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

// Get all forms data
app.get('/get/all/forms', async (req, res) => {
    try {
        const snapshot = await db.collection('forms').get();
        let formsList = [];

        snapshot.forEach(doc => {
            let data = doc.data();
            if (data.time) {
                data.time = getdate(data.time);
            }
            formsList.push({
                id: doc.id,
                ...data
            });
        });

        res.json({
            status: 'success',
            text: 'Successfully retrieved all forms.',
            data: formsList
        });
    } catch (error) {
        console.log(error);
        res.json({
            status: 'fail',
            text: 'Something went wrong while retrieving forms!',
            data: []
        });
    }
});

// Get all students data
app.get('/get/all/students', async (req, res) => {
    try {
        const snapshot = await db.collection('students').get();
        let studentsList = [];

        snapshot.forEach(doc => {
            let data = doc.data();
            if (data.time) {
                data.time = getdate(data.time);
            }
            studentsList.push({
                id: doc.id,
                ...data
            });
        });

        res.json({
            status: 'success',
            text: 'Successfully retrieved all students.',
            data: studentsList
        });
    } catch (error) {
        console.log(error);
        res.json({
            status: 'fail',
            text: 'Something went wrong while retrieving students!',
            data: []
        });
    }
});

// Add course student
app.post('/add/course/student', async (req, res) => {
    let recv = req.body;
    if (recv && recv.email) {
        try {
            const derivedName = recv.email.split('@')[0].replace(/[._]/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
            const today = new Date().toISOString().split('T')[0];

            const newStudentRef = await db.collection('students').add({
                name: recv.name || derivedName,
                email: recv.email,
                studentClass: recv.studentClass || 'Grade 9',
                status: recv.status || 'enrolled',
                address: recv.address || '',     // Added address
                gender: recv.gender || 'Male',
                joinDate: today,
                time: FieldValue.serverTimestamp()
            });

            res.json({
                status: 'success',
                text: 'Student added successfully.',
                data: {
                    id: newStudentRef.id,
                    name: recv.name || derivedName,
                    email: recv.email,
                    studentClass: recv.studentClass || 'Grade 9',
                    status: recv.status || 'enrolled',
                    address: recv.address || '',
                    gender: recv.gender || 'Male',
                    joinDate: today
                }
            });
        } catch (error) {
            console.log(error);
            res.json({
                status: 'fail',
                text: 'Something went wrong while adding student!',
                data: []
            });
        }
    } else {
        res.json({
            status: 'fail',
            text: 'Email is required!',
            data: []
        });
    }
});

// Edit course student
app.post('/edit/course/student', async (req, res) => {
    let recv = req.body;
    if (recv && recv.id) {
        try {
            const studentRef = db.collection('students').doc(String(recv.id));
            const updateData = {};
            if (recv.email) updateData.email = recv.email;
            if (recv.studentClass) updateData.studentClass = recv.studentClass;
            if (recv.status) updateData.status = recv.status;
            if (recv.name) updateData.name = recv.name;
            if (recv.address) updateData.address = recv.address;
            if (recv.gender) updateData.gender = recv.gender;

            await studentRef.set(updateData, { merge: true });

            res.json({
                status: 'success',
                text: 'Student updated successfully.',
                data: recv
            });
        } catch (error) {
            console.log(error);
            res.json({
                status: 'fail',
                text: 'Something went wrong while updating student!',
                data: []
            });
        }
    } else {
        res.json({
            status: 'fail',
            text: 'Student ID is required!',
            data: []
        });
    }
});

// Get all certificates data
app.get('/get/all/certificates', async (req, res) => {
    try {
        const snapshot = await db.collection('certificates').get();
        let certsList = [];

        snapshot.forEach(doc => {
            let data = doc.data();
            if (data.time) {
                data.time = getdate(data.time);
            }
            certsList.push({
                id: doc.id,
                ...data
            });
        });

        res.json({
            status: 'success',
            text: 'Successfully retrieved all certificates.',
            data: certsList
        });
    } catch (error) {
        console.log(error);
        res.json({
            status: 'fail',
            text: 'Something went wrong while retrieving certificates!',
            data: []
        });
    }
});

// Add certificate
app.post('/add/certificate', async (req, res) => {
    let recv = req.body;
    if (recv && recv.email) {
        try {
            const today = new Date().toISOString().split('T')[0];
            const newCertRef = await db.collection('certificates').add({
                displayName: recv.displayName || '',
                email: recv.email,
                course: recv.course || '',
                qualifyDate: recv.qualifyDate || today,
                grade: recv.grade || '',
                examScore: recv.examScore || '',
                assignmentScore: recv.assignmentScore || '',
                addDate: recv.addDate || today,
                certificateId: recv.certificateId || '',
                time: FieldValue.serverTimestamp()
            });

            res.json({
                status: 'success',
                text: 'Certificate added successfully.',
                data: {
                    id: newCertRef.id,
                    displayName: recv.displayName || '',
                    email: recv.email,
                    course: recv.course || '',
                    qualifyDate: recv.qualifyDate || today,
                    grade: recv.grade || '',
                    examScore: recv.examScore || '',
                    assignmentScore: recv.assignmentScore || '',
                    addDate: recv.addDate || today,
                    certificateId: recv.certificateId || ''
                }
            });
        } catch (error) {
            console.log(error);
            res.json({
                status: 'fail',
                text: 'Something went wrong while adding certificate!',
                data: []
            });
        }
    } else {
        res.json({
            status: 'fail',
            text: 'Email is required!',
            data: []
        });
    }
});

// Edit certificate
app.post('/edit/certificate', async (req, res) => {
    let recv = req.body;
    if (recv && recv.id) {
        try {
            const certRef = db.collection('certificates').doc(String(recv.id));
            const updateData = {};
            if (recv.displayName !== undefined) updateData.displayName = recv.displayName;
            if (recv.email !== undefined) updateData.email = recv.email;
            if (recv.course !== undefined) updateData.course = recv.course;
            if (recv.qualifyDate !== undefined) updateData.qualifyDate = recv.qualifyDate;
            if (recv.grade !== undefined) updateData.grade = recv.grade;
            if (recv.examScore !== undefined) updateData.examScore = recv.examScore;
            if (recv.assignmentScore !== undefined) updateData.assignmentScore = recv.assignmentScore;
            if (recv.addDate !== undefined) updateData.addDate = recv.addDate;
            if (recv.certificateId !== undefined) updateData.certificateId = recv.certificateId;

            await certRef.set(updateData, { merge: true });

            res.json({
                status: 'success',
                text: 'Certificate updated successfully.',
                data: recv
            });
        } catch (error) {
            console.log(error);
            res.json({
                status: 'fail',
                text: 'Something went wrong while updating certificate!',
                data: []
            });
        }
    } else {
        res.json({
            status: 'fail',
            text: 'Certificate ID is required!',
            data: []
        });
    }
});

// Check certificate by ID
app.get('/check/certificate/:id', async (req, res) => {
    const certId = req.params.id;
    try {
        // First, try to query by 'certificateId' field
        const snapshot = await db.collection('certificates').where('certificateId', '==', certId).get();

        if (!snapshot.empty) {
            let certData = null;
            snapshot.forEach(doc => {
                let data = doc.data();
                if (data.time) {
                    data.time = getdate(data.time);
                }
                certData = {
                    id: doc.id,
                    ...data
                };
            });
            return res.json({
                status: 'success',
                text: 'Certificate found.',
                data: certData
            });
        }

        // If not found by certificateId field, try finding by document ID
        const docRef = await db.collection('certificates').doc(certId).get();
        if (docRef.exists) {
            let data = docRef.data();
            if (data.time) {
                data.time = getdate(data.time);
            }
            return res.json({
                status: 'success',
                text: 'Certificate found.',
                data: {
                    id: docRef.id,
                    ...data
                }
            });
        }

        res.json({
            status: 'fail',
            text: 'Certificate not found.',
            data: null
        });

    } catch (error) {
        console.log(error);
        res.json({
            status: 'fail',
            text: 'Something went wrong while checking certificate!',
            data: null
        });
    }
});

// Sync or Update User Auth Data in Firestore
app.post('/sync/user', async (req, res) => {
    let recv = req.body;
    if (recv && recv.uid) {
        try {
            const userRef = db.collection('users').doc(String(recv.uid));
            const doc = await userRef.get();

            const userData = {
                uid: recv.uid,
                email: recv.email || '',
                displayName: recv.displayName || '',
                lastActive: FieldValue.serverTimestamp()
            };

            if (!doc.exists) {
                // If user doesn't exist in database, create new document
                userData.createdAt = FieldValue.serverTimestamp();
                userData.completedCourses = [];
                userData.enrolledCourses = [];
                userData.role = 'student';
                userData.bio = '';
                userData.photoURL = recv.photoURL || null;

                await userRef.set(userData);
                return res.json({
                    status: 'success',
                    text: 'User created in database successfully.',
                    data: userData
                });
            } else {
                // If user exists, check and update if there are any changes (like displayName or email)
                const existingData = doc.data();
                const updates = {};

                if (recv.displayName && recv.displayName !== existingData.displayName) {
                    updates.displayName = recv.displayName;
                }
                if (recv.email && recv.email !== existingData.email) {
                    updates.email = recv.email;
                }
                if (recv.photoURL && recv.photoURL !== existingData.photoURL) {
                    updates.photoURL = recv.photoURL;
                }

                updates.lastActive = FieldValue.serverTimestamp();

                await userRef.update(updates);

                return res.json({
                    status: 'success',
                    text: 'User data synchronized and updated successfully.',
                    data: { ...existingData, ...updates }
                });
            }
        } catch (error) {
            console.log(error);
            res.json({
                status: 'fail',
                text: 'Something went wrong while syncing user data!',
                data: null
            });
        }
    } else {
        res.json({
            status: 'fail',
            text: 'User UID is required!',
            data: null
        });
    }
});

// Update user profile (Address, Name, etc.) in Firestore
app.post('/update/profile', async (req, res) => {
    let recv = req.body;
    if (recv && recv.uid) {
        try {
            const userRef = db.collection('users').doc(String(recv.uid));
            const doc = await userRef.get();

            const updateData = {
                lastActive: FieldValue.serverTimestamp(),
                updatedAt: FieldValue.serverTimestamp()
            };

            if (recv.address !== undefined) {
                updateData.address = recv.address;
            }
            if (recv.displayName !== undefined) {
                updateData.displayName = recv.displayName;
            }

            if (!doc.exists) {
                // If user document doesn't exist yet, create it
                updateData.uid = recv.uid;
                updateData.email = recv.email || '';
                updateData.createdAt = FieldValue.serverTimestamp();
                await userRef.set(updateData);
            } else {
                // Update existing user document
                await userRef.update(updateData);
            }

            res.json({
                status: 'success',
                text: 'Profile updated successfully in database.',
                data: updateData
            });
        } catch (error) {
            console.log(error);
            res.json({
                status: 'fail',
                text: 'Something went wrong while updating profile!',
                data: null
            });
        }
    } else {
        res.json({
            status: 'fail',
            text: 'User UID is required!',
            data: null
        });
    }
});

// Get all users data from Firestore users collection
app.get('/get/all/users', async (req, res) => {
    try {
        const snapshot = await db.collection('users').get();
        let usersList = [];

        snapshot.forEach(doc => {
            let data = doc.data();
            // Convert timestamps if available
            if (data.createdAt && typeof data.createdAt.toDate === 'function') {
                data.createdAt = getdate(data.createdAt);
            }
            if (data.lastActive && typeof data.lastActive.toDate === 'function') {
                data.lastActive = getdate(data.lastActive);
            }
            usersList.push({
                id: doc.id,
                ...data
            });
        });

        res.json({
            status: 'success',
            text: 'Successfully retrieved all users.',
            data: usersList
        });
    } catch (error) {
        console.log(error);
        res.json({
            status: 'fail',
            text: 'Something went wrong while retrieving users!',
            data: []
        });
    }
});

// Get student courses/progress by email using path /student/course
app.get('/student/course', async (req, res) => {
    const userEmail = req.query.email ? req.query.email.trim() : '';

    if (!userEmail) {
        return res.json({
            status: 'fail',
            text: 'Email query parameter is required!',
            data: []
        });
    }

    try {
        const studentsSnapshot = await db.collection('students')
            .where('email', '==', userEmail)
            .get();

        if (studentsSnapshot.empty) {
            console.log("No student found for email:", userEmail);
            return res.json({
                status: 'success',
                text: 'No student record found for this email.',
                data: []
            });
        }

        let studentList = [];
        studentsSnapshot.forEach(doc => {
            const data = doc.data();
            studentList.push({
                id: doc.id,
                title: data.studentClass || 'Enrolled Course', // ဥပမာ - "linux-noob-to-pro"
                level: data.status || 'Active',                 // ဥပမာ - "enrolled"
                ...data
            });
        });

        res.json({
            status: 'success',
            text: 'Student records retrieved successfully.',
            data: studentList
        });

    } catch (error) {
        console.error('Error fetching student course:', error);
        res.json({
            status: 'fail',
            text: 'Server error while fetching student course.',
            data: []
        });
    }
});

// Get student certificates by email using path /student/certificates
app.get('/student/certificates', async (req, res) => {
    const userEmail = req.query.email ? req.query.email.trim() : '';

    if (!userEmail) {
        return res.json({
            status: 'fail',
            text: 'Email query parameter is required!',
            data: []
        });
    }

    try {
        const certsSnapshot = await db.collection('certificates')
            .where('email', '==', userEmail)
            .get();

        if (certsSnapshot.empty) {
            console.log("No certificate found for email:", userEmail);
            return res.json({
                status: 'success',
                text: 'No certificate record found for this email.',
                data: []
            });
        }

        let certList = [];
        certsSnapshot.forEach(doc => {
            const data = doc.data();
            certList.push({
                id: doc.id,
                course: data.course || 'Course Certificate',
                certificateId: data.certificateId || '',
                grade: data.grade || 'N/A',
                qualifyDate: data.qualifyDate || '',
                ...data
            });
        });

        res.json({
            status: 'success',
            text: 'Certificates retrieved successfully.',
            data: certList
        });

    } catch (error) {
        console.error('Error fetching student certificates:', error);
        res.json({
            status: 'fail',
            text: 'Server error while fetching certificates.',
            data: []
        });
    }
});

// Get all courses data from Firestore collection
app.get('/get/course/:id', async (req, res) => {
    try {
        let { id } = req.params;
        const snapshot = await db.collection('courses').doc(id).get();
        let usersList = [];
        if (snapshot.exists) {
            let coursedata = snapshot.data();
            let parseddata = {
                id: snapshot.id,
                ...coursedata
            }
            res.json({
                status: 'success',
                text: 'Course data got.',
                data: parseddata
            });
        } else {
            res.json({
                status: 'fail',
                text: 'There have no course with this ID!',
                data: []
            });
        }
    } catch (error) {
        console.log(error);
        res.json({
            status: 'fail',
            text: 'Something went wrong while retrieving course!',
            data: []
        });
    }
});

// Add class with logoemoji and description (Updated to support className)
app.post('/add/class', async (req, res) => {
    let recv = req.body;
    const classNameVal = recv.className || recv.name;
    if (recv && classNameVal) {
        try {
            const newClassRef = await db.collection('classes').add({
                className: classNameVal,
                logoemoji: recv.logoemoji || '',
                description: recv.description || '',
                instructor: recv.instructor || '',
                schedule: recv.schedule || '',
                fee: recv.fee || '',
                status: recv.status || 'Active',
                classLink: recv.classLink || '',
                time: FieldValue.serverTimestamp()
            });

            res.json({
                status: 'success',
                text: 'Class added successfully.',
                data: {
                    id: newClassRef.id,
                    className: classNameVal,
                    ...recv
                }
            });
        } catch (error) {
            console.log(error);
            res.json({
                status: 'fail',
                text: 'Something went wrong while adding class!',
                data: []
            });
        }
    } else {
        res.json({
            status: 'fail',
            text: 'Class name is required!',
            data: []
        });
    }
});

// Edit class (Updated to support className, schedule, fee, status)
app.post('/edit/class', async (req, res) => {
    let recv = req.body;
    if (recv && recv.id) {
        try {
            const classRef = db.collection('classes').doc(String(recv.id));
            const updateData = {};
            if (recv.className !== undefined) updateData.className = recv.className;
            if (recv.name !== undefined) updateData.className = recv.name;
            if (recv.logoemoji !== undefined) updateData.logoemoji = recv.logoemoji;
            if (recv.description !== undefined) updateData.description = recv.description;
            if (recv.instructor !== undefined) updateData.instructor = recv.instructor;
            if (recv.schedule !== undefined) updateData.schedule = recv.schedule;
            if (recv.fee !== undefined) updateData.fee = recv.fee;
            if (recv.status !== undefined) updateData.status = recv.status;
            if (recv.classLink !== undefined) updateData.classLink = recv.classLink;

            await classRef.set(updateData, { merge: true });

            res.json({
                status: 'success',
                text: 'Class updated successfully.',
                data: recv
            });
        } catch (error) {
            console.log(error);
            res.json({
                status: 'fail',
                text: 'Something went wrong while updating class!',
                data: []
            });
        }
    } else {
        res.json({
            status: 'fail',
            text: 'Class ID is required!',
            data: []
        });
    }
});

// Get all classes data
app.get('/get/all/classes', async (req, res) => {
    try {
        const snapshot = await db.collection('classes').get();
        let classesList = [];

        snapshot.forEach(doc => {
            let data = doc.data();
            if (data.time) {
                data.time = getdate(data.time);
            }
            classesList.push({
                id: doc.id,
                ...data
            });
        });

        res.json({
            status: 'success',
            text: 'Successfully retrieved all classes.',
            data: classesList
        });
    } catch (error) {
        console.log(error);
        res.json({
            status: 'fail',
            text: 'Something went wrong while retrieving classes!',
            data: []
        });
    }
});

app.listen(80, () => {
    console.log('Server was started on port 80.');
})