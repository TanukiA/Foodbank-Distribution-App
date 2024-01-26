"Use Strict"

var mysql = require('mysql2');
require('dotenv').config();

//Database - mysql
const database = mysql.createPool({
    host: process.env.DB_HOST,
    database: process.env.DB_NAME,
    user: process.env.DB_USER,
    password: process.env.DB_PASS,
    connectionLimit: 100
})

//Get
exports.browse = async(req, res) => {
    if (!req.session.actorid) {
        return res.status(401).send();
    } else {
        var set1 = await getResult("SELECT foodbank_id, location_id, owner_id, foodbank_name, foodbank_food_halal, foodbank_contact AS contact, DATE_FORMAT(foodbank_open_time,'%h:%i%p') AS open_time, DATE_FORMAT(foodbank_close_time,'%h:%i%p') AS close_time FROM foodbank");
        var set2 = await getResult("SELECT location_id, location_address FROM location");
        var set3 = await getResult("SELECT * FROM food");
        var coordinate = await getResult("SELECT location_id, ST_astext(location_point) FROM location;");
        res.render("adminBrowse", { set1, set2, set3, coordinate });
    }

};
exports.viewUserlist = async(req, res) => {
    if (!req.session.actorid) {
        return res.status(401).send();
    } else {
        var data = await getResult("SELECT * FROM user;");
        res.render("userlist", { data })
    }

}
exports.viewRequest = async(req, res) => {
    if (!req.session.actorid) {
        return res.status(401).send();
    } else {
        var data1 = await getResult("SELECT * FROM request;");
        var data2 = await getResult("SELECT * FROM user;");
        var data3 = await getResult("SELECT * FROM location;");
        res.render("request", { data1, data2, data3 })
    }
}
exports.adminHome = (req, res) => { //view admin home page
    if (!req.session.actorid) {
        return res.status(401).send();
    } else {
        res.render('adminHome');
    }
};

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
        set1 = await getSpecific("SELECT foodbank_id, location_id, owner_id, foodbank_name, foodbank_food_halal, RIGHT(foodbank_contact, LENGTH(foodbank_contact) - 2) AS contact, DATE_FORMAT(foodbank_open_time,'%h:%i%p') AS open_time, DATE_FORMAT(foodbank_close_time,'%h:%i%p') AS close_time FROM foodbank" +
            cont_query, food_type, food_category);

    } else if ((sort == "all") && (food_type == "all")) {
        cont_query = " WHERE foodbank_id IN (SELECT foodbank_id FROM food WHERE food_category IN (?))";
        set1 = await getSpecific("SELECT foodbank_id, location_id, owner_id, foodbank_name, foodbank_food_halal, RIGHT(foodbank_contact, LENGTH(foodbank_contact) - 2) AS contact, DATE_FORMAT(foodbank_open_time,'%h:%i%p') AS open_time, DATE_FORMAT(foodbank_close_time,'%h:%i%p') AS close_time FROM foodbank" +
            cont_query, food_category);
    }

    var set2 = await getResult("SELECT location_id, location_address FROM location");
    var set3 = await getResult("SELECT * FROM food");
    var coordinate = await getResult("SELECT location_id, ST_astext(location_point) FROM location;");
    res.render("adminBrowse", { set1, set2, set3, coordinate });
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
                                pool.query("DELETE FROM owner WHERE owner_id = ?", [owner_id], (err, rows) => {
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

//Post - delete user
exports.deleteUser = (req, res) => {

    const { user_id } = req.body;

    for (var i = 0; i < user_id.length; i++) {

        database.query("SELECT location_id FROM user WHERE user_id = ?", [user_id[i]], (err, rows) => {

            var location_id;
            if (!err) {

                location_id = rows[0].location_id;

                database.query("DELETE FROM location WHERE location_id = ?", [location_id], (err, rows) => {
                    if (err) {
                        console.log(err);
                    }
                });

                database.query("DELETE FROM owner WHERE user_id = ?", [user_id[i]], (err, rows) => {
                    if (err) {
                        console.log(err);
                    }
                });

                database.query("DELETE FROM user WHERE user_id = ?", [user_id[i]], (err, rows) => {
                    if (err) {
                        console.log(err);
                    }
                });

            } else {
                console.log(err);
            }
        });
    }

    res.json({ length: user_id.length });
};

//Post - approve request
/* NO LOCATION POINT & FOOD LIST IS ADDED*/
exports.approveRequest = async(req, res) => {
    const { request_id } = req.body;

    database.query("SELECT * FROM request WHERE request_id = ?", [request_id], (err, rows) => {

        (async() => {
            var user_id, request_location_id, request_name, request_food_halal, request_contact, request_open_time, request_close_time;
            var ownerId;
            if (!err) {
                user_id = rows[0].user_id;
                request_location_id = rows[0].location_id;
                request_name = rows[0].request_name;
                request_food_halal = rows[0].request_food_halal;
                request_contact = rows[0].request_contact;
                request_open_time = rows[0].request_open_time;
                request_close_time = rows[0].request_close_time;

                await getSpecific("SELECT COUNT(*) AS count FROM owner WHERE user_id = ?", user_id).then(async function(message) {
                    if (message[0].count == 0) {
                        database.query("INSERT INTO owner(owner_id, user_id) VALUES(NULL,?)", [user_id], (err, rows) => {
                            if (err) {
                                console.log(err)
                            } else {
                                console.log("New owner inserted"); //test
                            }
                        });
                    }
                    await getSpecific("SELECT owner_id FROM owner WHERE user_id = ?", user_id).then(function(msg) {
                        var resultArray = Object.values(JSON.parse(JSON.stringify(msg)))
                        console.log(resultArray[0]); //test
                        console.log(resultArray[0].owner_id); //test
                        ownerId = resultArray[0].owner_id;
                        console.log("Owner_id is " + ownerId); //test
                    }).catch((err) => setImmediate(() => { throw err; }));

                    database.query(`INSERT INTO foodbank(foodbank_id, location_id, owner_id, foodbank_name, foodbank_food_halal, foodbank_contact, foodbank_open_time, foodbank_close_time) VALUES (NULL, ?, ?, ?,?,?,?,?);`, [request_location_id, ownerId, request_name, request_food_halal, request_contact, request_open_time, request_close_time], (err, rows) => {
                        if (err) {
                            console.log(err)
                        } else {
                            console.log("Foodbank inserted"); //test
                        }
                    });
                }).catch((err) => setImmediate(() => { throw err; }));

                database.query(`INSERT INTO notification(notification_id, user_id, notification_message, notification_date_time) VALUES(NULL,?,'Foodbank created successfully',CURRENT_TIMESTAMP)`, [user_id], (err, rows) => {
                    if (err) {
                        console.log(err);
                    } else {
                        console.log("Notification Inserted");
                    }
                });

                database.query("DELETE FROM request WHERE request_id = ?", [request_id], (err, rows) => {
                    if (err) {
                        console.log(err);
                    }
                });

                await getSpecific(`SELECT AsText(location_point) FROM location WHERE location_id = ? `, request_location_id).then(function(msg) {
                    var resultArray = Object.values(JSON.parse(JSON.stringify(msg)))
                    console.log(resultArray[0]); //test
                    console.log(resultArray[0]['AsText(location_point)']); //test
                    var point = resultArray[0]['AsText(location_point)'];
                    console.log("point is " + point); //test
                    var temp = point.trim().substring(6).slice(0, -1).split(" ");
                    console.log(temp);
                    calDistance(temp[0], temp[1], request_name);
                }).catch((err) => setImmediate(() => { throw err; }));


            } else {
                console.log(err);
            }
        })();

        res.json({ status: "Success" });
    });
};

//Post - decline request
exports.declineRequest = async(req, res) => {
    const { request_id } = req.body;
    database.query("SELECT user_id FROM request WHERE request_id = ?", [request_id], (err, rows) => {
        if (!err) {

            database.query("DELETE FROM request WHERE request_id = ?", [request_id], (err, rows) => {
                if (err) {
                    console.log(err);
                }
            });

            database.query(`INSERT INTO notification(notification_id, user_id, notification_message, notification_date_time) VALUES(NULL,?,'Your foodbank has been decline by the administrator for some reason.',CURRENT_TIMESTAMP)`, [rows[0].user_id], (err, rows) => {
                if (err) {
                    console.log(err);
                }
            });

            res.json({ status: "Success" });

        } else {
            console.log(err);
        }
    });
};

//generate report
exports.report = async (req,res) => {
    var foodbank = await getResult("SELECT foodbank_id,foodbank_name, location_id, foodbank_contact, foodbank_open_time, foodbank_close_time, foodbank_food_halal FROM foodbank;");
    console.log(foodbank);
    var locationId=[];
    var foodbankId=[];
    var openTime = [];
    var closeTime = [];
    try{
        for(let i =0; i < foodbank.length; i++){
            locationId.push(foodbank[i].location_id);
            foodbankId.push(foodbank[i].foodbank_id);
            var ot = foodbank[i].foodbank_open_time.slice(3,8);
            openTime.push(ot);
            var ct = foodbank[i].foodbank_close_time.slice(3,8);
            closeTime.push(ct);
        }
        locationId.join();
        foodbankId.join();
    }catch(err){
        console.log(err);
    }

    var location = await getSpecific("SELECT location_address from location WHERE location_id in (?)", locationId);
    console.log(location);
  
    var food= [];
    
    
    try{
        console.log("foodbank length = " + foodbank.length);
        
        for(let i =0; i< foodbank.length+1;i++){
            await getSpecific("SELECT food_name, food_category, food_quantity from food WHERE foodbank_id =?",foodbank[i].foodbank_id)
            .then(function(result) {
                var resultArray = Object.values(JSON.parse(JSON.stringify(result)));
                food.push(resultArray);
                
            })
        }
        
        
    }catch(err){
        console.log(err); 
    }

    console.log(food);
   

    res.render("report",{foodbank,location,food,openTime,closeTime});
}


//Functions

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

function getFiltered(sql, food_type, food_category) {
    return new Promise((res, rej) => {
        database.query(sql, [food_type, food_category], (err, result) => {
            if (err) {
                rej(err);
            } else {
                res(result);
            }
        });
    });
}

async function calDistance(lat, long, fbName) {
    var userAddressArray = [];
    var locationDetailsArray = [];
    var checkArray = [];
    var finalResult = [];
    var kmArray = [];

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
        if (distance > 0 && distance <= 3) {
            for (const user of userAddressArray) {
                if (user.location_id === checkThis.location_id) {
                    finalResult.push(user.user_id);
                    kmArray.push(Math.round((distance + Number.EPSILON) * 100) / 100);
                }
            }
        }
    }
    console.log("final: " + finalResult); //test

    var query = `INSERT INTO notification (notification_id, user_id, notification_message, notification_date_time) VALUES (NULL, ?, "There is a new food bank named '?' added ?km from you!", CURRENT_TIMESTAMP);`;

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
        await insertRecord(query, Number(finalResult[i]), fbName, kmArray[i]).then(function(rows) {
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