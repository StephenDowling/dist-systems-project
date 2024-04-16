const express = require('express');
const path = require('path');
const grpc = require("@grpc/grpc-js");
const protoLoader = require("@grpc/proto-loader");
const http = require('http');
const WebSocket = require('ws');
var {createServer} = require("http");
var { Server } = require("socket.io");

const app = express();
const newServer = http.createServer(app);
const wss = new WebSocket.Server({ server: newServer });

// Load protobuf definition
const PROTO_PATH = path.join(__dirname, "protos/retail.proto");
const PROTO_PATH_QUERY = path.join(__dirname, "protos/query.proto");
const PROTO_PATH_ASSISSTANCE = path.join(__dirname, "protos/assisstance.proto");
const packageDefinition = protoLoader.loadSync(PROTO_PATH);
const packageDefinitionQuery = protoLoader.loadSync(PROTO_PATH_QUERY);
const packageDefinitionAssisstance = protoLoader.loadSync(PROTO_PATH_ASSISSTANCE);
const retail_proto = grpc.loadPackageDefinition(packageDefinition).retail;
const query_proto = grpc.loadPackageDefinition(packageDefinitionQuery).query;
const assisstance_proto = grpc.loadPackageDefinition(packageDefinitionAssisstance).assisstance;
var client = new retail_proto.Cart("0.0.0.0:40000", grpc.credentials.createInsecure());
var clientQuery = new query_proto.Query("0.0.0.0:40000", grpc.credentials.createInsecure());
var clientAssisstance = new assisstance_proto.Assisstance("0.0.0.0:40000", grpc.credentials.createInsecure());

// ********** CART SERVICE ********** //

//declaring variables globally for us in numerous functions
var msg = ""
var removeMsg = ""
var cart = [];
var item = {
  name: "",
  price: 0
}
var total = 0

//addToCart
function addToCart(call, callback) {
    call.on('data', function(request) { //create new item with the name and price provided
      var newItem = {
        name: request.name,
        price: request.price
      }
      cart.push(newItem) //add this new item to the cart array
      total+=parseFloat(request.price) //increase the total by the price
      console.log("Added item: "+newItem.name) //printed to the console for clarity
      console.log(cart) //print the cart for clarity
      console.log("total is now "+total) //print new total for clarity
    })

    call.on('end', function() {
      callback(null, {
        msg: "item(s) added succesfully" //response message to client
      })
    })

    call.on('error', function(e) {
      console.log("An error occured") //in case of error
    })
}//addToCart

//remove from cart
function removeFromCart(call, callback) {
  //extract request object from the gRPC call
  const request = call.request
  console.log("Name of item to remove = "+call.request.name) //for clarity


  if (!request) {
    callback(new Error('Invalid request. Missing item name.')); //handle errors
    return;
  }

  //check if the item is in the cart
  var found = false;
  for (var i = 0; i < cart.length; i++) {
    if (request.name.toLowerCase() === cart[i].name.toLowerCase()) {
      //Remove the item from the cart
      total = total-cart[i].price;
      found = true;
      cart.splice(i, 1); //actual removal
      break; //exit the loop after removing the item
    }
  }
  //response message
  var responseMsg = found ? request.name + " was removed successfully" : request.name+ " was not found in the cart";
  console.log(responseMsg)
  //send the response back to the client
  callback(null, {
    removeMsg: responseMsg
  });
}

//totalValue
function totalValue(call, callback) {
  total=Math.round((total + Number.EPSILON) * 100) / 100 //round it up to two decimal places
  callback(null, {
    total:total //send it back to the client
  });
}//totalValue

//applyDiscount
function applyDiscount(call, callback) {
  var discountConf //response message
  if(total == 0){
    discountConf = "There is nothing in your cart"; //handle errors
  }
  else{
    total = total*0.9 //reduce by ten percent
    total = Math.round((total + Number.EPSILON) * 100) / 100 //round up to two decimal places
    console.log(total) //for clarity
    discountConf = "10% has been applied! Your new total is €"+total //response message
  }

  callback(null, { //send back to the client
    total:total,
    discountConf: discountConf
  })
}//applyDiscount

//processPayment
function processPayment(call, callback){
  var paymentConfirmation; //response message
  const request = call.request; //get the request from the call object

  if(cart.length === 0){//exception handling
    paymentConfirmation = "There is nothing in your cart!"
  }
  else if(request.cardNo.length!=16){//more exception handling
    paymentConfirmation = "Your card number must be 16 digits"
  }
  else{
    paymentConfirmation = "Congratulations, your payment has been processed. Your cart is now empty. Thank you for shopping with us!"
    total = 0; //clear total
    cart = []; //clear cart
    console.log(paymentConfirmation) //for clarity
    console.log("Cart = "+cart) //for clarity
  }
  callback(null, {
    paymentConfirmation: paymentConfirmation //send back to client
  })
}//processPayment

// ********** QUERY SERVICE ********** //

var allergyData = [ //array of data about allergies that will be sent to the client when requested
  {
    allergy:"nuts",
    products: "Cookies, Cereals, Sauces"
  },
  {
    allergy:"gluten",
    products: "Beer, Bread, Cake"
  },
  {
    allergy:"eggs",
    products: "Mayonnaise, Processed meat, Baked goods"
  },
  {
    allergy:"fish",
    products: "Sushi, Salad dressing, Fish oil"
  },
  {
    allergy:"shellfish",
    products: "Crab, Lobster, Shrimp"
  }
]

//priceLookUp
function priceLookUp(call, callback) {
  // Array of items with name and price
  const items = [
    { name: "bread", price: 3.00 },
    { name: "tea", price: 1.50 },
    { name: "milk", price: 2.00 }
  ];

  const itemName = call.request.name.toLowerCase(); //extract name from call object

  //find the item in the array
  const item = items.find(item => item.name === itemName);

  //response message based on whether the item is found or not
  const priceMsg = item
    ? `The cost of ${item.name} is €${item.price.toFixed(2)}`
    : "Unable to locate product. Please try a different product name.";

  //send priceMsg back to the client
  callback(null, { priceMsg });
}//priceLookUp

//findProduct
function findProduct(call, callback) {
  //array of products with name and location
  const products = [
    { name: "bread", location: "aisle 1" },
    { name: "tea", location: "aisle 2" },
    { name: "milk", location: "aisle 3" }
  ];

  const name = call.request.name.toLowerCase(); //extract name

  //find the product in the array
  const product = products.find(product => product.name === name);

  //response message based on whether the product is found or not
  const location = product
    ? `${product.name} is located on ${product.location}`
    : "Unable to locate product, please try a different product name";

  //send the location back to the client
  callback(null, { location });
}//findProduct

//allergyInfo
function allergyInfo(call, callback) {
  try{
    for (var i = 0; i < allergyData.length; i++) {
      call.write({
        allergy: allergyData[i].allergy, //write the data from the array declared earlier
        products: allergyData[i].products
      });
    }
    call.end();
  } catch(error){
    console.log("Error in allergyInfo", error) //handle errors
  }
}//allergyInfo

//contactSupport
var clients = {} //for storing names of people who log onto the chat, so customer is not asked name twice


//creating the server
var httpServer = createServer ((req, res) => {
});

//description about the metadata (head), can use any methods
var io = new Server(httpServer, {
cors:{
  origin: '*',
  methods: '*'
}
});

//get the connection
io.on("connection", function(socket){
  console.log(`connect ${socket.id}`);
//capturing the communication
  socket.on('chat message', function(msg){
    io.emit('chat message', msg);
  });
//capturing information about the disconnection
  socket.on("disconnect", function(reason){
    console.log(`disconnect ${socket.id} due to ${reason}`)
  });
});

//server is listening in this port
httpServer.listen(8081);

function contactSupport(call){



    call.on('data', function(chat_message){
      if(!(chat_message.name in clients)){ //if name is not in clients array do this
        clients[chat_message.name] = { //add the name to the clients array
          name: chat_message.name,
          call: call}
      }
      for(var client in clients){
        clients[client].call.write({
          name: chat_message.name, //name of person sending the message
          message: chat_message.message //actual message
        })
      }
    })
    call.on('end', function(){
      call.end();
    })
    call.on('error', function(e){ //handle errors
      console.log(e)
    })
}//contactSupport

//customerFeedback
function customerFeedback(call, callback){

  var feedback = call.request.feedback; //extract data from call
  console.log("Logging the following feedback: "+feedback); //logging for clarity and so the feedback is logged somewhere


  callback(null, {
    msg: "Your feedback has been received, thank you" //send this back to the client
  })
}//customerFeedback

// ********** ASSISSTANCE SERVICE ********** //

const shopTills = [ //array of data about the tills that will be sent to the client
  //each till number has a randomly generated number of minutes wait time (between 0 and 9)
    { tillNumber: 1, waitTime: Math.floor(Math. random()*10) },
    { tillNumber: 2, waitTime: Math.floor(Math. random()*10) },
    { tillNumber: 3, waitTime: Math.floor(Math. random()*10) },
    { tillNumber: 4, waitTime: Math.floor(Math. random()*10) },
    { tillNumber: 5, waitTime: Math.floor(Math. random()*10) }

];

//queueTime
function queueTime(call, callback){

  for (var i = 0; i < shopTills.length; i++) {
    call.write({ //using a loop to send this data back to the client
      tillNumber: shopTills[i].tillNumber,
      waitTime: shopTills[i].waitTime
    });
  }
  call.end();
}//queueTime

//unlockTrolley
function unlockTrolley(call, callback){
  var trolleyNumber = call.request.trolleyNumber //extract data from call
  if(isNaN(trolleyNumber)){ //needs to be a number
    unlockMsg = "This trolley is unavailable, please try a different trolley number"
  } else{
    unlockMsg = "Trolley is unlocked, happy shopping!"
  }
  callback(null, {
    unlockMsg:unlockMsg //send response back to the client
  })
}//unlockTrolley

//locateCar
function locateCar(call, callback){

  var carReg = call.request.carReg //extract data from call
  console.log(carReg) //print for clarity
  //testing out few different options
  if(carReg > 0 && carReg < 100){
    parkingSpace = "You are parked in space number 23"
  }
  else if(carReg >= 100 && carReg < 200){
    parkingSpace = "You are parked in space number 43"
  }
  else if(carReg >= 200 && carReg < 300){
    parkingSpace = "You are parked in space number 63"
  }
  else{
    parkingSpace = "Unable to locate your car in the car park, please try again"
  }
  callback(null, {
    parkingSpace:parkingSpace //send this back to the client
  })
}//locateCar


var server = new grpc.Server()
server.addService(retail_proto.Cart.service, { addToCart: addToCart, removeFromCart: removeFromCart, totalValue:totalValue, applyDiscount: applyDiscount, processPayment: processPayment })
server.addService(query_proto.Query.service, {priceLookUp: priceLookUp, findProduct: findProduct, allergyInfo: allergyInfo, contactSupport: contactSupport, customerFeedback: customerFeedback})
server.addService(assisstance_proto.Assisstance.service, {queueTime: queueTime, unlockTrolley: unlockTrolley, locateCar: locateCar})
server.bindAsync("0.0.0.0:40000", grpc.ServerCredentials.createInsecure(), function() {
  server.start()
})
