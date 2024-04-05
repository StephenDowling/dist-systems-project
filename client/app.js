var readlineSync = require('readline-sync')
var axios = require('axios')
var grpc = require("@grpc/grpc-js")
var protoLoader = require("@grpc/proto-loader")
var PROTO_PATH = __dirname + "/protos/retail.proto"

var packageDefinition = protoLoader.loadSync(PROTO_PATH)
var retail_proto = grpc.loadPackageDefinition(packageDefinition).retail
var client = new retail_proto.Cart("0.0.0.0:40000", grpc.credentials.createInsecure());

var call = client.addToCart(function(error, response) {

  if(error){
    console.log("An error occured: "+error)
  } else{
    console.log("Response: " + response.msg)
  }

})




function addToCart(){
  var name = readlineSync.question("What is the name of the item?: ")
  var price = parseFloat(readlineSync.question("How much does the item cost?: "))

  call.write({
    name: name,
    price: price
  })

}

function finishedAdding() {
    call.end();
}

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

function totalValue(){
  try{
    client.totalValue({}, function(error, response){
      try{
        if(response.total){
          console.log("Your total is "+response.total)
        }
        else{
          console.log("There is nothing in your cart")
        }
      }
      catch(e){
        console.log(error)
      }
    })
  }
  catch(e){
    console.log("Error occured")
  }
}


while (true) {
  var option = readlineSync.keyIn('Press "a" to add an item, press "r" to remove an item and press "q" to quit : ', { limit: 'aqrt' });

  if (option === 'a') {
    addToCart();
  } else if(option === 'r'){
    removeFromCart();
  } else if(option === 't'){
    totalValue();
  }else if (option === 'q') {
    finishedAdding()
    break;
  }
}
