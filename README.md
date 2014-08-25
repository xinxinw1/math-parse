# Math Parsing Library

A math parser that works in both web js and Node.js.

## How to use in HTML

1. Go to https://github.com/xinxinw1/tools/releases and download the latest release.
2. Go to https://github.com/xinxinw1/math-parse/releases and download the latest release.
3. Extract `tools.js` from the first download and `math-parse.js` from the second download into your project directory.
4. Add
   
   ```html
   <script src="tools.js"></script>
   <script src="math-parse.js"></script>
   ```
   
   to your html file.
5. Run `$.al(Parser.prs("-2^(13-4)/3^3i*7"))` to make sure it works.
   (Should output
   ```
   ["sub", ["num", "0", "0"],
           ["mul", ["div", ["pow", ["num", "2", "0"],
                                   ["sub", ["num", "13", "0"], ["num", "4", "0"]]],
                           ["pow", ["num", "3", "0"],
                                   ["mul", ["num", "3", "0"], ["num", "0", "1"]]]], 
                   ["num", "7", "0"]]]
   ```
   )

See http://xinxinw1.github.io/math-parse/ for a demo.

## How to use in Node.js

1. Go to https://github.com/xinxinw1/tools/releases and download the latest release.
2. Go to https://github.com/xinxinw1/math-parse/releases and download the latest release.
3. Extract `tools.js` from the first download and `math-parse.js` from the second download into your project directory.
4. Run `$ = require("./tools.js")` in node.
5. Run `Parser = require("./math-parse.js")` in node
6. Run `$.prn(Parser.prs("-2^(13-4)/3^3i*7"))` to make sure it works.
   (Should output
   ```
   ["sub", ["num", "0", "0"],
           ["mul", ["div", ["pow", ["num", "2", "0"],
                                   ["sub", ["num", "13", "0"], ["num", "4", "0"]]],
                           ["pow", ["num", "3", "0"],
                                   ["mul", ["num", "3", "0"], ["num", "0", "1"]]]], 
                   ["num", "7", "0"]]]
   ```
   and return `undefined`
   )

## Function reference

```
Note: These are all accessed by Parser.<insert name>

### Parser

prep(a)           does a couple of preparations for the main parser
prs1(a)           main parser; converts output from prep(a) to a lisp-like array
prs(a)            return prs1(prep(a)); input math expr and output lisp array

### Logging

logfn(a)          add a logger callback; takes a function(subj, data);
                    use this if you want to catch intermediate outputs
                    during a run of prs(a)
rlogfn(f)         remove a logging callback
```
