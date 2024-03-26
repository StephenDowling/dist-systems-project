var grpc = require("@grpc/grpc-js")
var protoLoader = require("@grpc/proto-loader")
var PROTO_PATH = __dirname + "/protos/cart.proto"
var packageDefinition = protoLoader.loadSync(
  PROTO_PATH
)
var cart_proto = grpc.loadPackageDefinition(packageDefinition).cart
var product_proto = grpc.loadPackageDefinition(packageDefinition).productinfo

function totalCartValue(call, callback) {
  var count = 0
  var price = 0
  var receipt = ""

  call.on('data', function(request) {
    price += request.price
    count += 1
    receipt += request.name+", €"+request.price+"\n"
  })

  call.on('end', function() {
    callback(null, {
      count: count,
      price: price,
      receipt: receipt
    })
  })

  call.on('error', function(e) {
    console.log("An error occured")
  })
}

var data = [
  {
    name: "Bread",
    description: "A loaf of fresh bread",
    price: 2.00,
    stock: true
  },
  {
    name: "Milk",
    description: "A litre of low fat milk",
    price: 1.50,
    stock: true
  },
  {
    name: "Fish",
    description: "Fresh catch of the day",
    price: 4.00,
    stock: true
  },
  {
    name: "Onions",
    description: "A net of brown onions",
    price: 1.00,
    stock: false
  },
  {
    name: "Peppers",
    description: "A packet of bell peppers",
    price: 1.50,
    stock: true
  }
]



function getProductInfo(call, callback) {
  for(var i = 0;i < data.length; i++){
    call.write({
      name: data[i].name,
      description: data[i].description,
      price: data[i].price,
      stock: data[i].stock
    })
  }
  call.end()
}

var server = new grpc.Server()
server.addService(cart_proto.TotalCart.service, { totalCartValue: totalCartValue })
server.addService(product_proto.getProductInfo.service, { ProductInfo: getProductInfo})
server.bindAsync("0.0.0.0:40000", grpc.ServerCredentials.createInsecure(), function() {
  server.start()
})
