var readlineSync = require('readline-sync')
var readline = require('readline')
var axios = require('axios')
var grpc = require("@grpc/grpc-js")
var protoLoader = require("@grpc/proto-loader")
var PROTO_PATH = __dirname + "/protos/query.proto"

var packageDefinition = protoLoader.loadSync(PROTO_PATH)
var query_proto = grpc.loadPackageDefinition(packageDefinition).query
var client = new query_proto.Query("0.0.0.0:40000", grpc.credentials.createInsecure());

//cart service

// function addToCart(call) {
//   while (true) {
//     var name = readlineSync.question("What is the name of the item? (Type 'q' to Quit): ");
//     if (name.toLowerCase() === "q") {
//       break;
//     }
//     var price = parseFloat(readlineSync.question("How much does the item cost?: "));
//
//     call.write({
//       name: name,
//       price: price
//     });
//   }
//
//   call.end();
// }
//
// var call = client.addToCart(function(error, response) {
//   if (error) {
//     console.error("An error occurred: " + error);
//   } else {
//     console.log("Response: " + response.msg);
//   }
// });
//
// function removeFromCart(){
//   var name = readlineSync.question("What is the name of the item you wish to remove?: ")
//   try{
//       client.removeFromCart({
//         name:name
//       }, function(error, response){
//         try{
//           if(response.removeMsg){
//             console.log(response.removeMsg)
//           }
//           else{
//             console.log(response.removeMsg)
//           }
//         }
//         catch(e){
//           console.log("server issue")
//         }
//       })
//   }catch(e){
//     console.log("Error occured")
//   }
// }
//
// function totalValue() {
//   client.totalValue({}, function(error, response) {
//     if (error) {
//       console.error("An error occurred:", error);
//       return;
//     }
//
//     if (response.total) {
//       console.log("Your total is " + response.total);
//     } else {
//       console.log("There is nothing in your cart");
//     }
//   });
// }
//
// function applyDiscount(){
//   try{
//     client.applyDiscount({}, function(error, response){
//       try{
//           console.log(response.discountConf)
//         }
//         catch(e){
//           console.log(error)
//         }
//       }
//
//     )
//   }
//   catch(e){
//     console.log("Error occured applying discount")
//   }
// }
//
// function processPayment(){
//   var cardNo = readlineSync.question("Please enter your 16 digit card number: ")
//   try{
//     client.processPayment({
//       cardNo:cardNo
//     }, function(error, response){
//       try{
//         if(response.paymentConfirmation){
//           console.log(response.paymentConfirmation)
//         }
//         else{
//           console.log(response.paymentConfirmation)
//         }
//       }
//       catch(e){
//         console.log(e)
//         console.log("server error")
//       }
//
//     } )
//   }
//   catch(e){
//     console.log("Error occured")
//     console.log(e);
//   }
// }

//query service

function priceLookUp(){
  var name = readlineSync.question("Please enter the name of the product you want to look up: ")

    client.priceLookUp({
      name: name
    }, function (error, response) {
      try{
        if(response){
          console.log(response)
        }
        else{
          console.log("Error here")
        }
      }
      catch(e){
        console.log(e)
        console.log("error occured")
      }

    })

}

function findProduct(){
  var name = readlineSync.question("Please enter the name of the product you want to locate: ")

    client.findProduct({
      name: name
    }, function (error, response) {
      try{
        if(response){
          console.log(response)
        }
        else{
          console.log("Error occured")
        }
      }
      catch(e){
        console.log(e)
        console.log("error occured")
      }

    })

}

function allergyInfo(){
  var call = client.allergyInfo({});
  call.on('data', function(response) {
    console.log("If you have a " + response.allergy + " allergy, please avoid the following products: " + response.products);
  });
}

function contactSupport() {
    var call = client.contactSupport();
    var name = readlineSync.question("What is your name?")

    call.on('data', function(resp){
      console.log(resp.name + ": "+resp.message)
    });

    call.on('end', function(){})

    call.on('error', function(e){
      console.log("Cannot connect to the Chat Service ")
    })
    call.write({
      message: name+" has joined the chat",
      name: name
    })

    var rl = readline.createInterface({
      input: process.stdin,
      output: process.stdout
    })

    rl.on("line", function(message){
      if(message.toLowerCase() === 'quit'){
        call.write({
          message: name + " left the chatroom",
          name: name
        })
        call.end();
        rl.close();
      }

      else{
        call.write({
          message: message,
          name: name
        })

      }
    })
}





  var action = readlineSync.question(
    "What would you like to do?\n"
    + "\t 1 look up the price of a product\n"
    + "\t 2 find the location of a product\n"
    + "\t 3 request allergy information based on your allergy\n"
    + "\t 4 contact customer support\n"
    + "\t 5 provide some customer feedback\n"
    + "\t 6 quit the application\n"
  )

  action = parseInt(action)


  if(action === 1) {
    priceLookUp();
  }
  if(action === 2) {
    findProduct();
  }
  if(action === 3) {
    allergyInfo()
  }
  if(action === 4) {
    contactSupport();
  }
  if(action === 5) {
    console.log("Not supported yet")
  }
  if(action === 6) {
    process.exit();
  }
