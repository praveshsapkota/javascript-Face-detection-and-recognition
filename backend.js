const express = require('express');
const app = express();
const server = require('http').Server(app);
const io = require('socket.io')(server);
const parser = require('body-parser');
const fs = require('fs');
const mysql = require('mysql')
const date = require('date-and-time');


app.set('view engine', 'ejs');
app.use('/static', express.static(__dirname + '/public'))
app.use(parser.urlencoded({
    extended: 'true'
}));


var db = mysql.createConnection({
    host: '127.0.0.1',
    user: 'root',
    password: '',
    port: '3306',
    database: 'db'
});

db.connect((err) => {
    if (err) {
        console.log(err);
    } else {
        console.log('database connected');
    }
});


app.get('/', function (req, res) {
    res.render('index')
})
app.get('/register', function (req, res) {
    res.render("Register_User")
});
app.get('/recognition', (req, res) => {
    let query = ('DELETE FROM Attendance');
    fetch_data(query, (results) => {});
    create_labels();
    res.render('Face_Recognition');

});
app.get('/attendance', (req, res) => {
    let query = 'SELECT t1.*,t2.Date FROM register t1,Attendance t2 WHERE t1.USN = t2.USN'
    fetch_data(query, (result) => {
        res.json(result);
        console.log(result)
    });
});

app.get('/index2', (req, res) => {
    let query = 'SELECT * FROM register'
    fetch_data(query, (results) => {
        res.render('tabel_data', {
            rows: results
        })
    });
})


app.get('/registered', (req, res) => {
    let query = 'SELECT * FROM register'
    fetch_data(query, (results) => {
        res.render('tabel_data', {
            rows: results
        })
    });
});


function fetch_data(query, cb) {
    db.query(query, (err, result, fields) => {
        if (err) {
            console.error(err.sqlMessage);
            return;
        }
        cb(result)
    })

}


var labels = [];

function create_labels() {
    labels = [];
    for (i = 0; i < fs.readdirSync(__dirname + '/public/images/').length; i++) {
        var user_name = fs.readdirSync(__dirname + '/public/images/')[i].split('.')[0]
        labels.push(user_name)
    }
}

io.on('connect', socket => {
    var j = 0;
    socket.on('userdata', (data) => {
        var name = data.name;
        var department = data.dep;
        var semester = data.sem;
        var usn = data.usn;
        var imgdata = data.choosed_image.img;
        console.log(name, department, semester, usn)
        if(name != undefined || usn != undefined || department != undefined || semester != undefined|| imgdata != undefined){
            query = `INSERT INTO register VALUES('${usn}','${name}','${department}','${semester}')`
        db.query(query, (err, response) => {
            if (err) {
                console.error(err.sqlMessage);
                return;
            }
            console.log(response.insertId);
        });
        createuser(name, usn, imgdata);
        }
        else{
            console.log('Please submitt full information in order of register');
        }
        

    });
    socket.emit('labels', labels);
});


function createuser(name, usn, imgdata) {
    if (fs.existsSync(__dirname + '/public/images' + '/' + name + '_' + usn + '.png')) {
        console.log('user named ' + name + usn + " already exists");
    } else {
        if(imgdata != undefined){
        var data = imgdata
        var base64Data = data.replace(/^data:image\/png;base64,/, "");
        fs.writeFile(__dirname + '/public/images/' + name + '_' + usn + ".png", base64Data, 'base64',
            function (err, data) {
                if (err) {
                    console.log('err', err);
                }
                console.log('success');
            });
        }
        else{
            console.log('no image selected');
        }
    }
}


setTimeout(function () {
    var recognized = 0;
    io.on('connect', (socket) => {
        socket.on('recognized', (data) => {
            recognized = [data.split('_')[1], date.format(new Date(), 'YYYY/MM/DD HH:mm:ss')]
            if (recognized[0] != undefined) {
                console.log(recognized)
                query = `INSERT INTO Attendance VALUES('${recognized[0]}','${recognized[1]}')`
                db.query(query, (err, response) => {
                    if (err) {
                        console.error(err.sqlMessage);
                        return;
                    }
                    console.log(response.insertId);
                });
            }

        });
    });
}, 500)


server.listen(5000, function () {
    console.log('server started at port 5000')
});