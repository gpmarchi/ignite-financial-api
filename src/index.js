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

function getBalance(statement) {
  const balance = statement.reduce((accumulator, operation) => {
    if (operation.type === 'credit') {
      return accumulator + operation.amount;
    }

    return accumulator - operation.amount;
  }, 0);

  return balance;
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
    type: 'credit',
    created_at: new Date(),
  };

  customer.statement.push(statementOperation);

  return response.status(201).send();
});

app.post('/withdrawal', verifyExistingAccount, (request, response) => {
  const { amount, description } = request.body;

  const { customer } = request;

  const balance = getBalance(customer.statement);

  if (balance < amount) {
    return response.status(400).json({ error: 'Insufficient funds.' });
  }

  const statementOperation = {
    description,
    amount,
    type: 'debit',
    created_at: new Date(),
  };

  customer.statement.push(statementOperation);

  return response.status(201).send();
});

app.get('/statement/date', verifyExistingAccount, (request, response) => {
  const { customer } = request;
  const { date } = request.query;

  const dateFormat = new Date(date + " 00:00");

  const statement = customer.statement.filter(
    operation =>
      operation.created_at.toDateString() ===
      new Date(dateFormat).toDateString()
  );

  return response.json(statement);
});

app.put('/account', verifyExistingAccount, (request, response) => {
  const { name } = request.body;

  const { customer } = request;

  customer.name = name;

  return response.status(200).send();
});

app.get('/account', verifyExistingAccount, (request, response) => {
  const { customer } = request;

  return response.json(customer);
});

app.delete('/account', verifyExistingAccount, (request, response) => {
  const { customer } = request;

  customers.splice(customer, 1);

  return response.status(200).json(customers);
});

app.get('/balance', verifyExistingAccount, (request, response) => {
  const { customer } = request;

  const balance = getBalance(customer.statement);

  return response.json({ balance });
});

app.listen(3333);