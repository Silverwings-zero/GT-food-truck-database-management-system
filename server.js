const express = require('express');
const mysql = require('mysql');
const fs = require('fs')


const app = express();

const connection = mysql.createConnection({
    // connection properties
    host: 'localhost',
    user: 'root',
    password: '19991212',
    database: 'cs4400spring2020'
});

app.set('view engine', 'ejs');

app.get('/', (req, resp) => {
    resp.render('index');
});

var user_name;
var user_type;

app.use(express.urlencoded({ extended: true }));

// LOGIN page
app.post('/login', (req, resp) => {
    var username = req.body.username;
    var password = req.body.password;
    connection.query("CALL login(?, ?)", [username, password]);
    connection.query("SELECT * FROM login_result", (err, res) => {
        if (res.length == 0) {
            return resp.render('index', {error: "Incorrect combination"});
        }
        user_name = res[0].username;
        user_type = res[0].userType;
        return resp.render('home');
    });
});

app.post('/toregister', (req, resp) => {
    return resp.render('register');
});

// REGISTER page
app.post('/backtoindex',(req, resp) => {
    return resp.redirect('/');
});

app.post('/register', (req, resp) => {
    var username = req.body.username;
    var fname = req.body.fname;
    var lname = req.body.lname;
    var password = req.body.password;
    var balance = req.body.balance;
    if (req.body.balance == '') {
        balance = null;
    }
    var email = req.body.email;
    if (req.body.email == undefined) {
        email = null;
    }
    var position = req.body.position;
    if (req.body.position == undefined) {
        position = null;
    }
    connection.query("CALL register(?, ?, ?, ?, ?, ?, ?)", [username, email, fname, lname, password, balance, position], (err, res) => {
        if (res.affectedRows == 0) {
            resp.render('register');
        } else {
            // user_name = username;
            // user_type = position;
            connection.query("CALL login(?, ?)", [username, password]);
            connection.query("SELECT * FROM login_result", (err, res) => {
                if (res.length == 0) {
                    return resp.render('index', {error: "Incorrect combination"});
                }
                user_name = res[0].username;
                user_type = res[0].userType;
                resp.render('home');
            });
            // resp.render('home');
        }
    });

});

// HOME page
app.post('/toexplore', (req, resp) => {
    if (user_type == "Admin" || user_type == "Manager" || user_type == "Staff") {
        return resp.render('home');
    } else {
        var stationName = [null];
        var buildingName = [null];
        connection.query("SELECT DISTINCT stationName, Building.buildingName FROM Station RIGHT JOIN Building ON Station.buildingName = Building.buildingName;", (err, res) => {
            for (let i = 0; i < res.length; i++) {
                if (res[i].stationName != null) {
                    stationName.push(res[i].stationName);
                }
                if (res[i].buildingName != null) {
                    buildingName.push(res[i].buildingName);
                }
            }  
            resp.render('explore', {
                buildingName: JSON.stringify(buildingName),
                stationName: JSON.stringify(stationName),
                array: JSON.stringify([])
            });
        });
    }
});

app.post('/selectCurrLocation', (req, resp) => {
    var stationName = req.body.selected;
    console.log(stationName);
    connection.query("CALL cus_select_location(?,?)", [user_name, stationName]);
    resp.render('home');
})

app.post('/explore', (req, resp) => {
    var buildingName = req.body.bname;
    var buildingTag = req.body.btag;
    var stationName = req.body.sname;
    var ftname1 = req.body.ftname;
    if (req.body.ftname == '') {
        ftname1 = null;
    }
    var food1 = req.body.food;
    if (req.body.food == '') {
        food1 = null;
    } 
    connection.query("CALL cus_filter_explore(?, ?, ?, ?, ?)", [buildingName, stationName, buildingTag, ftname1, food1]);
    connection.query("SELECT * FROM cus_filter_explore_result;", (err, res) => {
        var myArray = []
        for (let i = 0; i < res.length; i++) {    
            myArray.push({
                bname: res[i].buildingName,
                sname: res[i].stationName,
                foodtrucks: res[i].foodTruckNames,
                foods: res[i].foodNames
            });
        }
        var stationName = [null];
        var buildingName = [null];
        connection.query("SELECT DISTINCT stationName, Building.buildingName FROM Station RIGHT JOIN Building ON Station.buildingName = Building.buildingName;", (err, res) => {
            for (let i = 0; i < res.length; i++) {
                if (res[i].stationName != null) {
                    stationName.push(res[i].stationName);
                }
                if (res[i].buildingName != null) {
                    buildingName.push(res[i].buildingName);
                }
            }  
            resp.render('explore', {
                buildingName: JSON.stringify(buildingName),
                stationName: JSON.stringify(stationName),
                array: JSON.stringify(myArray)
            });
        });
    });
});

app.post('/deleteBuilding', (req, resp) => {
    var buildingName = req.body.selectedbd;
    connection.query("CALL ad_delete_building(?)", [buildingName]);
    var stationName = [null];
    var buildingName = [null];
    connection.query("SELECT DISTINCT stationName, Building.buildingName FROM Station RIGHT JOIN Building ON Station.buildingName = Building.buildingName;", (err, res) => {
        for (let i = 0; i < res.length; i++) {
            if (res[i].stationName != null) {
                stationName.push(res[i].stationName);
            }
            if (res[i].buildingName != null) {
                buildingName.push(res[i].buildingName);
            }
        }  
        resp.render('buildingANDstation', {
            buildingName: JSON.stringify(buildingName),
            stationName: JSON.stringify(stationName),
            array: JSON.stringify([])
        });
    });
});

app.post('/deleteStation', (req, resp) => {
    var sname;
    connection.query("SELECT * FROM Station;", (err, res) => {
        for (let i = 0; i < res.length; i++) {
            if (res[i].buildingName == req.body.sel_bname) {
                sname = res[i].stationName;
            }
        }
        if (sname != undefined) {
            connection.query("CALL ad_delete_station(?)", [sname]);
        }
    });
    var stationName = [null];
    var buildingName = [null];
    connection.query("SELECT DISTINCT stationName, Building.buildingName FROM Station RIGHT JOIN Building ON Station.buildingName = Building.buildingName;", (err, res) => {
        for (let i = 0; i < res.length; i++) {
            if (res[i].stationName != null) {
                stationName.push(res[i].stationName);
            }
            if (res[i].buildingName != null) {
                buildingName.push(res[i].buildingName);
            }
        }  
        resp.render('buildingANDstation', {
            buildingName: JSON.stringify(buildingName),
            stationName: JSON.stringify(stationName),
            array: JSON.stringify([])
        });
    });
});

app.post('/viewOrderHistory', (req, resp) => {
    if (user_type == "Admin" || user_type == "Manager" || user_type == "Staff") {
        return resp.render('home');
    } else {
        connection.query("CALL cus_order_history(?)", [user_name], (err, res) => {
            connection.query("SELECT * FROM cus_order_history_result;", (err, res) => {
                var array = [];
                if (res != null) {
                    for (let i = 0; i < res.length; i++) {
                        array.push({
                            date: res[i].date,
                            orderID: res[i].orderID,
                            orderTotal: res[i].orderTotal,
                            orderFood: res[i].foodNames,
                            orderQuantity: res[i].foodQuantity 
                        })
                    }
                }
                resp.render('viewOrderHistory', {
                    array: JSON.stringify(array)
                })
            });
        });
    }
});

app.post('/viewCurrentInformation', (req, resp) => {
    if (user_type == "Admin" || user_type == "Manager" || user_type == "Staff") {
        return resp.render('home');
    }
    var s_name;
    var b_name;
    var tags;
    var des;
    var balance;
    connection.query("CALL cus_current_information_basic(?)", user_name);
    connection.query("SELECT * FROM cus_current_information_basic_result;", (err, res) => {
        s_name = res[0].stationName;
        b_name = res[0].buildingName;
        tags = res[0].tags;
        des = res[0].description;
        balance = res[0].balance;
    });
    connection.query("CALL cus_current_information_foodTruck(?)", user_name);
    connection.query("SELECT * FROM cus_current_information_foodTruck_result;", (err, res) => {
        var table = [];
        for (let i = 0; i < res.length; i++) {
            table.push({
                foodTruckName: res[i].foodTruckName,
                managerName: res[i].managerName,
                foodNames: res[i].foodNames
            });
        }
        resp.render('currentInfo', {
            s_name: s_name,
            b_name: b_name,
            tags: tags,
            des: des,
            balance: balance,
            table: JSON.stringify(table)
        })
    });
});

app.post("/toCustomerOrder", (req, resp) => {
    var ft_name = req.body.selected;
    var table = [];
    connection.query("SELECT MenuItem.foodName, MenuItem.price FROM MenuItem where MenuItem.foodtruckname = (?);", ft_name, (err, res) => {
        for (let i = 0; i < res.length; i++) {
            table.push({
                foodName: res[i].foodName,
                price: res[i].price
            });
        }
        resp.render('customerOrder', {
            ft_name: ft_name,
            table: JSON.stringify(table)
        });
    });
});

app.post("/customerOrder", (req, resp) => {
    var date = req.body.date;
    var ft_name = req.body.foodtruck_name;
    var foods = [];
    var temp_quantity = [];
    if (typeof req.body.food === 'string') {
        foods.push(req.body.food);
    } else {
        foods = req.body.food;
    }
    if (typeof req.body.purchaseQuantity === 'string') {
        temp_quantity.push(req.body.purchaseQuantity);
    } else {
        temp_quantity = req.body.purchaseQuantity;
    }
    var quantity = [];
    var orderID;
    for (let i = 0; i < temp_quantity.length; i++) {
        if (temp_quantity[i] != "") {
            quantity.push(temp_quantity[i]);
        }
    }
    connection.query("CALL cus_order(?, ?)", [date, user_name], (err, res) => {
        connection.query("SELECT max(orderID) as oid FROM Orders WHERE customerUsername = (?)", user_name, (err, res) => {
            orderID = res[0].oid;
            for (let i = 0; i < foods.length; i++) {
                console.log("NUM: " + i);
                console.log("FTN: " + ft_name);
                console.log("FOOD: " + foods[i]);
                console.log("QUANTITY: " + quantity[i]);
                console.log("OID: " + orderID);
                connection.query("CALL cus_add_item_to_order(?, ?, ?, ?)", [ft_name, foods[i], quantity[i], orderID]);
            }
            resp.render('home');
        });
    });
});

app.post('/manageFoodTruck', (req, resp) => {
    if (user_type != "Manager" && user_type != "Manager-Customer") {
        return resp.render('home');
    }
    var station_list = [null];
    connection.query("SELECT DISTINCT Station.stationName FROM Station INNER JOIN FoodTruck ON Station.stationName = FoodTruck.stationName WHERE FoodTruck.managerUsername = (?);", user_name, (err, res) => {
        for (let i = 0; i < res.length; i++) {
            station_list.push(res[i].stationName);
        } 
        resp.render('manageFoodTruck', {
            station_list: JSON.stringify(station_list),
            table: JSON.stringify([])
        });
    });
});

app.post('/manageFoodTruckFilter', (req, resp) => {
    if (user_type != "Manager") {
        return resp.render('home');
    }

    var ft_name = req.body.food_truck_name;
    var station_name = req.body.station_name;
    var min_sc = req.body.staff_low;
    var max_sc = req.body.staff_high;
    if (req.body.staff_low == '') {
        min_sc = null;
    }
    if (req.body.staff_high == '') {
        max_sc = null;
    }
    var has_rc;
    if (req.body.has_remaining_cap == 'on') {
        has_rc = 1;
    } else {
        has_rc = 0;
    }

    var station_list = [null];
    connection.query("SELECT DISTINCT Station.stationName FROM Station INNER JOIN FoodTruck ON Station.stationName = FoodTruck.stationName WHERE FoodTruck.managerUsername = (?);", user_name, (err, res) => {
        for (let i = 0; i < res.length; i++) {
            station_list.push(res[i].stationName);
        } 
    });
    connection.query("CALL mn_filter_foodTruck(?, ?, ?, ?, ?, ?)", [user_name, ft_name, station_name, min_sc, max_sc, has_rc]);
    connection.query("SELECT * FROM mn_filter_foodTruck_result", (err, res) => {
        var table = [];
        for (let i = 0; i < res.length; i++) {
            table.push({
                foodTruckName: res[i].foodTruckName,
                stationName: res[i].stationName,
                remainingCapacity: res[i].remainingCapacity,
                staffCount: res[i].staffCount,
                menuItemCount: res[i].menuItemCount
            });
        }
        resp.render('manageFoodTruck', {
            station_list: JSON.stringify(station_list),
            table: JSON.stringify(table)
        })
    });
});

app.post('/deleteFoodTruck', (req, resp) => {
    var victim = req.body.selected2;
    var station_list = [];
    connection.query("SELECT DISTINCT Station.stationName FROM Station INNER JOIN FoodTruck ON Station.stationName = FoodTruck.stationName WHERE FoodTruck.managerUsername = (?);", user_name, (err, res) => {
        for (let i = 0; i < res.length; i++) {
            station_list.push(res[i].stationName);
        }
    });
    connection.query("CALL mn_delete_foodTruck(?)", victim);
    connection.query("SELECT * FROM mn_filter_foodTruck_result", (err, res) => {
        var table = [];
        for (let i = 0; i < res.length; i++) {
            if (res[i].foodTruckName != victim) {
                table.push({
                    foodTruckName: res[i].foodTruckName,
                    stationName: res[i].stationName,
                    remainingCapacity: res[i].remainingCapacity,
                    staffCount: res[i].staffCount,
                    menuItemCount: res[i].menuItemCount
                });
            }
        }
        resp.render('manageFoodTruck', {
            station_list: JSON.stringify(station_list),
            table: JSON.stringify(table)
        })
    });
});

app.post('/viewFoodTruckSummary', (req, resp) => {
    if (user_type != "Manager" && user_type != "Manager-Customer") {
        return resp.render('home');
    }
    var station_list = [null];
    connection.query("SELECT DISTINCT(stationName) FROM FoodTruck WHERE managerUsername = (?);", user_name, (err, res) => {
        for (let i = 0; i < res.length; i++) {
            station_list.push(res[i].stationName);
        } 
        resp.render('foodTruckSummary', {
            station_list: JSON.stringify(station_list),
            table: JSON.stringify([])
        });
    });
});

app.post('/viewFoodTruckSummaryFilter', (req, resp) => {
    if (user_type != "Manager") {
        return resp.render('home');
    }

    var ft_name = req.body.food_truck_name;
    var station_name = req.body.station_name;
    var min_date = req.body.start_date;
    var max_date = req.body.end_date;
    var sorted_by = req.body.sortedby;
    var sorted_direction = req.body.direction;

    if (req.body.start_date == '') {
        min_date = null;
    }
    if (req.body.end_date == '') {
        max_date = null;
    }
    if (req.body.sortedby == undefined) {
        sorted_by = null;
    }
    if (req.body.direction == undefined) {
        sorted_direction = null;
    }

    var station_list = [null];
    connection.query("SELECT DISTINCT(stationName) FROM FoodTruck WHERE managerUsername = (?);", user_name, (err, res) => {
        for (let i = 0; i < res.length; i++) {
            station_list.push(res[i].stationName);
        }
    });
    connection.query("CALL mn_filter_summary(?, ?, ?, ?, ?, ?, ?)", [user_name, ft_name, station_name, min_date, max_date, sorted_by, sorted_direction]);
    connection.query("SELECT * FROM mn_filter_summary_result", (err, res) => {
        var table = [];
        for (let i = 0; i < res.length; i++) {
            table.push({
                foodTruckName: res[i].foodTruckName,
                totalOrder: res[i].totalOrder,
                totalRevenue: res[i].totalRevenue,
                totalCustomer: res[i].totalCustomer
            });
        }
        resp.render('foodTruckSummary', {
            station_list: JSON.stringify(station_list),
            table: JSON.stringify(table)
        })
    });
});

app.post('/viewSummaryDetail', (req, resp) => {
    if (user_type != "Manager") {
        return resp.render('home');
    }

    var ft_name = req.body.selected;
    connection.query("CALL mn_summary_detail(?, ?)", [user_name, ft_name]);
    connection.query("SELECT * FROM mn_summary_detail_result", (err, res) => {
        var table = [];
        for (let i = 0; i < res.length; i++) {
            table.push({
                date: res[i].date,
                customerName: res[i].customerName,
                totalPurchase: res[i].totalPurchase,
                orderCount: res[i].orderCount,
                foodNames: res[i].foodNames
            });
        }
        resp.render('summaryDetail', {
            ft_name: ft_name,
            table: JSON.stringify(table)
        })
    });
});

// Render building name and station name drop down
app.post('/manageBuildingAndStation', (req, resp) => {
    if (user_type == "Admin" || user_type == "Admin-Customer") {
        var stationName = [null];
        var buildingName = [null];
        connection.query("SELECT DISTINCT stationName, Building.buildingName FROM Station RIGHT JOIN Building ON Station.buildingName = Building.buildingName;", (err, res) => {
            for (let i = 0; i < res.length; i++) {
                if (res[i].stationName != null) {
                    stationName.push(res[i].stationName);
                }
                if (res[i].buildingName != null) {
                    buildingName.push(res[i].buildingName);
                }
            }  
            resp.render('buildingANDstation', {
                buildingName: JSON.stringify(buildingName),
                stationName: JSON.stringify(stationName),
                array: JSON.stringify([])
            });
        });
    } else {
        return resp.render('home');
    }
});

app.post('/manageFood', (req, resp) => {
    if (user_type == "Admin" || user_type == "Admin-Customer") {
        var foodName = [null];
        connection.query("SELECT DISTINCT foodName FROM Food;", (err, res) => {
            for (let i = 0; i < res.length; i++) {
                if (res[i].foodName != null) {
                    foodName.push(res[i].foodName);
                }
            }
            resp.render('manageFood', {
                foodName: JSON.stringify(foodName),
                table: JSON.stringify([])
            });
        });
    } else {
        return resp.render('home');
    }
});

app.post('/backtomanageFood', (req, resp) => {
    if (user_type == "Admin" || user_type == "Admin-Customer") {
        var foodName = [null];
        connection.query("SELECT DISTINCT foodName FROM Food;", (err, res) => {
            for (let i = 0; i < res.length; i++) {
                if (res[i].foodName != null) {
                    foodName.push(res[i].foodName);
                }
            }
            resp.render('manageFood', {
                foodName: JSON.stringify(foodName),
                table: JSON.stringify([])
            });
        });
    } else {
        return resp.render('home');
    }
});

app.post('/filterFood', (req, resp) => {
    if (user_type == "Admin" || user_type == "Admin-Customer") {
        var foodName = [null];
        var name = req.body.foodName;
        var sortedby = req.body.sortedby;
        if (req.body.sortedby == undefined) {
            sortedby = null;
        }
        var direction = req.body.direction;
        if (req.body.direction == undefined) {
            direction = null;
        }        
        connection.query("SELECT DISTINCT foodName FROM Food;", (err, res) => {
            for (let i = 0; i < res.length; i++) {
                if (res[i].foodName != null) {
                    foodName.push(res[i].foodName);
                }
            }
        });
        connection.query("CALL ad_filter_food(?, ?, ?)", [name, sortedby, direction]);
        connection.query("SELECT * FROM ad_filter_food_result", (err, res) => {
            var table = [];
            for (let i = 0; i < res.length; i++) {
                table.push({
                    foodName: res[i].foodName,
                    menuCount: res[i].menuCount,
                    purchaseCount: res[i].purchaseCount,
                });
            }
            resp.render('manageFood', {
                foodName: JSON.stringify(foodName),
                table: JSON.stringify(table)
            })
        })
    } else {
        return resp.render('home');
    }
});

// Add Filter result to manage building and station
app.post('/manageBS', (req, resp) => {
    var buildingName = req.body.bname;
    var buildingTag = req.body.btag;
    var stationName = req.body.sname;
    var minCapacity = req.body.capacity_low;
    if (req.body.capacity_low == '') {
        minCapacity = null;
    }
    var maxCapacity = req.body.capacity_high;
    if (req.body.capacity_high == '') {
        maxCapacity = null;
    } 
    connection.query("CALL ad_filter_building_station(?, ?, ?, ?, ?)", [buildingName, buildingTag, stationName, minCapacity, maxCapacity]);
    connection.query("SELECT * FROM ad_filter_building_station_result;", (err, res) => {
        var myArray = [];
        var stationName = [null];
        var buildingName = [null];
        for (let i = 0; i < res.length; i++) {
            myArray.push({
                bname: res[i].buildingName,
                tags: res[i].tags,
                sname: res[i].stationName,
                cap: res[i].capacity,
                tnames: res[i].foodTruckNames
            });
        }
        connection.query("SELECT * FROM Building;", (err, res) => {
            for (let i = 0; i < res.length; i++) {
                if (res[i].buildingName != null) {
                    buildingName.push(res[i].buildingName);
                }
            }
            connection.query("SELECT * FROM Station;", (err, res) => {
                for (let i = 0; i < res.length; i++) {
                    if (res[i].stationName != null) {
                        stationName.push(res[i].stationName);
                    }
                }
                resp.render('buildingANDstation', {
                    buildingName: JSON.stringify(buildingName),
                    stationName: JSON.stringify(stationName),
                    array: JSON.stringify(myArray)
                })
            });
        });

    });
});

app.post('/toCreateFood', (req, resp) => {
    if (user_type == "Admin" || user_type == "Admin-Customer") {
        resp.render('createFood');
    } else {
        return resp.render('home');
    }
});

app.post('/createFood', (req, resp) => {
    if (user_type == "Admin" || user_type == "Admin-Customer") {
        var Name = req.body.Name;
        connection.query("CALL ad_create_food(?)", Name, (err, res) => {
            resp.render('createFood');
        });
    } else {
        return resp.render('home');
    }
});

app.post('/deleteFood', (req,resp) => {
    var victim = req.body.selected;
    connection.query("CALL ad_delete_food(?)", victim);
    resp.render('home');
});

app.post('/backtohome', (req, resp) => {
    resp.render('home');
});

app.post('/createBuilding', (req, resp) => {
    resp.render('createBuilding');
});

app.post('/createB', (req, resp) => {
    var bname = req.body.bname;
    var description = req.body.description;
    var tags;
    if (req.body.tags == null || req.body.tags == "") {
        tags = null;
    } else {
        tags = JSON.parse(req.body.tags);
    }
    connection.query("SELECT buildingName FROM Building;", (err, res) => {
        if (tags == null) {
            return;
        }
        for (let i = 0; i < res.length; i++) {
            if (res[i].buildingName == bname) {
                return;
            }
        }
        connection.query("CALL ad_create_building(?, ?)", [bname, description]);
        for (let i = 0; i < tags.length; i++) {
            connection.query("CALL ad_add_building_tag(?, ?)", [bname, tags[i]]);
        }
        var stationName = [null];
        var buildingName = [null];
        connection.query("SELECT DISTINCT stationName, Building.buildingName FROM Station RIGHT JOIN Building ON Station.buildingName = Building.buildingName;", (err, res) => {
            for (let i = 0; i < res.length; i++) {
                if (res[i].stationName != null) {
                    stationName.push(res[i].stationName);
                }
                if (res[i].buildingName != null) {
                    buildingName.push(res[i].buildingName);
                }
            }  
            resp.render('buildingANDstation', {
                buildingName: JSON.stringify(buildingName),
                stationName: JSON.stringify(stationName),
                array: JSON.stringify([])
            });
        });
    });
});

app.post('/backtomanageBS', (req, resp) => {
    var stationName = [null];
    var buildingName = [null];
    connection.query("SELECT DISTINCT stationName, Building.buildingName FROM Station RIGHT JOIN Building ON Station.buildingName = Building.buildingName;", (err, res) => {
        for (let i = 0; i < res.length; i++) {
            if (res[i].stationName != null) {
                stationName.push(res[i].stationName);
            }
            if (res[i].buildingName != null) {
                buildingName.push(res[i].buildingName);
            }
        }  
        resp.render('buildingANDstation', {
            buildingName: JSON.stringify(buildingName),
            stationName: JSON.stringify(stationName),
            array: JSON.stringify([])
        });
    });
});

app.post('/toUpDateBuilding', (req, resp) => {
    if (req.body.selected == "") {
        return;
    } else {
        connection.query("CALL ad_view_building_general(?)", [req.body.selected]);
        connection.query("SELECT * FROM ad_view_building_general_result;", (err, res) => {
            var buildingName = res[0].buildingName;
            var description = res[0].description;
            connection.query("CALL ad_view_building_tags(?)", [req.body.selected]);
            connection.query("SELECT * FROM ad_view_building_tags_result;", (err, res) => {
                var arr = [];
                for (let i = 0; i < res.length; i++) {
                    arr.push(res[i].tag);
                }
                resp.render('updateBuilding', {
                    b_name: JSON.stringify(buildingName),
                    b_description: JSON.stringify(description),
                    tags: JSON.stringify(arr)
                });
            });
        });   
    }
});

app.post('/updateBuilding', (req, resp) => {
    var old_buildingName = req.body.selected;
    var changed_buildingName = req.body.bname;
    var changed_description = req.body.description;
    var tags;
    if (req.body.tags == "") {
        tags = null;
    } else {
        tags = JSON.parse(req.body.tags);
    }
    var old_tags = JSON.parse(req.body.old_tag);

    connection.query("SELECT buildingName FROM Building;", (err, res) => {
        if (tags == null) {
            return;
        }
        connection.query("CALL ad_update_building(?, ?, ?)", [JSON.parse(old_buildingName), changed_buildingName, changed_description]);
        for (let i = 0; i < old_tags.length; i++) {
            connection.query("CALL ad_remove_building_tag(?, ?)", [changed_buildingName, old_tags[i]]);
        }
        for (let i = 0; i < tags.length; i++) {
            connection.query("CALL ad_add_building_tag(?, ?)", [changed_buildingName, tags[i]]);
        }
        var stationName = [null];
        var buildingName = [null];
        connection.query("SELECT DISTINCT stationName, Building.buildingName FROM Station RIGHT JOIN Building ON Station.buildingName = Building.buildingName;", (err, res) => {
            for (let i = 0; i < res.length; i++) {
                if (res[i].stationName != null) {
                    stationName.push(res[i].stationName);
                }
                if (res[i].buildingName != null) {
                    buildingName.push(res[i].buildingName);
                }
            }  
            resp.render('buildingANDstation', {
                buildingName: JSON.stringify(buildingName),
                stationName: JSON.stringify(stationName),
                array: JSON.stringify([])
            });
        });
    });
});

app.post('/toCreateStation', (req, resp) => {
    var buildingName = [];
    connection.query("CALL ad_get_available_building()");
    connection.query("SELECT * FROM ad_get_available_building_result;", (err, res) => {
        for (let i = 0; i < res.length; i++) {
            buildingName.push(res[i].buildingName);
        }
        resp.render('createStation', {
            buildingName: JSON.stringify(buildingName)
        });
    });
});

app.post('/createStation', (req, resp) => {
    var s_stationName = req.body.sname;
    var capacity = req.body.capacity;
    var sponsorBuilding = req.body.sb;
    connection.query("SELECT stationName FROM Station;", (err, res) => {
        for (let i = 0; i < res.length; i++) {
            if (res[i].stationName == stationName) {
                return;
            }
        }
        if (capacity <= 0) {
            return;
        }
        connection.query("CALL ad_create_station(?, ?, ?)", [s_stationName, sponsorBuilding, capacity]);
        var stationName = [null];
        var buildingName = [null];
        connection.query("SELECT DISTINCT stationName, Building.buildingName FROM Station RIGHT JOIN Building ON Station.buildingName = Building.buildingName;", (err, res) => {
            for (let i = 0; i < res.length; i++) {
                if (res[i].stationName != null) {
                    stationName.push(res[i].stationName);
                }
                if (res[i].buildingName != null) {
                    buildingName.push(res[i].buildingName);
                }
            }  
            resp.render('buildingANDstation', {
                buildingName: JSON.stringify(buildingName),
                stationName: JSON.stringify(stationName),
                array: JSON.stringify([])
            });
        });
    });
});

app.post('/toUpDateStation', (req, resp) => {
    if (req.body.selectedStation == "") {
        return;
    } else {
        connection.query("SELECT * FROM Station;", (err, res) => {
            var stationName;
            for (let i = 0; i < res.length; i++) {
                if (res[i].buildingName == req.body.selectedStation) {
                    stationName = res[i].stationName;
                }
            }
            var buildingName = [];
            connection.query("CALL ad_get_available_building()");
            connection.query("SELECT * FROM ad_get_available_building_result;", (err, res) => {
                for (let i = 0; i < res.length; i++) {
                    buildingName.push(res[i].buildingName);
                }
                connection.query("CALL ad_view_station(?)", [stationName]);
                connection.query("SELECT * FROM ad_view_station_result;", (err, res) => {
                    var s_name = res[0].stationName;
                    var cap = res[0].capacity;
                    var b_name = res[0].buildingName;
                    buildingName.push(b_name);
                    resp.render('updateStation', {
                        buildingName: JSON.stringify(buildingName),
                        b_name: JSON.stringify(b_name),
                        s_name: JSON.stringify(s_name),
                        cap: JSON.stringify(cap)
                    });
                });
            });
        });
    }
});


app.post('/updateStation', (req, resp) => {
    var stationName = JSON.parse(req.body.s_name);
    var capacity = req.body.capacity;
    var buildingName = req.body.sb;
    if (capacity <= 0) {
        return;
    }
    connection.query("CALL ad_update_station(?, ?, ?)", [stationName, capacity, buildingName]);
    var stationName = [null];
    var buildingName = [null];
    connection.query("SELECT DISTINCT stationName, Building.buildingName FROM Station RIGHT JOIN Building ON Station.buildingName = Building.buildingName;", (err, res) => {
        for (let i = 0; i < res.length; i++) {
            if (res[i].stationName != null) {
                stationName.push(res[i].stationName);
            }
            if (res[i].buildingName != null) {
                buildingName.push(res[i].buildingName);
            }
        }
        resp.render('buildingANDstation', {
            buildingName: JSON.stringify(buildingName),
            stationName: JSON.stringify(stationName),
            array: JSON.stringify([])
        });
    });
});

app.post('/tocreateFoodTruck', (req, resp) => {
    var stations = [];
    var staffs = [];
    var foods = [];
    connection.query("SELECT * FROM Station;", (err, res) => {
        for (let i = 0; i < res.length; i++) {
            if (res[i].capacity > 0) {
                stations.push(res[i].stationName);
            }
        }
        connection.query("SELECT * FROM Staff;", (err, res) => {
            for (let i = 0; i < res.length; i++) {
                if (res[i].foodTruckName == null) {
                    staffs.push(res[i].username);
                }
            }
            connection.query("SELECT * FROM Food;", (err, res) => {
                for (let i = 0; i < res.length; i++) {
                    foods.push(res[i].foodName);
                }
                resp.render('createFoodTruck', {
                    stations: JSON.stringify(stations),
                    staffs: JSON.stringify(staffs),
                    foods: JSON.stringify(foods)
                });
            });
        });
    });
});

app.post('/createFoodTruck', (req, resp) => {
    var ftname = req.body.fname;
    var station = req.body.station;
    var assignedStaff = req.body.assignStaff;
    var fooditems = JSON.parse(req.body.foodItems);


    connection.query("CALL mn_create_foodTruck_add_station(?, ?, ?)", [ftname, station, user_name]);
    if (typeof assignedStaff === 'string') {
        connection.query("CALL mn_create_foodTruck_add_staff(?, ?)", [ftname, assignedStaff]);
    } else {
        for (let i = 0; i < assignedStaff.length; i++) {
            connection.query("CALL mn_create_foodTruck_add_staff(?, ?)", [ftname, assignedStaff[i]]);
        }
    }
    for (let i = 0; i < fooditems.length; i++) {
        connection.query("CALL mn_create_foodTruck_add_menu_item(?, ?, ?)", [ftname, fooditems[i].value, fooditems[i].key]);
    }

    var station_list = [];
    connection.query("SELECT DISTINCT Station.stationName FROM Station INNER JOIN FoodTruck ON Station.stationName = FoodTruck.stationName WHERE FoodTruck.managerUsername = (?);", user_name, (err, res) => {
        if (err) throw err;
        for (let i = 0; i < res.length; i++) {
            station_list.push(res[i].stationName);
        } 
        resp.render('manageFoodTruck', {
            station_list: JSON.stringify(station_list),
            table: JSON.stringify([])
        });
    });
});

app.post('/toupdateFoodTruck', (req, resp) => {
    if (req.body.selected == "") {
        return;
    } else {
        var stations = [];
        var staffs = [];
        var foods = [];
        connection.query("SELECT * FROM Station;", (err, res) => {
            for (let i = 0; i < res.length; i++) {
                if (res[i].capacity > 0) {
                    stations.push(res[i].stationName);
                }
            }
            connection.query("SELECT * FROM Staff;", (err, res) => {
                for (let i = 0; i < res.length; i++) {
                    if (res[i].foodTruckName == null || res[i].foodTruckName == req.body.selected) {
                        staffs.push(res[i].username);
                    }
                }
                connection.query("SELECT * FROM Food;", (err, res) => {
                    for (let i = 0; i < res.length; i++) {
                        foods.push(res[i].foodName);
                    }
                    var ftname = req.body.selected;
                    connection.query("SELECT * FROM FoodTruck;", (err, res) => {
                        var selected_station;
                        for (let i = 0; i < res.length; i++) {
                            if (res[i].foodTruckName == ftname) {
                                selected_station = res[i].stationName;
                            }
                        }
                        connection.query("SELECT * FROM Staff;", (err, res) => {
                            var selected_staff = [];
                            for (let i = 0; i < res.length; i++) {
                                if (res[i].foodTruckName == ftname) {
                                    selected_staff.push(res[i].username);
                                }
                            }
                            connection.query("SELECT * FROM MenuItem;", (err, res) => {
                                var menuItems = [];
                                for (let i = 0; i < res.length; i++) {
                                    if (res[i].foodTruckName == ftname) {
                                        menuItems.push({
                                            key: res[i].foodName,
                                            value: res[i].price
                                        });
                                    }
                                }
                                resp.render('updateFoodTruck', {
                                    stations: JSON.stringify(stations),
                                    staffs: JSON.stringify(staffs),
                                    foods: JSON.stringify(foods),
                                    selected_station: JSON.stringify(selected_station),
                                    selected_staff: JSON.stringify(selected_staff),
                                    menuItems: JSON.stringify(menuItems),
                                    selected_foodTruck: JSON.stringify(ftname)
                                });
                            })
                        });
                    });
                });
            });
        });
    }
});

app.post('/updateFoodTruck', (req, resp) => {
    var ftname = req.body.fname;
    var station = req.body.station;
    var assignedStaff = req.body.assignStaff;
    var fooditems = JSON.parse(req.body.foodItems);
    connection.query("CALL mn_update_foodTruck_station(?, ?)", [ftname, station]);
    if (typeof assignedStaff === 'string') {
        connection.query("CALL mn_update_foodTruck_staff(?, ?)", [ftname, assignedStaff]);
    } else {
        for (let i = 0; i < assignedStaff.length; i++) {
            connection.query("CALL mn_update_foodTruck_staff(?, ?)", [ftname, assignedStaff[i]]);
        }
    }
    connection.query("SELECT * FROM MenuItem WHERE foodTruckName= ? ;", [ftname], (err, res) => {
        for (let i = res.length; i < fooditems.length; i++) {
            connection.query("CALL mn_create_foodTruck_add_menu_item(?, ?, ?)", [ftname, fooditems[i].value, fooditems[i].key]);
        }
    });


    var station_list = [];
    connection.query("SELECT DISTINCT Station.stationName FROM Station INNER JOIN FoodTruck ON Station.stationName = FoodTruck.stationName WHERE FoodTruck.managerUsername = (?);", user_name, (err, res) => {
        if (err) throw err;
        for (let i = 0; i < res.length; i++) {
            station_list.push(res[i].stationName);
        } 
        resp.render('manageFoodTruck', {
            station_list: JSON.stringify(station_list),
            table: JSON.stringify([])
        });
    });
});

app.listen(3000);