var readlineSync = require('readline-sync')
var grpc = require("@grpc/grpc-js")
var protoLoader = require("@grpc/proto-loader")
var PROTO_PATH = __dirname + "/protos/productinfo.proto"

var packageDefinition = protoLoader.loadSync(PROTO_PATH)
var product_proto = grpc.loadPackageDefinition(packageDefinition).productinfo
var client = new product_proto.getProductInfo("0.0.0.0:40000", grpc.credentials.createInsecure());

var call = client.ProductInfo({ });

call.on('data', function(response) {
  console.log("Name: "+response.name)
  console.log("Description: "+response.description)
  console.log("Price: "+response.price)
  console.log("In stock: "+response.stock)
  console.log("*****")
});

call.on('end', function() {

});

call.on('error', function(e) {
  console.log(e)
});
