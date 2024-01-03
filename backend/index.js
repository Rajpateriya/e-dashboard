const express = require('express');
require('./db/config.js');
const cors = require('cors');
const User = require('./db/User');
const Product = require('./db/Product');
const bodyparser = require('body-parser');

const Jwt = require('jsonwebtoken');
const jwtKey = 'e-comm';


const app = express();
app.use(express.json());
app.use(cors({origin: '*',credentials: true}));
app.use(bodyparser.urlencoded({ extended: true }))
app.use(bodyparser.json())

const  verifyToken = async (req,resp,next)=> {
    let token = req.headers['authorization'];
    console.log("inside headers");
    console.log(token);
    if(token){
        token = token.split(' ')[1];
        console.log(token);
        Jwt.verify(token,jwtKey,(err,valid)=>{
            if(err){
                resp.status(401).send({result:"Please provide valid token"})
            }else{
                next();
            }
        })

    }
    else{
        resp.status(403).send({result:"Please add token with header"})
    }
    console.warn("middleware called...",token)
    next();
}



app.post("/register",async (req,resp)=>{
    
    let user = new User(req.body);
    let result = await user.save();
    result = result.toObject();
    delete result.password;
    Jwt.sign({result}, jwtKey, {expiresIn:"2h"},(err ,token)=>{
        if(err){
            resp.send({result:"something went wrong ,Please try again after sometime"})
        }
        return resp.status(200).json({result, auth: token});
    })
});



app.post("/login",async(req,resp)=>{
    try{
        console.log(req.body)
    if(req.body.password && req.body.email){
        let user = await User.findOne({email : req.body.email}).select("-password");
    if(user){
        Jwt.sign({user}, jwtKey, {expiresIn:"2h"},(err ,token)=>{
            if(err){
                resp.send({result:"something went wrong ,Please try again after sometime"})
            }
            return resp.status(200).json({user, auth: token});
        })
       
    }else{
        return resp.status(200).json({result: 'No User FOund'})
    }
    }else{
       return resp.status(200).json({result: 'No User FOund'})
    }
}catch(error){
    console.log(error);
    return resp.status(500).json(error.message);
}
    
    
})

app.post("/add-product",async(req,resp)=>{
    let product = new Product(req.body);
    let result = await product.save();
    resp.send(result)
});

app.get("/products", async (req,resp) => {
     try{

         let products = await Product.find();
        let result = await Product.find();
         console.log(products);
       
          return resp.status(200).json({
          data: products
     })
        
    }catch(err){
        console.log(err.message);
        return resp.status(500).json({
            err: "err message"
        })
    }

    return resp.status(500).json({
        result
    })
});

app.delete("/product/:id", async(req,resp)=>{
    const result = await Product.deleteOne({_id:req.params.id})
    
    
    resp.send(result);
});

app.get("/product/:id",async(req,resp)=>{
    let result = await Product.findOne({_id:req.params.id});
    if(result){
        resp.send(result)
    }else{
        resp.send({result:"No Record Found"})
    }
});

app.put("/product/:id",async(req,resp)=>{
    let result = await Product.updateOne(
        {_id: req.params.id},
        {
            $set : req.body
        }
    )
    resp.send(result)
});

app.get("/search/:key", async(req,resp)=>{
    let result = await Product.find({
        "$or":[
            {name : {$regex: req.params.key}},
            {company : {$regex: req.params.key}},
            {category : {$regex: req.params.key}}
        ]
    });
    resp.send(result)
})



app.listen(5000);