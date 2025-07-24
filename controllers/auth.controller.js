const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const Sequelize = require('../config/db.config');

const register = async (req, res) => {
  try {
    const { email, password, name, role, phone, address,auth_provider,is_verified } = req.body;

    // Check if user already exists
    const existingUser = await Sequelize.query(
      'SELECT * FROM "users" WHERE email = $1',
      {
        bind: [email], // ✅ bind parameters properly
        type: Sequelize.QueryTypes.SELECT
      }
    );    

    // existingUser is already an array, no `.rows`


    if(existingUser[0]?.auth_provider == 'google'){
      return res.status(400).json({message: 'Please login through Google Your Mail already register with that'})
    }

        if (existingUser.length > 0) {
      return res.status(400).json({ message: 'User already exists' });
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Create user
    const insertResult = await Sequelize.query(
      'INSERT INTO users (email, password, name, role, phone, address,auth_provider,is_verified,"createdAt","updatedAt") VALUES ($1, $2, $3, $4, $5, $6, $7, $8, NOW(),NOW()) RETURNING *',
      {
        bind: [email, hashedPassword, name, role, phone, address,auth_provider,is_verified],
        type: Sequelize.QueryTypes.INSERT
      }
    );

    // Sequelize returns rows in first element of result array
    const user = insertResult[0][0]; // result[0] = rows, result[0][0] = first row
    delete user.password;

    // Generate JWT token
    const token = jwt.sign({ id: user.id }, process.env.JWT_SECRET, { expiresIn: '24h' });

    res.status(201).json({
      message: 'User created successfully',
      user,
      token  
    });

  } catch (error) {  
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
};




const googleSuccess = async (req, res) => {
  try {
    const data = req.user;

    const email = data.emails[0].value;
    const name = data.displayName;
    const provider = data.provider;

    // Check if user exists
    const existingUser = await Sequelize.query(
      'SELECT * FROM "users" WHERE email = $1',
      {
        bind: [email],
        type: Sequelize.QueryTypes.SELECT
      }
    );

    let user;
    if (existingUser.length > 0) {
      user = existingUser[0]; // already exists
    } else {
      // New user – create
      const insertResult = await Sequelize.query(
        'INSERT INTO users (email, password, name, role, phone, address, auth_provider, is_verified, "createdAt", "updatedAt") VALUES ($1, $2, $3, $4, $5, $6, $7, $8, NOW(), NOW()) RETURNING *',
        {
          bind: [
            email,
            null,
            name,
            'user',
            null,
            null,
            provider,
            true
          ],
          type: Sequelize.QueryTypes.INSERT
        }
      );
      user = insertResult[0][0];
    }

    const token = jwt.sign({ id: user.id }, process.env.JWT_SECRET, { expiresIn: '24h' });

    // Redirect with token to frontend (Angular)
    res.redirect(`http://localhost:4200/google-auth-success?token=${token}`);
  } catch (error) {
    console.error("Google login error:", error);
    res.status(500).json({ message: "Google login failed" });
  }
};


const login = async (req, res) => {
  try {
    const { email, password } = req.body;
  
    // Find user
    const result = await Sequelize.query('SELECT * FROM users WHERE email = $1',       {
        bind: [email], // ✅ bind parameters properly
        type: Sequelize.QueryTypes.SELECT
      });
    if (result.length === 0) {
      return res.status(400).json({ message: 'Invalid credentials' });
    }  


    if(result[0].auth_provider == 'google'){
      return res.status(400).json({message: 'Please login through Google'})
    }

    const user = result[0];



    // Check password
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(400).json({ message: 'Invalid credentials' });
    }

    delete user.password;

    // Generate JWT token
    const token = jwt.sign({ id: user.id }, process.env.JWT_SECRET, { expiresIn: '24h' });

    res.json({
      message: 'Login successful',
      user,
      token
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
};


const adminlogin = async (req, res) => {
  try {
    const { email, password } = req.body;
  
    // Find user
    const result = await Sequelize.query('SELECT * FROM users WHERE email = $1',       {
        bind: [email], // ✅ bind parameters properly
        type: Sequelize.QueryTypes.SELECT
      });
    if (result.length === 0) {
      return res.status(400).json({ message: 'Invalid credentials' });
    }  

    const user = result[0];


      if (user.role !== 'admin') {
    return res.status(403).json({ message: "Only admin can login" });
  }
    // Check password
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(400).json({ message: 'Invalid credentials' });
    }

    delete user.password;

    // Generate JWT token
    const token = jwt.sign({ id: user.id }, process.env.JWT_SECRET, { expiresIn: '24h' });

    res.json({
      message: 'Login successful',
      user,
      token
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
};

const getProfile = async (req, res) => {
  try {
    const user = req.user;
    delete user.password;
    res.json({ user });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
};
  
module.exports = { register, login, getProfile ,adminlogin,googleSuccess};