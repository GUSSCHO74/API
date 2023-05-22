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

// POST route för att kunna lägga till användare
app.post("/users", function(req, res) {
  const password = hash(req.body.password)

  let sql = `INSERT INTO users (username, firstname, lastname, password) 
  VALUES ('${req.body.username}', '${req.body.firstname}', '${req.body.lastname}', '${password}')`

  con.query(sql, function(err, result){
    if (err) throw err
    res.send(result.id)

    if (result.username == req.body.username){
      res.status(409)
      res.send("Username already in use.")
    }
  })
  res.status(201).send("Ditt konto har skapats.")
})
    

app.get("/users", function(req, res) {
  let authHeader = req.headers["authorization"]
  if (authHeader === undefined) {
    res.status(498).send("Invalid token")
  }
  let token = authHeader.slice(7)
  let decoded
  try {
    const decoded = jwt.verify(token, jwtSecret)
  } catch (err) {
    res.status(401)
  }
  
  if (token){
    let sql = "SELECT * FROM users"
    con.query(sql, function (err, result) {
      if (err) throw err
      res.send(result)
    })
  }
})

function verifyJWT(req, res) {
  let authHeader = req.headers['authorization']
  if (authHeader === undefined) {
    res.sendStatus(403).send('Du saknar token i din authorization-header')
  }
  let token = authHeader.slice(7)

  if (!token) {
    return res.status(401).send('Ingen giltig token hittades.');
  }

  let decoded
  try {
    decoded = jwt.verify(token, jwtSecret)
  } catch (err) {
    res.status(498).send('Din token är inte giltig eller har gått ut')
  }
}
    
let jwtSecret = "my-secret-key"
    
function hash(data) {
  const hash = crypto.createHash('sha256')
  hash.update(data)
  return hash.digest('hex')
}

// POST route för att logga in en användare och generera en JWT-token
// app.post("/login", (req, res) => {
//     const password = hash(req.body.password)

//     // if(activeUser(req.body)){
//         let sql = `SELECT * FROM users WHERE username = '${req.body.username}'`
//         con.query(sql, function(err, result){
//             if (err) throw err
//             if (password == result[0].password){
//                 const token = jwt.sign({ userId: req.body.id, exp: Date.now()/1000 + 300}, jwtSecret)

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
    
// })
app.post("/login", function (req, res) {
  let username = req.body.username
  let passwordHash = hash(req.body.password)

  let sql = `SELECT * FROM users WHERE username='${username}'`

  con.query(sql, function(err, result) {
    if (err) throw err
    if (passwordHash == result[0].password){

      let payload = {
        sub: result[0].id,                                     
        exp: Date.now()/1000 + 120
      }
      
      let token = jwt.sign(payload, jwtSecret)

      let Response = {
        "Svar": "Du är nu inloggad, här under är din token som du använder för att nå åtkomst till admin-behörigheter!",
        "Token": token
      }
      res.send(Response)
    }
    else {
      res.status(401).send("Fel användarnamn eller lösenord.")
    }
  })
})
  
  
      

// GET route för att se informationen hos en specifik användare genom dess id
app.get("/users/:id", function(req, res) {
  let sql = `SELECT * FROM users WHERE id = '${req.params.id}'`
  
  con.query(sql, function(err, result){
    if (err) throw err
    res.send(result)
  })
})

// GET route för att ändra informationen hos en specifik användare genom dess id och för att se den uppdaterade informationen hos en specifik användare
app.put("/users/:id", function(req, res) {
  // verifyJWT(res)
  // console.log("test successful")
  // decoded = verifyJWT(req.headers, jwtSecret)
  // if (decoded) {
  //   if (req.body.firstname == undefined || req.body.lastname == undefined|| req.body.password == undefined){
  //     console.log("Wrong")
  //     res.sendStatus(400)
  //   } else {
    let sql = `SELECT * FROM users WHERE id = '${req.params.id}'`
    
    con.query(sql, function (err, result) {
      if (err) throw err
      
      let sql = `UPDATE users SET  
      firstname = '${req.body.firstname}', 
      lastname = '${req.body.lastname}',
      password = '${hash(req.body.password)}' 
      WHERE id = ${req.params.id}`

      con.query(sql, function (err, result) {
        if (err) throw err
        delete result[0].password
        res.json(result)
      })
    })
    // }
  // } else {
  //   res.sendStatus(401)
  // }
})