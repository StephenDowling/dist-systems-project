var readlineSync = require('readline-sync')
var axios = require('axios')
var grpc = require("@grpc/grpc-js")
var protoLoader = require("@grpc/proto-loader")
var PROTO_PATH = __dirname + "/protos/retail.proto"

var packageDefinition = protoLoader.loadSync(PROTO_PATH)
var retail_proto = grpc.loadPackageDefinition(packageDefinition).retail
var client = new retail_proto.Cart("0.0.0.0:40000", grpc.credentials.createInsecure());

//retail service

function addToCart(call) {
  while (true) {
    var name = readlineSync.question("What is the name of the item? (Type 'q' to Quit): ");
    if (name.toLowerCase() === "q") {
      break;
    }
    var price = parseFloat(readlineSync.question("How much does the item cost?: "));

    call.write({
      name: name,
      price: price
    });
  }

  call.end();
}

var call = client.addToCart(function(error, response) {
  if (error) {
    console.error("An error occurred: " + error);
  } else {
    console.log("Response: " + response.msg);
  }
});

function removeFromCart(){
  var name = readlineSync.question("What is the name of the item you wish to remove?: ")
  try{
      client.removeFromCart({
        name:name
      }, function(error, response){
        try{
          if(response.removeMsg){
            console.log(response.removeMsg)
          }
          else{
            console.log(response.removeMsg)
          }
        }
        catch(e){
          console.log("server issue")
        }
      })
  }catch(e){
    console.log("Error occured")
  }
}

function totalValue() {
  client.totalValue({}, function(error, response) {
    if (error) {
      console.error("An error occurred:", error);
      return;
    }

    if (response.total) {
      console.log("Your total is " + response.total);
    } else {
      console.log("There is nothing in your cart");
    }
  });
}

function applyDiscount(){
  try{
    client.applyDiscount({}, function(error, response){
      try{
          console.log(response.discountConf)
        }
        catch(e){
          console.log(error)
        }
      }

    )
  }
  catch(e){
    console.log("Error occured applying discount")
  }
}

function processPayment(){
  var cardNo = readlineSync.question("Please enter your 16 digit card number: ")
  try{
    client.processPayment({
      cardNo:cardNo
    }, function(error, response){
      try{
        if(response.paymentConfirmation){
          console.log(response.paymentConfirmation)
        }
        else{
          console.log(response.paymentConfirmation)
        }
      }
      catch(e){
        console.log(e)
        console.log("server error")
      }

    } )
  }
  catch(e){
    console.log("Error occured")
    console.log(e);
  }
}

//1234567812345678
  var action = readlineSync.question(
    "What would you like to do?\n"
    + "\t 1 add items to the cart\n"
    + "\t 2 remove an item from the cart\n"
    + "\t 3 get the total value of your cart\n"
    + "\t 4 apply a 10% discount to your cart\n"
    + "\t 5 process card payment\n"
    + "\t 6 quit the application\n"
  )

  action = parseInt(action)


  if(action === 1) {
    addToCart(call);
  }
  if(action === 2) {
    removeFromCart();
  }
  if(action === 3) {
    totalValue();
  }
  if(action === 4) {
    applyDiscount();
  }
  if(action === 5) {
    processPayment();
  }
  if(action === 6) {
    process.exit();
  }
