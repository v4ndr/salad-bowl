module.exports = function Sockets(server, games) {
    var io = require('socket.io')(server);
    function shuffle(a) {
        var j, x, i;
        for (i = a.length - 1; i > 0; i--) {
            j = Math.floor(Math.random() * (i + 1));
            x = a[i];
            a[i] = a[j];
            a[j] = x;
        }
        return a;
    }
    io.on('connection', (socket)=> {
        socket.on('join', (info)=>{
            //gestion de la connection / room
            socket.join(info.room);
            socket.broadcast.to(info.room).emit('refreshlobby', games[info.room].players);

            //lobby
            socket.on('teamchange', (data)=>{
                games[info.room].players[info.player].team = data;
                io.in(info.room).emit('refreshlobby', games[info.room].players);
            });
            socket.on('readychange', ()=>{
                games[info.room].players[info.player].ready = !games[info.room].players[info.player].ready;
                io.in(info.room).emit('refreshlobby', games[info.room].players);
                if(games[info.room].players.every(v=>v.ready == true)){
                    socket.broadcast.to(info.room).emit('allready', false);
                    socket.emit('allready', true);
                }
                else{
                    io.in(info.room).emit('unallready', false);
                }
            });
            socket.on('preparegame', ()=>{
                var comp = 0;
                games[info.room].players.forEach(plr => {
                    games[info.room].teams[plr.team-1].playersId.push(comp);
                    comp++;
                });
                if(!games[info.room].teams.every(v=>v.playersId.length > 0)){
                    games[info.room].teams.forEach(team=>{
                        team.playersId = [];
                    });
                    io.in(info.room).emit('unallready', true);
                }
                else{
                    games[info.room].tour++;
                    games[info.room].teamPlaying = 0;
                    games[info.room].tmpWords = games[info.room].words.slice();
                    games[info.room].tmpWords = shuffle(games[info.room].tmpWords);
                    console.log('fin de prepare game');
                    console.log(games[info.room])
                    console.log(games[info.room].teams)
                    io.in(info.room).emit('game');
                }
            });

            //game
            socket.on('pass',()=>{
                games[info.room].tmpWords.push(games[info.room].tmpWords.shift());
                socket.emit('newword', games[info.room].tmpWords[0]);
            });
            socket.on('next', ()=>{
                games[info.room].tmpWords.shift();
                games[info.room].scores[games[info.room].teamPlaying]++;

                if (games[info.room].tmpWords.length == 0){
                    games[info.room].tour++;
                    games[info.room].tmpWords = games[info.room].words.slice();
                    games[info.room].tmpWords = shuffle(games[info.room].tmpWords);

                    games[info.room].teams[games[info.room].teamPlaying].playerPlaying++;
                    if(games[info.room].teams[games[info.room].teamPlaying].playerPlaying >= games[info.room].teams[games[info.room].teamPlaying].playersId.length){
                        games[info.room].teams[games[info.room].teamPlaying].playerPlaying = 0;
                    }

                    games[info.room].teamPlaying++;
                    if(games[info.room].teamPlaying >= games[info.room].teamNumber){
                        games[info.room].teamPlaying = 0;
                    }
                    games[info.room].emptybowl = true;
                    io.in(info.room).emit('end');
                }
                else{
                    socket.emit('newword', games[info.room].tmpWords[0]);
                }
            });
            socket.on('endtime', ()=>{
                games[info.room].teams[games[info.room].teamPlaying].playerPlaying++;
                if(games[info.room].teams[games[info.room].teamPlaying].playerPlaying >= games[info.room].teams[games[info.room].teamPlaying].playersId.length){
                    games[info.room].teams[games[info.room].teamPlaying].playerPlaying = 0;
                }

                games[info.room].teamPlaying++;
                if(games[info.room].teamPlaying >= games[info.room].teamNumber){
                    games[info.room].teamPlaying = 0;
                }
                io.in(info.room).emit('end');
            });
            socket.on('setemptybowl',()=>{
                if(games[info.room].emptybowl){
                    games[info.room].emptybowl = false;
                }
            });
            socket.on('atend',()=>{
                games[info.room].players[info.player].atEnd = true;
                console.log(games[info.room].players);
                if(games[info.room].players.every(v=>v.atEnd == true)){
                    delete games[info.room];
                    console.log(games);
                }
            });
        });
    });
  };
  