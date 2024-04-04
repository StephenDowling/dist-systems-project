var grpc = require("@grpc/grpc-js")
var protoLoader = require("@grpc/proto-loader")
var PROTO_PATH = __dirname + "/protos/retail.proto"
var packageDefinition = protoLoader.loadSync(
  PROTO_PATH
)
var retail_proto = grpc.loadPackageDefinition(packageDefinition).retail

var msg = ""
var removeMsg = ""
var cart = [];
var item = {
  name: "",
  price: 0
}

function addToCart(call, callback) {
  
    call.on('data', function(request) {
      var newItem = {
        name: request.name,
        price: request.price
      }
      cart.push(newItem)
      msg = "item added succesfully"
      console.log("Added item: "+newItem.name)
      console.log(cart)
    })

    call.on('end', function() {
      callback(null, {
        msg: msg
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
      cart.splice(i, 1);
      found = true;
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




var server = new grpc.Server()
server.addService(retail_proto.Cart.service, { addToCart: addToCart, removeFromCart: removeFromCart })
server.bindAsync("0.0.0.0:40000", grpc.ServerCredentials.createInsecure(), function() {
  server.start()
})
