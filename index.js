const express = require('express')
const mysql = require('mysql')
const app = express()
const bodyParser = require('body-parser')
const jwt = require('jsonwebtoken')
const crypto = require('crypto')
const port = 3000

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: false }));

let con = mysql.createConnection({
    host: 'localhost',
    user: 'root',
    password: '',
    database: 'restapi'
});

app.listen(port, function(req, res) {
    console.log(`listening on port http://localhost:${port}`);
});

app.post("/users", function(req, res) {
    const password = hash(req.body.password);

    let sql = `INSERT INTO users (username, firstname, lastname, password) 
    VALUES ('${req.body.username}', '${req.body.firstname}', '${req.body.lastname}', '${password}')`

    con.query(sql, function(err, result){
        if (err) throw err;
            res.send(result);
            
            if (result[0] === null){
                res.status(404).end();
            }
        })
    res.send("Hashningen och tillägg av användare funkar")
})
    
app.get("/users", function(req, res) {
    let authHeader = req.headers['authorization']

    if (authHeader === undefined) {
        res.sendStatus(403).send("Du har ingen token")
    }
    let token = authHeader.slice(7)

    let decoded
    try {
        decoded = jwt.verify(token, jwtSecret)
    }
    catch (err) {
        console.log(err)
        res.status(401).send("Din token stämmer ej eller gått ut...")
    }


    let sql = `SELECT * FROM users`
    
    con.query(sql, function(err, result){
        if (err) throw err;
            res.send(result);
        if (result[0] === null){
            res.status(404).end();
        }
    })
})
    
const jwtSecret = 'my-secret-key';
    
function hash(data) {
    const hash = crypto.createHash('sha256');
    hash.update(data);
    return hash.digest('hex')
}

function activeUser(body){
    return body && body.username
}

// POST route för att logga in en användare och generera en JWT-token
app.post("/login", (req, res) => {
    const username = req.body.username
    const password = hash(req.body.password)

    if(activeUser(req.body)){
        let sql = `SELECT * FROM users WHERE username = '${req.body.username}'`
        con.query(sql, function(err, result){
            if (hash(req.body.password) == password){
                if (err) throw err;
                const token = jwt.sign({ userId: req.body.id, exp: Date.now()/1000 + 40}, jwtSecret);
                // Generera en JWT-token med användarens ID som payload

                let Response = {
                    "svar": "Här under är din token du använder för att logga in.",
                    "Token": token
                }
                res.send(Response)
            }
            res.send("Incorrect login credentials")
        })
    }
    else {
        res.status(422)
    }
});

app.get("/users/:id", function(req, res) {
    let sql = `SELECT * FROM users WHERE id = '${req.params.id}'`
    
    con.query(sql, function(err, result){
        if (err) throw err;
            res.send(result);
        if (res[0] === null){
            res.status(404).end();
        }
    })
})

app.put("/users/:id", function(req, res) {
    const password = hash(req.body.password)

    let sql = `UPDATE users SET username='${req.body.username}', firstname ='${req.body.firstname}', lastname = '${req.body.lastname}', password = '${password}' WHERE id = '${req.params.id}'`

    con.query(sql, function(err, result){
        if (err) throw err;
        res.status(202).end();
        res.json(result);
    })
})
