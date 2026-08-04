import express from 'express';
import cors from 'cors';

const app = express();

app.use(cors());

app.get('/', (_req, res) => {
  res.send('Arena Online Backend Running');
});

const PORT = 3000;

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});