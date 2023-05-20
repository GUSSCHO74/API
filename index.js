const express = require('express')
const app = express()

const bodyParser = require('body-parser')
const jwt = require('jsonwebtoken')
const crypto = require('crypto')
const mysql = require('mysql')


app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: false }));

let con = mysql.createConnection({
    host: 'localhost',
    user: 'root',
    password: '',
    database: 'restapi'
});

app.listen(3000, function() {
    console.log(`Listening on port http://localhost:3000`);
});

// POST route för att kunna lägga till användare
app.post("/users", function(req, res) {
    const password = hash(req.body.password);

    let sql = `INSERT INTO users (username, firstname, lastname, password) 
    VALUES ('${req.body.username}', '${req.body.firstname}', '${req.body.lastname}', '${password}')`

    con.query(sql, function(err, result){
        if (err) throw err;
        res.send(result.id);

        if (result.username == req.body.username){
            res.status(409)
            res.send("Username already in use.")
        }
    })
    res.status(201).send("Ditt konto har skapats.")
})
    

app.get("/users", function(req, res) {
    let sql = "SELECT id, username, firstname, lastname FROM users"
    con.query(sql, function (err, result) {
        if (err) throw err
        res.send(result)
    });
})

function verifyJWT(req, res) {
    let authHeader = req.headers["authorization"];

    if (authHeader === undefined) {
        res.sendStatus(498).send("Invalid token");
    }
    
    let token = authHeader.slice(7);
    
    try {
        const decoded = jwt.verify(token, 'my-secret-key');
        return decoded;
    } catch (err) {
        res.sendStatus(401)
    }
}
    
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
// app.post("/login", (req, res) => {
//     const password = hash(req.body.password)

//     // if(activeUser(req.body)){
//         let sql = `SELECT * FROM users WHERE username = '${req.body.username}'`
//         con.query(sql, function(err, result){
//             if (err) throw err;
//             if (password == result[0].password){
//                 const token = jwt.sign({ userId: req.body.id, exp: Date.now()/1000 + 300}, jwtSecret);

//                 let Response= {
//                     svar: "Här under är din token du använder för att logga in.",
//                     Token: token
//                 }

//                 res.send(Response)
//             }
//             else {
//                 res.status(400).send("Incorrect login credentials.")
//             }
//         })
//     // }
    
// });
app.post("/login", function (req, res) {
    const name = req.body.username
    const hashedPassword = hash(req.body.password)

    if (name && hashedPassword) {
      let sql = `SELECT * FROM users WHERE username='${name}'`

      con.query(sql, function (err, result) {
        if (err) throw err;
        
        if (result.length == 1) {
          let user = result[0]

          if (hashedPassword == user.password) {
            let payload = {
              id: user.id,
              username: user.username,
            }

            let token = jwt.sign(payload, jwtSecret, {
              expiresIn: "1h",
            });

            res.status(200).send(token);
          } 
          else {
            res.status(401).send("Invalid username or password")
          }
        } else {
          res.status(401).send("Invalid username or password")
        }
      })
    } else {
      res.status(422).send("Missing username or password")
    }
});


// GET route för att se informationen hos en specifik användare genom dess id
app.get("/users/:id", function(req, res) {
    let sql = `SELECT * FROM users WHERE id = '${req.params.id}'`
    
    con.query(sql, function(err, result){
        if (err) throw err;
        res.send(result);
    })
})

// GET route för att ändra informationen hos en specifik användare genom dess id och för att se den uppdaterade informationen hos en specifik användare
app.put("/users/:id", function(req, res) {
    // const password = hash(req.body.password)

    // let sql = `UPDATE users SET username='${req.body.username}', firstname ='${req.body.firstname}', lastname = '${req.body.lastname}', password = '${password}' WHERE id = '${req.params.id}'`

    // con.query(sql, function(err, result){
    //     if (err) throw err;
    //     res.status(202).end();
    // })
    // res.send(JSON.stringify(req.body))

    decoded = verifyJWT(req.headers, 'my-secret-key');
    if (decoded) {
      if (req.body.firstname == undefined || req.body.lastname == undefined|| req.body.password == undefined){
        console.log("Wrong");
        res.sendStatus(400);
      } else {
        let sql = `UPDATE users SET  
        firstname = '${req.body.firstname}', 
        lastname = '${req.body.lastname}',
        password = '${hash(req.body.password)}' 
        WHERE id = ${req.params.id}`

        con.query(sql, function (err, result) {
          if (err) throw err;
          let sql = `SELECT * FROM users WHERE id = "${req.params.id}`
          con.query(sql, function (err, result) {
            if (err) throw err;
            delete result[0].password;
            res.json(result);
          });
        });
      }
    } else {
      res.sendStatus(401);
    }
})
