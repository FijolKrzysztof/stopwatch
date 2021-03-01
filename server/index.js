const dotenv = require('dotenv');
const mongoose = require('mongoose');
const express = require('express');
const bodyParser = require('body-parser');
const cors = require('cors');

dotenv.config();

const CONNECTION_URL = '--example--mongodb+srv://<username>:<password>@<cluster>.pkyaw.mongodb.net/<databaseName>?retryWrites=true&w=majority';

mongoose.connect(CONNECTION_URL, { useNewUrlParser: true, useUnifiedTopology: true })

const schema = new mongoose.Schema({
    User: Number,
    Time: { type:Number, default: null },
    InsertTime: { type:Number, default: null },
    Expires: { type:Number, default:getDate(1) }
})

const user = mongoose.model('user', schema);

function mongoInsert(id){
    new user({ User:id }).save();
}

function mongoUpdateTime(id, time, insertTime){
    if(time === undefined){ user.updateOne({ User:id },{ $set:{ Time:null, InsertTime:null }}).then() }
    else{ user.updateOne({ User:id },{ $set:{ Time:time, InsertTime:insertTime }}).then() };
}

function mongoUpdateExpiration(id){
    user.updateOne({ User:id },{ $set:{ Expires:getDate(1) }}).then();
}

function mongoRead(id, callback){
    user.find({ User:id })
    .then((data) => { return callback(data[0]) })
}

function mongoDelete(callback){
    user.deleteMany({ Expires:{ $lt:getDate(0) }}).then(() => { return callback() });
}

function generateRandom(callback){
    let random = Math.floor(Math.random() * Number.MAX_SAFE_INTEGER) + 1;
    mongoRead(random, function(output){
        if(output === undefined){ return callback(random) }
        else{ return callback(generateRandom()) }
    })
}

function getDate(change){
    let date = new Date();
    date.setDate(date.getDate() + change);
    return date.getTime();
}

const app = express();

app.use(express.json());
app.use(bodyParser.urlencoded({extended: true}));
app.use(cors());

app.post('/cookie', (req, res) => {
    mongoDelete(function(){
        let id = req.body.id;
        id = parseInt(id, 10);
        if(id === 0 || Number.isNaN(id)){
            generateRandom(function(random){
                res.send({ id:random, time:undefined });
                mongoInsert(random);
            })
        } else {
            mongoRead(id, function(output){
                if(output === undefined){
                    mongoInsert(id);
                    res.send({ id:id, time:undefined })
                } else {
                    mongoUpdateExpiration(id);
                    if(output.Time === null){
                        res.send({ id:id, time:undefined })
                    } else {
                        res.send({ id:id, time:output.Time, insertTime:output.InsertTime })
                    }
                }
            })
        }
    })
})

app.post('/send', (req, res) => {
    mongoUpdateTime(req.body.id, req.body.time, req.body.insertTime);
    res.send();
})

app.post('/clear', (req, res) => {
    mongoUpdateTime(req.body.id);
    res.send();
})

app.listen(process.env.PORT || 5000)
