const socket = io();

//Elements
const $messageForm = document.querySelector('#message-form');
const $messageFormInput = $messageForm.querySelector('input');
const $messageFormButton = $messageForm.querySelector('button');
const $sendLocationButton = document.querySelector('#send-location');
const $messages = document.querySelector('#messages');

//Templates
const $messageTemplate = document.querySelector('#message-template').innerHTML;
const $locationMessageTemplate = document.querySelector('#locationMessage-template').innerHTML;
const sidebarTemplate = document.querySelector('#sidebar-template').innerHTML

//Options
const {username, room} = Qs.parse(location.search, {ignoreQueryPrefix : true});

//AutoScroll
const autoscroll = () => {

    // New message element
    const $newMessage = $messages.lastElementChild

    // la hauteur du nouveau message

    //1- xa me donne toutes les proprietés css
    const newMessageStyles = getComputedStyle($newMessage)
    //2- j 'extrais le margin bottom et je le convertis en nombre
    const newMessageMargin = parseInt(newMessageStyles.marginBottom)
    //2- je fais la somme a chaque fois qu'un message est ajouté
    const newMessageHeight = $newMessage.offsetHeight + newMessageMargin

    // hauteur visible
    const visibleHeight = $messages.offsetHeight

    // Height of messages container
    const containerHeight = $messages.scrollHeight

    // How far have I scrolled?
    const scrollOffset = $messages.scrollTop + visibleHeight

    if (containerHeight - newMessageHeight <= scrollOffset) {
        $messages.scrollTop = $messages.scrollHeight
    }

}


socket.on('message' , (message) => {

    const html = Mustache.render($messageTemplate, {
        username:message.username,
        message:message.text,
        createdAt: moment(message.createdAt).format('HH:mm:s  a')
    });
    $messages.insertAdjacentHTML('beforeend', html);
    autoscroll();
});


socket.on('locationMessage', (message) => {
   
    const html = Mustache.render($locationMessageTemplate, {
        username:message.username,
        url:message.url,
        createdAt: moment(message.createdAt).format('HH:mm:s  a')
    });
    $messages.insertAdjacentHTML('beforeend', html);
    autoscroll()
    
});

socket.on('roomData', ({ room, users }) => {
    const html = Mustache.render(sidebarTemplate, {
        room,
        users
    });
    
    document.querySelector('#sidebar').innerHTML = html
});

$messageForm.addEventListener('submit' , (event) => {
   event.preventDefault();

   // quand le message est envoyé on disabled le bouton
   $messageFormButton.setAttribute('disabled', 'disabled')

   const message = event.target.elements.message.value;

    socket.emit('sendMessage', message , (error) => {

        // on recoit le message ds le chat dc on enable le button pour eviter des envois multiples
        $messageFormButton.removeAttribute('disabled')
        //on vide le input de l'ancien message
        $messageFormInput.value = ''
        //et le focus aussi
        $messageFormInput.focus()
        
        if(error){
            return console.log(error);
            
        }
        console.log('The message was delivered!!');
    })
});


$sendLocationButton.addEventListener('click', (e) => {

    e.preventDefault();

    if(!navigator.geolocation){
        return alert('Geolocalisation is not supported by the browser')
    }

    // quand le message est envoyé on disabled le bouton
    $sendLocationButton.setAttribute('disabled', 'disabled')

    navigator.geolocation.getCurrentPosition((position) => {
        socket.emit('sendLocation', {
            latitude: position.coords.latitude,
            longitude: position.coords.longitude
        }, () => {
            $sendLocationButton.removeAttribute('disabled')
            console.log('location shared');
            
        })
    })
});

socket.emit('join', {username, room}, (error) => {

     if(error){
         alert(error)
         location.href = '/'
     }
});

