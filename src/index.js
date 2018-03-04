const express = require('express');
const session = require('express-session');
const compression = require('compression');
const bodyParser = require('body-parser');
const notFound = require('./routes/not-found.js');

const { SESSION_SECRET } = process.env;

if(!SESSION_SECRET) {
    throw new Error('Environment variable SESSION_SECRET should be set');
}

const app = express();
app.use(compression());
app.use(bodyParser.urlencoded({extended: false}));
app.use(bodyParser.json());
app.use(session({ secret: SESSION_SECRET }));

app.use('/guilds', require('./routes/guilds/guilds.js'));

app.use(notFound);

app.listen(8080, '0.0.0.0');
