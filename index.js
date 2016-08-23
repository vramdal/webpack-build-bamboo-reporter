var spawn = require('child_process').spawn;
var fs = require("fs");
var jsonfile = require('jsonfile');
var webpackOutputJsonFilename = "webpack-output.json";
var reportFileName = "webpack-bamboo-report.json";

console.log("Creating " + webpackOutputJsonFilename);
const tempWritable = fs.createWriteStream(webpackOutputJsonFilename);
console.log("Running webpack --json -p");
var child = spawn('webpack', ['--json', '-p']);
child.stdout.on('data', function(data) {
    tempWritable.write(data);
});
child.on('close', function(code)  {
    console.log("Reading " + webpackOutputJsonFilename);
    jsonfile.readFile(webpackOutputJsonFilename, function(err, obj) {
        if (err) {
            console.error(err);
            return;
        }
        var result = {
            stats: {
                tests: 0 /*(result.success + result.failed)*/,
                passes: 0 /*result.success*/,
                failures: obj.errors.length /*result.failed*/,
                duration: obj.time /*results.time*/
            },
            failures: obj.errors.map(function(error) {
                var lines = error.split("\n");
                return {
                    title: lines[0],
                    fullTitle: lines[1],
                    duration: obj.time,
                    error: lines.slice(2).join("\n")
                }
            }),
            passes: [],
            skipped: []
        };
        for (var i = 0; i < result.failures.length; i++) {
            var failure = result.failures[i];
            console.error(failure.title + ": " + failure.fullTitle + "\n" + failure.error);
        }
        console.log("Writing " + reportFileName);
        jsonfile.writeFileSync(reportFileName, result, {spaces: 2});
        console.log("Exiting with code " + code);
        process.exit(code);
    });
});