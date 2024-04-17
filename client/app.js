var readlineSync = require('readline-sync')
var readline = require('readline')
var axios = require('axios')
var grpc = require("@grpc/grpc-js")
var protoLoader = require("@grpc/proto-loader")
const path = require('path');
var PROTO_PATH = __dirname + "/protos/retail.proto"
var PROTO_PATH_QUERY = path.join(__dirname, "protos/query.proto");
var PROTO_PATH_ASSISSTANCE = path.join(__dirname, "protos/assisstance.proto")

var packageDefinition = protoLoader.loadSync(PROTO_PATH)
const packageDefinitionQuery = protoLoader.loadSync(PROTO_PATH_QUERY);
const packageDefinitionAssisstance = protoLoader.loadSync(PROTO_PATH_ASSISSTANCE);
const retail_proto = grpc.loadPackageDefinition(packageDefinition).retail;
const query_proto = grpc.loadPackageDefinition(packageDefinitionQuery).query;
const assisstance_proto = grpc.loadPackageDefinition(packageDefinitionAssisstance).assisstance;
var client = new retail_proto.Cart("0.0.0.0:40000", grpc.credentials.createInsecure());
var clientQuery = new query_proto.Query("0.0.0.0:40000", grpc.credentials.createInsecure());
var clientAssisstance = new assisstance_proto.Assisstance("0.0.0.0:40000", grpc.credentials.createInsecure());

//retail service

function addToCart(call) {
  while (true) { //keep asking user until they quit
    var name = readlineSync.question("What is the name of the item? (Type 'q' to Quit): "); //take in value for name
    if (name.toLowerCase() === "q") {
      break;
    }
    var price = parseFloat(readlineSync.question("How much does the item cost?: ")); //take in value for price

    call.write({ //write data to the call object
      name: name,
      price: price
    });
  }

  call.end(); //when user presses 'q' call will end
}

var call = client.addToCart(function(error, response) { //call the grpc method
  if (error) { //handle errors
    console.error("An error occurred: " + error);
  } else {
    console.log("Response: " + response.msg); //display response
  }
});

function removeFromCart(){
  var name = readlineSync.question("What is the name of the item you wish to remove?: ") //get data for name
  try{
      client.removeFromCart({ //try call grpc method
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
        catch(e){ //handle errors
          console.log("server issue")
        }
      })
  }catch(e){
    console.log("Error occured")
  }
}

function totalValue() {
  client.totalValue({}, function(error, response) { //call the grpc method
    if (error) { //handle errors
      console.error("An error occurred: ", error);
      return;
    }

    if (response.total) { //if total isn't null
      response.total = Math.round((response.total + Number.EPSILON) * 100) / 100 //round up to two decimal places
      console.log("Your total is €" + response.total); //display total to user
    } else {
      console.log("There is nothing in your cart"); //exception handling
    }
  });
}

function applyDiscount(){
  try{
    client.applyDiscount({}, function(error, response){ //try call the grpc method
      try{
          console.log(response.discountConf) //display response message
        }
        catch(e){
          console.log(error) //handle errors
        }
      }

    )
  }
  catch(e){ //handle errors
    console.log("Error occured applying discount")
  }
}

function processPayment(){
  var cardNo = readlineSync.question("Please enter your 16 digit card number: ") //take in value for card no
  try{
    client.processPayment({ //try call the grpc method
      cardNo:cardNo
    }, function(error, response){
      try{
        if(response.paymentConfirmation){ //display payment confirmation
          console.log(response.paymentConfirmation)
        }
        else{
          console.log(response.paymentConfirmation)
        }
      }
      catch(e){ //handle errors
        console.log(e)
        console.log("server error")
      }

    } )
  }
  catch(e){ //handle errors
    console.log("Error occured")
    console.log(e);
  }
}

function priceLookUp(){
  var name = readlineSync.question("Please enter the name of the product you want to look up: ") //take in data for name

    clientQuery.priceLookUp({ //call the grpc method
      name: name
    }, function (error, response) {
      try{
        if(response){
          console.log(response.priceMsg)
        }
        else{
          console.log("Error here")
        }
      }
      catch(e){ //handle errors
        console.log(e)
        console.log("error occured")
      }

    })

}

function findProduct(){
  var name = readlineSync.question("Please enter the name of the product you want to locate: ") //take in data for name

    clientQuery.findProduct({ //try call the grpc method
      name: name
    }, function (error, response) {
      try{
        if(response){
          console.log(response.location)
        }
        else{
          console.log("Error occured")
        }
      }
      catch(e){ //handle errors
        console.log(e)
        console.log("error occured")
      }

    })

}

function allergyInfo(){
  var call = clientQuery.allergyInfo({}); //call the grpc method using call
  call.on('data', function(response) { //when you get data, display it below
    console.log("If you have a " + response.allergy + " allergy, please avoid the following products: " + response.products);
  });
}

function contactSupport() {
    var call = clientQuery.contactSupport(); //call grpc method using call
    var name = readlineSync.question("What is your name?: ") //take in data for name

    call.on('data', function(resp){ //when call receives data, display at in the below format
      console.log(resp.name + ": "+resp.message)
    });

    call.on('end', function(){})

    call.on('error', function(e){
      console.log("Cannot connect to the Chat Service ") //handle errors
    })
    call.write({ //when someone joins the chat
      message: name+" has joined the chat",
      name: name
    })

    var rl = readline.createInterface({
      input: process.stdin,
      output: process.stdout
    })

    rl.on("line", function(message){
      if(message.toLowerCase() === 'quit'){ //handle quitting the chat
        call.write({
          message: name + " left the chatroom", //quitting display message
          name: name
        })
        call.end(); //end the call
        rl.close(); //and close readline
      }

      else{ //actually sending messages
        call.write({
          message: message,
          name: name
        })

      }
    })
}

function customerFeedback() {
  var feedback = readlineSync.question("Please enter your feedback here: ") //take in feedback
  clientQuery.customerFeedback({ //try call grpc method
      feedback: feedback
  }, function(error, response) {
    try {
      if (response) {
        console.log(response.msg);
      } else {
        console.log("Error occurred");
      }
    } catch (e) { //handle errors
      console.log(e);
      console.log("Error here");
    }
  })
}

function queueTime(){
  var call = clientAssisstance.queueTime({}); //call the grpc method using call
  call.on('data', function(response) { //when you receive data display it as below
    console.log("Till number " + response.tillNumber + ", wait time is " + response.waitTime+" minutes");
  });
}

function unlockTrolley() {

  var trolleyNumber = readlineSync.question("Please enter the number of the trolley you want to unlock: ");
  //call unlockTrolley method with correct arguments
  var call = clientAssisstance.unlockTrolley({ trolleyNumber: trolleyNumber }, function(err, response) {
    if (err) {
      console.error(err);
      return;
    }
    console.log(response.unlockMsg);
  });
}

function locateCar(){

  var carReg = readlineSync.question("Please enter your car reg number: ") //take in car reg

  var call = clientAssisstance.locateCar({ carReg: carReg }, function(err, response) { //call grpc method
    if (err) {
      console.error(err);
      return;
    }
    console.log(response.parkingSpace);
  });
}

  var chooseService = readlineSync.question( //opening display message for user 
    "\n"
    +"******************** Welcome to the Automated Kiosk! ********************\n"
    +"\n"
    +"\tWhat service would you like to enter?\n"
    +"\n"
    + "\t 1. Retail service (e.g add to your cart, checkout)\n"
    + "\t 2. Query service (e.g. find product information)\n"
    + "\t 3. Assistance service (e.g check current queue times)\n"
    + "\t 4. Quit the application\n"
  )

  chooseService = parseInt(chooseService)

  if(chooseService === 1) {
    var action = readlineSync.question(
      "\n"
      +"******************** Welcome to the Retail Service! ********************\n"
      +"\n"
      +"\tWhat would you like to do?\n"
      +"\n"
      + "\t 1. Add items to the cart\n"
      + "\t 2. Remove an item from the cart\n"
      + "\t 3. Get the total value of your cart\n"
      + "\t 4. Apply a 10% discount to your cart\n"
      + "\t 5. Process card payment\n"
      + "\t 6. Quit the application\n"
    )
    action = parseInt(action)
    if(action === 1){
      addToCart(call);
    }
    else if(action === 2) {
      removeFromCart();
    }
    else if(action === 3) {
      totalValue();
    }
    else if(action === 4) {
      applyDiscount();
    }
    else if(action === 5) {
      processPayment();
    }
    else if(action === 6) {
      process.exit();
    }
    else{
      console.log("Please enter a number between 1 and 6")
    }
  }//chooseService 1
  else if(chooseService === 2){
    var action = readlineSync.question(
      "\n"
      +"******************** Welcome to the Query Service! ********************\n"
      +"\n"
      +"\tWhat would you like to do?\n"
      +"\n"
      + "\t 1. Look up the price of a product\n"
      + "\t 2. Find the location of a product\n"
      + "\t 3. Display allergy information\n"
      + "\t 4. Contact customer support\n"
      + "\t 5. Provide some customer feedback\n"
      + "\t 6. Quit the application\n"
    )
    action = parseInt(action)
    if(action === 1) {
      priceLookUp();
    }
    else if(action === 2) {
      findProduct();
    }
    else if(action === 3) {
      allergyInfo()
    }
    else if(action === 4) {
      contactSupport();
    }
    else if(action === 5) {
      customerFeedback();
    }
    else if(action === 6) {
      process.exit();
    }
    else{
      console.log("Please enter a number between 1 and 6")
    }
  }//chooseService 2
  else if(chooseService === 3){
    var action = readlineSync.question(
      "\n"
      +"******************** Welcome to the Assisstance Service! ********************\n"
      +"\n"
      +"\tWhat would you like to do?\n"
      +"\n"
      + "\t 1. Look up the queue times on each till\n"
      + "\t 2. Unlock a trolley at the store\n"
      + "\t 3. Locate your car in the car park\n"
      + "\t 4. Quit the application\n"
    )
    action = parseInt(action)
    if(action === 1) {
      queueTime();
    }
    else if(action === 2) {
      unlockTrolley();
    }
    else if(action === 3) {
      locateCar()
    }
    else if(action === 4) {
      process.exit();
    }
    else{
      console.log("Please enter a number between 1 and 4")
    }
  }//chooseService 3
  else if(chooseService === 4){
    process.exit();
  }
  else{
    console.log("Please enter a number between 1 and 4")
  }
