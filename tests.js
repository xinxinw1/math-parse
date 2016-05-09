QUnit.assert.testdeep = function (a, x){
  this.same(a, x, $.deepiso);
};

QUnit.test('Parser', function (assert){
  assert.testdeep(Parser.prs("-(53*3-2/(4i))+((34+53i)/(23-34i))*(-i)"), ["add", ["sub", C.mknum("0"), ["sub", ["mul", C.mknum("53"), C.mknum("3")], ["div", C.mknum("2"), ["mul", C.mknum("4"), C.mknum("i")]]]], ["mul", ["div", ["add", C.mknum("34"), ["mul", C.mknum("53"), C.mknum("i")]], ["sub", C.mknum("23"), ["mul", C.mknum("34"), C.mknum("i")]]], ["sub", C.mknum("0"), C.mknum("i")]]]);
  assert.testdeep(Parser.prs("-1^3"), ["sub", C.mknum("0"), ["pow", C.mknum("1"), C.mknum("3")]]);
  assert.testdeep(Parser.prs("2^3^4"), ["pow", C.mknum("2"), ["pow", C.mknum("3"), C.mknum("4")]]);
  assert.testdeep(Parser.prs("2^-1"), ["pow", C.mknum("2"), ["sub", C.mknum("0"), C.mknum("1")]]);
  assert.testdeep(Parser.prs("2^-1!"), ["pow", C.mknum("2"), ["sub", C.mknum("0"), ["fact", C.mknum("1")]]]);
});
