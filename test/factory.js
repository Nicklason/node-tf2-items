'use strict';

/* eslint no-undef: 0, no-invalid-this: 0 */

const fs = require('graceful-fs');
const path = require('path');
const TF2Items = require('../');

const fileDir = path.join(__dirname, 'files');

module.exports = function (options, useSchema) {
    if (options === undefined) {
        options = { apiKey: process.env.STEAM_API_KEY, updateTime: -1 };
    }
    if (useSchema === undefined) {
        useSchema = false;
    }

    const tf2Items = new TF2Items(options);

    if (useSchema === true) {
        const json = fs.readFileSync(path.join(fileDir, 'schema.json'));
        const schema = JSON.parse(json);
        tf2Items.setSchema(schema);
    }

    return tf2Items;
};
