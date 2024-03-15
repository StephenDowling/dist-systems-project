var readlineSync = require('readline-sync')
var grpc = require("@grpc/grpc-js")
var protoLoader = require("@grpc/proto-loader")
var PROTO_PATH = __dirname + "/protos/bookstore.proto"

var packageDefinition = protoLoader.loadSync(PROTO_PATH)
var bookstore_proto = grpc.loadPackageDefinition(packageDefinition).bookstore
var client = new bookstore_proto.BookStore("0.0.0.0:40000", grpc.credentials.createInsecure());

var call = client.totalCartValue(function(error, response) {

  if(error){
    console.log("An error occured")
  } else{
    console.log("You have ordered " + response.books + " books, the total cost is: " + response.price)
  }
})

while(true) {
  var book_name = readlineSync.question("What is the book called? (q to Quit)")
  if(book_name.toLowerCase() === 'q') {
    break
  }
  var author = readlineSync.question("Who is the author of the book?")
  var price = readlineSync.question("How much does the book cost?")

  call.write({
    price: parseFloat(price),
    author: author,
    name: book_name
  })
}

call.end()
