import express from "express";
import bcrypt from "bcrypt-nodejs";
import cors from "cors";
import knex from "knex";


const db = knex({
    client: 'pg',
    connection: {
        host: 'dpg-cfqps31gp3joa8g3gs9g-a',
        user: 'smart_brain_f7nl_user',
        port: 5432,
        password: 'Ki8rdQw1ftcYtrmxtdepI2Ea1OICy4UG',
        database: 'smart_brain_f7nl'
    }
});

db.select('*').from('users').then(data => {
});


const app = express();

app.use(express.urlencoded({extended: false}));
app.use(express.json());
app.use(cors())



app.get('/', (req, res) => { res.send('it is working!') })
//     db.select('*').from('users')
//         .then(user => {
//         if (user.length) {
//             res.json(user)
//         } else {
//             res.status(400).json('Not Found')
//         }
//     })
//     .catch(err => res.status(400).json('Error getting users'))
// }) 

app.post('/signin', (req, res) => {
    const { email, password } = req.body;
    if(!email || !password) {
        return res.status(400).json('Incorrect form submission')
    }
    db.select('email', 'hash').from('login')
        .where('email', '=', email)
        .then(data => {
            const isValid = bcrypt.compareSync(password, data[0].hash);
            if (isValid) {
                return db.select('*').from('users')
                    .where('email', '=', email)
                    .then(user => {
                        res.json(user[0])
                    })
                    .catch(err => res.status(400).json('Unable to get user'))
            } else {
                res.status(400).json('Wrong credentials')
            }
        })
        .catch(err => res.status(400).json('Wrong credentials'))
})

app.post('/register', (req, res) => {
    const { email, name, password } = req.body;
    if(!email || !name || !password) {
        return res.status(400).json('Incorrect form submission')
    }
    const hash = bcrypt.hashSync(password);
        db.transaction(trx => {
            trx.insert({
                hash: hash,
                email: email
            })
            .into('login')
            .returning('email')
            .then(loginEmail => {
                return trx('users')
                    .returning('*')
                    .insert({
                        email: loginEmail[0].email,
                        name: name,
                        joined: new Date()
                })
                .then(user => {
                    res.json(user[0])
                })
            })
            .then(trx.commit)
            .catch(trx.rollback)
        })    
    .catch(err => res.status(400).json('Unable to register'))
})


app.put('/image', (req, res) => {
    const { id } = req.body;
    db('users').where('id', '=', id)
    .increment('entries', 1)
    .returning('entries')
    .then(entries => {
        res.json(entries[0].entries);
    })
    .catch(err => res.status(400).json('Unable to get entries'))
})



app.listen(process.env.PORT || 3001, ()=> {
    console.log(`App is running on port ${process.env.PORT}`)
})