const express = require('express');
const path = require('path');
const grpc = require("@grpc/grpc-js");
const protoLoader = require("@grpc/proto-loader");

const app = express();

// Load protobuf definition
const PROTO_PATH = path.join(__dirname, "protos/retail.proto");
const PROTO_PATH_QUERY = path.join(__dirname, "protos/query.proto");
const packageDefinition = protoLoader.loadSync(PROTO_PATH);
const packageDefinitionQuery = protoLoader.loadSync(PROTO_PATH_QUERY);
const retail_proto = grpc.loadPackageDefinition(packageDefinition).retail;
const query_proto = grpc.loadPackageDefinition(packageDefinitionQuery).query;

// Serve static files from the 'public' directory
app.use(express.static(path.join(__dirname, 'public')));

// Parse JSON request bodies
app.use(express.json());

// addToCart
app.post('/addToCart', (req, res) => {
  // You can access the request body here

  const itemName = req.body.itemName;
  const itemPrice = req.body.itemPrice;
  console.log("Request.body = "+req.body)
  console.log("Request.body.itemName = "+req.body.itemName)
  console.log("Request.body.price = "+req.body.itemPrice)
  // Call your gRPC function totalValue here
  // Check if itemName and itemPrice are defined
  if (itemName && itemPrice) {
    // Call your gRPC function addToCart here with itemName and itemPrice
    addToCart({ name: itemName, price: itemPrice }, (error, response) => {
      if (error) {
        res.status(500).send('Error adding item to the cart');
      } else {
        res.status(200).json(response);
      }
    });
  } else {
    // Respond with a 400 Bad Request if itemName or itemPrice is missing
    res.status(400).send('Item name or price is missing');
  }
});

//removeFromCart
app.delete('/removeFromCart', (req, res) => {
  const itemName = req.body.itemName;
  console.log("item to remove = "+itemName);
  removeFromCart(itemName, (error, response) => {
    if (error) {
      res.status(500).send('Error removing item from the cart');
    } else {
      res.status(200).send('Item removed from the cart');
    }
  });
})

// Define route for handling GET requests to /totalValue
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

// Define route for handling GET requests to /applyDiscount
app.get('/applyDiscount', (req, res) => {
  // You can access the request body here
  const requestData = req.body;

  // Call your gRPC function applyDiscount here
  applyDiscount(requestData, (error, response) => {
    if (error) {
      res.status(500).send('Error applying discount to this cart');
    } else {
      res.status(200).json(response);
    }
  });
});

// process payment
app.delete('/processPayment', (req, res) => {
  const cardNo = req.body.cardNo;
  console.log("card number to process payment "+cardNo)

  processPayment(cardNo, (error, response) => {
    if (error) {
      res.status(500).send('Error processing payment');
    } else {
      res.status(200).send('Payment processed');
    }
  })
})


app.listen(3000, () => {
  console.log("App listening on port 3000")
})

//cart service

var msg = ""
var removeMsg = ""
var cart = [];
var item = {
  name: "",
  price: 0
}
var total = 0

function addToCart(request, call, callback) {

    // call.on('data', function(request) {
      var newItem = {
        name: request.name,
        price: request.price
      }
      cart.push(newItem)
      total+=parseFloat(request.price)
      console.log("Added item: "+newItem.name)
      console.log(cart)
      console.log("total is now "+total)
    //})

    // // call.on('end', function() {
    //   callback(null, {
    //     msg: "item(s) added succesfully"
    //   })
    // // })

    // // call.on('error', function(e) {
    //   console.log("An error occured")
    // // })
}

function removeFromCart(request, call, callback) {
  // Extract the request object from the gRPC call
  //const request = call.request;
  console.log("request = "+request)
  //console.log("name = "+request.name)

  // Check if request is defined and has a 'name' property
  if (!request) {
    callback(new Error('Invalid request. Missing item name.'));
    return;
  }

  // Check if the item is in the cart
  var found = false;
  for (var i = 0; i < cart.length; i++) {
    if (request.toLowerCase() === cart[i].name.toLowerCase()) {
      // Remove the item from the cart
      total = total-cart[i].price;
      found = true;
      cart.splice(i, 1);


      console.log(cart); //print the cart to the console for clarity
      break; // Exit the loop after removing the item
    }
  }

  // Prepare the response message
  var responseMsg = found ? request + " was removed successfully" : request+ " was not found in the cart";
  console.log(responseMsg)
  // Send the response back to the client
  // callback(null, {
  //   removeMsg: responseMsg
  // });
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

function processPayment(request, call, callback){
  var paymentConfirmation;
  //const request = call.request;

  if(request.length!=16){
    paymentConfirmation = "Your card number must be 16 digits"
  }
  else{
    paymentConfirmation = "Congratulations, your payment has been processed. Your cart is now empty. Thank you for shopping with us!"
    total = 0;
    cart = [];
    console.log(cart)
    console.log(paymentConfirmation)
  }
  // callback(null, {
  //   paymentConfirmation: paymentConfirmation
  // })
}

//query service

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

function priceLookUp(call, callback){
  var price, priceMsg;
  var name = call.request.name;
  console.log(name);
  if(name.toLowerCase() == "bread"){
    price = 3.00;
    priceMsg = "The cost of "+name+" is "+price;
  } else if(name.toLowerCase() == "tea"){
    price = 1.50;
    priceMsg = "The cost of "+name+" is "+price;
  } else if(name.toLowerCase() == "milk"){
    price = 2.00
    priceMsg = "The cost of "+name+" is "+price;
  } else{
    priceMsg = "Unable to locate product, please try a different product name"
  }

  console.log(priceMsg);
  callback(null, {
    priceMsg: priceMsg
  })
}

function findProduct(call, callback){
  var location;
  var name = call.request.name;
  console.log(name);
  if(name.toLowerCase() == "bread"){
    location = name+" is located on aisle 1"
  } else if(name.toLowerCase() == "tea"){
    location = name+" is located on aisle 2"
  } else if(name.toLowerCase() == "milk"){
    location = name+" is located on aisle 3"
  } else{
    location = "Unable to locate product, please try a different product name"
  }

  console.log(location);
  callback(null, {
    location: location
  })
}

function allergyInfo(call, callback){
  for(var i = 0;i < allergyData.length; i++){
    call.write({
      allergy: allergyData[i].allergy,
      products: allergyData[i].products
    })
  }
  call.end()
}


var clients = {}

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
}

var server = new grpc.Server()
server.addService(retail_proto.Cart.service, { addToCart: addToCart, removeFromCart: removeFromCart, totalValue:totalValue, applyDiscount: applyDiscount, processPayment: processPayment })
server.addService(query_proto.Query.service, {priceLookUp: priceLookUp, findProduct: findProduct, allergyInfo: allergyInfo, contactSupport: contactSupport})
server.bindAsync("0.0.0.0:40000", grpc.ServerCredentials.createInsecure(), function() {
  server.start()
})
