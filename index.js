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

app.get("/", function(req, res) {   
    res.send("Hello, world!");
})

app.post("/users", function(req, res) {
    const password = hash(req.body.password);

    let sql = `INSERT INTO users (username, firstname, lastname, password) 
    VALUES ('${req.body.username}', '${req.body.firstname}', '${req.body.lastname}', '${password}')`
    
    con.query(sql, function(err, res){
        if (err) throw err;
            res.send(res);
            
            if (res[0] === null){
                res.status(404).end();
            }
        })
        res.send("Hashningen och tillägg av användare funkar")
        // Två stycken användare har samma lösenord (banan) vilket ger samma hashkoder
})
    
app.get("/users", function(req, res) {
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

// POST route för att logga in en användare och generera en JWT-token
app.post("/login", (req, res) => {
    console.log(req.body);

    const username = req.body.username
    const password = hash(req.body.password)

    if(username && password){
        // Generera en JWT-token med användarens ID som payload
        const token = jwt.sign({ userId: user.id }, jwtSecret);
        
        jwt.verify(token, 'my-secret-key')
        
        let decoded
        try {
            decoded = jwt.verify(token, 'my-secret-key')
        } catch (err) {
            console.log(err) //Logga felet, för felsökning på servern.
            res.status(401).send('Invalid auth token')
        }
    }
    else {
        return res.status(401).send('Felaktigt användarnamn eller lösenord');
    }

    let authHeader = req.headers['authorization']
    if (authHeader === undefined) {
    // skicka lämplig HTTP-status om auth-header saknas, en “400 någonting”
    }
    let token = authHeader.slice(7) // tar bort "BEARER " från headern.
    // nu finns den inskickade token i variabeln token

    // Skicka tillbaka tokenen som svar på inloggningsförsöket
    return res.json({ token });
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
        res.send(result);
        res.status(202).end();
    })

})


app.listen(port, function(req, res) {
    console.log(`listening on port http://localhost:${port}`);
});