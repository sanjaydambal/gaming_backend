// server.js

const express = require('express');
const jwt = require('jsonwebtoken');
const bodyParser = require('body-parser');
const cors = require('cors');
const bcrypt = require('bcrypt');
const { Pool } = require('pg');
require('dotenv').config();
const fileUpload = require('express-fileupload');

// Create Express app
const app = express();
const port = 3001;

// Middleware
app.use(cors());
app.use(bodyParser.json());
app.use(fileUpload());

// PostgreSQL connection
const pool = new Pool({
  user: process.env.DB_USER,
  host: process.env.DB_HOST,
  database: process.env.DB_NAME,
  password: process.env.DB_PASSWORD,
  port: 5432, // Default PostgreSQL port
  ssl: {
      rejectUnauthorized: false, // Set to false if using self-signed certificates
      // You may need to provide other SSL options such as ca, cert, and key
      // Example:
      // ca: fs.readFileSync('path/to/ca-certificate.crt'),
      // cert: fs.readFileSync('path/to/client-certificate.crt'),
      // key: fs.readFileSync('path/to/client-certificate.key')
  },
});

pool.on('error', (err, client) => {
  console.error('Unexpected error on idle client', err);
  process.exit(-1);
});
// POST endpoint to handle studio data insertion
app.post('/entity', (req, res) => {
  const { type, name, location, email, address, aboutUs, website, agreeTerms, confirmOwner } = req.body;
  const logo = req.files ? req.files.logo.data : null; // Get logo data from files
  const coverArt = req.files ? req.files.coverArt.data : null; // Get coverArt data from files
  const agreeTermsInt = agreeTerms ? 1 : 0; // Convert boolean to integer
  const confirmOwnerInt = confirmOwner ? 1 : 0; // Convert boolean to integer

  // Determine the table name based on the type
  const tableName = type === 'studio' ? 'Studios' : 'Organizations';

  const sql = `INSERT INTO ${tableName} (name, location, email, address, aboutUs, website, logo, coverArt, agreeTerms, confirmOwner) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`;
  const values = [name, location, email, address, aboutUs, website, logo, coverArt, agreeTermsInt, confirmOwnerInt];

  pool.query(sql, values, (err, result) => {
    if (err) {
      console.error('Error inserting entity data:', err);
      res.status(500).send({ message: 'Error inserting entity data' });
    } else {
      console.log('Entity data inserted successfully');
      res.status(201).send({ message: 'Entity data inserted successfully' });
    }
  });
});


app.get('/entities', (req, res) => {
  const sql = `SELECT name, logo FROM Studios`;

  pool.query(sql, (err, results) => {
    if (err) {
      console.error('Error retrieving entities:', err);
      res.status(500).send({ message: 'Error retrieving entities' });
    } else {
      res.status(200).send(results);
    }
  });
});




app.use(cors({
  origin: 'https://gaming-website-fe.onrender.com', // Allow requests from your React app
  
}));

// Session middleware configuration






pool.connect((err) => {
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
    const sql = 'INSERT INTO members (email, password) VALUES ($1, $2)';

    pool.query(sql, [email, hashedPassword], (err, result) => {
      if (err) {
        console.error('Error registering user:', err.message); // Log the error message
        res.status(500).send({ message: 'Error registering user' });
      } else {
        res.status(201).send({ message: 'User registered successfully' });
      }
      
    });
  });
});

app.post('/login', (req, res) => {
  const { email, password } = req.body;

  const sql = 'SELECT * FROM members WHERE email = $1';
  pool.query(sql, [email], (err, results) => {
    if (err) {
      res.status(500).send({ message: 'Error retrieving user' });
    } else {
      if (results.rows.length === 0) {
        res.status(404).send({ message: 'User not found' });
      } else {
        const user = results.rows[0];

        bcrypt.compare(password, user.password, (err, result) => {
          if (err) {
            res.status(500).send({ message: 'Error comparing passwords' });
          } else {
            if (result) {
              // Generate JWT
              const token = jwt.sign({ email: user.email }, process.env.JWT_SECRET, {
                expiresIn: '1h'
              });
              res.status(200).send({ message: 'Login successful', token });
            } else {
              res.status(401).send({ message: 'Incorrect password' });
            }
          }
        });
      }
    }
  });
});


// Middleware to verify JWT
const verifyToken = (req, res, next) => {
  const token = req.headers['authorization'];
  if (!token || !token.startsWith('Bearer ')) {
    return res.status(403).send({ message: 'Token not provided or invalid' });
  }
  
  const verifiedToken = token.split(' ')[1];
  jwt.verify(verifiedToken, process.env.JWT_SECRET, (err, decoded) => {
    if (err) {
      return res.status(401).send({ message: 'Failed to authenticate token' });
    }

    req.user = decoded;
    next();
  });
};








// Logout route
// Logout route without token verification
app.post('/logout', (req, res) => {
  const token = req.headers['authorization'];
  console.log(req.headers)

  if (!token) {
    return res.status(400).send({ message: 'Token not provided' });
  }

  // Perform logout action here (if any)

  res.status(200).send({ message: 'Logout successful' });
});


app.post('/news', (req, res) => {
  const {
    title,
    subtitle,
    short_description,
    long_description,
    header_img,
    thumbnail_img,
    scheduled_date,
    is_live,
    is_scheduled,
    is_trashed,
    slug,
    keywords,
    tags,
    created_by,
    category_uid
  } = req.body;

  const sql = `INSERT INTO news 
    (title, subtitle, short_description, long_description, header_img, thumbnail_img, 
    scheduled_date, is_live, is_scheduled, is_trashed, slug, keywords, tags, created_by, category_uid) 
    VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15)`;

  pool.query(
    sql,
    [
      title,
      subtitle,
      short_description,
      long_description,
      header_img,
      thumbnail_img,
      scheduled_date,
      is_live,
      is_scheduled,
      is_trashed,
      slug,
      keywords,
      tags,
      created_by,
      category_uid
    ],
    (err, result) => {
      if (err) {
        console.error('Error posting news:', err);
        res.status(500).send({ message: 'Error posting news' });
      } else {
        console.log('News posted successfully');
        res.status(201).send({ message: 'News posted successfully' });
      }
    }
  );
});


app.get('/news', (req, res) => {
  const sql = 'SELECT * FROM news';
  console.log(req.session)

  pool.query(sql, (err, results) => {
    if (err) {
      res.status(500).send({ message: 'Error retrieving news' });
    } else {
      res.status(200).send(results.rows);
    }
  }
  )})

  app.get('/news/:id', verifyToken, (req, res) => {
    const newsId = req.params.id;
    const sql = 'SELECT * FROM news WHERE news_id = $1'; // Using parameterized query to prevent SQL injection
  
    pool.query(sql, [newsId], (err, results) => {
      if (err) {
        console.error('Error retrieving news:', err);
        res.status(500).send({ message: 'Error retrieving news' });
      } else {
        if (results.rows.length > 0) { // Access rows property in PostgreSQL result object
          res.status(200).send(results.rows[0]); // Access rows property to get the array of rows
        } else {
          res.status(404).send({ message: 'News not found' });
        }
      }
    });
  });
  


app.listen(port, () => {
  console.log(`Server is running on port ${port}`);
});
