// Importing all modules
const express = require("express")
const path = require("path")
const bcrypt = require("bcrypt")
const collection = require("./config")
const ejs = require("ejs")
const session = require("express-session")
const { body, validationResult } = require("express-validator");
const bodyparser = require("body-parser")

const app = express()
// converting data into json format
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(bodyparser.urlencoded({ extended: true }))
app.use(session({
    secret: "secret-key",
    saveUninitialized: false,
    resave: false
}));

// use ejs as view engine
app.set("view engine", "ejs")

app.use(express.static("public"))

app.get('/', (req, res) => {
    res.render("login")
})

app.get('/signup', (req, res) => {
    res.render("signup")
})


// SignUp Page
app.post("/signup", [
    body('username').trim().notEmpty().withMessage("Username is required"),
    body('email').trim().isEmail().withMessage("Invalid email address"),
    body('password').trim().isLength({ min: 6 }).withMessage("Password must be at least 6 characters long"),
    body('userType').trim().notEmpty().withMessage("User type is required"),
],
    async (req, res) => {
        const errors = validationResult(req);

        if (!errors.isEmpty()) {
            return res.render('signup', { errors: errors.array() });
        }
        const data = {
            name: req.body.username,
            email: req.body.email,
            password: req.body.password,
            userType: req.body.userType
        };
        const existingUser = await collection.findOne({ name: data.name });
        if (existingUser) {
            return res.render('signup', { errors: [{ msg: 'User already exists, please try a different name' }] });
        } else {
            //hashing password using bcrypt
            const saltRounds = 10; // number of salting rounds
            const hashPasswords = await bcrypt.hash(data.password, saltRounds); // hashing password process
            data.password = hashPasswords; // replace hashed password with original password data
            const userData = await collection.insertMany(data);
            console.log(userData);
            res.redirect('/');
        }
    }
);


// Login Page
app.post('/login', [
    body('username').trim().notEmpty().withMessage("Username Required"),
    body('password').trim().notEmpty().withMessage("Password Required")
],
    async (req, res) => {
        const errors = validationResult(req);

        if (!errors.isEmpty()) {
            res.render('login', { errors: errors.array() })
        }
        else {
            try {
                const check = await collection.findOne({ name: req.body.username })
                if (!check) {
                    return res.render('login', { errors: [{ msg: 'Invalid username' }] })
                }
                const isPasswordMatch = await bcrypt.compare(req.body.password, check.password);
                if (isPasswordMatch) {
                    if (check.userType === 'admin') {
                        // Add user information to the session
                        req.session.user = {
                            username: req.body.username,
                            userType: 'admin'
                        };

                        res.redirect('/adminhome');
                    } else {
                        // Add user information to the session
                        req.session.user = {
                            username: req.body.username,
                            userType: 'user'
                        };

                        res.render("home", { username: req.body.username })
                    }
                } else {
                    return res.render('login', { errors: [{ msg: 'Invalid password' }] })
                }
            } catch {
                return res.render('login', { errors: [{ msg: 'Wrong Details' }] })
            }
        }

    });

// Admin Home Page
app.get('/adminhome', async (req, res) => {
    try {
        // Check if the user is logged in
        if (!req.session.user || req.session.user.userType !== 'admin') {
            return res.redirect('/');
        }
        const username = req.session.user.username;
        const users = await collection.find({ userType: { $ne: "admin" } });
        res.render("adminhome", { username: username, users: users });
    } catch {
        res.send("Error fetching users");
    }
});


// Edit User Page
app.get('/admin/edit/:userId', async (req, res) => {
    try {
        // Check if the user is logged in
        if (!req.session.user || req.session.user.userType !== 'admin') {
            return res.redirect('/');
        }
        const user = await collection.findById(req.params.userId);
        res.render("edituser", { user: user });
    } catch {
        res.send("Error fetching user");
    }
});

// Update User
app.post('/admin/update/:userId', async (req, res) => {
    try {
        // Check if the user is logged in
        if (!req.session.user || req.session.user.userType !== 'admin') {
            return res.redirect('/');
        }
        await collection.findByIdAndUpdate(req.params.userId, {
            name: req.body.updatedUsername,
            email: req.body.updatedEmail
        });

        res.redirect('/adminhome');
    } catch {
        res.send("Error updating user");
    }
});

// Delete User
app.get('/admin/delete/:userId', async (req, res) => {
    try {
        // Check if the user is logged in
        if (!req.session.user || req.session.user.userType !== 'admin') {
            return res.redirect('/');
        }
        // Delete user from the database
        await collection.findByIdAndDelete(req.params.userId);

        res.redirect('/adminhome');
    } catch {
        res.send("Error deleting user");
    }
});

// Create User
app.post('/admin/create', async (req, res) => {
    try {
        // Check if the user is logged in
        if (!req.session.user || req.session.user.userType !== 'admin') {
            return res.redirect('/');
        }
        const newData = {
            name: req.body.newUsername,
            email: req.body.newEmail,
            password: req.body.newPassword,
            userType: 'user' // set the user type accordingly
        };
        // Add new user to the database
        await collection.create(newData);

        res.redirect('/adminhome');
    } catch {
        res.send("Error creating user");
    }
});

const port = 5000;
app.listen(port, () => {
    console.log(`Server is listening to ${port}`)
})

