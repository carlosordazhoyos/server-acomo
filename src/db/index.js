const mongoose = require('mongoose');
require('dotenv').config();

//mongoose.connect('mongodb://localhost:27017/web', {
mongoose.connect('mongodb+srv://acomo_carlos:873vCbAY4NJ1wRqy@clusteracomo.msmi0.mongodb.net/web', {
    useNewUrlParser: true,
    useUnifiedTopology: true,
}).then(db => console.log('db connected'))
    .catch(error => console.log(error));
