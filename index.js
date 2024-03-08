// server.js

const express = require('express');
const mysql = require('mysql');
const bodyParser = require('body-parser');
const cors = require('cors');
const bcrypt = require('bcrypt'); // Add bcrypt for password hashing
require('dotenv').config();

const app = express();
const port = 3001;


const db = mysql.createConnection({
  host: 'localhost',
  user: process.env.DB_USER, 
  password: process.env.DB_PASSWORD,
  database: 'Gaming_website'
});


db.connect((err) => {
  if (err) {
    throw err;
  }
  console.log('Connected to the database');
});


app.use(cors());
app.use(bodyParser.json());

// Register route
app.post('/register', (req, res) => {
  const { email, password } = req.body;

  // Hash the password
  bcrypt.hash(password, 10, (err, hashedPassword) => {
    if (err) {
      res.status(500).send({ message: 'Error hashing password' });
      return;
    }

    // Insert user into the database with hashed password
    const sql = 'INSERT INTO Users (email, password) VALUES (?, ?)';
    db.query(sql, [email, hashedPassword], (err, result) => {
      if (err) {
        res.status(500).send({ message: 'Error registering user' });
      } else {
        res.status(201).send({ message: 'User registered successfully' });
      }
    });
  });
});


app.post('/login', (req, res) => {
  const { email, password } = req.body;


  const sql = 'SELECT * FROM Users WHERE email = ?';
  db.query(sql, [email], (err, results) => {
    if (err) {
      res.status(500).send({ message: 'Error retrieving user' });
    } else {
      if (results.length === 0) {
        res.status(404).send({ message: 'User not found' });
      } else {
        const user = results[0];

      
        bcrypt.compare(password, user.password, (err, result) => {
          if (err) {
            res.status(500).send({ message: 'Error comparing passwords' });
          } else {
            if (result) {
              res.status(200).send({ message: 'Login successful' });
            } else {
              res.status(401).send({ message: 'Incorrect password' });
            }
          }
        });
      }
    }
  });
});


app.listen(port, () => {
  console.log(`Server is running on port ${port}`);
});
