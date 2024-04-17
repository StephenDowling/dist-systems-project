var express = require('express');
var router = express.Router();
var grpc = require('@grpc/grpc-js');
var protoLoader = require('@grpc/proto-loader');
var path = require('path');
var readlineSync = require('readline-sync')
var readline = require('readline');

const PROTO_PATH = path.join(__dirname, "../protos/retail.proto");
const PROTO_PATH_QUERY = path.join(__dirname, "../protos/query.proto");
const PROTO_PATH_ASSISSTANCE = path.join(__dirname, "../protos/assisstance.proto");
const packageDefinition = protoLoader.loadSync(PROTO_PATH);
const packageDefinitionQuery = protoLoader.loadSync(PROTO_PATH_QUERY);
const packageDefinitionAssisstance = protoLoader.loadSync(PROTO_PATH_ASSISSTANCE);
const retail_proto = grpc.loadPackageDefinition(packageDefinition).retail;
const query_proto = grpc.loadPackageDefinition(packageDefinitionQuery).query;
const assisstance_proto = grpc.loadPackageDefinition(packageDefinitionAssisstance).assisstance;
var client = new retail_proto.Cart("0.0.0.0:40000", grpc.credentials.createInsecure());
var clientQuery = new query_proto.Query("0.0.0.0:40000", grpc.credentials.createInsecure());
var clientAssisstance = new assisstance_proto.Assisstance("0.0.0.0:40000", grpc.credentials.createInsecure());

/* CART SERVICE */

//index
router.get('/', function(req, res, next) {
  //Render the home page
  res.render('index', { title: 'Welcome to the Automated Kiosk!', error: null});
});

//addToCart
router.get('/addToCart', function(req, res, next) {
  //render the page before we add anythign
  res.render('addToCart', { title: 'Add To Cart', error: null, msg: null });
})

router.post('/addToCart', function(req, res, next) {
  var name = req.body.name //extract from the request
  var price = req.body.price //extract from the request
  console.log(name) //for clarity
  console.log(price) //for clarity
  var msg
  if(!isNaN(price)){ //if price is a number
    try{ //call gRPC method using name and price taken from request
      client.addToCart({ name: name, price: price}, function (error, response){
        try{
          res.render('addToCart', {title: 'Add To Cart', error: error, msg: response.msg});
        }
        catch (error) {
          console.log(error)
          res.render('addToCart', {title: 'Add To Cart', error: "Add To Cart is not available at the moment, please try again later", msg: null})
        }
      });
    }
    catch(error){ //handle errors
      console.log(error)
      res.render('addToCart', {title: 'Add To Cart', error: "Add To Cart is not available at the moment, please try again later", msg: null})
    }
  } else{
    res.render('addToCart', {title: 'Add To Cart', error: null, msg:msg })
  }
}); //add to cart

//Remove From Cart

router.get('/removeFromCart', function(req, res, next) {
  var name = req.query.name //extract name
  var removeMsg = null; //set this to null initially, we will change it based on the try/catch
  if(name){
    try{
      client.removeFromCart({ name: name}, function (error, response){ //call grpc method
        try{
          res.render('removeFromCart', {title: 'Remove From Cart', error: error, removeMsg: response.removeMsg});
        }
        catch (error) {
          console.log(error)
          res.render('removeFromCart', {title: 'Remove From Cart', error: "Remove From Cart is not available at the moment, please try again later", removeMsg: null})
        }
      });
    }
    catch(error){ //handle errors
      console.log(error)
      res.render('removeFromCart', {title: 'Remove From Cart', error: "Remove From Cart is not available at the moment, please try again later", removeMsg: null})
    }
  } else{
    res.render('removeFromCart', {title: 'Remove From Cart', error: null, removeMsg:removeMsg })
  }
}); //Remove From Cart

/* Total Value */
router.get('/totalValue', function(req, res, next) {
  var total
    try{
      client.totalValue({}, function (error, response){ //call grpc method
        try{
          response.total = Math.round((response.total + Number.EPSILON) * 100) / 100 //round up to 2 decimal places
          res.render('totalValue', {title: 'Total Value', error: error, total: response.total});
        }
        catch (error) {
          console.log(error)
          res.render('totalValue', {title: 'Total Value', error: "Total Value is not available at the moment, please try again later", total: null})
        }
      });
    }
    catch(error){ //handle errors
      console.log(error)
      res.render('totalValue', {title: 'Total Value', error: "Total Value is not available at the moment, please try again later", total: null})
    }

}); //total value

 //Apply Discount
router.get('/applyDiscount', function(req, res, next) {
  var discountConf
  var total
  if(total != 0){ //if total isn't 0, try call the gRPC method
    try{
      client.applyDiscount({}, function (error, response){
        try{
          res.render('applyDiscount', {title: 'Apply Discount', error: error, total: response.total, discountConf: response.discountConf});
        }
        catch (error) {
          console.log(error)
          res.render('applyDiscount', {title: 'Apply Discount', error: "Apply Discount is not available at the moment, please try again later", total: null, discountConf: null })
        }
      });
    }
    catch(error){ //handle errors
      console.log(error)
      res.render('applyDiscount', {title: 'Apply Discount', error: "Apply Discount is not available at the moment, please try again later", total: null, discountConf: null})
    }
  }else{
      res.render('applyDiscount', {title: 'Apply Discount', error: null, discountConf:discountConf })
    }

}); //Apply Discount

/* Process Payment */
router.get('/processPayment', function(req, res, next) {
  var cardNo = req.query.cardNo //extract cardNo from request
  var paymentConfirmation
  if(!isNaN(cardNo)){ //if cardNo is a number
    try{
      client.processPayment({ cardNo: cardNo}, function (error, response){ //call gRPC method with cardNo
        try{
          res.render('processPayment', {title: 'Process Payment', error: error, paymentConfirmation: response.paymentConfirmation});
        }
        catch (error) {
          console.log(error)
          res.render('processPayment', {title: 'Process Payment', error: "Process Payment is not available at the moment, please try again later", paymentConfirmation: null})
        }
      });
    }
    catch(error){ //handle errors
      console.log(error)
      res.render('processPayment', {title: 'Process Payment', error: "Process Payment is not available at the moment, please try again later", paymentConfirmation: null})
    }
  } else{
    res.render('processPayment', {title: 'Process Payment', error: null, paymentConfirmation:paymentConfirmation })
  }
}); //process payment

/* QUERY SERVICE */

/* Price Look Up */
router.get('/priceLookUp', function(req, res, next) {
  var name = req.query.name //extract name from request
  var priceMsg
  if(name){ //if name is not null
    try{
      clientQuery.priceLookUp({ name: name}, function (error, response){ //call grpc method with name
        try{
          res.render('priceLookUp', {title: 'Price Look Up', error: error, priceMsg: response.priceMsg});
        }
        catch (error) {
          console.log(error)
          res.render('priceLookUp', {title: 'Price Look Up', error: "Price Look Up is not available at the moment, please try again later", priceMsg: null})
        }
      });
    }
    catch(error){ //handle errors
      console.log(error)
      res.render('priceLookUp', {title: 'Price Look Up', error: "Price Look Up is not available at the moment, please try again later", priceMsg: null})
    }
  }  else{
      res.render('priceLookUp', {title: 'Price Look Up', error: null, priceMsg:priceMsg })
    }
}); //price look up

//Find Product
router.get('/findProduct', function(req, res, next) {
  var name = req.query.name //extract name from request
  var location
  if(name){ //if name is not null
    try{
      clientQuery.findProduct({ name: name}, function (error, response){ //call grpc method with name
        try{
          res.render('findProduct', {title: 'Find Product', error: error, location: response.location});
        }
        catch (error) { //handle errors
          console.log(error)
          res.render('findProduct', {title: 'Find Product', error: "Find Product is not available at the moment, please try again later", location: null})
        }
      });
    }
    catch(error){
      console.log(error)
      res.render('findProduct', {title: 'Find Product', error: "Find Product is not available at the moment, please try again later", location: null})
    }
  }  else{
      res.render('findProduct', {title: 'Find Product', error: null, location:location })
    }
}); //find product

router.get('/allergyInfo', function(req, res, next) { //render the page first
  res.render('allergyInfo', { title: 'Allergy Info', error: null});
})

router.get('/allergyInfo', function(req, res, next) {
  var allergy
  var products
    try{
      clientQuery.allergyInfo({}, function (error, response){ //call the grpc method
        try{
          res.render('allergyInfo', {title: 'Allergy Info', error: error, allergy: response.allergy, products: response.products});
        }
        catch (error) { //handle errors
          console.log(error)
          res.render('allergyInfo', {title: 'Allergy Info', error: "Allergy Info is not available at the moment, please try again later", allergy: null, products: null})
        }
      });
    }
    catch(error){
      console.log(error)
      res.render('allergyInfo', {title: 'Allergy Info', error: "Allergy Info is not available at the moment, please try again later", allergy: null, products: null})
    }
}); //allergy info

router.get('/contactSupport', function(req, res, next) { //render the page first
  res.render('contactSupport', { title: 'Contact Support', error: null});
})

//Contact Support
router.get('/contactSupport', function(req, res, next) {
  var call = clientQuery.contactSupport();
  var name;

  call.on('data', function(resp){ //call the gRPC method when we receive data
    console.log(resp.name + ": "+resp.message) //print to the console for clarity
  });

  call.on('end', function(){})

  call.on('error', function(e){
    console.log("Cannot connect to the Chat Service ") //handle errors
  })
  call.write({
    message: name+" has joined the chat", //when someone new joins
    name: name
  })

  var rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
  })

  rl.on("line", function(message){
    if(message.toLowerCase() === 'quit'){ //how we leave the chat
      call.write({
        message: name + " left the chatroom", //displays when someone leaves
        name: name
      })
      call.end(); //ends the grpc call
      rl.close(); //closes readline
    }

    else{
      call.write({ //else, these are the messages to be sent
        message: message,
        name: name
      })

    }
  })
}); //Contact Support

//Customer Feedback
router.get('/customerFeedback', function(req, res, next) {
  var feedback = req.query.feedback //extract feedback from request
  var msg
  if(feedback){
    try{
      clientQuery.customerFeedback({ feedback: feedback}, function (error, response){ //call grpc method
        try{
          res.render('customerFeedback', {title: 'Customer Feedback', error: error, msg: response.msg});
        }
        catch (error) {
          console.log(error)
          res.render('customerFeedback', {title: 'Customer Feedback', error: "Customer Feedback is not available at the moment, please try again later", msg: null})
        }
      });
    }
    catch(error){ //handle errors
      console.log(error)
      res.render('customerFeedback', {title: 'Customer Feedback', error: "Customer Feedback is not available at the moment, please try again later", msg: null})
    }
  }  else{
      res.render('customerFeedback', {title: 'Customer Feedback', error: null, msg:msg })
    }
}); //customer feedback

//Queue Time

router.get('/queueTime', function(req, res, next) { //render the page
  res.render('queueTime', { title: 'Queue Time', error: null, tillNumber: null, waitTime: null });
})

router.get('/queueTime', function(req, res, next) {
  var tillNumber, waitTime
    try{
      clientAssisstance.queueTime({}, function (error, response){ //try call the grpc method
        try{
          res.render('queueTime', {title: 'Queue Time', error: error, tillNumber: response.tillNumber, waitTime: response.waitTime});
        }
        catch (error) { //handle errors
          console.log(error)
          res.render('queueTime', {title: 'Queue Time', error: "Queue Time is not available at the moment, please try again later", tillNumber: null, waitTime: null})
        }
      });
    }
    catch(error){
      console.log(error)
      res.render('queueTime', {title: 'Queue Time', error: "Queue Time is not available at the moment, please try again later", tillNumber: null, waitTime: null})
    }

}); //queueTime

//unlock trolley
router.get('/unlockTrolley', function(req, res, next) {
  var trolleyNumber = req.query.trolleyNumber //extract trolleyNumber from the request
  var unlockMsg
  if(!isNaN(trolleyNumber)){ //if trolleynumber is a number, try call the gRPC method
    try{
      clientAssisstance.unlockTrolley({ trolleyNumber: trolleyNumber}, function (error, response){
        try{
          res.render('unlockTrolley', {title: 'Unlock Trolley', error: error, unlockMsg: response.unlockMsg});
        }
        catch (error) {
          console.log(error)
          res.render('unlockTrolley', {title: 'Unlock Trolley', error: "Unlock Trolley is not available at the moment, please try again later", unlockMsg: null})
        }
      });
    }
    catch(error){ //handle errors
      console.log(error)
      res.render('unlockTrolley', {title: 'Unlock Trolley', error: "Unlock Trolley is not available at the moment, please try again later", unlockMsg: null})
    }
  }  else{
      res.render('unlockTrolley', {title: 'Unlock Trolley', error: null, unlockMsg:unlockMsg })
    }
}); //unlock trolley

//locate car
router.get('/locateCar', function(req, res, next) {
  var carReg = req.query.carReg //extract carReg from the request
  var parkingSpace
  if(!isNaN(carReg)){ //make sure car reg is a number
    try{
      clientAssisstance.locateCar({ carReg: carReg}, function (error, response){ //try call the grpc method 
        try{
          res.render('locateCar', {title: 'Locate Car', error: error, parkingSpace: response.parkingSpace});
        }
        catch (error) {
          console.log(error)
          res.render('locateCar', {title: 'Locate Car', error: "Locate Car is not available at the moment, please try again later", parkingSpace: null})
        }
      });
    }
    catch(error){
      console.log(error)
      res.render('locateCar', {title: 'Locate Car', error: "Locate Car is not available at the moment, please try again later", parkingSpace: null})
    }
  }  else{
      res.render('locateCar', {title: 'Locate Car', error: null, parkingSpace:parkingSpace })
    }
}); //locate car

module.exports = router;
