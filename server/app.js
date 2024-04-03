var grpc = require("@grpc/grpc-js")
var protoLoader = require("@grpc/proto-loader")
var PROTO_PATH = __dirname + "/protos/retail.proto"
var packageDefinition = protoLoader.loadSync(
  PROTO_PATH
)
var retail_proto = grpc.loadPackageDefinition(packageDefinition).retail

var msg = ""
var cart = [];
var item = {
  name: "",
  price: 0
}

function addToCart(call, callback) {
  msg = "item added succesfully"
  call.on('data', function(request) {
    var newItem = {
      name: request.name,
      price: request.price
    }
    cart.push(newItem)

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


// function totalCartValue(call, callback) {
//   var count = 0
//   var price = 0
//   var receipt = ""
//
//   call.on('data', function(request) {
//     price += request.price
//     count += 1
//     receipt += request.name+", €"+request.price+"\n"
//   })
//
//   call.on('end', function() {
//     callback(null, {
//       count: count,
//       price: price,
//       receipt: receipt
//     })
//   })
//
//   call.on('error', function(e) {
//     console.log("An error occured")
//   })
// }

// var data = [
//   {
//     name: "Bread",
//     description: "A loaf of fresh bread",
//     price: 2.00,
//     stock: true
//   },
//   {
//     name: "Milk",
//     description: "A litre of low fat milk",
//     price: 1.50,
//     stock: true
//   },
//   {
//     name: "Fish",
//     description: "Fresh catch of the day",
//     price: 4.00,
//     stock: true
//   },
//   {
//     name: "Onions",
//     description: "A net of brown onions",
//     price: 1.00,
//     stock: false
//   },
//   {
//     name: "Peppers",
//     description: "A packet of bell peppers",
//     price: 1.50,
//     stock: true
//   }
// ]
//
//
//
// function getProductInfo(call, callback) {
//   for(var i = 0;i < data.length; i++){
//     call.write({
//       name: data[i].name,
//       description: data[i].description,
//       price: data[i].price,
//       stock: data[i].stock
//     })
//   }
//   call.end()
// }

var server = new grpc.Server()
server.addService(retail_proto.Cart.service, { addToCart: addToCart })
server.bindAsync("0.0.0.0:40000", grpc.ServerCredentials.createInsecure(), function() {
  server.start()
})
