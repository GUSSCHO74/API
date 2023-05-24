const express = require('express')
const app = express()
const bodyParser = require('body-parser')
const jwt = require('jsonwebtoken')
const crypto = require('crypto')
const mysql = require('mysql')


app.use(bodyParser.json())
app.use(bodyParser.urlencoded({ extended: false }))

let con = mysql.createConnection({
  host: 'localhost',
  user: 'root',
  password: '',
  database: 'restapi'
})

app.listen(3000, function() {
  console.log(`Listening on port http://localhost:3000`)
})

// Routen som visar information om alla routes
app.get("/", function (req, res) {
  res.sendFile(__dirname + "/index.html");
})

let jwtSecret = "my-secret-key"
    
function hash(data) {
  const hash = crypto.createHash('sha256')
  hash.update(data)
  return hash.digest('hex')
}

function isValidUserData(body) {
  return body && body.username
}

function verifyJWT(req, res) {
  let authHeader = req.headers["authorization"]
  if (authHeader === undefined) {
    res
    .sendStatus(403)
    .send("Du saknar token i din authorization-header")
  }
  let token = authHeader.slice(7)
  let decoded
  try {
    decoded = jwt.verify(token, jwtSecret)
  } catch (err) {
    console.log(err)
    res
    .status(401)
    .send("Din token är stämmer ej eller har gått ut för sessionen")
  }
}
    

// GET route för att returnera alla användare
app.get("/users", function(req, res) {
  verifyJWT(req, res)
  
  let sql = "SELECT * FROM users"
  con.query(sql, function (err, result) {
    if (err) throw err
    res.send(result)
  })
})

// POST route för att kunna lägga till användare
app.post("/users", function(req, res) {
  verifyJWT(req, res)

  const password = hash(req.body.password)

  let sql = `INSERT INTO users (username, firstname, lastname, password) 
  VALUES ('${req.body.username}', '${req.body.firstname}', '${req.body.lastname}', '${password}')`

  con.query(sql, function(err, result){
    if (err) throw err
    res.send(result.id)

    if (result.username == req.body.username){
      res.status(409)
      res.send("Användarnamn är redan taget.")
    }
  })
  res.status(201).send("Ditt konto har skapats.")
})
  
// POST route för att logga in en användare och generera en JWT-token
app.post("/login", function (req, res) {
  let password = hash(req.body.password)
  var sql = `SELECT * FROM users`
  
  con.query(sql, function (err, result) {
    if (err) throw err
    let correctUsername = false
  
    for (let i = 0; i < result.length; i++) {
      if (result[i].username == req.body.username) {
        correctUsername = true
      }
    }

    if (correctUsername == false) {
      res.send("Fel användarnamn eller lösenord.")
    } else {
      if (isValidUserData(req.body)) {
        var sql = `SELECT * FROM users WHERE username='${req.body.username}'`
        con.query(sql, function (err, result) {
          if (err) throw err
          
          if (password == result[0].password) {
            console.log("TEST WORKING")
            let payload = {
              username: result[0].username,
              password: req.body.password,
            }
            let token = jwt.sign(payload, jwtSecret, { expiresIn: "1h" })
            
            res.send(token)
          } else {
            res
              .status(401)
              .send("Fel användarnamn eller lösenord.")
          }
        })
      } else {
        res
          .status(422)
          .send("Ett fel har uppstått.")
      }
    }
  })
})
  
// GET route för att se informationen hos en specifik användare genom dess id
app.get("/users/:id", function(req, res) {
  verifyJWT(req, res)
  
  let sql = `SELECT * FROM users WHERE id = '${req.params.id}'`
  
  con.query(sql, function(err, result){
    if (err) throw err
    res.send(result)
  })
})

// GET route för att ändra informationen hos en specifik användare genom dess id och för att se den uppdaterade informationen hos en specifik användare
app.put("/users/:id", function(req, res) {
  verifyJWT(req, res)

  let sql = `SELECT * FROM users WHERE id = '${req.params.id}'`
  
  con.query(sql, function (err, result) {
    if (err) throw err
    
    let sql = `UPDATE users SET  
    username = '${req.body.username}',
    firstname = '${req.body.firstname}', 
    lastname = '${req.body.lastname}',
    password = '${hash(req.body.password)}' 
    WHERE id = ${req.params.id}`

    let updatedObject = {
      username: req.body.username,
      firstname: req.body.firstname,
      lastname: req.body.lastname,
      password: req.body.password
    }

    con.query(sql, function (err, result) {
      if (err) throw err
      res.send(updatedObject)
    })
  })
})