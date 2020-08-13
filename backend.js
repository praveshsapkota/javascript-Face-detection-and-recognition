//const cv = require('opencv4nodejs');
const express = require('express');
const app = express();
const server = require('http').Server(app);
const io = require('socket.io')(server);
const parser = require('body-parser');
const fs  = require('fs');


app.use('/static', express.static(__dirname+'/public'))
app.use(parser.urlencoded({extended:'true'}));


app.get('/',function(req,res){res.sendFile(__dirname+'/HTML/index.html')})
app.get('/register',function(req,res){res.sendFile(__dirname+"/HTML/Register_User.html")});
app.get('/recognition',(req,res)=>{
    res.sendFile(__dirname+"/HTML/Face_Recognition.html")
    create_labels();
});

var name = 0;
var department = 0;
var imgdata = [];
var  labels = []; 


function create_labels(){
    for(i=0;i<fs.readdirSync(__dirname+'/public/images/').length;i++){
        var user_name = fs.readdirSync(__dirname+'/public/images/')[i].split('.')[0]
        labels.push(user_name)
    }
}

io.on('connect', socket => {
    var j = 0;
    socket.on('imgdata', (data) => {
      for(j=0;j<data.length;j++){
        imgdata.push(data[j])  
      }
      createuser(name,department,imgdata);
    });
    socket.emit('labels',labels);
});

app.post('/submitt_data',(req,res)=>{
    res.send('new user uploaded');
    name = req.body.name;
    department = req.body.department
    console.log(name,department) 
})

function createuser(name,department,imgdata){
    if(fs.existsSync(__dirname+'/images'+'/'+name+'_'+department+'.jpg')){
        console.log('user named '+name+" already exists");
    }
    else{
        var i = 0;
        for(i=0;i<imgdata.length;i++){
            var data = imgdata[i]
            var base64Data = data.replace(/^data:image\/png;base64,/, "");
            fs.writeFile(__dirname+'/public/images/'+name+'_'+department+[i]+".png", base64Data, 'base64', 
            function(err, data) {
                if (err) {
                    console.log('err', err);
                }
                console.log('success');

            });

        };
    }
}



server.listen(5000,function(){
    console.log('server started at port 5000')
});