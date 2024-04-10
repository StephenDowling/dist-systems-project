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

//WebSocket

// wss.on('connection', function connection(ws) {
//   console.log('WebSocket connected');
//
//   // Handle messages from the client
//   ws.on('message', function incoming(message) {
//     console.log('Received message:', message);
//     // You can handle the received message here and send responses if needed
//   });
//
//   // Handle WebSocket disconnection
//   ws.on('close', function close() {
//     console.log('WebSocket disconnected');
//   });
// });

wss.on('connection', function(ws) {
    ws.on('message', function(message) {

        //console.log('Received message from client:', message);
        wss.clients.forEach(function(client) {
            if (client !== ws && client.readyState === WebSocket.OPEN) {
                client.send(message);
            }
        });
        // Parse message as JSON
        try {
            const data = JSON.parse(message);

            if (data.method === 'allergyInfo') {
                // Call the appropriate gRPC method
                allergyInfo(data.parameters);
            }

            // Handle the message
            console.log('Parsed message:', data);

            // Example: Make gRPC call based on the message
            if (data.method === 'contactSupport') {
                // Call the appropriate gRPC method
                contactSupport(data.parameters);
            }
        } catch (error) {
            console.error('Error parsing message:', error);
        }
    });
});


// Serve static files from the 'public' directory
app.use(express.static(path.join(__dirname, 'public')));

// Parse JSON request bodies
app.use(express.json());

//cart service

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

//query service

//price look up
app.get('/priceLookUp', (req, res) => {
  // You can access the request query parameters here
  const itemName = req.query.itemName;
  console.log("app.get() " + itemName);

  priceLookUp(itemName, (error, response) => {
    if (error) {
      // Handle error
      console.error('Error:', error);
      // Send error response if needed
      res.status(500).send('Error processing price lookup');
    } else {
      // Send response with priceMsg
      res.status(200).json(response);
    }
  });
});

//find product
app.get('/findProduct', (req, res) => {
  // You can access the request query parameters here
  const itemName = req.query.itemName;
  console.log("app.get() " + itemName);

  findProduct(itemName, (error, response) => {
    if (error) {
      // Handle error
      console.error('Error:', error);
      // Send error response if needed
      res.status(500).send('Error processing findProduct');
    } else {
      // Send response with priceMsg
      res.status(200).json(response);
    }
  });
});

//price look up

app.post('/customerFeedback', (req, res) => {
  // You can access the request body here

  const feedback = req.body.feedback;
  console.log("Request body:", req.body);
if (req.body && req.body.feedback) {
  console.log("Feedback:", req.body.feedback);
} else {
  console.error("Missing feedback in request body");
}
  // Call your gRPC function totalValue here
  // Check if itemName and itemPrice are defined
  if (feedback) {
    // Call your gRPC function addToCart here with itemName and itemPrice
    customerFeedback({ feedback: feedback}, (error, response) => {
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


app.listen(3000, () => {
  console.log("App listening on port 3000")
})

const PORT = process.env.PORT || 4000;
newServer.listen(PORT, function () {
  console.log(`WebSocket server listening on port ${PORT}`);
});

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
var allergyDataString = JSON.stringify(allergyData);

function priceLookUp(call, callback) {
  const itemName = call
  var priceMsg;

  if (itemName.toLowerCase() === "bread") {
    priceMsg = "The cost of " + itemName + " is $3.00";
  } else if (itemName.toLowerCase() === "tea") {
    priceMsg = "The cost of " + itemName + " is $1.50";
  } else if (itemName.toLowerCase() === "milk") {
    priceMsg = "The cost of " + itemName + " is $2.00";
  } else {
    priceMsg = "Unable to locate product. Please try a different product name.";
  }

  // Send the priceMsg back to the client
  callback(null, {
    priceMsg: priceMsg
  });
}

function findProduct(call, callback){
  var location;
  var name = call;
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

function allergyInfo(call, callback) {
  console.log("We are here");
  for (var i = 0; i < allergyData.length; i++) {
    call.write({
      allergy: allergyData[i].allergy,
      products: allergyData[i].products
    });
  }
  call.end();

}

function sendDataToClients() {
  wss.clients.forEach(function each(client) {
    if (client.readyState === WebSocket.OPEN) {
      client.send(allergyDataString);
      console.log(JSON.stringify(allergyDataString))
    }
  });
}

sendDataToClients(allergyData)

setTimeout(() => {
  const randomData = allergyData.toString();
  sendDataToClients(randomData);
}, 5000);

var clients = {}

function contactSupport(chat_message, call) {
    // Check if client with this name already exists
    if (!(chat_message.name in clients)) {
        clients[chat_message.name] = {
            name: chat_message.name,
            call: call
        };
    }

    // Access the client's call object and send the message if available
    if (clients[chat_message.name] && clients[chat_message.name].call) {
        clients[chat_message.name].call.send(JSON.stringify({
            name: chat_message.name,
            message: chat_message.message
        }));
    } else {
        console.error('Client not found or call object not available');
    }

    // call.on('end', function () {
    //     call.end();
    // });
    // call.on('error', function (e) {
    //     console.log(e);
    // });
}

function customerFeedback(call, callback){

  var feedback = call;
  console.log("Logging the following feedback: "+feedback.feedback);


  callback(null, {
    msg: "Your feedback has been received, thank you"
  })
}

const shopTills = [
    { tillNumber: 1, waitTime: Math.floor(Math. random()*10) },
    { tillNumber: 2, waitTime: Math.floor(Math. random()*10) },
    { tillNumber: 3, waitTime: Math.floor(Math. random()*10) },
    { tillNumber: 4, waitTime: Math.floor(Math. random()*10) },
    { tillNumber: 5, waitTime: Math.floor(Math. random()*10) }

];

function queueTime(call, callback){

  for (var i = 0; i < shopTills.length; i++) {
    call.write({
      tillNumber: shopTills[i].tillNumber,
      waitTime: shopTills[i].waitTime
    });
  }
  call.end();
}

function unlockTrolley(call, callback){

  var trolleyNumber = call.request.trolleyNumber
  if(trolleyNumber > 0 && trolleyNumber < 100){
    unlockMsg = "Trolley is unlocked, happy shopping!"
  } else{
    unlockMsg = "This trolley is unavailable, please try a different trolley number"
  }
  callback(null, {
    unlockMsg:unlockMsg
  })
}

function locateCar(call, callback){

  var carReg = call.request.carReg
  var parkingSpace
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
    parkingSpace = "Unable to locate your reg in the car park, please try again"
  }
  callback(null, {
    parkingSpace:parkingSpace
  })
}

var server = new grpc.Server()
server.addService(retail_proto.Cart.service, { addToCart: addToCart, removeFromCart: removeFromCart, totalValue:totalValue, applyDiscount: applyDiscount, processPayment: processPayment })
server.addService(query_proto.Query.service, {priceLookUp: priceLookUp, findProduct: findProduct, allergyInfo: allergyInfo, contactSupport: contactSupport, customerFeedback: customerFeedback})
server.addService(assisstance_proto.Assisstance.service, {queueTime: queueTime, unlockTrolley: unlockTrolley, locateCar: locateCar})
server.bindAsync("0.0.0.0:40000", grpc.ServerCredentials.createInsecure(), function() {
  server.start()
})
