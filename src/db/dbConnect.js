const mongoose = require('mongoose');

mongoose.connect(process.env.database,{ // Initialization
    useNewUrlParser: true,
    useCreateIndex: true,
    useUnifiedTopology: true
})