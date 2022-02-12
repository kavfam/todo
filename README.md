# todo
to-do lists
Another project from AY JS course on Udemy and App Brewery. 
This project is a to-do list where you can enter as many lists as you want and as many items per list as you want. Its basic - only a description field for list/item.
Background
Its js using express and mongoose/mongod cloud database. 
Uses .env for connection credentials for mongo atlas / cloud database. 
being express it had the usual app.get, .post and .listen.
Uses ejs for rendering items/list.
Deployed to Heroku so uses Config Vars there to substitute for .env variables
App.js
Requires express, body-parser, loadash, mongoose, dotenv.
Sets up connection to mongoDB cluster.
Sets up schemas/models for items and lists.
If no items/lists, some default items will be created for "Today". You can add more items for "Today" or you can enter /Listname in input field. If a list exists it will then display the items in the list. If it does not, it will create the list and you can then add items to the list created.
You can click the checkbox to DELETE an item.
Thats it!
