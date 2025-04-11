var express = require("express");
var path = require("path");
var app = express();
const cors = require("cors")
var methodOverride = require('method-override');
const main = require("./connect.js");
const BlogModel = require('./models/blog.js');
const UserModel = require('./models/user.js');
const CategoryModel = require('./models/category.js');
const FeedbackModel = require('./models/feedback.js');
const data = require('./data.js');
var cookieParser = require('cookie-parser');
var {setUser , getUser} = require("./service/auth.js");
var {checkAuthentication} = require("./middlewares/auth.js");
const multer  = require('multer');
const category = require("./category.js");


app.use(cors({
    origin: "http://localhost:5173", // Allow requests only from React app
    methods: "GET,POST,PUT,DELETE",
    credentials: true
}));
app.set("view engine","ejs");
app.set("views",path.resolve("./views"));
app.use(express.static(path.join(__dirname,'/public')));
app.use(express.urlencoded({extended:true}));
app.use(methodOverride('_method'));
app.use(cookieParser());
app.use(express.json());


// let URL ='mongodb://127.0.0.1:27017/blogs';

const storage = multer.diskStorage({
    destination: function (req, file, cb) {
      return cb(null, './public/photos');
    },
    filename: function (req, file, cb) {
      return cb(null, `${Date.now()}-${file.originalname}`);
    }
});
  
const upload = multer({ storage: storage });


main(process.env.URL)
.then(()=>{
    console.log("connected successfully")
})
.catch(err => console.log(err));

app.get("/api/blogs",async (req,res)=>{
    let blogs = await BlogModel.find({}).sort({ publishDate: -1 });
    let categories = await CategoryModel.find({}).sort({ publishDate: -1 });   
    // console.log(blogs[4].description);
    res.json({blogs ,categories});
    // res.render("home.ejs" , {blogs , name: ""});
    
});

app.get("/",async (req,res)=>{
  
    let blogs = await BlogModel.find({}).sort({ publishDate: -1 });
    
 res.render("home.ejs" , {blogs , name: ""});
    
});

    
app.get("/user",checkAuthentication,async (req,res)=>{
    let user =req.user;
    let blogs = await BlogModel.find({}).sort({ publishDate: -1 });
    let name = user.user.fullname;
    if(user.user.roles == "ADMIN"){
        res.render("admin.ejs"  , {blogs , name});
    }else{

        res.render("home.ejs" , {blogs , name});
        
    }
    
});

app.get("/user/blogs",async (req,res)=>{  
    let blogs = await BlogModel.find({}).sort({ publishDate: -1 });
    res.render("adminBlogs.ejs" , {blogs})
    
});
app.get("/api/admin/blogs",async (req,res)=>{  
    let blogs = await BlogModel.find({})
    res.json(blogs);
    
});
// app.get("/api/admin/subscribe",async (req,res)=>{  
//     const customers = await stripe.customers.search({
//         query: 'email:\'Jane Doe\' AND metadata[\'foo\']:\'bar\'',});
//         res.json(customers);
// });
// app.post("/api/admin/subscribe",async (req,res)=>{  
//     let {user} = req.body
//     const customers = await stripe.customers.search({
//         query: `email:\'${user}\' AND metadata[\'foo\']:\'bar\'`,});
//         res.json(customers);
// });

app.get("/user/:id/edit",async (req,res)=>{
    let title = req.params.id;
    let blog = await BlogModel.findOne({title: title});
    res.render("edit.ejs", {blog});
    
});
app.get("/api/admin/:id/edit",async (req,res)=>{
    let title = req.params.id;
    let blog = await BlogModel.findOne({title: title});
    let category = await CategoryModel.find({});
    res.json({
        blog: blog,
        category: category
      });
    
});
app.put("/user/:id/edit",upload.single("Image"),async (req,res)=>{
    let name = req.params.id;
    let {title, category, description} = req.body;
  
    if(req.file){
        let filepath = "/photos/" + req.file.filename ;      
        let blog = await BlogModel.findOneAndUpdate({title: name},{title:title ,category:category ,description:description , imgUrl:filepath} , {runValidators : true});
    }
    else{      
        let blog = await BlogModel.findOneAndUpdate({title: name},{title:title ,category:category ,description:description } , {runValidators : true});
    }
    res.redirect("/user/blogs");
    
});
app.put("/api/admin/:id/edit",upload.single("Image"),async (req,res)=>{
    let name = req.params.id;
    let {title, category, description ,id} = req.body;
  
    // let category1 = await CategoryModel.findOneAndUpdate({title: id},{title:category } , {runValidators : true}); 
    if(req.file){
        let filepath = "/photos/" + req.file.filename ;      
        let blog = await BlogModel.findOneAndUpdate({title: name},{title:title ,category:category ,description:description , imgUrl:filepath} , {runValidators : true});
    }
    else{      
        let blog = await BlogModel.findOneAndUpdate({title: name},{title:title ,category:category ,description:description } , {runValidators : true});
    }
    res.json({ message: "Blog updated successfully" });
    
});

app.get("/user/:id/delete",async (req,res)=>{
    let title = req.params.id;
    let blog = await BlogModel.findOne({title: title});   
    res.render("delete.ejs", {blog});
    
});
app.get("/api/admin/:id/delete",async (req,res)=>{
    let title = req.params.id;
    let blog = await BlogModel.findOne({title: title});   
    res.json(blog);
    
});

app.delete("/user/:id/delete",async (req,res)=>{
    let title = req.params.id;
    let blog = await BlogModel.findOneAndDelete({title: title});   
    res.redirect("/user/blogs");
});
app.delete("/api/admin/:id/delete",async (req,res)=>{
    let title = req.params.id;
    let blog = await BlogModel.findOneAndDelete({title: title});   
    res.json({ message: "Blog deleted successfully" });
});

app.get("/user/blogs/new",async (req,res)=>{
    res.render("new.ejs");
});
app.get("/api/admin/blogs/new",async (req,res)=>{
    let category = await CategoryModel.find({});
    res.json(category);
});

app.post("/user/blogs/new",upload.single("Image"),async (req,res)=>{
    let {title, category, description } = req.body;
    let filepath = "/photos/" + req.file.filename ;
    let publishDate =  Date.now();
    let category1 = await CategoryModel.create({title:category ,publishDate:publishDate });
    let blog = await BlogModel.create({title:title ,category:category ,description:description , imgUrl:filepath ,publishDate:publishDate});
    res.redirect("/user");
    
});

app.post("/api/admin/blogs/new",upload.single("Image"),async (req,res)=>{
    try{ 
    let {title, category, description } = req.body;
    let filepath = "/photos/" + req.file.filename ;
    let publishDate =  Date.now();
    let category1 = await CategoryModel.create({title:category ,publishDate:publishDate });
    let blog = await BlogModel.create({title:title ,category:category ,description:description , imgUrl:filepath ,publishDate:publishDate});
   
    res.status(201).json({ message: "Blog created successfully", blog });

} catch (error) {
    console.error("Error creating blog:", error);
    res.status(500).json({ message: "Server error", error });
}
});
// app.get("/categories",async (req,res)=>{  
    
//     let cat = await CategoryModel.insertMany(category);  
//     console.log(cat)
//     res.send("hiiiiiii")
// });

app.get("/user/categories",async (req,res)=>{  
    let blogs = await BlogModel.find({}).sort({ publishDate: -1 });   
    res.render("category.ejs",{blogs});  
});
app.get("/api/admin/categories",async (req,res)=>{  
    let categories = await CategoryModel.find({});   
    res.json(categories);  
});

app.get("/user/:id/categories/edit",async (req,res)=>{
    let category = req.params.id;
    let blog = await BlogModel.findOne({category: category});  
    res.render("categoryEdit.ejs", {blog});    
});
app.get("/api/admin/:id/categories/edit",async (req,res)=>{
    let title = req.params.id;

    let category = await CategoryModel.findOne({title: title});  

    res.json(category);    
});

app.post("/user/:id/categories/edit",async (req,res)=>{
    res.redirect("/user/categories");
});
app.post("/api/admin/:id/categories/edit",async (req,res)=>{
    let title = req.params.id;
    let { category} = req.body;
    let category1 = await CategoryModel.findOneAndUpdate({title: title},{title:category } , {runValidators : true}); 
    res.status(201).json({ message: "category is  edited successfully" });
});

app.get("/user/:id/categories/delete",async (req,res)=>{
    let category = req.params.id;
    let blog = await BlogModel.findOne({category: category});
    res.render("categoryDelete.ejs", {blog});
    
});
app.get("/api/admin/:id/categories/delete",async (req,res)=>{
    let title = req.params.id;

    let category = await CategoryModel.findOne({title: title});  

    res.json(category);    

    
});

app.post("/user/:id/categories/delete",async (req,res)=>{
    res.redirect("/user/categories");   
});
app.post("/api/admin/:id/categories/delete",async (req,res)=>{
    let title = req.params.id;
    let category1 = await CategoryModel.findOneAndDelete({title: title}); 
  
    res.status(201).json({ message: "category is deleted successfully" });
});


app.get("/user/categories/new",async (req,res)=>{  
    res.render("newCategory.ejs");  
});
app.get("/api/admin/categories/new",async (req,res)=>{  
    res.status(201).json({ message: "page for category create" });
});
app.post("/user/categories/new",async (req,res)=>{ 
    res.redirect("/user");  
});
app.post("/api/admin/categories/new",async (req,res)=>{ 
    let { category} = req.body;
    let publishDate =  Date.now();
    let category1 = await CategoryModel.create({title:category ,publishDate:publishDate });
    res.status(201).json({ message: "category is created successfully" });
});

app.get("/logout",async (req,res)=>{
    res.clearCookie("token");   
    res.redirect("/"); 
});
app.get("/api/logout",async (req,res)=>{
    res.clearCookie("token");   
    res.status(201).json({ message: "logout is done successfully" });
});

app.get("/signup",async (req,res)=>{
    res.render("signup.ejs");  
});
app.post("/signup",async (req,res)=>{
    let {fullname , email, password} = req.body;
    try{
        let user = await UserModel.create({fullname:fullname, email:email,password:password,roles :"NORMAL"});
    }catch(err){
        console.log("err", err);
    }
    res.redirect("/");   
});
app.get("/api/signup",async (req,res)=>{

    res.status(201).json({ message: "sign up page" });
});
app.post("/api/signup",async (req,res)=>{
    let {fullname , email, password} = req.body;
    
    try{
        let user = await UserModel.create({fullname:fullname, email:email,password:password,roles :"NORMAL"});
        res.status(201).json({ message: "sign up is done successfully" });
    }catch(err){
        console.log("err", err);
        res.status(500).json({ message: "Server error", err });
    }
    
});

app.get("/signin",async (req,res)=>{    
    res.render("signin.ejs");    
});

app.post("/signin",async (req,res)=>{   
    let { email, password} = req.body;
    let user = await UserModel.findOne({email,password});
    if(!user){
        res.render("signin.ejs");
    }
    else{
        let token = setUser(user);
        res.cookie("token",token);
        res.redirect("/user")
    } 
});
app.get("/api/signin",async (req,res)=>{    
 
    res.status(201).json({ message: "sign up is done successfully" });
});

app.post("/api/signin",async (req,res)=>{   
    try{

        let { email, password} = req.body;
        let user = await UserModel.findOne({email,password});
        let token = setUser(user);
           res.cookie("token",token);
           res.json(user)
 
    }
 catch(err){
    console.log("error",err);
    
 }       
});
app.get("/api/feedback",async (req,res)=>{   
    try{
        let feedback = await FeedbackModel.find({});
           res.status(201).json(feedback);
 
    }
 catch(err){
    console.log("error",err);
    
 }       
});
app.post("/api/feedback",async (req,res)=>{   
    try{

        let { name,email,subject, message} = req.body;
        let feedback = await FeedbackModel.create({name:name,email:email,subject:subject,message:message});
           res.status(201).json({ message: "feedbacck is uploaded successfully" });
 
    }
 catch(err){
    console.log("error",err);
    
 }       
});

app.get("/api/:title", async (req, res) => {
    let title = req.params.title;
    
    try {
        let blog = await BlogModel.findOne({ title: title });
        if (!blog) {
            return res.status(404).send("Blog not found");
        }
        res.status(200).json({ blog });
    } catch (err) {
        console.error("Error fetching blog:", err);
        res.status(500).json({ message: "Internal Server Error" });
    }
});
    

app.get("/:title", async (req, res) => {
    let title = req.params.title;
    
    try {
        let blog = await BlogModel.findOne({ title: title });
        if (!blog) {
            return res.status(404).send("Blog not found");
        }
        res.render("details.ejs", { blog });
    } catch (err) {
        console.error("Error fetching blog:", err);
        res.status(500).send("Internal Server Error");
    }
});
    

app.listen(5000,()=>{
    console.log("server is ready...");
});
