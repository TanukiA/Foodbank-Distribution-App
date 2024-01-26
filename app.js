//Imports
const express = require('express')
const session = require('express-session');
require('dotenv').config()

//App
const app = express()
app.listen(8000, function() {
    console.log('listening on port', 8000);
});

//Static Files
app.use(express.static('public'))

//Set Views
app.set('views', './views')
app.set('view engine', 'ejs')

//Body Parser
app.use(express.urlencoded({ extended: true }))

//Parsing Application/json
app.use(express.json())

//Secret
app.use(session({
    secret: 's0e1c2r3e4t5',
    resave: false,
    saveUninitialized: true
}));

//Status
app.use(function(err, req, res, next) {
    res.status(err.status || 500)
    res.send(err.message)
})

//Get Respond using route
const routes1 = require('./server/routes/user')
app.use('/', routes1)

const routes2 = require('./server/routes/admin')
app.use('/', routes2)