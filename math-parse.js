/***** Math Parsing Library *****/

/* require tools */
/* require prec-math */
/* require cmpl-math */

(function (udf){
  ////// Import //////
  
  var nodep = $.nodep;
  
  var udfp = $.udfp;
  
  var str = String;
  
  var inp = $.inp;
  
  var las = $.las_;
  
  var apl = $.apl;
  var map = $.map;
  var pos = $.pos;
  var has = $.has;
  var rem = $.rem;
  var rpl = $.rpl;
  var mat = $.mat;
  
  var len = $.len_;
  var sli = $.sli;
  var app = $.app;
  
  var each = $.each;
  var mrem = $.mrem;
  
  var push = $.push;
  
  var stf = $.stf;
  
  var err = $.err;
  
  var mknum2 = C.mknum2;
  
  ////// Predicates //////
  
  function bracp(a){
    if (len(a) == 0)return false;
    return a[0] == "(" && las(a) == ")";
  }
  
  function nump(a){
    return has(/^‘[0-9.]+,[0-9.]+’$/, a);
  }
  
  function varp(a){
    return has(/^[a-zA-Z][a-zA-Z0-9]*$/, a);
  }
  
  function operp(a){
    return has(/^[-+*^//!,=]$/, a);
  }
  
  function equp(a){
    return has(/^[a-zA-Z0-9]+=/, a);
  }
  
  function factp(a){
    return a === "!";
  }
  
  function pmp(a){
    return a === "+" || a === "-";
  }
  
  ////// Parser //////
  
  // changes math expr into form processable by prs1
  function prep(a){
    a = rem(/\s/g, str(a));
    
    var ill = mat(/[^a-zA-Z0-9,!*+^.=()//-]/, a);
    if (ill != -1)err(prep, "Illegal character $1 in a = $2", ill, a);
    
    // replace "3i" and "5x" with "3*i" and "5*x"
    a = rpl(/\b([0-9.]+)([a-zA-Z]+)\b/g, "$1*$2", a);
    a = rpl(/\b([0-9.]+)\b/g, "‘$1,0’", a); // real numbers
    a = rpl(/\bi\b/g, "‘0,1’", a); // imaginary numbers
    
    return a;
  }
  
  // converts math expr -> lisp array
  function prs(a, log){
    if (udfp(log))log = function (){};
    a = prep(a);
    log("Finish prep", "$1", a);
    a = prs1(a);
    log("Finish prs", "$1", a);
    
    return a;
  }
  
  // converts prepared math expr -> lisp array
  function prs1(a){
    var o = obj(a, 0);
    if (operp(o)){
      if (inp(o, "-", "+"))return prs1("‘0,0’" + a);
      err(prs1, "Invalid operator $1 at start of a = $2", o, a);
    }
    if (nump(o))return prs2(a, prsnum(o), len(o));
    if (varp(o))return prs2(a, o, len(o));
    if (bracp(o))return prs2(a, prs1(sli(o, 1, len(o)-1)), len(o));
    if (o == "")return "";
    err(prs1, "Unknown object $1 in a = $2", o, a);
  }
  
  function prs2(a, bef, n){
    if (n >= len(a))return bef;
    var o = obj(a, n);
    if (operp(o)){
      if (factp(o))return prs2(a, ["fact", bef], n+len(o));
      var opn = opnd(a, n);
      return prs2(a, [word(o), bef, prs1(opn)], n+len(o)+len(opn));
    }
    // function application
    if (bracp(o)){
      return prs2(a, app([bef], prsargs(o)), n+len(o));
    }
    err(prs2, "Object $1 in a = $2 not an operator", o, a);
  }
  
  function prsnum(a){
    var n = pos(",", a);
    return mknum2(sli(a, 1, n), sli(a, n+1, len(a)-1));
  }
  
  // converts arg expr "(1, 2, 3)" -> array [<1>, <2>, <3>]
  function prsargs(a){
    var name = sli(a, 0, pos("(", a));
    var args = [];
    var b = 1; // bracket level
    var n = 0; // number level
    var las = 0; // end of last arg
    for (var i = 1; i < len(a)-1; i++){
      switch (a[i]){
        case "(": b++; break;
        case ")": b--; break;
        case "‘": n++; break;
        case "’": n--; break;
        case ",": if (b == 1 && n == 0){
          push(sli(a, las+1, i), args);
          las = i;
        }
      }
    }
    // if a != "()"
    if (a[las+1] != ")")push(sli(a, las+1, len(a)-1), args);
    return map(prs1, args);
  }
  
  // gets the object starting at pos
  function obj(a, n){
    if (n >= len(a))return "";
    a = sli(a, n);
    
    if (a[0] == "‘")return mat(/^‘[0-9.]+,[0-9.]+’/, a);
    if (operp(a[0]))return a[0];
    if (a[0] == "("){ // Brackets
      var lvl = 1;
      for (var i = 1; i < len(a); i++){
        if (a[i] == "(")lvl++;
        else if (a[i] == ")")lvl--;
        if (lvl == 0)return sli(a, 0, i+1);
      }
      err(obj, "Brackets not matched in a = $1", a);
    }
    if (has(/^[a-zA-Z0-9]+/, a))return mat(/^[a-zA-Z0-9]+/, a);
    err(obj, "Char $1 in a = $2 not a number or operator", a[0], a);
  }
  
  // gets the operand of an operator given position of the operator
  function opnd(a, n){
    var oper = obj(a, n);
    if (!operp(oper))err(opnd, "Object $1 not an operator", oper);
    return opnd2(a, oper, oper, n+len(oper));
  }
  
  function opnd2(a, oper, las, n){
    var o = obj(a, n);
    if (nump(o) || varp(o)){
      if (operp(las) && !factp(las)){
        return o + opnd2(a, oper, o, n+len(o));
      }
      err(opnd2, "Object $1 before $2 in a = $3 must be a non-factorial operator", las, o, a);
    }
    if (bracp(o)){
      return o + opnd2(a, oper, o, n+len(o));
    }
    if (operp(o)){
      if (!operp(las) || factp(las)){
        if (higher(o, oper))return o + opnd2(a, oper, o, n+len(o));
        return "";
      }
      if (pmp(o))return o + opnd2(a, oper, o, n+len(o));
      err(opnd2, "Object $1 before operator $2 in a = $3 can't be a non-factorial operator", las, o, a);
    }
    if (o == ""){
      if (!operp(las) || factp(las))return "";
      err(opnd2, "Missing object after non-factorial operator $1 in a = $2", las, a);
    }
    err(opnd2, "Unknown object $1 in a = $2", o, a);
  }
  
  function higher(a, b){
    if (a == "^" && b == "^")return true;
    if (a == "=" && b == "=")return true;
    return level(a) > level(b);
  }
  
  function level(a){
    switch (a){
      case ",": return 0;
      case "=": return 1;
      case "+":
      case "-": return 2;
      case "*":
      case "/": return 3;
      case "^": return 4;
      case "!": return 5;
      default: err(level, "Unknown operator $1", a);
    }
  }
  
  function word(a){
    switch (a){
      case ",": return "progn";
      case "=": return "set";
      case "+": return "add";
      case "-": return "sub";
      case "*": return "mul";
      case "/": return "div";
      case "^": return "pow";
      case "!": return "fact";
      default: err(word, "Unknown operator $1", a);
    }
  }
  
  ////// Logging //////
  
  var loggers = [];
  
  function log(subj){
    var rst = sli(arguments, 1);
    each(loggers, function (f){
      f(subj, apl(stf, rst));
    });
  }
  
  function logfn(f){
    push(f, loggers);
  }
  
  function rlogfn(f){
    mrem(f, loggers);
  }
  
  ////// Object exposure //////
  
  var Parser = {
    varp: varp,
    
    prep: prep,
    prs1: prs1,
    prs: prs,
    
    logfn: logfn,
    rlogfn: rlogfn
  };
  
  if (nodep)module.exports = Parser;
  else window.Parser = Parser;
  
})();
