import express, { json } from 'express';
import { v4 as uuidv4 } from 'uuid';

const app = express();

app.use(json());

const customers = [];

app.post('/account', (request, response) => {
  const { name, cpf } = request.body;

  const id = uuidv4();

  customers.push({
    cpf,
    name,
    id,
    statement: [],
  });

  return response.status(201).send();
});

app.listen(3333);