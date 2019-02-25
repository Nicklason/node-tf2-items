'use strict';

/* eslint no-undef: 0, no-invalid-this: 0 */

require('dotenv').config();

const assert = require('assert');
const fs = require('graceful-fs');
const path = require('path');

const factory = require('./factory');
const fileDir = path.join(__dirname, 'files');

describe('Items', function () {
    describe('Instantiate', function () {
        const tf2Items = factory({ updateTime: 3599999 });

        it('should limit updateTime to 3600000 milliseconds (1 hour)', function () {
            assert.strictEqual(tf2Items.updateTime, 3600000);
        });
    });

    describe('#init()', function () {
        let tf2Items;
        before(function () {
            tf2Items = factory({ updateTime: -1 });
        });

        it('should throw an error when missing apiKey', function () {
            assert.throws(function () {
                tf2Items.init();
            });
        });

        it('should initialize without errors (assuming that Steam is responsive)', function (done) {
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
            tf2Items = factory(undefined, true);
            json = JSON.parse(fs.readFileSync(path.join(fileDir, 'schema.json')));
        });

        it('should export the same file', function () {
            const json2 = tf2Items.schema.toJSON();
            assert.deepStrictEqual(json2, json);
        });
    });
});

describe('Schema', function () {
    describe('#getName()', function () {
        const tf2Items = factory({ apiKey: process.env.STEAM_API_KEY, updateTime: -1 }, true);

        it('should throw an error if the module is not initialized (not ready)', function () {
            assert.throws(function () {
                tf2Items.schema.getName();
            });
        });

        before(function (done) {
            tf2Items.init(done);
        });

        it('should return null if no item with the same defindex was', function () {
            const name = tf2Items.schema.getName({
                defindex: 123,
                quality: 6,
                craftable: true,
                killstreak: 0,
                australium: 0,
                effect: null
            });

            assert.equal(name, null);
        });

        it('should not care about types', function () {
            const name = tf2Items.schema.getName({
                defindex: '378',
                quality: '6',
                craftable: 'false',
                tradeable: 'false',
                killstreak: '1',
                australium: 'true',
                effect: '34'
            });

            assert.equal(name, 'Non-Tradeable Non-Craftable Bubbling Killstreak Australium Team Captain');
        });

        it('should return "The Team Captain"', function () {
            const name = tf2Items.schema.getName({
                defindex: 378,
                quality: 6,
                craftable: true,
                killstreak: 0,
                australium: 0,
                effect: null
            });

            assert.equal(name, 'The Team Captain');
        });

        it('should return "Team Captain"', function () {
            const name = tf2Items.schema.getName({
                defindex: 378,
                quality: 6,
                craftable: true,
                killstreak: 0,
                australium: 0,
                effect: null
            }, false);

            assert.equal(name, 'Team Captain');
        });

        it('should return "Unusual Horseless Headless Horsemann\'s Headtaker"', function () {
            const name = tf2Items.schema.getName({
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
            const name = tf2Items.schema.getName({
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
            const name = tf2Items.schema.getName({
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
            const name = tf2Items.schema.getName({
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
            const name = tf2Items.schema.getName({
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

        it('should return "Strange Night Owl Sniper Rifle (Battle Scarred)"', function () {
            const name = tf2Items.schema.getName({
                defindex: 15000,
                quality: 11,
                craftable: true,
                killstreak: 0,
                australium: false,
                effect: null,
                wear: 5
            });

            assert.equal(name, 'Strange Night Owl Sniper Rifle (Battle Scarred)');
        });
    });
});

describe('Inventory', function () {
    const tf2Items = factory({ apiKey: process.env.STEAM_API_KEY, updateTime: -1 }, true);
    let inventory;

    before(function (done) {
        tf2Items.init(done);
    });

    describe('#fetch', function (done) {
        it('should fetch without errors (assuming that Steam is responsive)', function (done) {
            this.timeout(30000);
            tf2Items.getInventory('76561198120070906', function (err, inv) {
                if (err) {
                    return done(err);
                }

                inventory = inv;
                done();
            });
        });
    });

    describe('#isPrivate()', function () {
        it('should return false (inventory is not private)', function () {
            assert.strictEqual(inventory.isPrivate(), false);
        });
    });

    describe('#getOverview', function (done) {
        it('should not throw an error when creating the overview', function () {
            assert.doesNotThrow(function () {
                inventory.getOverview();
            });
        });

        it('should return an object', function () {
            // It does not display all items because it is using a minified schema used to test with (files/schema.json)
            assert.equal(typeof inventory.getOverview(), 'object');
        });
    });

    describe('#findItem()', function () {
        it('should null because an item with the same id was not found', function () {
            assert.strictEqual(inventory.findItem('1234'), null);
        });
    });
});
