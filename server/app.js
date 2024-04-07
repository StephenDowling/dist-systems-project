const express = require('express');
const path = require('path');
const grpc = require("@grpc/grpc-js");
const protoLoader = require("@grpc/proto-loader");

const app = express();

// Load protobuf definition
const PROTO_PATH = path.join(__dirname, "protos/retail.proto");
const packageDefinition = protoLoader.loadSync(PROTO_PATH);
const retail_proto = grpc.loadPackageDefinition(packageDefinition).retail;

// Serve static files from the 'public' directory
app.use(express.static(path.join(__dirname, 'public')));

// Parse JSON request bodies
app.use(express.json());

// Define route for handling POST requests to /totalValue
app.get('/totalValue', (req, res) => {
  // You can access the request body here
  const requestData = req.body;

  // Call your gRPC function totalValue here
  totalValue(requestData, (error, response) => {
    if (error) {
      res.status(500).send('Error getting total value of the cart');
    } else {
      res.status(200).json(response);
    }
  });
});

app.listen(3000, () => {
  console.log("App listening on port 3000")
})

var msg = ""
var removeMsg = ""
var cart = [];
var item = {
  name: "",
  price: 0
}
var total = 0

function addToCart(call, callback) {

    call.on('data', function(request) {
      var newItem = {
        name: request.name,
        price: request.price
      }
      cart.push(newItem)
      total+=request.price
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
}

function removeFromCart(call, callback) {
  // Extract the request object from the gRPC call
  const request = call.request;

  // Check if the item is in the cart
  var found = false;
  for (var i = 0; i < cart.length; i++) {
    if (request.name.toLowerCase() === cart[i].name.toLowerCase()) {
      // Remove the item from the cart
      total = total-cart[i].price;
      found = true;
      cart.splice(i, 1);


      console.log(cart); //print the cart to the console for clarity
      break; // Exit the loop after removing the item
    }
  }

  // Prepare the response message
  var responseMsg = found ? request.name + " was removed successfully" : request.name + " was not found in the cart";
  // Send the response back to the client
  callback(null, {
    removeMsg: responseMsg
  });
}


function totalValue(call, callback) {
  callback(null, {
    total:total
  });
}

function applyDiscount(call, callback) {
  var discountConf
  if(total == 0){
    discountConf = "There is nothing in your cart";
  }
  else{
    total = total*0.9
    total = Math.round((total + Number.EPSILON) * 100) / 100
    console.log(total)
    discountConf = "10% has been applied! Your new total is "+total
  }

  callback(null, {
    total:total,
    discountConf: discountConf
  })
}

function processPayment(call, callback){
  var paymentConfirmation;
  const request = call.request;

  if(request.cardNo.length!=16){
    paymentConfirmation = "Your card number must be 16 digits"
  }
  else{
    paymentConfirmation = "Congratulations, your payment has been processed. Your cart is now empty. Thank you for shopping with us!"
    total = 0;
    cart = [];
    console.log(cart)
  }
  callback(null, {
    paymentConfirmation: paymentConfirmation
  })
}



var server = new grpc.Server()
server.addService(retail_proto.Cart.service, { addToCart: addToCart, removeFromCart: removeFromCart, totalValue:totalValue, applyDiscount: applyDiscount, processPayment: processPayment })
server.bindAsync("0.0.0.0:40000", grpc.ServerCredentials.createInsecure(), function() {
  server.start()
})
