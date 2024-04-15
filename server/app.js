const express = require('express');
const path = require('path');
const grpc = require("@grpc/grpc-js");
const protoLoader = require("@grpc/proto-loader");
const http = require('http');
const WebSocket = require('ws');

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
    call.on('data', function(request) {
      var newItem = {
        name: request.name,
        price: request.price
      }
      cart.push(newItem)
      total+=parseFloat(request.price)
      console.log("Added item: "+newItem.name)
      console.log(cart)
      console.log("total is now "+total)
    })

    call.on('end', function() {
      callback(null, {
        msg: "item(s) added succesfully"
      })
    })

    call.on('error', function(e) {
      console.log("An error occured")
    })
}//addToCart

//remove from cart
function removeFromCart(call, callback) {
  // Extract the request object from the gRPC call
  const request = call.request
  console.log("Name of item to remove = "+call.request.name)


  if (!request) {
    callback(new Error('Invalid request. Missing item name.'));
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
  // Send the response back to the client
  callback(null, {
    removeMsg: responseMsg
  });
}

//totalValue
function totalValue(call, callback) {
  total=Math.round((total + Number.EPSILON) * 100) / 100
  callback(null, {
    total:total
  });
}//totalValue

//applyDiscount
function applyDiscount(call, callback) {
  var discountConf
  if(total == 0){
    discountConf = "There is nothing in your cart";
  }
  else{
    total = total*0.9
    total = Math.round((total + Number.EPSILON) * 100) / 100
    console.log(total)
    discountConf = "10% has been applied! Your new total is €"+total
  }

  callback(null, {
    total:total,
    discountConf: discountConf
  })
}//applyDiscount

//processPayment
function processPayment(call, callback){
  var paymentConfirmation;
  const request = call.request;

  if(cart.length === 0){
    paymentConfirmation = "There is nothing in your cart!"
  }
  else if(request.cardNo.length!=16){
    paymentConfirmation = "Your card number must be 16 digits"
  }
  else{
    paymentConfirmation = "Congratulations, your payment has been processed. Your cart is now empty. Thank you for shopping with us!"
    total = 0;
    cart = [];
    console.log(paymentConfirmation)
    console.log("Cart = "+cart)
  }
  callback(null, {
    paymentConfirmation: paymentConfirmation
  })
}//processPayment

// ********** QUERY SERVICE ********** //

var allergyData = [
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
const shopTills = [
  //each till number has a randomly generated number of minutes wait time (between 0 and 9)
    { tillNumber: 1, waitTime: Math.floor(Math. random()*10) },
    { tillNumber: 2, waitTime: Math.floor(Math. random()*10) },
    { tillNumber: 3, waitTime: Math.floor(Math. random()*10) },
    { tillNumber: 4, waitTime: Math.floor(Math. random()*10) },
    { tillNumber: 5, waitTime: Math.floor(Math. random()*10) }

];

//priceLookUp
function priceLookUp(call, callback) {
  // Array of items with name and price
  const items = [
    { name: "bread", price: 3.00 },
    { name: "tea", price: 1.50 },
    { name: "milk", price: 2.00 }
  ];

  const itemName = call.request.name.toLowerCase();

  // Find the item in the array
  const item = items.find(item => item.name === itemName);

  // Prepare response message based on whether the item is found or not
  const priceMsg = item
    ? `The cost of ${item.name} is €${item.price.toFixed(2)}`
    : "Unable to locate product. Please try a different product name.";

  // Send the priceMsg back to the client
  callback(null, { priceMsg });
}//priceLookUp

//findProduct
function findProduct(call, callback) {
  // Array of products with name and location
  const products = [
    { name: "bread", location: "aisle 1" },
    { name: "tea", location: "aisle 2" },
    { name: "milk", location: "aisle 3" }
  ];

  const name = call.request.name.toLowerCase();

  // Find the product in the array
  const product = products.find(product => product.name === name);

  // Prepare response message based on whether the product is found or not
  const location = product
    ? `${product.name} is located on ${product.location}`
    : "Unable to locate product, please try a different product name";

  // Send the location back to the client
  callback(null, { location });
}//findProduct

//allergyInfo
function allergyInfo(call, callback) {
  try{
    for (var i = 0; i < allergyData.length; i++) {
      call.write({
        allergy: allergyData[i].allergy,
        products: allergyData[i].products
      });
    }
    call.end();
  } catch(error){
    console.log("Error in allergyInfo", error)
  }
}//allergyInfo


var clients = {}
//contactSupport
function contactSupport(call){
    call.on('data', function(chat_message){
      if(!(chat_message.name in clients)){
        clients[chat_message.name] = {
          name: chat_message.name,
          call: call}
      }
      for(var client in clients){
        clients[client].call.write({
          name: chat_message.name,
          message: chat_message.message
        })
      }
    })
    call.on('end', function(){
      call.end();
    })
    call.on('error', function(e){
      console.log(e)
    })
}//contactSupport

//customerFeedback
function customerFeedback(call, callback){

  var feedback = call.request.feedback;
  console.log("Logging the following feedback: "+feedback);


  callback(null, {
    msg: "Your feedback has been received, thank you"
  })
}//customerFeedback

// ********** ASSISSTANCE SERVICE ********** //

//queueTime
function queueTime(call, callback){

  for (var i = 0; i < shopTills.length; i++) {
    call.write({
      tillNumber: shopTills[i].tillNumber,
      waitTime: shopTills[i].waitTime
    });
  }
  call.end();
}//queueTime

//unlockTrolley
function unlockTrolley(call, callback){
  var trolleyNumber = call.request.trolleyNumber
  if(isNaN(trolleyNumber)){
    unlockMsg = "This trolley is unavailable, please try a different trolley number"
  } else{
    unlockMsg = "Trolley is unlocked, happy shopping!"
  }
  callback(null, {
    unlockMsg:unlockMsg
  })
}//unlockTrolley

//locateCar
function locateCar(call, callback){

  var carReg = call.request.carReg
  console.log(carReg)
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
    parkingSpace:parkingSpace
  })
}//locateCar


var server = new grpc.Server()
server.addService(retail_proto.Cart.service, { addToCart: addToCart, removeFromCart: removeFromCart, totalValue:totalValue, applyDiscount: applyDiscount, processPayment: processPayment })
server.addService(query_proto.Query.service, {priceLookUp: priceLookUp, findProduct: findProduct, allergyInfo: allergyInfo, contactSupport: contactSupport, customerFeedback: customerFeedback})
server.addService(assisstance_proto.Assisstance.service, {queueTime: queueTime, unlockTrolley: unlockTrolley, locateCar: locateCar})
server.bindAsync("0.0.0.0:40000", grpc.ServerCredentials.createInsecure(), function() {
  server.start()
})
