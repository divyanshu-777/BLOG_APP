const cors = require('cors');
const mongoose = require('mongoose');
const config = require('config');
const express = require('express');
const logger = require('./helper/logger');

const app = express();

app.use(express.json());
app.use(cors());

 require('./routes/userAuth')(app)
 require('./routes/blogRoutes')(app)
 require('./routes/adminRoutes')(app);

  // fallback invalid route
 app.use((req, res, next) => {
    res.status(404).json({
        success: false,
        message: 'Invalid route',
        result: {},
        statusCode: 404
    });
});

  //Handles the error throughout the app
app.use((err, req, res, next) => {
        logger(req,res,err);
        return res.status(500).json({
              code: 500,
              message: 'Internal Server Error',
              success: false
     });
});

mongoose.connect(
    config.get("mongodb_uri"),
    {
        useCreateIndex: true,
        useNewUrlParser: true,
        useUnifiedTopology: true
    }
).then(
    () => {
        console.log('MongoDB server Connected');
    },
    (err) => {
        console('MongoDB connection failed', err);
    }
);

app.listen(process.env.PORT||config.get("PORT"),
    () => {
        console.log('Server is Up and running on port No', config.get("PORT"));
    })
    