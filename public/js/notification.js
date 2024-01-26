const express = require('express')
const router = express.Router()

router.use('/css', express.static(__dirname + 'public/css'))
router.use('/js', express.static(__dirname + 'public/js'))

//Body Parser
router.use(express.urlencoded({ extended: false }))

//Parsing Application/json
router.use(express.json())

//Database - mysql
const database = mysql.createPool({
    host: process.env.DB_HOST,
    database: process.env.DB_NAME,
    user: process.env.DB_USER,
    password: process.env.DB_PASS,
    connectionLimit: 100
})

router.get('/notification', (req, res) => {
   res.render('notification')
})

module.exports = router