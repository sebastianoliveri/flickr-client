# flickr-client

A Flickr passthrough application to search for photos.

## To run the application

Just download the code and... 

- sudo npm install
- sudo node server.js

## To run the test cases

NPM will install the required packages supertest, mocha and chai. Make sure you have mocha install globally.
Start the server using the command described above and then just run the tests using 'mocha' or your favourite IDE (I use webstorm).
There are just three very simple test cases that hit the API to search for photos in Flickr.

## To use the application

The API follows the Restful Hypermedia constraint and uses with the HAL media type. It provides you with the HAL-Browser (https://github.com/mikekelly/hal-browser) so you can navigate through the whole application by just following the transitions (links).

Just open the browser and type: localhost:3000 :)



