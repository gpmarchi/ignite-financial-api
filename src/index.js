import express, { json } from 'express';
import { v4 as uuidv4 } from 'uuid';

const app = express();

app.use(express.json());

const customers = [];

function verifyExistingAccount(request, response, next) {
  const { cpf } = request.headers;

  const customer = customers.find(customer => customer.cpf === cpf);

  if (!customer) {
    return response.status(400).json({ error: 'Customer not found.' });
  }

  request.customer = customer;

  return next();
}

app.post('/account', (request, response) => {
  const { name, cpf } = request.body;

  const customerAlreadyExists = customers.some(customer => customer.cpf === cpf);

  if (customerAlreadyExists) {
    return response.status(400).json({ error: 'Customer already exists.' });
  }

  customers.push({
    cpf,
    name,
    id: uuidv4(),
    statement: [],
  });

  return response.status(201).send();
});

app.get('/statement', verifyExistingAccount, (request, response) => {
  const { customer } = request;

  return response.json(customer.statement);
});

app.post('/deposit', verifyExistingAccount, (request, response) => {
  const { amount, description } = request.body;

  const { customer } = request;

  const statementOperation = {
    description,
    amount,
    type: "credit",
    created_at: new Date(),
  };

  customer.statement.push(statementOperation);

  return response.status(201).send();
});

app.listen(3333);