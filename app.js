/*
FAILLES CONNUES :
[x toléré] si un joueur ferme l'app dans le lobby ses mots restent dans le salad-bowl
[x faille comblée] si un joueur ouvre un autre onglet de l'app il y a conflit entre les deux instance (session)
[x]les entrée avec apostrophes et specials chars ne sont pas gérées
*/



var http = require('http');
var express = require('express');
var app = express();
var server = http.createServer(app);

var bodyParser = require('body-parser');
var urlencodedParser = bodyParser.urlencoded({extended : true});
var session = require('express-session');

class room {
    constructor(name) {
        this.name = name;
        this.teamNumber = 0;
        this.wordsNumber = 0;
        this.tour = 0;
        this.teamPlaying = 0;
        this.scores = [];
        this.words = [];
        this.tmpWords = [];
        this.players = [];
        this.teams = [];
        this.ready = false;
        this.emptybowl = false;
    }
}
class player {
    constructor(name) {
        this.name = name;
        this.team = 1;
        this.ready = false; 
        this.atEnd = false;
    }
}
class team {
    constructor(){
        this.playersId = [];
        this.playerPlaying = 0;
    }
}
var games = [];

var sockets = require('./lib/sockets.js')(server, games);

app.use(express.static('public'));
app.use(session({secret: 'vander'}));

app.set('view engine','ejs');

app.get('/',(req,res)=>{
    if(req.query.errorCode){
        res.render('home', {errorCode: req.query.errorCode});
    }
    else{
        res.render('home', {errorCode: 0});
    }
})
.post('/host', urlencodedParser, (req,res)=>{
    if(req.body.roomName in games){
        res.redirect('/?errorCode=3');
    }
    else{
        games[req.body.roomName] = new room(req.body.roomName);
        games[req.body.roomName].players.push(new player(req.body.playerName));
        req.session.playerId = games[req.body.roomName].players.length - 1;
        req.session.roomName = req.body.roomName;
        
    }
    res.render('config', {roomName:req.session.roomName});
})
.post('/join', urlencodedParser,(req,res)=>{
    var error = false;
    if(req.body.roomName in games){
        games[req.body.roomName].players.forEach(plr=>{
            if(req.body.playerName == plr.name){
                error = true;
                res.redirect('/?errorCode=1');
            }
        });
        if(!error){
            if(games[req.body.roomName].ready == true){
                games[req.body.roomName].players.push(new player(req.body.playerName));
                req.session.playerId = games[req.body.roomName].players.length - 1;
                req.session.roomName = req.body.roomName;
            }
            else{
                res.redirect('/?errorCode=4');
            }
        }
    }
    else{
        res.redirect('/?errorCode=2');
    }
    res.render('submit-words',{wordsNumber:games[req.session.roomName].wordsNumber});
})
.post('/config',urlencodedParser, (req,res)=>{
    games[req.session.roomName].wordsNumber = parseInt(req.body.wordsNumber);
    games[req.session.roomName].teamNumber = parseInt(req.body.teamNumber);
    for(var i = 0; i<req.body.teamNumber; i++){
        games[req.session.roomName].teams.push(new team());
        games[req.session.roomName].scores.push(0);
    }
    games[req.session.roomName].ready = true;
    res.render('submit-words',{wordsNumber:games[req.session.roomName].wordsNumber});
})
.post('/submit-words',urlencodedParser,(req,res)=>{
    req.body.words.forEach(word => {
        games[req.session.roomName].words.push(word);
    });
    res.redirect('/lobby');
})
.get('/lobby',(req,res)=>{
    res.render('lobby',{
        teamNumber : games[req.session.roomName].teamNumber,
        myself : req.session.playerId,
        players : games[req.session.roomName].players,
        roomName : req.session.roomName,
    });
})
.get('/game',(req,res)=>{
    if(!games[req.session.roomName].emptybowl){
        var teamPlaying = games[req.session.roomName].teams[games[req.session.roomName].teamPlaying];   
        var playerPlayingId = teamPlaying.playersId[teamPlaying.playerPlaying];
        var playerPlayingName = games[req.session.roomName].players[playerPlayingId].name;

        if(req.session.playerId == playerPlayingId){
            res.render('pregame');
        }
        
        else{
            res.render('message', {
                myself : req.session.playerId,
                roomName : req.session.roomName,
                msg : playerPlayingName+' est en train de jouer !',
            });
        }
    }
    else{
        res.redirect('/scores');
    }
        
})
.get('/play',(req,res)=>{
    res.render('game', {
        myself : req.session.playerId,
        roomName : req.session.roomName,
        firstWord : games[req.session.roomName].tmpWords[0],
    });
})
.get('/msg',(req,res)=>{
    res.render('message', {msg: "L'equipe 1 joue"});
})
.get('/scores',(req,res)=>{
    var title ="Fin de la manche";
    var end = 0;
    var scores = games[req.session.roomName].scores;
    if(games[req.session.roomName].tour > 3){
        title = "Partie terminée";
        end = 1;
    }
    res.render('scores', {
        title: title, 
        end:end, 
        scores: scores,
        myself : req.session.playerId,
        roomName : req.session.roomName,
    });   
})
.get('/MTerror', (req,res)=>{
    res.render('MTerror');
})
.use(function(req, res, next){
    res.setHeader('Content-Type', 'text/plain');
    res.status(404).send('FORBIDDEN');
});

server.listen(3000);




