// ESM syntax is supported.
import express from 'express';
require('dotenv').config();

const app = express();

app.use(express.urlencoded({extended: false}));
app.use(express.json());

const PORT = process.env.PORT || 9400;

app.listen(PORT, () => {
  console.log(`PR slack bot started on port ${PORT}`);
});
