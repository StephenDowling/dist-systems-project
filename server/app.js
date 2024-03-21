var grpc = require("@grpc/grpc-js")
var protoLoader = require("@grpc/proto-loader")
var PROTO_PATH = __dirname + "/protos/cart.proto"
var packageDefinition = protoLoader.loadSync(
  PROTO_PATH
)
var cart_proto = grpc.loadPackageDefinition(packageDefinition).cart

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

var server = new grpc.Server()
server.addService(cart_proto.TotalCart.service, { totalCartValue: totalCartValue })
server.bindAsync("0.0.0.0:40000", grpc.ServerCredentials.createInsecure(), function() {
  server.start()
})
