var readlineSync = require('readline-sync')
var grpc = require("@grpc/grpc-js")
var protoLoader = require("@grpc/proto-loader")
var PROTO_PATH = __dirname + "/protos/cart.proto"

var packageDefinition = protoLoader.loadSync(PROTO_PATH)
var cart_proto = grpc.loadPackageDefinition(packageDefinition).cart
var client = new cart_proto.TotalCart("0.0.0.0:40000", grpc.credentials.createInsecure());

var call = client.totalCartValue(function(error, response) {

  if(error){
    console.log("An error occured")
  } else{
    console.log("You have ordered " + response.count + " items, the total cost is: " + response.price + ". Your receipt is printed below: ")
    console.log(response.receipt)
    console.log("Thank you for shopping with us!")
  }
})

while(true) {
  var item_name = readlineSync.question("What is the item called? (q to Quit): ")
  if(item_name.toLowerCase() === 'q') {
    break
  }
  var price = readlineSync.question("How much does the item cost?: ")

  call.write({
    name: item_name,
    price: price
  })
}

call.end()

// var product_proto = grpc.loadPackageDefinition(packageDefinition).productinfo
// var client2 = new product_proto.getProductInfo("0.0.0.0:40000", grpc.credentials.createInsecure());
// 
// var call = client2.ProductInfo({ });
//
// call.on('data', function(response) {
//   console.log("Name: "+response.name)
//   console.log("Description: "+response.description)
//   console.log("Price: "+response.price)
//   console.log("In stock: "+response.stock)
//   console.log("*****")
// });
//
// call.on('end', function() {
//
// });
//
// call.on('error', function(e) {
//   console.log(e)
// });
