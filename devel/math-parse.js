/***** Math Parsing Library Devel *****/

/* requires "tools.js" */
/* requires "prec-math.js" */
/* requires "prec-math-check.js" */

(function (win, udf){
  ////// Import //////
  
  var str = String;
  var arrp = $.arrp;
  var udfp = $.udfp;
  
  var len = $.len;
  var pos = $.pos;
  var rpl = $.rpl;
  var sli = $.sli;
  var app = $.app;
  var rem = $.rem;
  var att = $.att;
  var map = $.map;
  var has = $.has;
  
  var psh = $.psh;
  
  var oref = $.oref;
  var oset = $.oset;
  var odel = $.odel;
  
  var stf = $.stf;
  
  var apl = $.apl;
  var mat = $.mat;
  var err = $.err;
  var inp = $.inp;
  var las = $.las;
  
  var proc = PMath.proc;
  var log = PMath.log;
  
  ////// Predicates //////
  
  function bracp(a){
    if (len(a) == 0)return false;
    return a[0] == "(" && las(a) == ")";
  }
  
  function fnp(a){
    if (len(a) == 0)return false;
    return has(/^[a-zA-Z0-9]+\(/, a) && las(a) == ")";
  }
  
  function nump(a){
    return has(/^‘[0-9.]+,[0-9.]+’$/, a);
  }
  
  function varp(a){
    return has(/^[a-zA-Z0-9]+$/, a);
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
  
  ////// Prepare //////
  
  // changes math expr into form processable by prs
  function prep(a){
    a = rem(/\s/g, str(a));
    
    var ill = mat(/[^a-zA-Z0-9,!*+^.=()//-]/, a);
    if (ill != -1)err(prep, "Illegal character $1 in a = $2", ill, a);
    
    // replace "3i" and "5x" with "3*i" and "5*x"
    a = rpl(/\b([0-9.]+)([a-zA-Z]+)\b/g, "($1*$2)", a);
    a = rpl(/\b([0-9.]+)\b/g, "‘$1,0’", a); // real numbers
    a = rpl(/\bi\b/g, "‘0,1’", a); // imaginary numbers
    
    return a;
  }
  
  ////// Parser //////
  
  // converts math expr -> lisp array
  function parse(a){
    a = prep(a);
    log("Finish prepare", "$1", a);
    a = prs(a);
    log("Finish parse", "$1", a);
    
    return a;
  }
  
  // converts prepared math expr -> lisp array
  function prs(a){
    var o = obj(a, 0);
    if (operp(o)){
      if (inp(o, "-", "+"))return prs2(a, "‘0,0’", 0);
      err(prs, "Invalid operator $1 at start of a = $2", o, a);
    }
    if (nump(o) || varp(o))return prs2(a, o, len(o));
    if (bracp(o))return prs2(a, prs(sli(o, 1, len(o)-1)), len(o));
    if (fnp(o))return prs2(a, prsfn(o), len(o));
    if (equp(o)){
      var equ = pos("=", o);
      return prs2(a, sli(o, 0, equ), equ);
    }
    if (o == "")return "";
    err(prs, "Unknown object $1 in a = $2", o, a);
  }
  
  function prs2(a, bef, n){
    if (n >= len(a))return bef;
    var o = obj(a, n);
    if (operp(o)){
      if (factp(o))return prs2(a, ["fact", bef], n+len(o));
      var opn = opnd(a, n);
      return prs2(a, [word(o), bef, prs(opn)], n+len(o)+len(opn));
    }
    err(prs2, "Object $1 in a = $2 not an operator", o, a);
  }
  
  // converts function expr -> lisp array
  function prsfn(a){
    var name = sli(a, 0, pos("(", a));
    var args = [];
    var b = 1; // bracket level
    var n = 0; // number level
    var las = pos("(", a);
    for (var i = las+1; i < len(a)-1; i++){
      switch (a[i]){
        case "(": b++; break;
        case ")": b--; break;
        case "‘": n++; break;
        case "’": n--; break;
        case ",": if (b == 1 && n == 0){
          psh(sli(a, las+1, i), args);
          las = i;
        }
      }
    }
    if (a[las+1] != ")")psh(sli(a, las+1, len(a)-1), args);
    return app([name], map(prs, args));
  }
  
  // gets the object starting at pos
  function obj(a, n){
    if (n >= len(a))return "";
    a = sli(a, n);
    
    if (a[0] == "‘")return mat(/^‘[0-9.]+,[0-9.]+’/, a);
    if (operp(a[0]))return a[0];
    if (has(/^[a-zA-Z0-9]*\(/, a)){ // Brackets and Functions
      var lvl = 1;
      for (var i = pos("(", a)+1; i < len(a); i++){
        if (a[i] == "(")lvl++;
        else if (a[i] == ")")lvl--;
        if (lvl == 0)return sli(a, 0, i+1);
      }
      err(obj, "Brackets not matched in a = $1", a);
    }
    if (has(/^[a-zA-Z0-9]+=/, a))return a;
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
    if (nump(o) || bracp(o) || fnp(o) || varp(o) || equp(o)){
      if (operp(las) && !factp(las)){
        return o + opnd2(a, oper, o, n+len(o));
      }
      err(opnd2, "Object $1 before $2 in a = $3 must be a non-factorial operator", las, o, a);
    }
    if (operp(o)){
      if (!operp(las) || factp(las)){
        if (higher(o, oper))return o + opnd2(a, oper, o, n+len(o));
        return "";
      }
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
  
  ////// Evaluator //////
  
  // evaluates lisp array into ‘a,b’
  function evl(a){
    if (arrp(a)){
      var f = fref(a[0]);
      if (!f)err(evl, "Fn $1 not found", a[0]);
      var result = apl(f, map(evl, sli(a, 1)));
      log("Finish evl", "$1 -> $2", a, result);
      return result;
    }
    if (nump(a)){
      var n = pos(",", a);
      return [sli(a, 1, n), sli(a, n+1, len(a)-1)];
    }
    return a;
  }
  
  function procvars(a){
    if (arrp(a)){
      var f = a[0];
      if (f == "set"){
        var nm = a[1];
        if (!varp(nm))err(procvars, "set: Invalid variable name $1", nm);
        if (has(/^(i|pi|e|phi)$/, nm)){
          err(procvars, "set: Can't set special var $1", nm);
        }
        var data = vset(nm, procvars(a[2]));
        log("Set Variable " + nm, "$1", data);
        return data;
      }
      if (f == "unset"){
        var nm = a[1];
        if (has(/^(i|pi|e|phi)$/, nm)){
          err(procvars, "unset: Can't unset special var $1", nm);
        }
        var data = delvar(nm);
        if (!data){
          err(procvars, "unset: Variable $1 is already unset", nm);
        }
        log("Unset Variable " + nm, "");
        return data;
      }
      if (f == "progn"){
        var args = map(procvars, sli(a, 1));
        log("Finish progn", "$1", a);
        return las(args);
      }
      return app([f], map(procvars, sli(a, 1)));
    }
    if (varp(a)){
      var data = vref(a);
      if (!data)err(procvars, "Variable $1 is undefined", a);
      log("Get Variable " + a, "$1", data);
      return data;
    }
    return a;
  }
  
  ////// Display //////
  
  // converts ‘a,b’ -> a+bi
  function disp(a){
    if (a == "")return a;
    var re = C.getA(a);
    var b = C.getB(a);
    var im = R.abs(b);
    switch (im){
      case "0": return re;
      case "1": im = "i"; break;
      default: im += "i"; break;
    }
    var sign = R.negp(b);
    if (re == "0")return sign?"-"+im:im;
    return re + (sign?"-":"+") + im;
  }
  
  ////// Calculator //////
  
  // converts math expr -> a+bi
  function calc(a){
    log("Input", "$1", a);
    a = parse(a);
    a = procvars(a);
    log("Finish procvars", "$1", a);
    a = evl(a);
    log("Finish evl", "$1", a);
    a = disp(a);
    log("Finish disp", "$1", a);
    
    return a;
  }
  
  ////// Variables //////
  
  var vs = {};
  
  function vref(name){
    return oref(vs, name);
  }
  
  function vset(name, data){
    return oset(vs, name, data);
  }
  
  function vdel(name){
    return odel(vs, name);
  }
  
  var funcs = {};
  
  // gets function reference from functions list given name as string
  
  function fref(name){
    return oref(funcs, name);
  }
  
  function fset(name, fnref){
    return oset(funcs, name, fnref);
  }
  
  function chkfn(name, fnref){
    fset(name, proc(fnref));
  }
  
  vset("e", ["e"]);
  vset("pi", ["pi"]);
  vset("phi", ["phi"]);
  vset("ln2", ["ln2"]);
  vset("ln5", ["ln5"]);
  vset("ln10", ["ln10"]);
  
  chkfn("add", C.add);
  chkfn("sub", C.sub);
  chkfn("mul", C.mul);
  chkfn("div", C.div);
  
  chkfn("rnd", C.rnd);
  chkfn("round", C.rnd);
  chkfn("cei", C.cei);
  chkfn("ceil", C.cei);
  chkfn("flr", C.flr);
  chkfn("floor", C.flr);
  chkfn("trn", C.trn);
  chkfn("trunc", C.trn);
  
  chkfn("exp", C.exp);
  chkfn("ln", C.ln);
  chkfn("pow", C.pow);
  chkfn("root", C.root);
  chkfn("sqrt", C.sqrt);
  chkfn("cbrt", C.cbrt);
  chkfn("fact", C.fact);
  chkfn("bin", C.bin);
  chkfn("agm", C.agm);
  chkfn("sin", C.sin);
  chkfn("cos", C.cos);
  chkfn("sinh", C.sinh);
  chkfn("cosh", C.cosh);
  
  chkfn("abs", C.abs);
  chkfn("arg", C.arg);
  chkfn("sgn", C.sgn);
  chkfn("sign", C.sgn);
  chkfn("re", C.re);
  chkfn("Re", C.re);
  chkfn("im", C.im);
  chkfn("Im", C.im);
  chkfn("conj", C.conj);
  
  chkfn("pi", C.pi);
  chkfn("e", C.e);
  chkfn("phi", C.phi);
  chkfn("ln2", C.ln2);
  chkfn("ln5", C.ln5);
  chkfn("ln10", C.ln10);
  
  ////// Object exposure //////
  
  win.PMath = att({
    parse: parse,
    evl: evl,
    disp: disp,
    calc: calc
  }, PMath);
  
  ////// Testing //////
  
  //alert($.toStr(calc("3i+5+2^3+exp(34)-24*5!-(3i^sin(32-i)+5/3)^4")));
  //alert($.toStr(calc("-23^2*5-2+4/3*2/4*2/5!/3/2/6!^10-2")));
  //alert($.toStr(calc("-(53*3-2/(4i))+((34+53i)/(23-34i))*(-i)")));
  //alert($.toStr(calc("mult(34i+2!, 243*32i/5, 50*1, 3, 60))")));
})(window);