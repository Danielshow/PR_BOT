// ESM syntax is supported.
import express from 'express';
import githubHook from './modules/github';
import commandHook from './modules/command';
import './modules/reviews';
import './modules/cronJob';
require('dotenv').config();

const app = express();

app.use(express.urlencoded({extended: false}));
app.use(express.json());
githubHook(app);
commandHook(app);

// keep heroku from sleeping
app.get('/hello', (req, res) => {
  res.json({ message: "Stop sleeping"})
});

const PORT = process.env.PORT || 9400;

app.listen(PORT, () => {
  console.log(`PR slack bot started on port ${PORT}`);
});
