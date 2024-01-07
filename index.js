// Purpose: Lambda function to handle CRUD operations on DynamoDB table
import { DynamoDBClient } from "@aws-sdk/client-dynamodb";
import { DynamoDBDocumentClient, GetCommand, PutCommand, DeleteCommand, UpdateCommand, ScanCommand, QueryCommand } from "@aws-sdk/lib-dynamodb";
import express from "express";
import serverless from "serverless-http";

const app = express();

const USERS_TABLE = process.env.USERS_TABLE;
const client = new DynamoDBClient();
const dynamoDbClient = DynamoDBDocumentClient.from(client);

app.use(express.json());

app.get("/getUser/:userId/:timestamp", async function (req, res) {
  const params = {
    TableName: USERS_TABLE,
    Key: {
      userId: req.params.userId,
      timestamp: parseInt(req.params.timestamp),
    },
  };

  try {
    const { Item } = await dynamoDbClient.send(new GetCommand(params));
    if (Item) {
      const { userId, name, gender, age, timestamp } = Item;
      res.json({ userId, name, gender, age, timestamp });
    } else {
      res
        .status(404)
        .json({ error: 'Could not find user with provided "userId"' });
    }
  } catch (error) {
    console.log(error);
    res.status(500).json({ error: error,  message: "Could not retreive user" });
  }
});

app.post("/addUser", async function (req, res) {
  const { userId, name, gender, age } = req.body;
  if (typeof userId !== "string") {
    res.status(400).json({ error: '"userId" must be a string' });
  } else if (typeof name !== "string") {
    res.status(400).json({ error: '"name" must be a string' });
  }

  const params = {
    TableName: USERS_TABLE,
    Item: {
      userId: userId,
      name: name,
      gender: gender,
      age: age,
      timestamp: Date.now(),
    },
  };

  try {
    await dynamoDbClient.send(new PutCommand(params));
    res.json({ userId, name, gender, age });
  } catch (error) {
    console.log(error);
    res.status(500).json({ error: error,  message: "Could not create user" });
  }
});

app.post("/updateUser", async function (req, res) {
  const { userId, name, gender, age, timestamp } = req.body;
  if (typeof userId !== "string") {
    res.status(400).json({ error: '"userId" must be a string' });
  } else if (typeof name !== "string") {
    res.status(400).json({ error: '"name" must be a string' });
  }

  const params = {
    TableName: USERS_TABLE,
    Key: {
      userId: userId,
      timestamp: timestamp,
    },
    UpdateExpression: "set #name = :name, #gender = :gender, #age = :age",
    ExpressionAttributeNames: {
      "#name": "name",
      "#gender": "gender",
      "#age": "age",
    },
    ExpressionAttributeValues: {
      ":name": name,
      ":gender": gender,
      ":age": age,
    },
  };

  try {
    await dynamoDbClient.send(new UpdateCommand(params));
    res.json({ userId, name, gender, age, timestamp });
  } catch (error) {
    console.log(error);
    res.status(500).json({ error: error,  message: "Could not update user" });
  }
});

app.post("/deleteUser", async function (req, res) {
  const { userId, timestamp } = req.body;
  if (typeof userId !== "string") {
    res.status(400).json({ error: error,  message: '"userId" must be a string' });
  } 

  const params = {
    TableName: USERS_TABLE,
    Key: {
      userId: userId,
      timestamp: timestamp,
    },
  };

  try {
    await dynamoDbClient.send(new DeleteCommand(params));
    res.json({ userId, timestamp });
  } catch (error) {
    console.log(error);
    res.status(500).json({  error: error,  message: "Could not delete user" });
  }
});

app.get("/getAllUsers", async function (req, res) {
  const params = {
    TableName: USERS_TABLE,
  };

  try {
    const { Items } = await dynamoDbClient.send(new ScanCommand(params));
    if (Items) {
      res.json(Items);
    } else {
      res
        .status(404)
        .json({ error: 'Could not find any users' });
    }
  } catch (error) {
    console.log(error);
    res.status(500).json({ error: error,  message: "Could not retreive users" });
  }
});

app.use((req, res, next) => {
  return res.status(404).json({
    error: "Api Not Found",
  });
});

export const handler = serverless(app);
