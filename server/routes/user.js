const express = require('express');
const userController = require('../controllers/userController');
const { check, validationResult } = require('express-validator');
const mysql = require('mysql');
const router = express.Router();

//Static Files
router.use('/css', express.static(__dirname + 'public/css'))
router.use('/js', express.static(__dirname + 'public/js'))
router.use('/img', express.static(__dirname + 'public/img'))

//Get Respond
router.get('/', userController.landing);
router.get('/register', userController.register);
router.get('/login', userController.login);
router.get('/temp', userController.temp); //temp

router.get('/userBrowse', userController.browse);
router.get('/view-check-in', userController.viewCheckIn);
router.get('/viewOwnFoodBank', userController.viewOwned);

router.get('/notification', userController.viewNotification);
router.get('/addFoodBank', userController.addFoodBank);

router.get('/userHome', userController.userHome);
router.get('/profile', userController.profile);
router.get('/editProfile', userController.editProfile);


//Post
router.post('/loginPost', userController.loginPost);
router.post('/calDistance', userController.calDistance);

router.post('/check-in', userController.checkIn);
router.post('/search', userController.filter);
router.post('/deleteFoodBank', userController.deleteFoodBank);
router.post('/editFoodBank/:id', userController.editFoodBank);
router.post('/updateFoodBank', userController.updateFoodBank);

router.post('/addFB', userController.addFB);


//For Register Post
const database = mysql.createPool({
    host: process.env.DB_HOST,
    database: process.env.DB_NAME,
    user: process.env.DB_USER,
    password: process.env.DB_PASS,
    connectionLimit: 100
})

router.post('/register', [
        check('username').isLength({ min: 3 }).withMessage('Username should at least have 3 characters'),
        check('password').isLength({ min: 5 }).withMessage('Password should at least have 5 characters'),
        check('name').isLength({ min: 3 }).withMessage('Name should at least have 3 characters'),
        check('email').isEmail().withMessage('Email is not valid'),
        check('phone').isNumeric().isLength({ min: 10, max: 12 }).withMessage('Phone number should only contains 10-12 number (eg. 0122820663)')
    ],
    async function(req, res, next) {
        var columnArray = ['SELECT * FROM user WHERE user_username = ?', 'SELECT * FROM user WHERE user_email = ?', 'SELECT * FROM user WHERE user_phone = ?'];
        var inputArray = [req.body.username, req.body.email, req.body.phone];
        var errorMessage = [];

        const errors = validationResult(req);

        if (!errors.isEmpty()) {
            var myAlert = errors.array()
            res.render('register', { myAlert })
        } else {
            var found = [];
            const forLoop = async _ => {
                for (let i = 0; i < columnArray.length; i++) {
                    await checkDatabase(columnArray[i], inputArray[i]).then(function(result) {
                        found.push(result);
                    }).catch(function(erro) {
                        found.push(erro);
                        errorMessage.push(`"` + inputArray[i] + `" is already in used.`);
                    })
                }
            }
            await forLoop();

            var flag = true;
            found.forEach(element => {
                if (element === true) {
                    flag = false;
                }
            });

            if (flag) {
                var sql = "INSERT INTO user (user_id, location_id,user_name, user_email, user_phone, user_username, user_password) VALUES (NULL,NULL, ?, ?, ?, ?, ?)";
                database.query(sql, [req.body.name, req.body.email, req.body.phone, req.body.username, req.body.password], function(err, result) {
                    if (err) throw err;
                    console.log("1 record inserted");
                });
                res.render('login', { successMessage: 'success' })
            } else {
                res.render('register', { errorMessage })
            }
        }
    });

function checkDatabase(col, inp) {
    return new Promise(function(resolve, reject) {
        database.query(col, [inp], function(err, result, fields) {
            if (result.length > 0) {
                reject(true)
            } else {
                resolve(false)
            }
        })
    });

}

//edit profile
router.post('/editProfile', [
        check('username').isLength({ min: 3 }).withMessage('Username should at least have 3 characters'),
        check('password').isLength({ min: 5 }).withMessage('Password should at least have 5 characters'),
        check('name').isLength({ min: 3 }).withMessage('Name should at least have 3 characters'),
        check('email').isEmail().withMessage('Email is not valid'),
        check('phone').isNumeric().isLength({ min: 10, max: 12 }).withMessage('Phone number should only contains 10-12 number (eg. 0122820663)')
    ],
    async(req, res) => {
        var columnArray = ['SELECT * FROM user WHERE user_username = ? AND user_id NOT IN (?)', 'SELECT * FROM user WHERE user_email = ? AND user_id NOT IN (?)', 'SELECT * FROM user WHERE user_phone = ? AND user_id NOT IN (?)'];
        var inputArray = [req.body.username, req.body.email, req.body.phone, ];
        var errorMessage = [];

        console.log(req.body.username);

        const errors = validationResult(req);

        if (!errors.isEmpty()) {
            var myAlert = errors.array();
            var profile_arr = await getSpecific("SELECT user_name,user_email,user_phone,user_username,user_password FROM user WHERE user_id = ?;", req.session.actorid);
           
            res.render("editProfile", { profile_arr, myAlert });

        } else {
            var found = [];
            const forLoop = async _ => {
                for (let i = 0; i < columnArray.length; i++) {
                    await getSpecific(columnArray[i], [inputArray[i], req.session.actorid]).then(function(result) {
                        found.push(result);
                    }).catch(function(erro) {
                        found.push(erro);
                        errorMessage.push(`"` + inputArray[i] + `" is already in used.`);
                    })
                }
            }
            await forLoop();

            var flag = true;
            found.forEach(element => {
                if (element === true) {
                    flag = false;
                }
            });

            if (flag) {
                console.log(req.body.name);
                console.log(req.body.password);
                var sql = "UPDATE user SET user_name=? , user_email=? , user_phone=? , user_username=? , user_password=? WHERE user_id = ?;";
                database.query(sql, [req.body.name, req.body.email, req.body.phone, req.body.username, req.body.password, req.session.actorid]),(function(result) {
                    if (err) throw err;
                   console.log(result);
                })
                
                
            }
        }
        
    });

function getSpecific(sql, value) {
    return new Promise((res, rej) => {
        database.query(sql, [value], (err, result) => {
            if (err) {
                rej(err);
            } else {
                res(result);
            }
        });
    });
}


module.exports = router