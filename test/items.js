'use strict';

/* eslint no-undef: 0, no-invalid-this: 0 */

require('dotenv').config();

const assert = require('assert');
const fs = require('graceful-fs');
const moment = require('moment');
const path = require('path');
const TF2Items = require('../');

const fileDir = path.join(__dirname, 'files');

describe('Items', function () {
    describe('Instantiate', function () {
        const tf2Items = new TF2Items({ updateTime: 3599999 });

        it('should limit updateTime to 3600000 milliseconds (1 hour)', function () {
            assert.strictEqual(tf2Items.updateTime, 3600000);
        });
    });

    describe('#init()', function () {
        let tf2Items;
        before(function () {
            tf2Items = new TF2Items({ updateTime: -1 });
        });

        it('should throw an error when missing apiKey', function () {
            assert.throws(function () {
                tf2Items.init();
            });
        });

        it('should initialize without errors (assuming that Steam is always responsive)', function (done) {
            this.timeout(10000);

            tf2Items.apiKey = process.env.STEAM_API_KEY;

            assert.doesNotThrow(function () {
                tf2Items.init(done);
            });
        });

        it('should be ready after initializing', function () {
            assert.equal(true, tf2Items.ready);
        });
    });

    describe('#setSchema()', function () {
        let tf2Items;
        let json;

        before(function () {
            tf2Items = new TF2Items();

            json = JSON.parse(fs.readFileSync(path.join(fileDir, 'schema.json')));
            tf2Items.setSchema(json);
        });

        it('should have all the properties in the saved file', function () {
            assert.equal(Object.keys(tf2Items.schema).length, Object.keys(json).length);
        });

        it('should export the same file', function () {
            const json2 = tf2Items.schema.toJSON();
            assert.deepStrictEqual(json2, json);
        });
    });

    describe('#getName()', function () {
        const tf2Items = new TF2Items({ apiKey: process.env.STEAM_API_KEY, updateTime: -1 });

        let schema = JSON.parse(fs.readFileSync(path.join(fileDir, 'schema.json')));
        schema.time = moment().unix();

        tf2Items.setSchema(schema);

        it('should throw an error if the module is not initialized (not ready)', function () {
            assert.throws(function () {
                tf2Items.getName();
            });
        });

        before(function (done) {
            tf2Items.init(done);
        });

        it('should return null if no item with the same defindex was', function () {
            const name = tf2Items.getName({
                defindex: 123,
                quality: 6,
                craftable: true,
                killstreak: 0,
                australium: 0,
                effect: null
            });

            assert.equal(name, null);
        });

        it('should return "The Team Captain"', function () {
            const name = tf2Items.getName({
                defindex: 378,
                quality: 6,
                craftable: true,
                killstreak: 0,
                australium: 0,
                effect: null
            });

            assert.equal(name, 'The Team Captain');
        });

        it('should return "Unusual Horseless Headless Horsemann\'s Headtaker"', function () {
            const name = tf2Items.getName({
                defindex: 266,
                quality: 5,
                craftable: true,
                killstreak: 0,
                australium: 0,
                effect: null
            });

            assert.equal(name, 'Unusual Horseless Headless Horsemann\'s Headtaker');
        });

        it('should return "Strange Unusual Horseless Headless Horsemann\'s Headtaker"', function () {
            const name = tf2Items.getName({
                defindex: 266,
                quality: 11,
                craftable: true,
                killstreak: 0,
                australium: 0,
                effect: null
            });

            assert.equal(name, 'Strange Unusual Horseless Headless Horsemann\'s Headtaker');
        });

        it('should return "Non-Tradeable Non-Craftable Tour of Duty Ticket"', function () {
            const name = tf2Items.getName({
                defindex: 725,
                quality: 6,
                craftable: false,
                tradeable: false,
                killstreak: 0,
                australium: 0,
                effect: null
            });

            assert.equal(name, 'Non-Tradeable Non-Craftable Tour of Duty Ticket');
        });

        it('should return "Bubbling War Pig"', function () {
            const name = tf2Items.getName({
                defindex: 829,
                quality: 5,
                craftable: true,
                tradeable: true,
                killstreak: 0,
                australium: 0,
                effect: 34
            });

            assert.equal(name, 'Bubbling War Pig');
        });

        it('should return "Strange Professional Killstreak Australium Rocket Launcher"', function () {
            const name = tf2Items.getName({
                defindex: 205,
                quality: 11,
                craftable: true,
                tradeable: true,
                killstreak: 3,
                australium: true,
                effect: null
            });

            assert.equal(name, 'Strange Professional Killstreak Australium Rocket Launcher');
        });
    });
});
