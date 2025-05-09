// ================================
// Partition 1: Setup and Dependencies
// ================================
const express = require('express');
const mysql = require('mysql2');
const bodyParser = require('body-parser');
const path = require('path');
const csvParser = require('csv-parser');
const { Readable } = require('stream');
const nodemailer = require('nodemailer');
const session = require('express-session');
const crypto = require('crypto');
const fetch = require('node-fetch'); // Ensure node-fetch is installed
const cors = require('cors');

const app = express();

// ================================
// Partition 2: Middleware Setup
// ================================
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));
app.use(cors());
app.use(express.static(path.join(__dirname, 'public')));

// ================================
// Partition 3: MySQL Database Connection
// ================================
const connection = mysql.createConnection({
  host: '127.0.0.1',
  user: 'root',
  password: 'Omk@r355',
  database: 'login',
  port: 3306,
  multipleStatements: true
});

connection.connect(err => {
  if (err) {
    console.error('Error connecting to MySQL: ' + err.stack);
    return;
  }
  console.log('Connected to MySQL as id ' + connection.threadId);
});

// Query helper function
function query(sql, params = []) {
  return new Promise((resolve, reject) => {
    connection.execute(sql, params, (err, results) => {
      if (err) return reject(err);
      resolve(results);
    });
  });
}

// ================================
// Partition 4: Session Management and Authentication
// ================================
app.use(session({
  secret: 'your_secret_key',
  resave: false,
  saveUninitialized: true
}));

// ================================
// Partition 5: API Endpoints
// ================================

// Default route to verify server is running
app.get('/', (req, res) => {
  res.send('Dashboard API is running. Access <a href="/data_visualization.html">Data Visualization Dashboard</a>');
});

// API Endpoint: Users
app.get('/api/users', async (req, res) => {
  try {
    const result = await query('SELECT COUNT(*) AS total FROM users');
    res.json({ total: result[0].total });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err.message });
  }
});

// Candidate Count Endpoint – returns overall count or filtered by Year (if filter is provided)
app.get('/api/candidate-count', async (req, res) => {
  try {
    const filter = req.query.filter;
    let sql;
    const params = [];
    if (filter) {
      // Filter by Year when provided
      sql = 'SELECT COUNT(*) AS total FROM `candidate ranking` WHERE Year = ?';
      params.push(filter);
    } else {
      sql = 'SELECT COUNT(*) AS total FROM `candidate ranking`';
    }
    const result = await query(sql, params);
    res.json({ total: result[0].total });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// API Endpoint: Candidate Registrations by Date (Year or Month)
// When group is "month" and a filter is provided, filter rows using the Year column.
app.get('/api/candidate-by-date', async (req, res) => {
  try {
    const group = req.query.group;  // 'year' or 'month'
    const filter = req.query.filter; // optional, when grouping by month this is the Year
    let sql;
    let params = [];

    if (group === 'year') {
      if (filter) {
        sql = 'SELECT Year, COUNT(*) AS count FROM `candidate ranking` WHERE Year = ? GROUP BY Year ORDER BY Year';
        params.push(filter);
      } else {
        sql = 'SELECT Year, COUNT(*) AS count FROM `candidate ranking` GROUP BY Year ORDER BY Year';
      }
    } else if (group === 'month') {
      if (filter) {
        // Filter by Year to get month-wise breakdown for the selected year.
        sql = 'SELECT Month, COUNT(*) AS count FROM `candidate ranking` WHERE Year = ? GROUP BY Month ORDER BY CAST(Month AS UNSIGNED)';
        params.push(filter);
      } else {
        sql = 'SELECT Month, COUNT(*) AS count FROM `candidate ranking` GROUP BY Month ORDER BY CAST(Month AS UNSIGNED)';
      }
    }
    const result = await query(sql, params);
    res.json(result);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err.message });
  }
});


// API Endpoint: Candidate by Domain Endpoint – supports filtering by Year
app.get('/api/candidate-by-domain', async (req, res) => {
  try {
    const filter = req.query.filter;
    let sql;
    const params = [];
    if (filter) {
      sql = 'SELECT Domain, COUNT(*) AS count FROM `candidate ranking` WHERE Year = ? GROUP BY Domain';
      params.push(filter);
    } else {
      sql = 'SELECT Domain, COUNT(*) AS count FROM `candidate ranking` GROUP BY Domain';
    }
    const result = await query(sql, params);
    res.json(result);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// API Endpoint: Candidate by Subdomain Endpoint – supports filtering by Year
app.get('/api/candidate-by-subdomain', async (req, res) => {
  try {
    const filter = req.query.filter;
    let sql;
    const params = [];
    if (filter) {
      sql = 'SELECT Sub_Domain, COUNT(*) AS count FROM `candidate ranking` WHERE Year = ? GROUP BY Sub_Domain ORDER BY count DESC LIMIT 10';
      params.push(filter);
    } else {
      sql = 'SELECT Sub_Domain, COUNT(*) AS count FROM `candidate ranking` GROUP BY Sub_Domain ORDER BY count DESC LIMIT 10';
    }
    const result = await query(sql, params);
    res.json(result);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// API Endpoint: Form1 Data
app.get('/api/form1data', async (req, res) => {
  try {
    const totalResult = await query('SELECT COUNT(*) AS total FROM form1data');
    const gendersResult = await query('SELECT gender, COUNT(*) AS count FROM form1data GROUP BY gender');
    const genders = {};
    gendersResult.forEach(row => {
      genders[row.gender] = row.count;
    });
    res.json({ total: totalResult[0].total, genders });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err.message });
  }
});

// API Endpoint: Franchise Login Data
app.get('/api/franchiselogindata', async (req, res) => {
  try {
    const result = await query('SELECT COUNT(*) AS total FROM franchiselogindata');
    res.json({ total: result[0].total });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err.message });
  }
});

// API Endpoint: Imported Data
app.get('/api/importeddata', async (req, res) => {
  try {
    const result = await query('SELECT COUNT(*) AS total FROM `imported data`');
    res.json({ total: result[0].total });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err.message });
  }
});

/////////////////////////////////

app.get('/logout', (req, res) => {
  req.session.destroy(err => {
    if (err) {
      console.error('Error destroying session:', err);
      return res.redirect('/dashboard.html');
    }
    res.redirect('/index.html');
  });
});

app.post('/login', (req, res) => {
  const { email, password } = req.body;
  
  if (!email || !password) {
    return res.json({ success: false, error: 'Email and password are required.' });
  }
  
  const query = 'SELECT * FROM users WHERE email = ? AND password = ?';
  connection.query(query, [email, password], (err, results) => {
    if (err) {
      console.error('Error executing query: ', err);
      return res.json({ success: false, error: 'Server error.' });
    }
    
    if (results.length > 0) {
      req.session.admin_logged_in = true;
      req.session.email = email;
      return res.json({ success: true });
    } else {
      return res.json({ success: false, error: 'Invalid email or password.' });
    }
  });
});

// ================================
// Partition 5: CSV Upload and Data Import (Common for both tables)
// ================================
app.post('/upload-csv', (req, res) => {
  let appendData = req.query.append !== 'false';
  const doInsert = () => {
    let csvData = '';
    req.setEncoding('utf8');
    req.on('data', chunk => { csvData += chunk; });
    req.on('end', () => {
      const csvStream = Readable.from([csvData]);
      const results = [];
      csvStream
        .pipe(csvParser())
        .on('data', data => {
          console.log("CSV row:", data);
          results.push(data);
        })
        .on('end', () => {
          console.log(`Parsed ${results.length} rows from CSV.`);
          if (results.length === 0) {
            return res.status(400).json({ success: false, error: "CSV file is empty or has no valid rows." });
          }
          const fullNameSynonyms = ["full name", "Full Name", "name", "Name"];
          const emailSynonyms = ["email", "Email"];
          const phoneSynonyms = ["phone no", "Phone No", "phone", "Phone", "contact no", "Contact No", "contact", "Contact"];
          const tokenSynonyms = ["token_url", "Token URL", "token url", "tokenUrl"];
          const insertQuery = "INSERT INTO `imported data` (`full name`, email, `phone no`, token_url) VALUES (?, ?, ?, ?)";
          const insertPromises = results.map((row, index) => {
            const getValue = (row, synonyms) => {
              for (const key of synonyms) {
                if (row[key] && row[key].trim() !== '') {
                  return row[key].trim();
                }
              }
              return '';
            };
            const fullName = getValue(row, fullNameSynonyms);
            const email = getValue(row, emailSynonyms);
            const phoneNo = getValue(row, phoneSynonyms);
            const tokenUrl = getValue(row, tokenSynonyms);
            console.log(`Row ${index + 1}: fullName='${fullName}', email='${email}', phoneNo='${phoneNo}', tokenUrl='${tokenUrl}'`);
            if (!fullName || !email || !phoneNo) {
              console.log(`Skipping row ${index + 1} due to missing required fields.`);
              return Promise.resolve();
            }
            return new Promise((resolve, reject) => {
              connection.query(insertQuery, [fullName, email, phoneNo, tokenUrl], (err, result) => {
                if (err) {
                  console.error("Error inserting row:", err);
                  return reject(err);
                }
                resolve(result);
              });
            });
          });
          Promise.all(insertPromises)
            .then(() => { res.json({ success: true, message: "CSV data imported successfully." }); })
            .catch(err => {
              console.error("Error inserting rows:", err);
              res.status(500).json({ success: false, error: err.message });
            });
        })
        .on('error', err => {
          console.error("Error parsing CSV:", err);
          res.status(500).json({ success: false, error: err.message });
        });
    });
  };

  if (!appendData) {
    connection.query('SET FOREIGN_KEY_CHECKS=0', (fkErr) => {
      if (fkErr) {
        console.error("Error disabling foreign key checks:", fkErr);
        return res.status(500).json({ success: false, error: fkErr.message });
      }
      connection.query('TRUNCATE TABLE `imported data`', (err, result) => {
        if (err) {
          console.error("Error truncating table:", err);
          connection.query('DELETE FROM `imported data`', (err2, result2) => {
            if (err2) {
              console.error("Error deleting rows from table:", err2);
              return connection.query('SET FOREIGN_KEY_CHECKS=1', () => {
                res.status(500).json({ success: false, error: err2.message });
              });
            }
            console.log("Table cleared using DELETE. Proceeding with insert.");
            connection.query('SET FOREIGN_KEY_CHECKS=1', () => { doInsert(); });
          });
        } else {
          console.log("Table truncated. Proceeding with insert.");
          connection.query('SET FOREIGN_KEY_CHECKS=1', () => { doInsert(); });
        }
      });
    });
  } else {
    doInsert();
  }
});

// ================================
// Partition 6: Endpoints for "Imported Data"
// ================================
app.get('/data', (req, res) => {
  const query = 'SELECT id, `full name`, email, `phone no`, token_url, email_sent FROM `imported data`';
  connection.query(query, (err, results) => {
    if (err) {
      console.error("Error fetching data:", err);
      return res.status(500).json({ success: false, error: err.message });
    }
    const headers = ["ID", "Full Name", "Email", "Phone No", "Token URL"];
    res.json({ headers, rows: results });
  });
});

app.post('/modify-record', (req, res) => {
  const { id, fullName, email, phone, token_url, emailStatus } = req.body;
  if (!id) { 
    return res.status(400).json({ success: false, error: "Missing record id." });
  }
  const query = `UPDATE \`imported data\` 
                 SET \`full name\` = ?, email = ?, \`phone no\` = ?, token_url = ?, email_sent = ?
                 WHERE id = ?`;
  connection.query(query, [fullName, email, phone, token_url, emailStatus, id], (err, result) => {
    if (err) {
      console.error("Error updating record:", err);
      return res.status(500).json({ success: false, error: err.message });
    }
    res.json({ success: true, message: "Record updated successfully." });
  });
});

app.post('/delete-records', (req, res) => {
  const { ids } = req.body;
  if (!Array.isArray(ids) || ids.length === 0) {
    return res.json({ success: false, error: "No record ids provided." });
  }
  const query = 'DELETE FROM `imported data` WHERE id IN (?)';
  connection.query(query, [ids], (err, result) => {
    if (err) {
      console.error("Error deleting records:", err);
      return res.status(500).json({ success: false, error: err.message });
    }
    res.json({ success: true, message: `${result.affectedRows} records deleted successfully.` });
  });
});

app.delete('/deleteAll', (req, res) => {
  const query = 'DELETE FROM `imported data`';
  connection.query(query, (err, results) => {
    if (err) {
      console.error(err);
      return res.status(500).send('Error deleting all data');
    }
    res.send('All data deleted successfully');
  });
});

// --- Email Sending with Token Generation for Imported Data ---

const logoUrl = "https://drive.google.com/uc?id=1akfUCz2Tth4KN08V9hanX0cPerpjCpgr";

// --- Email Sending with Token Generation for Imported Data ---
app.post('/send-email', (req, res) => {
  const baseFormUrl = "http://localhost:3001/?token=";
  const query = 'SELECT id, `full name` as fullName, email, token_url FROM `imported data` WHERE email_sent = 0 OR email_sent IS NULL';
  connection.query(query, (err, results) => {
    if (err) {
      console.error("Error fetching candidates:", err);
      return res.status(500).json({ success: false, error: err.message });
    }
    if (results.length === 0) {
      return res.json({ success: false, error: 'No new candidates found.' });
    }
    
    const transporter = nodemailer.createTransport({
      service: 'gmail',
      auth: {
        user: 'awalegaonkaromkar1902@gmail.com',
        pass: 'neryixkboyiqpsdu'
      }
    });
    
    const sendEmailPromises = results.map(candidate => {
      return new Promise((resolve, reject) => {
        (async () => {
          try {
            let tokenUrl = candidate.token_url;
            if (!tokenUrl) {
              const token = generateToken();
              tokenUrl = baseFormUrl + token;
              // Use the helper function for imported data tokens
              await storeTokenInFirebaseImportedData(token, tokenUrl);
              connection.query('UPDATE `imported data` SET token_url = ? WHERE id = ?', [tokenUrl, candidate.id], (err, result) => {
                if (err) {
                  console.error("Error updating candidate token_url for id " + candidate.id + ":", err);
                } else {
                  console.log("Updated candidate token_url for id:", candidate.id);
                }
              });
            }
            
           // Create the HTML email body using template literals
const body = `
<html>
  <head>
    <style>
      body {
        font-family: Arial, sans-serif;
        background-color: #54397e;
        color: #fff;
        padding: 20px;
        margin: 0;
      }
      .container {
        max-width: 600px;
        margin: 20px auto;
        padding: 20px;
        background-color: #fff;
        border: 2px solid #54397e; /* Added border */
        border-radius: 10px;
        box-shadow: 0 4px 8px rgba(0, 0, 0, 0.2);
      }
      .header {
        text-align: center;
        padding-bottom: 20px;
      }
      .header img {
        max-width: 150px;
        margin-bottom: 20px;
        border-radius: 29px;
      }
      .header h2 {
        color: #54397e;
        margin: 0;
      }
      .content {
        font-size: 16px;
        line-height: 1.6;
        color: #333;
        text-align: center;
        padding: 20px 40px;
      }
      .content a {
        display: inline-block;
        background-color: #54397e;
        color: #fff;
        text-decoration: none;
        font-weight: bold;
        padding: 10px 20px;
        border-radius: 5px;
        font-size: 16px;
      }
      .footer {
        font-size: 16px;
        line-height: 1.6;
        color: #333;
        text-align: center;
        padding-top: 20px;
      }
        /* New CSS to center the link */
.link-container {
  text-align: center;
  margin: 20px 0;
}

    </style>
  </head>
  <body>
    <div class="container">
      <div class="header">
        <img src="${logoUrl}" alt="Talent Corner Logo" />
        <h2>Thank You!</h2>
      </div>
      <div class="content">
        <p>Hello ${candidate.fullName}</p>
        <p>You have been invited to fill out the form. Please use the following link to access it:</p>
        <div class="link-container">
  <a href="${tokenUrl}">Click here to access the Form link</a>
</div>

        <p>Once you submit the form, your access will be marked as used.</p>
      </div>
      <div class="footer">
        <p>Thank you.</p>
        <p>HR Team<br>Talent Corner</p>
      </div>
    </div>
  </body>
</html>
`;

// Update mailOptions to use the HTML email body
const mailOptions = {
  from: 'awalegaonkaromkar1902@gmail.com',
  to: candidate.email,
  subject: 'Your Access Token for the Form',
  html: body
};
            
            transporter.sendMail(mailOptions, (error, info) => {
              if (error) {
                console.error("Error sending email to candidate id " + candidate.id + ":", error);
                return reject(error);
              } else {
                console.log("Email sent to candidate id " + candidate.id + ":", info.response);
                connection.query('UPDATE `imported data` SET email_sent = 1 WHERE id = ?', [candidate.id], (err, result) => {
                  if (err) {
                    console.error("Error updating email_sent for candidate id " + candidate.id + ":", err);
                    return reject(err);
                  }
                  resolve();
                });
              }
            });
          } catch (e) {
            reject(e);
          }
        })();
      });
    });
    
    Promise.all(sendEmailPromises)
      .then(() => {
        res.json({ success: true, message: "Emails sent successfully to all candidates." });
      })
      .catch(error => {
        console.error("Error processing candidates:", error);
        res.status(500).json({ success: false, error: error.message });
      });
  });
});

// ================================
// Partition 7: Endpoints for "form1data"
// ================================
app.get('/form1data', (req, res) => {
  const query = 'SELECT * FROM `form1data`';
  connection.query(query, (err, results) => {
    if (err) {
      console.error("Error fetching form1data:", err);
      return res.status(500).json({ success: false, error: err.message });
    }
    const headers = [
      "id", "name", "email", "phone", "gender",
      "location", "college", "created_at", "email_sent", "token_url"
    ];
    res.json({ headers, rows: results });
  });
});

app.post('/modify-form1-record', (req, res) => {
  const { id, name, email, phone, gender, location, college, token_url, emailStatus } = req.body;
  if (!id) { 
    return res.status(400).json({ success: false, error: "Missing record id." });
  }
  const query = `UPDATE form1data 
                 SET name = ?, email = ?, phone = ?, gender = ?, location = ?, college = ?, token_url = ?, email_sent = ?
                 WHERE id = ?`;
  connection.query(query, [name, email, phone, gender, location, college, token_url, emailStatus, id], (err, result) => {
    if (err) {
      console.error("Error updating form1data record:", err);
      return res.status(500).json({ success: false, error: err.message });
    }
    res.json({ success: true, message: "Record updated successfully." });
  });
});

app.post('/delete-records-form1', (req, res) => {
  const { ids } = req.body;
  if (!Array.isArray(ids) || ids.length === 0) {
    return res.json({ success: false, error: "No record ids provided." });
  }
  const query = 'DELETE FROM `form1data` WHERE id IN (?)';
  connection.query(query, [ids], (err, result) => {
    if (err) {
      console.error("Error deleting form1data records:", err);
      return res.status(500).json({ success: false, error: err.message });
    }
    res.json({ success: true, message: `${result.affectedRows} records deleted successfully from form1data.` });
  });
});

app.delete('/deleteAll-form1', (req, res) => {
  const query = 'DELETE FROM `form1data`';
  connection.query(query, (err, results) => {
    if (err) {
      console.error("Error deleting all form1data:", err);
      return res.status(500).send('Error deleting all form1data');
    }
    const alterQuery = 'ALTER TABLE `form1data` AUTO_INCREMENT = 1';
    connection.query(alterQuery, (alterErr, alterResults) => {
      if (alterErr) {
        console.error("Error resetting auto_increment for form1data:", alterErr);
      }
      res.json( 'All form1data deleted successfully');
    });
  });
});

// --- Email Sending for form1data ---
app.post('/send-email-form1', (req, res) => {
  const baseFormUrl = "http://localhost:3002/?token=";
  const query = 'SELECT id, name, email, token_url FROM `form1data` WHERE email_sent = 0 OR email_sent IS NULL';
  connection.query(query, (err, results) => {
    if (err) {
      console.error("Error fetching candidates from form1data:", err);
      return res.status(500).json({ success: false, error: err.message });
    }
    if (results.length === 0) {
      return res.json({ success: false, error: 'No new candidates found in form1data.' });
    }
    
    const transporter = nodemailer.createTransport({
      service: 'gmail',
      auth: {
        user: 'awalegaonkaromkar1902@gmail.com',
        pass: 'neryixkboyiqpsdu'
      }
    });
    
    // Publicly accessible logo URL (update as needed)
    const logoUrl = "https://drive.google.com/uc?id=1akfUCz2Tth4KN08V9hanX0cPerpjCpgr";
    
    const sendEmailPromises = results.map(candidate => {
      return new Promise((resolve, reject) => {
        (async () => {
          try {
            let tokenUrl = candidate.token_url;
            if (!tokenUrl) {
              const token = generateToken();
              tokenUrl = baseFormUrl + token;
              // Use the helper function for form1data tokens
              await storeTokenInFirebaseForm1Data(token, tokenUrl);
              connection.query('UPDATE `form1data` SET token_url = ? WHERE id = ?', [tokenUrl, candidate.id], (err, result) => {
                if (err) {
                  console.error("Error updating token_url for candidate id " + candidate.id + ":", err);
                } else {
                  console.log("Updated token_url for candidate id:", candidate.id);
                }
              });
            }
            
            // Create the HTML email body using a template literal
            const body = `
  <html>
    <head>
      <style>
        body {
          font-family: Arial, sans-serif;
          background-color: #54397e;
          color: #fff;
          padding: 20px;
          margin: 0;
        }
        .container {
          max-width: 600px;
          margin: 20px auto;
          padding: 20px;
          background-color: #fff;
          border: 2px solid #54397e;
          border-radius: 10px;
          box-shadow: 0 4px 8px rgba(0, 0, 0, 0.2);
        }
        .header {
          text-align: center;
          padding-bottom: 20px;
        }
        .header img {
          max-width: 150px;
          margin-bottom: 20px;
          border-radius: 29px;
        }
        .header h2 {
          color: #54397e;
          margin: 0;
        }
        .content {
          font-size: 16px;
          line-height: 1.6;
          color: #333;
          text-align: center;
          padding: 20px 40px;
        }
        .content a {
          display: inline-block;
          background-color: #54397e;
          color: #fff;
          text-decoration: none;
          font-weight: bold;
          padding: 10px 20px;
          border-radius: 5px;
          font-size: 16px;
        }
        .footer {
          font-size: 16px;
          line-height: 1.6;
          color: #333;
          text-align: center;
          padding-top: 20px;
        }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <img src="${logoUrl}" alt="Talent Corner Logo" />
          <h2>Thank You!</h2>
        </div>
        <div class="content">
          <p>Dear ${candidate.name}</p>
          <p>
            We have received your form. Thank you for taking the time to complete it. Your responses will help us process your application more efficiently.
          </p>
          <p>Please click the button below to fill out an evaluation form for the next step in the process.</p>
          <p>
            <a href="${tokenUrl}">Click the Evaluation Form</a>
          </p>
        </div>
        <div class="footer">
          <p>Best regards,</p>
          <p>HR Team<br>Talent Corner</p>
        </div>
      </div>
    </body>
  </html>
`;

            
            const mailOptions = {
              from: 'awalegaonkaromkar1902@gmail.com',
              to: candidate.email,
              subject: 'Your Access Token for the Form',
              html: body  // send the email as HTML
            };
            
            transporter.sendMail(mailOptions, (error, info) => {
              if (error) {
                console.error("Error sending email to candidate id " + candidate.id + ":", error);
                return reject(error);
              } else {
                console.log("Email sent to candidate id " + candidate.id + ":", info.response);
                connection.query('UPDATE `form1data` SET email_sent = 1 WHERE id = ?', [candidate.id], (err, result) => {
                  if (err) {
                    console.error("Error updating email_sent for candidate id " + candidate.id + ":", err);
                    return reject(err);
                  }
                  resolve();
                });
              }
            });
          } catch (e) {
            reject(e);
          }
        })();
      });
    });
    
    Promise.all(sendEmailPromises)
      .then(() => {
        res.json({ success: true, message: "Emails sent successfully to all form1data candidates." });
      })
      .catch(error => {
        console.error("Error processing form1data candidates:", error);
        res.status(500).json({ success: false, error: error.message });
      });
  });
});
// ================================
// Partition 7: Endpoints for "candidate ranking"
// ================================

// --- Candidate Ranking Data Retrieval Endpoint ---
app.get('/candidate-ranking', (req, res) => {
  const query = `
    SELECT
      \`id\`,
      \`Rank\`,
      \`Timestamp\`,
      \`Full_Name\`,
      \`Email\`,
      \`Phone_No\`,
      \`Domain\`,
      \`Sub_Domain\`,
      \`Marks\`,
      \`Completion_of_MCQ\`,
      \`Date\`,
      \`Month\`,
      \`Year\`,
      \`email_status\`
    FROM \`candidate ranking\`
  `;

  connection.query(query, (err, results) => {
    if (err) {
      console.error("Error fetching candidate ranking data:", err);
      return res.status(500).json({ success: false, error: err.message });
    }

    console.log("Fetched candidate ranking rows:", results.length);

    const headers = [
      "id",
      "Rank",
      "Timestamp",
      "Full_Name",
      "Email",
      "Phone_No",
      "Domain",
      "Sub_Domain",
      "Marks",
      "Completion_of_MCQ",
      "Date",
      "Month",
      "Year",
      "email_status"
    ];

    res.json({
      headers,
      rows: results || []
    });
  });
});


// --- Modify Candidate Ranking Record ---
app.post('/candidate-ranking/modify', (req, res) => {
  const {
    id, fullName, email, phone,
    domain, subDomain, marks, completion_of_MCQ,
    date, month, year, emailStatus
  } = req.body;

  console.log("Received modification request for candidate ranking:", req.body);

  if (!id) {
    return res.status(400).json({ success: false, error: "Missing record id." });
  }

  const query = `
    UPDATE \`candidate ranking\`
    SET \`Full_Name\` = ?,
        \`Email\` = ?,
        \`Phone_No\` = ?,
        \`Domain\` = ?,
        \`Sub_Domain\` = ?,
        \`Marks\` = ?,
        \`Completion_of_MCQ\` = ?,
        \`Date\` = ?,
        \`Month\` = ?,
        \`Year\` = ?,
        \`email_status\` = ?
    WHERE \`id\` = ?
  `;

  const params = [
    fullName || "",
    email || "",
    phone || "",
    domain || "",
    subDomain || "",
    marks !== undefined ? marks : null,
    completion_of_MCQ !== undefined ? completion_of_MCQ : null,
    date !== undefined ? date : null,
    month || "",
    year !== undefined ? year : null,
    emailStatus || 0,
    id
  ];

  connection.query(query, params, (err, result) => {
    if (err) {
      console.error("Error updating candidate ranking record:", err);
      return res.status(500).json({ success: false, error: err.message });
    }
    console.log("Update result:", result);
    res.json({ success: true, message: "Record updated successfully." });
  });
});

// --- Delete Specific Candidate Ranking Records ---
app.post('/candidate-ranking/delete', (req, res) => {
  const { ids } = req.body;
  console.log("Received delete request for candidate ranking with IDs:", ids);

  if (!Array.isArray(ids) || ids.length === 0) {
    return res.json({ success: false, error: "No record ids provided." });
  }

  const placeholders = ids.map(() => '?').join(',');
  const query = `DELETE FROM \`candidate ranking\` WHERE \`id\` IN (${placeholders})`;

  connection.query(query, ids, (err, result) => {
    if (err) {
      console.error("Error deleting candidate ranking records:", err);
      return res.status(500).json({ success: false, error: err.message });
    }

    console.log("Candidate ranking delete result:", result);
    res.json({
      success: true,
      message: `${result.affectedRows} records deleted successfully from candidate ranking.`
    });
  });
});

// --- Delete All Candidate Ranking Records ---
app.delete('/candidate-ranking/deleteAll', (req, res) => {
  const truncateQuery = 'TRUNCATE TABLE `candidate ranking`';
  connection.query(truncateQuery, (err, results) => {
    if (err) {
      console.error("Error truncating candidate ranking table:", err);
      return res.status(500).send('Error deleting all candidate ranking records');
    }
    console.log("Candidate ranking table truncated successfully.");
    res.send('All candidate ranking records deleted successfully and auto_increment reset.');
  });
});

// --- Email Sending for Candidate Ranking ---
// Sends emails to the top 3 pending candidates per Domain/Sub_Domain and updates their status.
app.post('/candidate-ranking/email', (req, res) => {
  // Accept filter parameters from the request body (if provided)
  const { domain, subDomain } = req.body;

  // Step 1: Get count of already sent emails (email_status = 1) per Domain/Sub_Domain,
  // applying filters if provided.
  let checkSentQuery = `
    SELECT Domain, Sub_Domain, COUNT(*) as sentCount
    FROM \`candidate ranking\`
    WHERE email_status = 1
  `;
  const checkParams = [];
  if (domain) {
    checkSentQuery += " AND Domain = ?";
    checkParams.push(domain);
  }
  if (subDomain) {
    checkSentQuery += " AND Sub_Domain = ?";
    checkParams.push(subDomain);
  }
  checkSentQuery += " GROUP BY Domain, Sub_Domain";

  connection.query(checkSentQuery, checkParams, (checkErr, domainGroups) => {
    if (checkErr) {
      console.error("Error checking sent emails:", checkErr);
      return res.status(500).json({ success: false, error: checkErr.message });
    }

    // Build lookup map: key = "Domain|Sub_Domain", value = sentCount.
    const sentCountMap = {};
    domainGroups.forEach(group => {
      const key = `${group.Domain}|${group.Sub_Domain}`;
      sentCountMap[key] = group.sentCount;
    });

    // Step 2: Retrieve all pending candidates (email_status = 0),
    // applying filters if provided.
    let pendingQuery = `
      SELECT id, \`Full_Name\`, Email, \`Rank\`, email_status, Domain, Sub_Domain, wasProcessed
      FROM \`candidate ranking\`
      WHERE email_status = 0
    `;
    const pendingParams = [];
    if (domain) {
      pendingQuery += " AND Domain = ?";
      pendingParams.push(domain);
    }
    if (subDomain) {
      pendingQuery += " AND Sub_Domain = ?";
      pendingParams.push(subDomain);
    }
    pendingQuery += " ORDER BY Domain, Sub_Domain, \`Rank\` ASC";

    connection.query(pendingQuery, pendingParams, (err, allPendingResults) => {
      if (err) {
        console.error("Error fetching pending candidate ranking records:", err);
        return res.status(500).json({ success: false, error: err.message });
      }

      if (allPendingResults.length === 0) {
        return res.json({ success: false, error: 'No pending candidates to email for the selected filters.' });
      }

      // Step 3: Group pending candidates by Domain|Sub_Domain.
      const candidatesByGroup = {};
      allPendingResults.forEach(candidate => {
        const key = `${candidate.Domain}|${candidate.Sub_Domain}`;
        if (!candidatesByGroup[key]) {
          candidatesByGroup[key] = [];
        }
        candidatesByGroup[key].push(candidate);
      });

      // Step 4: For each group, select the top pending candidates by rank.
      // Candidates beyond the top 3 (per group) will be rejected.
      const candidatesToEmail = [];
      const candidatesToReject = [];
      for (const [groupKey, candidates] of Object.entries(candidatesByGroup)) {
        const alreadySentCount = sentCountMap[groupKey] || 0;
        if (alreadySentCount >= 3) {
          // If already 3 or more emails were sent for this group, reject all pending candidates.
          candidatesToReject.push(...candidates);
          continue;
        }
        const neededCount = 3 - alreadySentCount;
        const topCandidates = candidates.slice(0, neededCount);
        const remainingCandidates = candidates.slice(neededCount);
        candidatesToEmail.push(...topCandidates);
        candidatesToReject.push(...remainingCandidates);
      }

      if (candidatesToEmail.length === 0) {
        return res.json({ 
          success: false, 
          error: 'Top 3 candidates for the selected filters have already been emailed.' 
        });
      }

      // Step 5: Set up email transport.
      const transporter = nodemailer.createTransport({
        service: 'gmail',
        auth: {
          user: 'awalegaonkaromkar1902@gmail.com',
          pass: 'neryixkboyiqpsdu'
        }
      });

      const logoUrl = "https://drive.google.com/uc?id=1akfUCz2Tth4KN08V9hanX0cPerpjCpgr";

      // Step 6: Send emails for candidatesToEmail.
      // For each candidate emailed, update email_status to 1 and mark wasProcessed = 1.
      const sendEmailPromises = candidatesToEmail.map(candidate => {
        return new Promise((resolve, reject) => {
          const body = `
            <html>
              <head>
                <style>
                  body {
                    font-family: Arial, sans-serif;
                    background-color: #54397e;
                    color: #fff;
                    padding: 20px;
                    margin: 0;
                  }
                  .container {
                    max-width: 600px;
                    margin: 20px auto;
                    padding: 20px;
                    background-color: #fff;
                    border: 2px solid #54397e;
                    border-radius: 10px;
                    box-shadow: 0 4px 8px rgba(0, 0, 0, 0.2);
                  }
                  .header {
                    text-align: center;
                    padding-bottom: 20px;
                  }
                  .header img {
                    max-width: 150px;
                    margin-bottom: 20px;
                    border-radius: 10px;
                  }
                  .header h2 {
                    color: #54397e;
                    margin: 0;
                  }
                  .content {
                    font-size: 16px;
                    line-height: 1.6;
                    color: #333;
                    text-align: center;
                    padding: 20px 40px;
                  }
                  .footer {
                    font-size: 16px;
                    line-height: 1.6;
                    color: #333;
                    text-align: center;
                    padding-top: 20px;
                  }
                </style>
              </head>
              <body>
                <div class="container">
                  <div class="header">
                    <img src="${logoUrl}" alt="Talent Corner Logo" />
                    <h2>Congratulations on Your Selection!</h2>
                  </div>
                  <div class="content">
                    <p>Dear <strong>${candidate.Full_Name}</strong></p>
                    <p>You have been selected in the <strong>${candidate.Domain} - ${candidate.Sub_Domain}</strong> category. Your performance truly stands out!</p>
                    <p><strong>Achievement Details:</strong></p>
                    <ul style="list-style-type: none; padding: 0;">
                      <li><strong>Full Name:</strong> ${candidate.Full_Name}</li>
                      <li><strong>Domain:</strong> ${candidate.Domain}</li>
                      <li><strong>Subdomain:</strong> ${candidate.Sub_Domain}</li>
                    </ul>
                  </div>
                  <div class="footer">
                    <p>Best regards,</p>
                    <p>Mark Goldbridge<br>HR, Talent Corner<br>Contact: 9898787878</p>
                  </div>
                </div>
              </body>
            </html>
          `;
          
          const mailOptions = {
            from: 'awalegaonkaromkar1902@gmail.com',
            to: candidate.Email,
            subject: 'Your Candidate Ranking Notification',
            html: body
          };
          
          transporter.sendMail(mailOptions, (error, info) => {
            if (error) {
              console.error("Error sending email to candidate id " + candidate.id + ":", error);
              connection.query(
                'UPDATE `candidate ranking` SET email_status = 2, wasProcessed = 1 WHERE id = ?',
                [candidate.id],
                () => reject(error)
              );
            } else {
              console.log("Email sent to candidate id " + candidate.id + ":", info.response);
              connection.query(
                'UPDATE `candidate ranking` SET email_status = 1, wasProcessed = 1 WHERE id = ?',
                [candidate.id],
                (err, result) => {
                  if (err) {
                    console.error("Error updating candidate id " + candidate.id + ":", err);
                    return reject(err);
                  }
                  resolve(candidate.id);
                }
              );
            }
          });
        });
      });

      // Step 7: Process email sending promises and update remaining pending candidates to rejected.
      Promise.all(sendEmailPromises)
        .then(sentIds => {
          const rejectIds = candidatesToReject.map(c => c.id);
          if (rejectIds.length > 0) {
            const rejectQuery = `
              UPDATE \`candidate ranking\`
              SET email_status = 2, wasProcessed = 1
              WHERE id IN (${rejectIds.join(',')})
            `;
            connection.query(rejectQuery, (rejectErr) => {
              if (rejectErr) {
                console.error("Error updating rejected candidates:", rejectErr);
              } else {
                console.log(`Marked ${rejectIds.length} candidates as rejected`);
              }
              return res.json({ 
                success: true, 
                message: `Emails sent to ${sentIds.length} candidates. ${rejectIds.length} remaining candidates marked as rejected.` 
              });
            });
          } else {
            return res.json({ 
              success: true, 
              message: `Emails sent to ${sentIds.length} candidates. No remaining candidates to mark as rejected.` 
            });
          }
        })
        .catch(error => {
          console.error("Error processing candidate ranking emails:", error);
          return res.status(500).json({ success: false, error: error.message });
        });
    });
  });
});


// ================================
// Partition 8: Endpoints for "Admin login Data"
// ================================
// GET /admin-logindata/ - Retrieve all users
app.get('/admin-logindata/', (req, res) => {
  const query = 'SELECT id, email, password FROM users';
  connection.query(query, (err, results) => {
    if (err) {
      console.error("Error fetching users:", err);
      return res.status(500).json({ success: false, error: err.message });
    }
    const headers = ["ID", "Email", "Password"];
    res.json({ headers, rows: results || [] });
  });
});

// POST /admin-logindata/add-record - Add a new user
app.post('/admin-logindata/add-record', (req, res) => {
  const { email, password } = req.body;
  if (!email || !password) {
    return res.status(400).json({ success: false, error: "Email and Password are required." });
  }
  const query = 'INSERT INTO users (email, password) VALUES (?, ?)';
  connection.query(query, [email, password], (err, result) => {
    if (err) {
      console.error("Error adding user:", err);
      return res.status(500).json({ success: false, error: err.message });
    }
    res.json({ success: true, message: "User added successfully." });
  });
});

// POST /admin-logindata/modify-record - Modify an existing user record
app.post('/admin-logindata/modify-record', (req, res) => {
  const { id, email, password } = req.body;
  if (!id) {
    return res.status(400).json({ success: false, error: "Missing record id." });
  }
  const query = 'UPDATE users SET email = ?, password = ? WHERE id = ?';
  connection.query(query, [email, password, id], (err, result) => {
    if (err) {
      console.error("Error updating user:", err);
      return res.status(500).json({ success: false, error: err.message });
    }
    res.json({ success: true, message: "User updated successfully." });
  });
});

// POST /admin-logindata/delete-records - Delete selected user records
app.post('/admin-logindata/delete-records', (req, res) => {
  const { ids } = req.body;
  if (!Array.isArray(ids) || ids.length === 0) {
    return res.json({ success: false, error: "No record ids provided." });
  }
  const query = 'DELETE FROM users WHERE id IN (?)';
  connection.query(query, [ids], (err, result) => {
    if (err) {
      console.error("Error deleting users:", err);
      return res.status(500).json({ success: false, error: err.message });
    }
    res.json({ success: true, message: `${result.affectedRows} user(s) deleted successfully.` });
  });
});

// DELETE /admin-logindata/deleteAll - Delete all user records and reset auto-increment
app.delete('/admin-logindata/deleteAll', (req, res) => {
  const query = 'TRUNCATE TABLE users';
  connection.query(query, (err, results) => {
    if (err) {
      console.error("Error truncating users table:", err);
      return res.status(500).send('Error truncating users table');
    }
    res.send('All users deleted and auto-increment reset successfully');
  });
});

// ================================
// Partition 9: Endpoints for "Franchise signup data"
// ================================
// GET /franchiselogindata/ - Retrieve all records
// GET /franchiselogindata/ - Retrieve all records
app.get('/franchiselogindata/', (req, res) => {
  const query = 'SELECT id, Email, Password, `Organization name`, Timestamp, Otp FROM franchiselogindata';
  connection.query(query, (err, results) => {
    if (err) {
      console.error("Error fetching records:", err);
      return res.status(500).json({ success: false, error: err.message });
    }
    const headers = ["ID", "Email", "Password", "Organization name", "Timestamp", "Otp"];
    res.json({ headers, rows: results || [] });
  });
});

// POST /franchiselogindata/add-record - Add a new record
app.post('/franchiselogindata/add-record', (req, res) => {
  const { email, password, organization } = req.body;
  if (!email || !password || !organization) {
    return res.status(400).json({ success: false, error: "Email, Password, and Organization Name are required." });
  }
  const query = 'INSERT INTO franchiselogindata (Email, Password, `Organization name`) VALUES (?, ?, ?)';
  connection.query(query, [email, password, organization], (err, result) => {
    if (err) {
      console.error("Error adding record:", err);
      return res.status(500).json({ success: false, error: err.message });
    }
    res.json({ success: true, message: "Record added successfully." });
  });
});

app.post('/franchiselogindata/modify-record', (req, res) => {
  const { id, email, password, organization } = req.body;
  if (!id) {
    return res.status(400).json({ success: false, error: "Missing record id." });
  }
  
  // Check if password is empty (or only whitespace)
  if (!password || password.trim() === "") {
    // Update only email and organization if password is not provided
    const query = 'UPDATE franchiselogindata SET Email = ?, `Organization name` = ? WHERE id = ?';
    connection.query(query, [email, organization, id], (err, result) => {
      if (err) {
        console.error("Error updating record (email/org only):", err);
        return res.status(500).json({ success: false, error: err.message });
      }
      res.json({ success: true, message: "Record updated successfully (without password update)." });
    });
  } else {
    // Update email, password, and organization when password is provided
    const query = 'UPDATE franchiselogindata SET Email = ?, Password = ?, `Organization name` = ? WHERE id = ?';
    connection.query(query, [email, password, organization, id], (err, result) => {
      if (err) {
        console.error("Error updating record (with password):", err);
        return res.status(500).json({ success: false, error: err.message });
      }
      res.json({ success: true, message: "Record updated successfully." });
    });
  }
});


// POST /franchiselogindata/delete-records - Delete selected records
app.post('/franchiselogindata/delete-records', (req, res) => {
  const { ids } = req.body;
  if (!Array.isArray(ids) || ids.length === 0) {
    return res.json({ success: false, error: "No record ids provided." });
  }
  const query = 'DELETE FROM franchiselogindata WHERE id IN (?)';
  connection.query(query, [ids], (err, result) => {
    if (err) {
      console.error("Error deleting records:", err);
      return res.status(500).json({ success: false, error: err.message });
    }
    res.json({ success: true, message: `${result.affectedRows} record(s) deleted successfully.` });
  });
});

// DELETE /franchiselogindata/deleteAll - Delete all records and reset auto-increment
app.delete('/franchiselogindata/deleteAll', (req, res) => {
  const query = 'TRUNCATE TABLE franchiselogindata';
  connection.query(query, (err, results) => {
    if (err) {
      console.error("Error truncating table:", err);
      return res.status(500).send('Error truncating franchiselogindata table');
    }
    res.send('All records deleted and auto-increment reset successfully');
  });
});

// ================================
// Partition 10: Static Files and Root Routing
// ================================
app.use(express.static(path.join(__dirname, 'public')));

// If needed, you can serve a specific landing page
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'imported_data.html'));
});

// ================================
// Partition 11: Global Error Handling Middleware
// ================================
app.use((err, req, res, next) => {
  console.error(err);
  res.status(500).json({ success: false, error: err.message });
});

// ================================
// Partition 12: Server Initialization
// ================================
const PORT = 3000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});

// ================================
// Partition 13: Helper Functions (Token Generation and Storage)
// ================================

// Generate a random token (default length: 16 characters)
function generateToken(length = 16) {
  return crypto.randomBytes(Math.ceil(length / 2))
               .toString('hex')
               .slice(0, length);
}

// Store token for "imported data" in its Firebase database
async function storeTokenInFirebaseImportedData(token, tokenUrl) {
  const firebaseURL = `https://form1talentcorner-default-rtdb.firebaseio.com/tokens/${token}.json`;
  const payload = {
    token: token,
    url: tokenUrl,
    used: false,
    createdAt: new Date().toISOString()
  };

  try {
    const response = await fetch(firebaseURL, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });
    const data = await response.text();
    console.log('Imported Data Token stored in Firebase:', data);
  } catch (error) {
    console.error("Error storing token for imported data in Firebase:", error);
  }
}

// Store token for "form1data" in its separate Firebase database
async function storeTokenInFirebaseForm1Data(token, tokenUrl) {
  const firebaseURL = `https://form1-9604b-default-rtdb.firebaseio.com/tokens/${token}.json`;
  const payload = {
    token: token,
    url: tokenUrl,
    used: false,
    createdAt: new Date().toISOString()
  };

  try {
    const response = await fetch(firebaseURL, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });
    const data = await response.text();
    console.log('Form1Data Token stored in Firebase:', data);
  } catch (error) {
    console.error("Error storing token for form1data in Firebase:", error);
  }
}



// ================================
// Partition 6: Data Deletion
// ================================
// Partition 6: Data Deletion
app.post('/delete-all-data', (req, res) => {
  const { password } = req.body;
  
  if (!req.session.admin_logged_in) {
    return res.json({ success: false, error: 'Authentication required. Please log in.' });
  }
  
  const email = req.session.email;
  
  // Verify the admin password
  const query = 'SELECT * FROM users WHERE email = ? AND password = ?';
  connection.query(query, [email, password], (err, results) => {
    if (err) {
      console.error('Error executing query: ', err);
      return res.json({ success: false, error: 'Server error.' });
    }
    
    if (results.length === 0) {
      return res.json({ success: false, error: 'Invalid password. Deletion aborted.' });
    }
    
    // Check if there is any data to delete by summing the row counts from all three tables
    const countQuery = `
      SELECT (
        (SELECT COUNT(*) FROM \`imported data\`) +
        (SELECT COUNT(*) FROM \`candidate ranking\`) +
        (SELECT COUNT(*) FROM \`form1data\`)
      ) AS totalRows;
    `;
    connection.query(countQuery, (countErr, countResults) => {
      if (countErr) {
        console.error('Error counting rows: ', countErr);
        return res.json({ success: false, error: 'Error verifying data. ' + countErr.message });
      }
      
      const totalRows = countResults[0].totalRows;
      if (totalRows == 0) {
        return res.json({ success: false, error: 'There is no data to delete.' });
      }
      
      // Data exists, proceed with deletion
      connection.query('SET FOREIGN_KEY_CHECKS=0', (fkErr) => {
        if (fkErr) {
          console.error("Error disabling foreign key checks:", fkErr);
          return res.status(500).json({ success: false, error: fkErr.message });
        }
        
        const deleteTables = [
          'TRUNCATE TABLE `imported data`',
          'TRUNCATE TABLE `candidate ranking`',
          'TRUNCATE TABLE `form1data`'
        ];
        
        connection.query(deleteTables.join(';'), (deleteErr) => {
          connection.query('SET FOREIGN_KEY_CHECKS=1', () => {
            if (deleteErr) {
              console.error("Error deleting data:", deleteErr);
              return res.json({ success: false, error: 'Failed to delete data. ' + deleteErr.message });
            }
            
            return res.json({ 
              success: true, 
              message: 'All data has been successfully deleted from the database.'
            });
          });
        });
      });
    });
  });
});


