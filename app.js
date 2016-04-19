module.exports = function () {
    'use strict';

    const Path = require('path');
    const Hapi = require('hapi');
    const hal = require('hal');
    const Inert = require('inert');
    const _ = require('lodash');
    const Boom = require('boom');
    const Promise = require("bluebird");
    var CONSTANTS = require('./constants');

    require('./config/development');

    const server = new Hapi.Server({
        connections: {
            routes: {
                files: {
                    relativeTo: Path.join(__dirname, 'public')
                }
            }
        }
    });
    server.connection({ port: 3000 });

    server.register(Inert, function(err) {
        if (err) {
            throw err;
        }

        server.route({
            method: 'GET',
            path: '/{param*}',
            handler: {
                directory: {
                    path: '.',
                    redirectToSlash: true,
                    index: true
                }
            }
        });

        server.route({
            method: 'GET',
            path:'/',
            handler: function (request, reply) {
                return reply.redirect(process.env.HOST + '/browser/index.html#'+process.env.HOST + '/api');
            }
        });

        server.route({
            method: 'GET',
            path:'/api',
            handler: function (request, reply) {
                var resource = new hal.Resource({}, process.env.HOST + '/api');
                resource.link("searchPhotosByText", {href: process.env.HOST + "/api/search_term{?pageNumber,pageSize,text}", templated: true});
                return reply(resource);
            }
        });

        server.route({
            method: 'GET',
            path:'/api/image/{id}',
            handler: function (request, reply) {

                var Flickr = require("flickrapi"),
                    flickrOptions = {
                        api_key: process.env.FLICKR_API_KEY,
                        secret: process.env.FLICKR_API_SECRET
                    };

                Promise.promisify(Flickr.tokenOnly)(flickrOptions)
                .then(function(flickr) {
                    return Promise.promisify(flickr.photos.getInfo)({
                        photo_id: request.params.id
                    });
                })
                .then(function(results) {
                    var photo = results.photo;

                    var photoResource = new hal.Resource({
                        user : photo.owner.username,
                        title : photo.title._content,
                        description : photo.description._content,
                        taken: photo.dates.taken,
                        source: 'https://farm'+photo.farm+'.staticflickr.com/'+photo.server+'/'+photo.id+'_'+photo.secret+'.jpg'
                    }, process.env.HOST + '/api/image/'+request.params.id);

                    return reply(photoResource);
                })
                .catch(function(err) {
                    return reply(Boom.create(500, 'Unexpected error'));
                });

            }
        });

        server.route({
            method: 'GET',
            path: '/api/search_term',
            handler: function (request, reply) {

                var text = request.query.text;
                if (!text) {
                    return reply(Boom.badRequest('The text to search is required'));
                }

                var pageNumber = request.query.pageNumber;
                if (!pageNumber || pageNumber == 0) {
                    pageNumber = CONSTANTS.PHOTO_SEARCH_DEFAULTS.PAGE_NUMBER;
                }
                var pageSize = request.query.pageSize;
                if (!pageSize) {
                    pageSize = CONSTANTS.PHOTO_SEARCH_DEFAULTS.PAGE_SIZE;
                }

                var Flickr = require("flickrapi"),
                    flickrOptions = {
                        api_key: process.env.FLICKR_API_KEY,
                        secret: process.env.FLICKR_API_SECRET
                    };

                Promise.promisify(Flickr.tokenOnly)(flickrOptions)
                .then(function(flickr) {
                    return Promise.promisify(flickr.photos.search)({
                        text: text,
                        page: pageNumber,
                        per_page: pageSize
                    });
                })
                .then(function(result) {
                    var statusCode = result.stat;

                    if (statusCode == 'ok') {

                        var photos = result.photos;

                        if (_.size(photos.photo) == 0) {
                            reply(Boom.create(500, 'No photos found'));
                        }

                        var page = photos.page;
                        var pages = photos.pages;
                        var perPage = photos.perpage;

                        var pageResource = new hal.Resource({
                            page : page,
                            pageSize : perPage,
                        }, process.env.HOST + '/api/search_term?pageNumber=' + (page) + '&pageSize=' + pageSize + '&text=' + text);
                        if (page > 1) {
                            pageResource.link(
                                'previous',
                                process.env.HOST + '/api/search_term?pageNumber=' + (page-1) + '&pageSize=' + pageSize + '&text=' + text);
                        }
                        if (page < pages) {
                            pageResource.link(
                                'next',
                                process.env.HOST + '/api/search_term?pageNumber=' + (page+1) + '&pageSize=' + pageSize + '&text=' + text);
                        }

                        var photoResources = [];
                        _(photos.photo).forEach(function(aPhoto) {
                            var photoResource = new hal.Resource({
                                title: aPhoto.title
                            }, process.env.HOST + '/api/image/' + aPhoto.id);
                            photoResources.push(photoResource);
                        });
                        pageResource.embed("photos", photoResources);

                        return reply(pageResource);
                    } else {
                        return reply(Boom.create(500, 'Flick API response ' + statusCode));
                    }

                })
                .catch(function(err) {
                    return reply(Boom.create(500, 'Unexpected error'));
                });
            }
        });

        server.start(function(err) {
            if (err) {
                throw err;
            }
            console.log('Server running at:', server.info.uri);
        });
    });

};