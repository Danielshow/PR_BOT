// ESM syntax is supported.
import express from 'express';
import githubHook from './modules/github';
import ttt from './modules/reviews';
import './modules/cronJob';
require('dotenv').config();

const app = express();

app.use(express.urlencoded({extended: false}));
app.use(express.json());
githubHook(app);
ttt()

const PORT = process.env.PORT || 9400;

app.listen(PORT, () => {
  console.log(`PR slack bot started on port ${PORT}`);
});
