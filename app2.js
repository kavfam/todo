//jshint esversion:6
cl = (...args) => console.log(...args);
let defaultItems = [];
const express = require("express");
const bodyParser = require("body-parser");
const _ = require("lodash");

//import mongoose module
const mongoose = require("mongoose");

const date = require(__dirname + "/date.js");

const app = express();

app.set("view engine", "ejs");

app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.static("public"));

//set up default mongoose connection (this will connect to or create databse if it doesnt exist)
const myDB = "todolistDB"; // default database
const mongoDB = "mongodb://localhost:27017/" + myDB;
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
  cl("inside app.get'/'");
  cl("inside app.get'/'");
  cl("inside app.get'/'");

  // check for a list to display. findOne will find first list and can then use founditems[name] to get name and redirect to custom. If I use find() it will find all lists but I cant use founditems[name].

  List.find({}, function (err, foundItems) {
    // check if foundItems has any items, if not, can add default items
    if (err) {
      console.log(err);
    } else {
      if (foundItems.length === 0) {
        //   createDefaults(); // if no items found, create default docs
        //   res.redirect("/");
        cl("Get / - nothing found??");
        cl("Get / - nothing found??");
        cl("Get / - nothing found??");

        res.render("list2", {
          listTitle: "Add List Below",
          newListItems: [],
        });

        cl("Get / - after render add List below.");
        //
      } else {
        // if using findOne above, then I can get the listName and redirect to the custom route

        // // need to get name then pass that to custom route

        const itemName = foundItems["name"];
        listTitle = itemName;
        cl(foundItems);
        cl(foundItems.name);
        res.redirect("/" + itemName);

        // if using find (all), then want to display all lists from foundItems
        // cl("get / else");
        // cl(foundItems);

        // res.render("list2", {
        //   listTitle: "Select List to Update",
        //   newListItems: foundItems,
        // });
      }
    }
  });
});

app.post("/", function (req, res) {
  cl("app.post'/'");
  // with mongodb, still want to get new item entered in form so still use req.body but now we are creating a new document and then add that document to collection
  const itemName = req.body.newItem;
  const listName = req.body.list;

  // if first char of input is "/" then use this as route to custom list, otherwise, add the item
  cl(itemName);
  cl(itemName.substring(0, 1));
  cl(itemName.substring(1));

  if (itemName.substring(0, 1) === "/") {
    res.redirect("/" + itemName.substring(1));
  } else {
    cl("app.post / entered /list should NOT reach this point!");

    const item = new Item({
      name: itemName,
    });
    cl(`app.post / itemName: ${itemName}, list: ${listName}`);

    // now check if listName = Today, so an item is being added to "Todays" list and if so, save item and redirect to home
    // if listName <> Today, that means that a custom list was entered eg localhost:3000/work and in the custom route, if that custom list is found, it is displayed, otherwise it is created.

    // if (listName === "Today") {
    //   item.save();
    //   res.redirect("/");
    // } else {
    //   // if listName is not "today" then that means it is already added as a custom list. So we search for that list and then add the new item to that list. It MUST be found. When a new list name is first given as a (custom route) the list is created at that point and then the listName item is assigned. So when you get to this point, of adding a new item, you are adding it to "listName". The search here is not so much to find IF it exists but to find the record to add the item to the list.

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
  // if (listName === "Today") {
  //   // can also Item.findByIdAndRemove(checkedItemId, function(err){}) - that method you MUST provide callback or it will NOT execute delete.
  //   Item.deleteOne({ _id: checkedId }, function (err) {
  //     // returns {deletedCount: x} where x is the number of documents deleted.
  //     if (err) {
  //       cl(err);
  //     } else {
  //       cl("Deleted doc id:" + checkedId);
  //       res.redirect("/");
  //     }
  //   });
  // } else {
  //   // to remove an item from a custom list, need to find the item and the mongodb pull method
  List.findOneAndUpdate(
    { name: listName },
    { $pull: { items: { _id: checkedId } } },
    function (err, foundList) {
      if (!err) {
        res.redirect("/" + listName);
      }
    }
  );
  //  }
});

//custom lists
app.get("/:customListName", function (req, res) {
  cl("Inside app.get'/:customListName'");
  cl("Inside app.get'/:customListName'");
  cl("Inside app.get'/:customListName'");
  cl("Inside app.get'/:customListName'");
  cl("Inside app.get'/:customListName'");
  const customListName = _.capitalize(req.params.customListName);
  cl(`customListName = ${customListName}`);

  // check if name exists and if it does display otherwise create it
  List.findOne({ name: customListName }, function (err, foundList) {
    cl(`after List.findOne name: ${customListName}`);

    if (!err) {
      cl("inside if (!err)");

      if (!foundList) {
        cl("inside  !err !foundList");
        cl(`defaultItems: ${defaultItems}`);

        //create new list
        const list = new List({
          name: customListName,
          items: defaultItems,
        });
        list.save();

        cl(`created list ${customListName}`);
        cl(`redirect to /${customListName}`);

        res.redirect("/" + customListName); // redirects back to this route but then finds new list and displays in else block
      } else {
        cl(`Found list. Render list ${foundList.name}`);

        // display existing list
        res.render("list2", {
          listTitle: foundList.name,
          newListItems: foundList.items,
        });
      }
    }
  });
});

app.get("/about", function (req, res) {
  res.render("about");
});

app.listen(3000, function () {
  console.log("Server started on port 3000");
  console.log("Server started on port 3000");
  console.log("Server started on port 3000");
});

///////////////////////Functions //////////////////////////////////
//
function createDefaults() {
  const item1 = new Item({
    name: "Welcome to your todolist!",
  });
  // const item2 = new Item({
  //   name: "Hit the + button to add a new item.",
  // });
  // const item3 = new Item({
  //   name: "<--Hit this to delete an item!",
  // });
  // const item4 = new Item({
  //   name: "Below, enter /listname to show list",
  // });

  // saving these to default array
  //  defaultItems = [item1, item2, item3, item4];
  defaultItems = [item1];

  // to save more than one document, use insertMany()
  Item.insertMany(defaultItems, function (err) {
    if (err) {
      cl(err);
    } else {
      cl("Successfully inserted default items!");
    }
  });

  // //create new list
  // const list = new List({
  //   name: customListName,
  //   items: defaultItems,
  // });
  // list.save();
  // res.redirect("/" + customListName); // redirects back to this route but then finds new list and displays in else block
  // cl("created list :" + customListName);
}
