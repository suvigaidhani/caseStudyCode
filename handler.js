'use strict';
const req = require('request');
const AWS = require('aws-sdk');
const db = new AWS.DynamoDB.DocumentClient({ apiVersion: '2012-08-10' });
//const uuid = require('uuid/v4');
const {"v4": uuidv4} = require('uuid');

const postsTable = process.env.POSTS_TABLE;
const userTable = process.env.USERS_TABLE;
const ordersTable = process.env.ORDERS_TABLE;
const ordersDetailsTable = process.env.ORDERS_DETAILS_TABLE;
const cartTable = process.env.CART_TABLE;


const swaggerJsDoc = require("swagger-jsdoc");
const swaggerUi = require("swagger-ui-express");



// Create a response
function response(statusCode, message) {
  return {
    statusCode: statusCode,
    body: JSON.stringify(message)
  };
}

/**
 @swageer
 * /registerUser:
 * post:
 * register new user to the website
 * responses:
 * '200':
 *  description : A successfull response
 */

 module.exports.registerUser = (event, context, callback) => {

  const reqBody =  JSON.parse(event.body);
 
   const user = {
     id: uuidv4(),
     createdAt: new Date().toISOString(),
     fname: reqBody.fname,
     lname: reqBody.lname,
     status: reqBody.status,
     userName:reqBody.userName,
     password:reqBody.password
   };
 
   return db
     .put({
       TableName: userTable,
       Item: user
     })
     .promise()
     .then(() => {
       callback(null, response(201, user));
     })
     .catch((err) => response(null, response(err.statusCode, err)));
 };
 
 //login user
 module.exports.userLogin = (event, context, callback) => {
  const userName = JSON.parse(event.body).userName;
  const password = JSON.parse(event.body).password;

 console.log('searching....');
return db
.scan({

 TableName:"user",
 KeyConditionExpression: "userName = :userName AND password = :password ",

})
   .promise()
   .then((res) => {
     console.log(res.Items);
     if (res.Items) callback(null, response(200,{message:"Login successfully!!"}));
     else if(res.Items == []) callback(null, response(400,{message:"Enter valid Username and password!"}));
   })
   .catch((err) => callback(null, response(err.statusCode, err)));

};



 module.exports.placeOrders = (event, context, callback) => {

  const reqBody =  JSON.parse(event.body);
   const order = {
     id: uuidv4(),
     createdAt: new Date().toISOString(),
     user_id: reqBody.user_id,
     order_amount: reqBody.order_amount,
     payment_method: reqBody.payment_method,
     order_details:reqBody.order_details

   };
   const order_id = order.id;

   const orderDetails = {
    id: uuidv4(),
    createdAt: new Date().toISOString(),
    order_id: order_id,
  };
   console.log("order id current one :",orderDetails)
 
   return db
     .put({
       TableName: ordersTable,
       Item: order
     })
     .promise()
     .then(() => {
       callback(null, response(201, order));
     })
     .catch((err) => response(null, response(err.statusCode, err)));
 };


 module.exports.addToCart = (event, context, callback) => {

  const reqBody =  JSON.parse(event.body);
  const product_total_amount = reqBody.product_price * reqBody.product_quantity;
   
  const productDetails = {
     id: uuidv4(),
     createdAt: new Date().toISOString(),
     user_id: reqBody.user_id,
     product_id: reqBody.product_id,
     product_quantity: reqBody.product_quantity,
     product_price: reqBody.product_pricez,
     product_total_amount:product_total_amount
   };

   return db
     .put({
       TableName: cartTable,
       Item: productDetails
     })
     .promise()
     .then(() => {
       callback(null, response(201, productDetails));
     })
     .catch((err) => response(null, response(err.statusCode, err)));
 };

 module.exports.removeFromCart = (event, context, callback) => {
  const id = event.pathParameters.id;
  const params = {
    Key: {
      id:id
    },
    TableName: cartTable
  };
  return db
    .delete(params)
    .promise()
    .then(() =>
      callback(null, response(200, { message: 'Product removed from your cart!' }))
    )
    .catch((err) => callback(null, response(err.statusCode, err)));
};

// update user profile
module.exports.updateUserProfile = (event, context, callback) => {
  const id = event.pathParameters.id;
  const reqBody = JSON.parse(event.body);
  const { fname, lname, userName, password, ustatus } = reqBody;

  const params = {
    Key: {
      id: id
    },
    TableName: userTable,
    ConditionExpression: 'attribute_exists(id)',
    UpdateExpression: 'SET fname = :fname, lname = :lname, ustatus = :ustatus, userName = :userName, password = :password',
    ExpressionAttributeValues: {
      ':fname': fname,
      ':lname': lname,
      ':userName':userName,
      ':password':password,
      ':ustatus':ustatus
    },
    ReturnValues: 'ALL_NEW'
  };
  console.log('Updating');

  return db
    .update(params)
    .promise()
    .then((res) => {
      console.log(res);
      callback(null, response(200, res.Attributes));
    })
    .catch((err) => callback(null, response(err.statusCode, err)));
};

//search  product
module.exports.searchProduct = (event, context, callback) => {
   const product_name = JSON.parse(event.body).product_name;

  console.log('searching....');
return db
.scan({

  TableName:"product",
  FilterExpression:"contains(product_name, :product_name)",
  ExpressionAttributeValues:{
    ":product_name":product_name
  }

})
    .promise()
    .then((res) => {
      console.log(res.Items);
      callback(null, response(200, res.Items ));
    })
    .catch((err) => callback(null, response(err.statusCode, err)));

};


// get all orders of user
module.exports.getAllOrdersOFUser = (event, context, callback) => {
  const user_id = JSON.parse(event.body).user_id;

 console.log('searching....');
return db
.scan({

 TableName:"orders",
 FilterExpression:"contains(user_id, :user_id)",
 ExpressionAttributeValues:{
   ":user_id":user_id
 }

})
   .promise()
   .then((res) => {
     console.log(res.Items);
     if(res.Items) callback(null, response(200, res.Items ));
     else if(!res.Items) callback(null, response(404, { error: 'Orders not found' }));

   })
   .catch((err) => callback(null, response(err.statusCode, err)));

};
