//jshint esversion:6
cl = (...args) => console.log(...args);

// use dotenv to access your .env file
require("dotenv").config();
const srvr = process.env.N1_KEY;
const srvrCred = process.env.N1_SECRET;

let defaultItems = [];
const express = require("express");
const bodyParser = require("body-parser");
const _ = require("lodash");

//import mongoose module
const mongoose = require("mongoose");

//const date = require(__dirname + "/date.js");

const app = express();

app.set("view engine", "ejs");

app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.static("public"));

//set up default mongoose connection (this will connect to or create databse if it doesnt exist)
const myDB = "todolistDB"; // default database
//const mongoDB = "mongodb://localhost:27017/" + myDB;
const mongoDB =
  "mongodb+srv://" +
  srvr +
  ":" +
  srvrCred +
  "@cluster0.57qzj.mongodb.net/todolistDB";

mongoose.connect(mongoDB, { useNewUrlParser: true });

//get the default connecton
const db = mongoose.connection;

//bind connection to error event to get notification of connection errors
db.on("error", console.error.bind(console, "MongoDB connection error"));
cl("connection made");

////////////////// Schemas / Models ////////////////////////////////
//
// Next step is to create schema / model
const itemsSchema = new mongoose.Schema({
  name: String,
});
// model must specify singular name of collection, schema
const Item = mongoose.model("Item", itemsSchema);

// for custom lists, need schema/model
const listSchema = {
  name: String,
  items: [itemsSchema],
};
const List = mongoose.model("List", listSchema);

cl("created schemas/models");

/////////////////////// Routes ///////////////////////////////////
//
app.get("/", function (req, res) {
  // const day = date.getDate();
  //  res.render("list", { listTitle: day, newListItems: items });
  // no longer using array items so instead create the documents ..
  cl("app.get'/'");

  // read data from database
  Item.find({}, function (err, foundItems) {
    // check if foundItems has any items, if not, can add default items
    if (foundItems.length === 0) {
      createDefaults(); // if no items found, create default docs
      res.redirect("/");
    } else {
      res.render("list", { listTitle: "Today", newListItems: foundItems });
    }
  });
});

app.post("/", function (req, res) {
  cl("app.post'/'");
  // with mongodb, still want to get new item entered in form so still use req.body but now we are creating a new document and then add that document to collection
  const itemName = req.body.newItem;
  const listName = req.body.list;

  // if first char of input is "/" then use this as route to custom list, otherwise, add the item
  cl(itemName.substring(0, 1));
  cl(itemName.substring(1));

  if (itemName.substring(0, 1) === "/") {
    res.redirect("/" + itemName.substring(1));
    return;
  }

  const item = new Item({
    name: itemName,
  });
  cl(`app.post / itemName: ${itemName}, list: ${listName}`);

  // now check if listName = Today, so an item is being added to "Todays" list and if so, save item and redirect to home
  // if listName <> Today, that means that a custom list was entered eg localhost:3000/work and in the custom route, if that custom list is found, it is displayed, otherwise it is created.

  if (listName === "Today") {
    item.save();
    res.redirect("/");
  } else {
    // if listName is not "today" then that means it is already added as a custom list. So we search for that list and then add the new item to that list. It MUST be found. When a new list name is first given as a (custom route) the list is created at that point and then the listName item is assigned. So when you get to this point, of adding a new item, you are adding it to "listNam". The search here is not so much to find IF it exists but to find the record to add the item to the list.
    List.findOne({ name: listName }, function (err, foundList) {
      foundList.items.push(item);
      foundList.save();
      res.redirect("/" + listName);
    });
  }
});

app.post("/delete", function (req, res) {
  cl("app.post'/delete'");
  const checkedId = req.body.checkbox;
  const listName = req.body.listName; // get this from hidden input

  // now need to check if we are deleting from custom list or "today"
  if (listName === "Today") {
    // can also Item.findByIdAndRemove(checkedItemId, function(err){}) - that method you MUST provide callback or it will NOT execute delete.
    Item.deleteOne({ _id: checkedId }, function (err) {
      // returns {deletedCount: x} where x is the number of documents deleted.
      if (err) {
        cl(err);
      } else {
        cl("Deleted doc id:" + checkedId);
        res.redirect("/");
      }
    });
  } else {
    // to remove an item from a custom list, need to find the item and the mongodb pull method
    List.findOneAndUpdate(
      { name: listName },
      { $pull: { items: { _id: checkedId } } },
      function (err, foundList) {
        if (!err) {
          res.redirect("/" + listName);
        }
      }
    );
  }
});

//custom lists
app.get("/:customListName", function (req, res) {
  cl("app.get'/:customListName'");
  const customListName = _.capitalize(req.params.customListName);

  // check if name exists and if it does display otherwise create it
  List.findOne({ name: customListName }, function (err, foundList) {
    if (!err) {
      if (!foundList) {
        //create new list
        const list = new List({
          name: customListName,
          items: defaultItems,
        });
        list.save();
        res.redirect("/" + customListName); // redirects back to this route but then finds new list and displays in else block
        cl("created list :" + customListName);
      } else {
        // display existing list
        res.render("list", {
          listTitle: foundList.name,
          newListItems: foundList.items,
        });
      }
    }
  });
});

// app.listen(3000, function () {
//   console.log("Server started on port 3000");
// });
app.listen(process.env.PORT || 3000, function () {
  cl("Server started at port 3000");
});

///////////////////////Functions //////////////////////////////////
//
function createDefaults() {
  const item1 = new Item({
    name: "Welcome to your todolist!",
  });
  const item2 = new Item({
    name: "Hit the + button to add a new item.",
  });
  const item3 = new Item({
    name: "<--Hit this to delete an item!",
  });

  // saving these to default array
  defaultItems = [item1, item2, item3];

  // to save more than one document, use insertMany()
  Item.insertMany(defaultItems, function (err) {
    if (err) {
      cl(err);
    } else {
      cl("Successfully inserted default items!");
    }
  });
}
