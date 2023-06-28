const express = require('express');
const mysql = require('mysql');
const { body, validationResult } = require('express-validator');

const app = express();
const port = 3000;

// Create a MySQL connection pool
const pool = mysql.createPool({
  host: 'localhost',
  user: 'root',
  password: 'Mysql@9381',
  database: 'MySQL 8.0 Command Line Client - Unicode',
});

// Middleware to parse JSON requests
app.use(express.json());

// API route for phone number login
app.post(
  '/api/login',
  [
    // Validate input parameters
    body('phone').notEmpty().isString(),
  ],
  (req, res) => {
    // Check for validation errors
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    // Extract phone number from request body
    const { phone } = req.body;

    // Perform phone number login logic
    // ...

    // Return success response
    return res.sendStatus(200);
  }
);

// API route for adding a customer
app.post(
  '/api/customers',
  [
    // Validate input parameters
    body('name').notEmpty().isString(),
    body('email').notEmpty().isEmail(),
    body('phone').notEmpty().isString(),
    body('address').optional().isString(),
  ],
  (req, res) => {
    // Check for validation errors
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    // Extract customer data from request body
    const { name, email, phone, address } = req.body;

    // Check for duplicate customer by email or phone
    pool.getConnection((err, connection) => {
      if (err) {
        // Handle connection error
        console.error('Error getting MySQL connection', err);
        return res.status(500).json({ error: 'Internal server error' });
      }

      // Check for duplicate customer by email
      connection.query(
        'SELECT COUNT(*) AS emailCount FROM customers WHERE email = ?',
        [email],
        (err, emailResults) => {
          if (err) {
            // Handle query error
            console.error('Error executing MySQL query', err);
            connection.release();
            return res.status(500).json({ error: 'Internal server error' });
          }

          const emailCount = emailResults[0].emailCount;

          // Check for duplicate customer by phone
          connection.query(
            'SELECT COUNT(*) AS phoneCount FROM customers WHERE phone = ?',
            [phone],
            (err, phoneResults) => {
              if (err) {
                // Handle query error
                console.error('Error executing MySQL query', err);
                connection.release();
                return res.status(500).json({ error: 'Internal server error' });
              }

              const phoneCount = phoneResults[0].phoneCount;

              if (emailCount > 0 || phoneCount > 0) {
                // Duplicate customer found
                connection.release();
                return res.status(409).json({ error: 'Customer already exists' });
              }

              // Insert the new customer
              connection.query(
                'INSERT INTO customers (name, email, phone, address) VALUES (?, ?, ?, ?)',
                [name, email, phone, address],
                (err) => {
                  if (err) {
                    // Handle query error
                    console.error('Error executing MySQL query', err);
                    connection.release();
                    return res.status(500).json({ error: 'Internal server error' });
                  }

                  // New customer successfully added
                  connection.release();
                  return res.sendStatus(200);
                }
              );
            }
          );
        }
      );
    });
  }
);

// Start the server
app.listen(port, () => {
  console.log(`Server is running on port ${port}`);
});
