'use strict';

var supertest = require("supertest");
var expect = require('chai').expect;

var server = supertest.agent("http://localhost:3000");

describe('Search by term', function() {

    this.timeout(5000);

    it("should fail when no text parameter is specified",function(done){
        server
            .get("/api/search_term")
            .expect("Content-type",/json/)
            .end(function(err,res) {
                expect(res.status).to.equal(400);
                done();
            });
    });

    it("should find photos",function(done){
        server
            .get("/api/search_term?text=sea&pageNumber=1&pageSize=5")
            .expect("Content-type",/json/)
            .end(function(err,res) {
                expect(res.status).to.equal(200);
                done();
            });
    });

    it("should not find any photos",function(done){
        server
            .get("/api/search_term?text=ajshdiwodn8239djfn")
            .expect("Content-type",/json/)
            .end(function(err,res) {
                expect(res.status).to.equal(500);
                done();
            });
    });
});