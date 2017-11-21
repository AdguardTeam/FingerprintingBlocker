const fs = require('fs');
const asm = require('asm.js');

const gulp = require('gulp')

const asmDir = './src/asm/';

module.exports = (done) => {
    fs.readdir(asmDir, function(err, items) {
        for (let item of items) {
            if (item.endsWith('.asm.js')) {
                let file = fs.readFileSync(asmDir + item).toString();
                console.log(asm.validate(file));
            }
        }
    });

};

