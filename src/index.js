const path = require('path')
const http = require('http');
const express =require('express');
const socketio = require('socket.io')
const Filter = require('bad-words')
const {generateMessage, generateLocation} = require('./utils/messages')
const { addUser, removeUser, getUser,getUsersInRoom} = require('./utils/users')


const app = express()
const server = http.createServer(app)
const io = socketio(server)

const port = process.env.PORT || 3000
const publicDirectoryPath = path.join(__dirname, '../pubilc');


app.use(express.static(publicDirectoryPath));

io.on('connection', (socket) => {
    console.log('New connection with socket io');

    /**
     * emit() permet de creer un event
     * socket.emit() permet d'envoyer un event a un client specifique
     * io.emit() permet d'envoyer un event a tous les clients connectés
     * socket.broadcast.emit() permet un event a ts les clients connectés a part celui qui l'emet
     * socket.join(room) est seulement utilisé sur le serveur et nous permet de joindre un chatroom donné et prend en argument le nom du chatRoom et nous permet d'avoir donc access a d'autres manieres de creer un event:
     * io.to.emit() permet d'envoyer un event  ts les clients connectés a un  chatRoom specifique 
     * socket.broadcast.to.emit() permet d'envoyer un event a ts les clients connectés ds un chatRoom speccifique exépté celui qui l'envoit
     * 
     * 
     */

    
    socket.on('join', (options , callback) => {

        // on ajoute le user au room
       const {error,  user} = addUser({id: socket.id, ...options});

       // on verifie s'il y a erreur
       if(error){
           return callback(error);
       }

        socket.join(user.room)
        
        // envoi un messsage de bienvenu
        socket.emit('message', generateMessage('Admin','welcome'));

        // envoi un message a tous les clients connectés ds le chatRoom sauf celui qui vient de se connecter
        socket.broadcast.to(user.room).emit('message', generateMessage('Admin',` ${user.username} has joined us`));

        // on push le nom de l'utilisateur et le nom de son room au client side


        io.to(user.room).emit('roomData', {
            room: user.room,
            users: getUsersInRoom(user.room)
        })

        // et si il y a erreur on previent le user
        callback()


    })

    socket.on('sendMessage', (message, callback) => {
        // on track le user  qui va envoyer le message
        const user = getUser(socket.id);
        
        // on filtre le message qu'il va envoyer
        const filter = new Filter()
        if(filter.isProfane(message)){
            return callback('Profanity is not allowed!!')
        }
        
        // on envoit le massage ds le bon room
        io.to(user.room).emit('message', generateMessage( user.username, message) )

        // on affiche des erreurs potentielles
        callback()
    });

    socket.on('sendLocation', (coords, callback) => {
        // on track le user qui va envoyer sa localistaion
        const user = getUser(socket.id);
          
        // on envoit sa localisation
        io.to(user.room).emit('locationMessage', generateLocation(user.username,`https://google.com/maps?q=${coords.latitude},${coords.longitude}`))

        // on traque d'eventuelles erreurs
        callback()
    })
     
    // permet de se deconnecter
    socket.on('disconnect', () => {

        // on remove le user du room
      const user =  removeUser(socket.id);
     
      if(user){
          // on envoitun message ds le room qui'il nous a quitté
          io.to(user.room).emit('message', generateMessage(`${user.username} has left the room`));

          // on enleve le nom de l'utilisateur et le nom de son room au client side
          io.to(user.room).emit('roomData', {
              room: user.room,
              users: getUsersInRoom(user.room)
          }) 
      }   
    })
})
server.listen(port, () => {
    console.log(`server listen on ${port}`);
    
})