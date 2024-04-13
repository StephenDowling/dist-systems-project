var express = require('express');
var router = express.Router();
var grpc = require('@grpc/grpc-js');
var protoLoader = require('@grpc/proto-loader');
var path = require('path');

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

//addToCart
router.get('/', function(req, res, next) {
  // Render your form or any other content for adding items to the cart
  res.render('index', { title: 'Add To Cart', error: null, msg: null });
});

router.post('/', function(req, res, next) {
  var name = req.query.name
  var price = req.query.price
  var msg
  if(!isNaN(price)){
    try{
      client.addToCart({ name: name, price: price}, function (error, response){
        try{
          res.render('index', {title: 'Add To Cart', error: error, msg: response.msg});
        }
        catch (error) {
          console.log(error)
          res.render('index', {title: 'Add To Cart', error: "Add To Cart is not available at the moment, please try again later", msg: null})
        }
      });
    }
    catch(error){
      console.log(error)
      res.render('index', {title: 'Add To Cart', error: "Add To Cart is not available at the moment, please try again later", msg: null})
    }
  } else{
    res.render('index', {title: 'Add To Cart', error: null, msg:msg })
  }
}); //add to cart

//Remove From Cart
router.get('/removeFromCart', function(req, res, next) {
  // Render your form or any other content for adding items to the cart
  res.render('removeFromCart', { title: 'Remove From Cart', error: null, msg: null });
});

router.post('/removeFromCart', function(req, res, next) {
  var name = req.query.name
  console.log("req = "+req);
  console.log("req.query = "+req.query);
  console.log("req.query.name = "+req.query.name)
  var removeMsg
  if(isNaN(name)){
    try{
      client.removeFromCart({ name: name}, function (error, response){
        try{
          res.render('removeFromCart', {title: 'Remove From Cart', error: error, removeMsg: response.removeMsg});
        }
        catch (error) {
          console.log(error)
          res.render('removeFromCart', {title: 'Remove From Cart', error: "Remove From Cart is not available at the moment, please try again later", removeMsg: null})
        }
      });
    }
    catch(error){
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
      client.totalValue({}, function (error, response){
        try{
          response.total = Math.round((response.total + Number.EPSILON) * 100) / 100
          res.render('totalValue', {title: 'Total Value', error: error, total: response.total});
        }
        catch (error) {
          console.log(error)
          res.render('totalValue', {title: 'Total Value', error: "Total Value is not available at the moment, please try again later", total: null})
        }
      });
    }
    catch(error){
      console.log(error)
      res.render('totalValue', {title: 'Total Value', error: "Total Value is not available at the moment, please try again later", total: null})
    }

}); //total value

 //Apply Discount
router.get('/applyDiscount', function(req, res, next) {
  var discountConf
  var total
  if(total != 0){
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
    catch(error){
      console.log(error)
      res.render('applyDiscount', {title: 'Apply Discount', error: "Apply Discount is not available at the moment, please try again later", total: null, discountConf: null})
    }
  }else{
      res.render('applyDiscount', {title: 'Apply Discount', error: null, discountConf:discountConf })
    }

}); //Apply Discount

/* Process Payment */
router.get('/processPayment', function(req, res, next) {
  var cardNo = req.query.cardNo
  var paymentConfirmation
  if(!isNaN(cardNo)){
    try{
      client.processPayment({ cardNo: cardNo}, function (error, response){
        try{
          res.render('processPayment', {title: 'Process Payment', error: error, paymentConfirmation: response.paymentConfirmation});
        }
        catch (error) {
          console.log(error)
          res.render('processPayment', {title: 'Process Payment', error: "Process Payment is not available at the moment, please try again later", paymentConfirmation: null})
        }
      });
    }
    catch(error){
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
  var name = req.query.name
  var priceMsg
  if(name){
    try{
      clientQuery.priceLookUp({ name: name}, function (error, response){
        try{
          res.render('priceLookUp', {title: 'Price Look Up', error: error, priceMsg: response.priceMsg});
        }
        catch (error) {
          console.log(error)
          res.render('priceLookUp', {title: 'Price Look Up', error: "Price Look Up is not available at the moment, please try again later", priceMsg: null})
        }
      });
    }
    catch(error){
      console.log(error)
      res.render('priceLookUp', {title: 'Price Look Up', error: "Price Look Up is not available at the moment, please try again later", priceMsg: null})
    }
  }  else{
      res.render('priceLookUp', {title: 'Price Look Up', error: null, priceMsg:priceMsg })
    }
}); //price look up

//Find Product
router.get('/findProduct', function(req, res, next) {
  var name = req.query.name
  var location
  if(name){
    try{
      clientQuery.findProduct({ name: name}, function (error, response){
        try{
          res.render('findProduct', {title: 'Find Product', error: error, location: response.location});
        }
        catch (error) {
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

module.exports = router;
