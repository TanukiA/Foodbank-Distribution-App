"Use Strict"

const mysql = require('mysql2');

//Database - mysql
const database = mysql.createPool({
    host: process.env.DB_HOST,
    database: process.env.DB_NAME,
    user: process.env.DB_USER,
    password: process.env.DB_PASS,
    connectionLimit: 100
})

//Get
exports.landing = (req, res) => { //view landing page
    res.render('landing');
};
exports.register = (req, res) => { //view register page
    res.render('register')
}
exports.login = (req, res) => { //view login page
    req.session.destroy();
    res.render('login', { errorMessage: null })
}
exports.browse = async(req, res) => {
    if (!req.session.actorid) {
        return res.status(401).send();
    } else {
        var set1 = await getResult("SELECT foodbank_id, location_id, owner_id, foodbank_name, foodbank_food_halal, foodbank_contact AS contact, DATE_FORMAT(foodbank_open_time,'%h:%i%p') AS open_time, DATE_FORMAT(foodbank_close_time,'%h:%i%p') AS close_time FROM foodbank");
        var set2 = await getResult("SELECT location_id, location_address FROM location");
        var set3 = await getResult("SELECT * FROM food");
        var coordinate = await getResult("SELECT location_id, ST_astext(location_point) FROM location;");
        res.render("browse", { set1, set2, set3, coordinate });
    }

};
exports.viewCheckIn = async(req, res) => {
    if (!req.session.actorid) {
        return res.status(401).send();
    } else {
        var set1 = await getSpecific("SELECT foodbank_id, activity_date_time FROM activity WHERE user_id = ?", req.session.actorid);
        var set2 = await getResult("SELECT foodbank_id, foodbank_name FROM foodbank");
        if (set1.length > 0) {
            var date = [];
            var time = [];
            for (const item of set1) {
                var timestamp = item.activity_date_time;
                var dt = new Date(timestamp);
                date.push(dt.getDate() + "/" + (dt.getMonth() + 1) + "/" + dt.getFullYear());
                time.push(dt.toLocaleString('en-US', { hour: 'numeric', minute: 'numeric', hour12: true }));
            }
            res.render("activity", { set1, set2, date, time, noActivity: false });
        } else {
            res.render("activity", { noActivity: true });
        }
    }

};
exports.viewOwned = (req, res) => {
    getOwner(req.session.actorid, function(err, data) {
        if (err) {
            console.log(err);
        } else {
            if (data != null) {
                let owner_id = data[0].owner_id;
                exports.retrieveOwn(owner_id, req, res);
            } else {
                if (!req.session.actorid) {
                    return res.status(401).send();
                } else {
                    res.render("myFoodBank", { notFound: true });
                }

            }
        }
    });
};
exports.viewNotification = async(req, res) => {
    //var set1 = await getSpecific("SELECT user_id, notification_message, notification_date_time FROM notification WHERE user_id = ?", user_id);
    var set1 = await getSpecific("SELECT * FROM notification WHERE user_id = ? ORDER BY notification_date_time DESC;", req.session.actorid); //testing
    var set4 = await getSpecific("SELECT * FROM user WHERE user_id = ?", req.session.actorid);
    var date = [];
    var time = [];
    for (const item of set1) {
        var timestamp = item.notification_date_time;
        var dt = new Date(timestamp);
        date.push(dt.getDate() + "/" + (dt.getMonth() + 1) + "/" + dt.getFullYear());
        time.push(dt.toLocaleString('en-US', { hour: 'numeric', minute: 'numeric', hour12: true }));
    }
    if (!req.session.actorid) {
        return res.status(401).send();
    } else {
        res.render("notification", { set1, set4, date, time });
    }

};
exports.addFoodBank = (req, res) => {
    if (!req.session.actorid) {
        return res.status(401).send();
    } else {
        res.render('addFoodBank')
    }
}
exports.userHome = (req, res) => { //view user home page
    if (!req.session.actorid) {
        return res.status(401).send();
    } else {
        res.render('userHome')
    }
};
exports.profile = async(req, res) => { //show profile page
    var profile_arr = await getSpecific("SELECT user_name,user_email,user_phone,user_username,user_password FROM user WHERE user_id = ?;", req.session.actorid);
    console.log(profile_arr);
    res.render("profile", { profile_arr });
};

//show edit profile page
exports.editProfile = async(req, res) => {
    var profile_arr = await getSpecific("SELECT user_name,user_email,user_phone,user_username,user_password FROM user WHERE user_id = ?;", req.session.actorid);
   
    res.render("editProfile", { profile_arr });
};
exports.temp = (req, res) => { //view home page - temp ||| remember to delete
    if (!req.session.actorid) {
        return res.status(401).send();
    } else {
        var username = req.session.username;
        var userId = req.session.actorid;
        res.render('temp', { username, userId })
    }
}


//Post - login
exports.loginPost = (req, res) => {
    var errorMessage;
    var username = req.body.username;
    var password = req.body.password;
    var checkbox = req.body.adminBool;
    var userQuery = `SELECT * FROM user WHERE user_username = ? AND user_password = ?`;
    var adminQuery = `SELECT * FROM admin WHERE admin_username = ? AND admin_password = ?`;

    if (username && password) {
        if (checkbox) {
            database.query(adminQuery, [username, password], function(error, results, fields) {
                if (results.length > 0) {
                    req.session.loggedin = true;
                    req.session.username = username;
                    req.session.actorid = results[0].admin_id;
                    console.log("Hi " + req.session.username + ", admin_id " + req.session.actorid); //test
                    res.redirect('/adminHome');
                } else {
                    errorMessage = 'Incorrect Username and Password!';
                    res.render('login', { errorMessage })
                }
                res.end();
            });
        } else {
            database.query(userQuery, [username, password], function(error, results, fields) {
                if (results.length > 0) {
                    req.session.loggedin = true;
                    req.session.username = username;
                    req.session.actorid = results[0].user_id;
                    console.log("Hi " + req.session.username + ", user_id " + req.session.actorid); //test
                    res.redirect('/userHome');
                } else {
                    errorMessage = 'Incorrect Username and Password!';
                    res.render('login', { errorMessage });
                }
                res.end();
            });
        }
    } else {
        errorMessage = 'Please enter Username and Password!';
        res.render('login', { errorMessage });
        res.end();
    }
}

//not using, delete ltr
//Post - calculate distance
exports.calDistance = async(req, res) => {
    var userAddressArray = [];
    var locationDetailsArray = [];
    var checkArray = [];
    var finalResult = [];
    var kmArray = [];
    var lat = Number(req.body.lat);
    var long = Number(req.body.long);

    await getResult("SELECT user_id, location_id FROM user;").then(function(rows) {
        userAddressArray = Object.values(JSON.parse(JSON.stringify(rows)));
    }).catch((err) => setImmediate(() => { throw err; }));

    console.log(userAddressArray); //test

    await getResult("SELECT location_id, ST_astext(location_point) FROM location;").then(function(rows) {
        locationDetailsArray = Object.values(JSON.parse(JSON.stringify(rows)));
    }).catch((err) => setImmediate(() => { throw err; }));

    console.log(locationDetailsArray); //test

    for (const ins of userAddressArray) {
        for (const ins2 of locationDetailsArray) {
            if (ins.location_id === ins2.location_id) {
                checkArray.push(ins2)
            }
        }
    }
    console.log(checkArray); //test


    for (const checkThis of checkArray) {
        var temp = String(checkThis['ST_astext(location_point)']).trim().substring(6).slice(0, -1).split(" ");
        var distance = calculateDistance(lat, long, temp[0], temp[1]);
        console.log(Math.round((distance + Number.EPSILON) * 100) / 100); //test
        if (distance <= 3) {
            for (const user of userAddressArray) {
                if (user.location_id === checkThis.location_id) {
                    finalResult.push(user.user_id);
                    kmArray.push(Math.round((distance + Number.EPSILON) * 100) / 100);
                }
            }
        }
    }
    console.log("final: " + finalResult); //test

    var foodbankName = "Testing FoodBank"; //temp
    var query = `INSERT INTO notification (notification_id, user_id, notification_message, notification_date_time) VALUES (NULL, ?, "There is a new food bank named '?' added ?km from you!", NULL);`;

    function insertRecord(sql, id, name, km) {
        return new Promise((res, rej) => {
            database.query(sql, [id, name, km], (err, result) => {
                if (err) {
                    rej(err);
                } else {
                    res(result);
                }
            });
        });
    }

    for (let i = 0; i < finalResult.length; i++) {
        await insertRecord(query, finalResult[i], foodbankName, kmArray[i]).then(function(rows) {
            console.log("Notification's record inserted");
        }).catch((err) => setImmediate(() => { throw err; }));
    }

    //this function is retrived from online resouces
    function calculateDistance(lat1, lon1, lat2, lon2) {
        var R = 6371; // Radius of the earth in km
        var dLat = deg2rad(lat2 - lat1); // deg2rad below
        var dLon = deg2rad(lon2 - lon1);
        var a =
            Math.sin(dLat / 2) * Math.sin(dLat / 2) +
            Math.cos(deg2rad(lat1)) * Math.cos(deg2rad(lat2)) *
            Math.sin(dLon / 2) * Math.sin(dLon / 2);
        var c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
        var d = R * c; // Distance in km
        return d;
    }

    function deg2rad(deg) {
        return deg * (Math.PI / 180)
    }

}

//Post - filter
exports.filter = async(req, res) => {
    const { sort, food_type } = req.body;
    var food_category = req.body.food_category;

    var cont_query, set1;

    if (food_category == "undefined" || food_category == null) {
        food_category = ["Rice", "Bread", "Can Food", "Biscuit", "Frozen Food", "Noodles", "Baby Supplies", "Vegetables", "Drink"];
    }

    if ((sort == "foodbank_name") && (food_type != "all")) {
        cont_query = " WHERE foodbank_food_halal = ? AND foodbank_id IN (SELECT foodbank_id FROM food WHERE food_category IN (?)) ORDER BY foodbank_name ASC";
        set1 = await getFiltered("SELECT foodbank_id, location_id, owner_id, foodbank_name, foodbank_food_halal, RIGHT(foodbank_contact, LENGTH(foodbank_contact) - 2) AS contact, DATE_FORMAT(foodbank_open_time,'%h:%i%p') AS open_time, DATE_FORMAT(foodbank_close_time,'%h:%i%p') AS close_time FROM foodbank" +
            cont_query, food_type, food_category);

    } else if ((sort == "foodbank_name") && (food_type == "all")) {
        cont_query = " WHERE foodbank_id IN (SELECT foodbank_id FROM food WHERE food_category IN (?)) ORDER BY foodbank_name ASC";
        set1 = await getSpecific("SELECT foodbank_id, location_id, owner_id, foodbank_name, foodbank_food_halal, RIGHT(foodbank_contact, LENGTH(foodbank_contact) - 2) AS contact, DATE_FORMAT(foodbank_open_time,'%h:%i%p') AS open_time, DATE_FORMAT(foodbank_close_time,'%h:%i%p') AS close_time FROM foodbank" +
            cont_query, food_category);

    } else if ((sort == "all") && (food_type != "all")) {
        cont_query = " WHERE foodbank_food_halal = ? AND foodbank_id IN (SELECT foodbank_id FROM food WHERE food_category IN (?))";
        set1 = await getSpecific2("SELECT foodbank_id, location_id, owner_id, foodbank_name, foodbank_food_halal, RIGHT(foodbank_contact, LENGTH(foodbank_contact) - 2) AS contact, DATE_FORMAT(foodbank_open_time,'%h:%i%p') AS open_time, DATE_FORMAT(foodbank_close_time,'%h:%i%p') AS close_time FROM foodbank" +
            cont_query, food_type, food_category);

    } else if ((sort == "all") && (food_type == "all")) {
        cont_query = " WHERE foodbank_id IN (SELECT foodbank_id FROM food WHERE food_category IN (?))";
        set1 = await getSpecific("SELECT foodbank_id, location_id, owner_id, foodbank_name, foodbank_food_halal, RIGHT(foodbank_contact, LENGTH(foodbank_contact) - 2) AS contact, DATE_FORMAT(foodbank_open_time,'%h:%i%p') AS open_time, DATE_FORMAT(foodbank_close_time,'%h:%i%p') AS close_time FROM foodbank" +
            cont_query, food_category);
    }

    var set2 = await getResult("SELECT location_id, location_address FROM location");
    var set3 = await getResult("SELECT * FROM food");
    var coordinate = await getResult("SELECT location_id, ST_astext(location_point) FROM location;");
    res.render("browse", { set1, set2, set3, coordinate });
};

//Post - check in
exports.checkIn = (req, res) => {
    var foodbank_id = req.body.foodBankID;
    database.query("INSERT INTO activity SET user_id = ?, foodbank_id = ?, activity_date_time = CURRENT_TIMESTAMP", [req.session.actorid, foodbank_id], (err, rows) => {
        if (!err) {
            database.query("SELECT foodbank_name FROM foodbank WHERE foodbank_id = ?", [foodbank_id], (err, rows) => {
                if (!err) {
                    res.json({ foodbank_name: rows[0].foodbank_name });
                } else {
                    console.log(err);
                }
            });
        } else {
            console.log(err);
        }
    });
};

exports.editFoodBank = (req, res) => {

    var foodbank_id = req.params.id;
    database.query("SELECT foodbank_id, location_id, foodbank_name, foodbank_food_halal, foodbank_contact, foodbank_open_time, foodbank_close_time FROM foodbank WHERE foodbank_id = ?", [foodbank_id], (err, foodbank_arr) => {

        var location_id;

        if (!err) {

            location_id = foodbank_arr[0].location_id;

            database.query("SELECT * FROM food WHERE foodbank_id = ?", [foodbank_id], (err, food_arr) => {
                if (!err) {
                    database.query("SELECT location_address FROM location WHERE location_id = ?", [location_id], (err, location_arr) => {
                        if (!err) {
                            var food_names = [];
                            var food_categories = [];
                            var food_quantities = [];
                            for (var i = 0; i < food_arr.length; i++) {
                                food_names.push(food_arr[i].food_name);
                                food_categories.push(food_arr[i].food_category);
                                food_quantities.push(food_arr[i].food_quantity);
                            }
                            res.render("editFoodBank", { foodbank_arr, location_arr, food_names, food_categories, food_quantities, foodbank_id });
                        } else {
                            console.log(err);
                        }
                    });
                } else {
                    console.log(err);
                }
            });

        } else {
            console.log(err);
        }
    });
};

exports.updateFoodBank = (req, res) => {

    var locationId;

    const { foodbank_id, foodbank_name, phone, open_time, close_time, halal, food_name, food_category, food_quantity } = req.body;

    var fullAddress = req.body.newAddress;
    var lat = Number(req.body.newLat);
    var long = Number(req.body.newLong);
    console.log("Address: " + fullAddress);
    console.log("Lat: " + lat);
    console.log("Long: " + long);

    var food_type;

    if (halal) {
        food_type = "Y";
    } else {
        food_type = "N";
    }

    if (fullAddress != "" && fullAddress != undefined) {
        var getFoodBankID = "SELECT location_id FROM foodbank WHERE foodbank_id = ?";
        var updateLocationPoint = "UPDATE location SET location_point = ST_GeomFromText('POINT(? ?)') WHERE location_id = ?;";
        var updateLocationAddress = "UPDATE location SET location_address = ? WHERE location_id = ?;";

        (async() => {

            //get location id from foodbank
            await getRecord(getFoodBankID, foodbank_id).then(function(rows) {
                var resultArray = Object.values(JSON.parse(JSON.stringify(rows)))
                console.log(resultArray[0].location_id); //test
                locationId = resultArray[0].location_id;
            }).catch((err) => setImmediate(() => { throw err; }));

            console.log("locationId: " + locationId); //test

            await modifyRecord(updateLocationAddress, fullAddress, locationId).then(function(message) {
                console.log(message); //test
            }).catch((err) => setImmediate(() => { throw err; }));
            await modifyRecord(updateLocationPoint, lat, long, locationId).then(function(message) {
                console.log(message); //test
            }).catch((err) => setImmediate(() => { throw err; }));

        })();
    }

    database.query("DELETE FROM food WHERE foodbank_id = ?", [foodbank_id], (err, rows) => {
        if (err) {
            console.log(err);
        }
    });

    for (var i = 0; i < food_name.length; i++) {
        database.query("INSERT INTO food SET foodbank_id = ?, food_name = ?, food_category = ?, food_quantity = ?", [foodbank_id, food_name[i], food_category[i], food_quantity[i]], (err, rows) => {
            if (err) {
                console.log(err);
            }
        });
    }

    database.query("UPDATE foodbank SET foodbank_name = ?, foodbank_food_halal = ?, foodbank_contact = ?, foodbank_open_time = ?, foodbank_close_time = ? WHERE foodbank_id = ?", [foodbank_name, food_type, phone, open_time, close_time, foodbank_id], (err, rows) => {
        if (!err) {
            res.json({ status: "Success" });
        } else {
            console.log(err);
        }
    });

};

//Post - delete food bank
exports.deleteFoodBank = (req, res) => {
    var foodbank_id = req.body.foodBankID;
    database.query("SELECT foodbank_name, owner_id FROM foodbank WHERE foodbank_id = ?", [foodbank_id], (err, rows) => {
        var foodbank_name, owner_id;
        if (!err) {
            foodbank_name = rows[0].foodbank_name;
            owner_id = rows[0].owner_id;
            database.query("DELETE FROM location WHERE location_id IN (SELECT location_id FROM foodbank WHERE foodbank_id = ?)", [foodbank_id], (err, rows) => {
                if (err) {
                    console.log(err);
                }
            });
            database.query("DELETE FROM food WHERE foodbank_id = ?", [foodbank_id], (err, rows) => {
                if (err) {
                    console.log(err);
                }
            });
            database.query("DELETE FROM foodbank WHERE foodbank_id = ?", [foodbank_id], (err, rows) => {
                if (!err) {
                    res.json({ foodbank_name: foodbank_name });
                    // Check whether the owner of deleted food bank still own food bank
                    // If no food bank found, the user id is deleted from Owner table
                    database.query("SELECT COUNT(*) AS count FROM foodbank WHERE owner_id = ?", [owner_id], (err, rows) => {
                        if (!err) {
                            if (rows[0].count == 0) {
                                database.query("DELETE FROM owner WHERE owner_id = ?", [owner_id], (err, rows) => {
                                    if (err) {
                                        console.log(err);
                                    }
                                });
                            }
                        } else {
                            console.log(err);
                        }
                    });
                }
            });
        } else {
            console.log(err);
        }
    });
};
/*
//Post - add food bank
exports.addFB = async(req, res) => {
    var locationId;
    var fullAddress = req.body.newAddress;
    var lat = Number(req.body.newLat);
    var long = Number(req.body.newLong);
    const { foodbank_name, phone, open_time, close_time, halal } = req.body;
    var food_type;

    if (halal) {
        food_type = "Y";
    } else {
        food_type = "N";
    }

    var insertAddress = `INSERT INTO location(location_id, location_address) VALUES (NULL, ?);`;
    var updateLocationPoint = "UPDATE location SET location_point = ST_GeomFromText('POINT(? ?)') WHERE location_id = ?;";
    var selectLocationId = "SELECT location_id FROM location ORDER BY location_id DESC limit 1;";
    var insertRequest = `INSERT INTO request(request_id, user_id, location_id, request_name, request_food_halal, request_contact, request_open_time, request_close_time, request_date_time) VALUES (NULL, ?, ?, ?,?,?,?,?,CURRENT_TIMESTAMP);`;

    (async() => {

        database.query(insertAddress, [fullAddress], (err, rows) => {
            console.log("One row inserted");
        });

        await getRecord(selectLocationId).then(function(message) {
            var resultArray = Object.values(JSON.parse(JSON.stringify(message)))
            console.log(resultArray[0].location_id); //test
            locationId = resultArray[0].location_id;
        }).catch((err) => setImmediate(() => { throw err; }));

        await modifyRecord(updateLocationPoint, lat, long, locationId).then(function(message) {
            console.log(message); //test
        }).catch((err) => setImmediate(() => { throw err; }));

        database.query(insertRequest, [req.session.actorid, locationId, foodbank_name, food_type, phone, open_time, close_time], (err, rows) => {
            if (err) {
                console.log(err);
            } else {
                res.json({ status: "Success" });
            }
        });

    })();
};
*/
//Post - add food bank
exports.addFB = async(req, res) => {
    console.log("COME");
    var locationId;
    var fullAddress = req.body.newAddress;
    var lat = Number(req.body.newLat);
    var long = Number(req.body.newLong);
    const { foodbank_name, phone, open_time, close_time, halal } = req.body;
    var food_type;

    if (halal) {
        food_type = "Y";
    } else {
        food_type = "N";
    }

    var insertAddress = `INSERT INTO location(location_id, location_address) VALUES (NULL, ?);`;
    var updateLocationPoint = "UPDATE location SET location_point = ST_GeomFromText('POINT(? ?)') WHERE location_id = ?;";
    var selectLocationId = "SELECT location_id FROM location ORDER BY location_id DESC limit 1;";
    var insertRequest = `INSERT INTO request(request_id, user_id, location_id, request_name, request_food_halal, request_contact, request_open_time, request_close_time, request_date_time) VALUES (NULL, ?, ?, ?,?,?,?,?,CURRENT_TIMESTAMP);`;
    var insertNotification = `INSERT INTO notification(notification_id, user_id, notification_message, notification_date_time) VALUES (NULL, ?, "Your Food Bank Request has been sent successfully.",CURRENT_TIMESTAMP);`;

    (async() => {

        database.query(insertAddress, [fullAddress], (err, rows) => {
            console.log("One row inserted");
        });

        await getRecord(selectLocationId).then(function(message) {
            var resultArray = Object.values(JSON.parse(JSON.stringify(message)))
            console.log(resultArray[0].location_id); //test
            locationId = resultArray[0].location_id;
        }).catch((err) => setImmediate(() => { throw err; }));

        await modifyRecord(updateLocationPoint, lat, long, locationId).then(function(message) {
            console.log(message); //test
        }).catch((err) => setImmediate(() => { throw err; }));

        database.query(insertRequest, [req.session.actorid, locationId, foodbank_name, food_type, phone, open_time, close_time], (err, rows) => {
            if (err) {
                console.log(err);
            } else {
                console.log("done");
            }
        });
        database.query(insertNotification, [req.session.actorid], (err, rows) => {
            if (err) {
                console.log(err);
            } else {
                console.log("notification sent");
            }
        });

        var set1 = await getSpecific("SELECT * FROM notification WHERE user_id = ? ORDER BY notification_date_time DESC;", req.session.actorid); //testing
        var set4 = await getSpecific("SELECT * FROM user WHERE user_id = ?", req.session.actorid);
        var date = [];
        var time = [];
        for (const item of set1) {
            var timestamp = item.notification_date_time;
            var dt = new Date(timestamp);
            date.push(dt.getDate() + "/" + (dt.getMonth() + 1) + "/" + dt.getFullYear());
            time.push(dt.toLocaleString('en-US', { hour: 'numeric', minute: 'numeric', hour12: true }));
        }
        if (!req.session.actorid) {
            return res.status(401).send();
        } else {
            res.render("notification", { set1, set4, date, time });
        }

    })();
};


//Other
exports.retrieveOwn = async(owner_id, req, res) => {
    var foodbank_arr = await getSpecific("SELECT foodbank_id, location_id, foodbank_name, foodbank_food_halal, RIGHT(foodbank_contact, LENGTH(foodbank_contact) - 2) AS contact, DATE_FORMAT(foodbank_open_time,'%h:%i%p') AS open_time, DATE_FORMAT(foodbank_close_time,'%h:%i%p') AS close_time FROM foodbank WHERE owner_id = ?", owner_id);
    var location_arr = await getResult("SELECT location_id, location_address FROM location");
    var food_arr = await getResult("SELECT * FROM food");
    res.render("myFoodBank", { foodbank_arr, location_arr, food_arr, notFound: false });
};


//Functions

function modifyRecord(query, item1, item2, item3) {
    return new Promise(function(resolve, reject) {
        database.query(query, [item1, item2, item3], function(err, rows, fields) {
            if (err) { return reject(err); }
            resolve("One record modified");
        });
    });
}

function getRecord(query, item) {
    return new Promise(function(resolve, reject) {
        database.query(query, [item], function(err, rows, fields) {
            if (err) { return reject(err); }
            resolve(rows);
        });
    });
}

function getOwner(actorid, callback) {
    database.query("SELECT owner_id FROM owner WHERE user_id = ?", [actorid], (err, rows) => {

        if (err) {
            callback(err, null);
        }

        if (rows.length > 0) {
            console.log("This user is food bank owner.");
            callback(null, rows);
        } else
            callback(null, null);
    });
}

function getResult(sql) {
    return new Promise((res, rej) => {
        database.query(sql, (err, result) => {
            if (err) {
                rej(err);
            } else {
                res(result);
            }
        });
    });
}

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

function getSpecific2(sql, value, value2) {
    return new Promise((res, rej) => {
        database.query(sql, [value, value2], (err, result) => {
            if (err) {
                rej(err);
            } else {
                res(result);
            }
        });
    });
}

function getFiltered(sql, food_type, food_category) {
    return new Promise((res, rej) => {
        pool.query(sql, [food_type, food_category], (err, result) => {
            if (err) {
                rej(err);
            } else {
                res(result);
            }
        });
    });
}