"use strict";
// Synthetic-only regressions: no provider calls or live case data.
const { test } = require("node:test");
const assert = require("node:assert/strict");
process.env.ANTHROPIC_API_KEY = "SYNTHETIC_ONLY_NON_SECRET";
process.env.DOC_INDEX_PATH = "/nonexistent-synthetic-index.json";
const { handler } = require("../netlify/functions/chat");
const u = content => ({role:"user",content});
const a = content => ({role:"assistant",content});
const req = payload => ({httpMethod:"POST",body:JSON.stringify(payload)});
let outbound=0;
async function withFakeProvider(event, provider) {
  const prior=global.fetch;
  outbound=0;
  global.fetch=async (...args) => {
    outbound++;
    if (!provider) throw Error("Unexpected model call");
    return provider(...args);
  };
  try {return await handler(event);} finally {global.fetch=prior;}
}
async function reject(messages, expected=400) {
  const result=await withFakeProvider(req({messages}));
  assert.equal(result.statusCode,expected);
  assert.equal(outbound,0,"No provider calls permitted on rejected inputs");
}
test("GET is rejected before model access",async()=>{
  const r=await withFakeProvider({httpMethod:"GET",body:"{}"});
  assert.equal(r.statusCode,405);assert.equal(outbound,0);
});
test("same-origin contract does not issue wildcard CORS authorisation",async()=>{
  const r=await withFakeProvider({httpMethod:"OPTIONS",body:"{}"});
  assert.notEqual(r.headers["Access-Control-Allow-Origin"],"*");
  assert.equal(outbound,0);
});
test("unconfigured model returns only a generic error",async()=>{
  const prev=process.env.ANTHROPIC_API_KEY;delete process.env.ANTHROPIC_API_KEY;
  try {const r=await withFakeProvider(req({messages:[u("fictional question")]}));
    assert.equal(r.statusCode,503);
    assert.doesNotMatch(r.body,/ANTHROPIC_API_KEY/);assert.equal(outbound,0);
  }finally{process.env.ANTHROPIC_API_KEY=prev;}
});
test("invalid JSON is rejected without a provider request",async()=>{
  const r=await withFakeProvider({httpMethod:"POST",body:"{invalid"});
  assert.equal(r.statusCode,400);assert.equal(outbound,0);
});
test("non-object payload and missing messages are rejected",async()=>{
  for(const body of ["null","[]","{}"]){
    const r=await withFakeProvider({httpMethod:"POST",body});
    assert.equal(r.statusCode,400);assert.equal(outbound,0);
  }
});
test("malformed role and content cannot be silently co-erced",async()=>{
  for(const message of [{role:"system",content:"synthetic"},{role:"user",content:42},null,{role:"assistant",content:""}]){
    await reject([message,u("fictional question")]);
  }
});
test("blank or non-user final message is rejected",async()=>{
  await reject([u("   ")]);await reject([u("fictional"),a("synthetic response")]);
});
test("individual message limit is enforced without silent clipping",async()=>{
  await reject([u("x".repeat(12001))]);
});
test("aggregate history limit is enforced",async()=>{
  const records=[u("x".repeat(9000)),a("a".repeat(9000)),u("x".repeat(9000)),a("a".repeat(9000)),u("x".repeat(9000)),a("a".repeat(9000)),u("x".repeat(9000))];
  await reject(records);
});
test("excessively long conversation array is rejected",async()=>{
  await reject(Array.from({length:101},(_,i)=>i%2?a("test"):u("test")));
});
test("request-size guard is enforced before JSON parsing or model calls",async()=>{
  const body=JSON.stringify({messages:[u("x".repeat(72000))]});
  const r=await withFakeProvider({httpMethod:"POST",body});
  assert.equal(r.statusCode,413);assert.equal(outbound,0);
});
test("invalid client clock metadata is rejected before model calls",async()=>{
  for(const value of [123,{test:"synthetic"},"x".repeat(129)]){
    const r=await withFakeProvider(req({messages:[u("fictional")],clientDateTime:value}));
    assert.equal(r.statusCode,400);assert.equal(outbound,0);
  }
});
test("valid same-origin synthetic chat retains provider request format",async()=>{
  let modelBody;
  const fake=async (url,options)=>{
    assert.equal(url,"https://api.anthropic.com/v1/messages");
    modelBody=JSON.parse(options.body);
    return {ok:true,status:200,json:async()=>({content:[{type:"text",text:"[PRIORITY:GREY]\nSynthetic reply"}]})};
  };
  const r=await withFakeProvider(req({messages:[u(" Fictional policy question ")] ,clientDateTime:"Monday 2 November 2026, 05:00 GMT"}),fake);
  assert.equal(r.statusCode,200);assert.equal(outbound,1);
  assert.equal(modelBody.messages.at(-1).content,"Fictional policy question");
  assert.match(r.body,/Synthetic reply/);
});
test("provider error bodies and status are not disclosed",async()=>{
  const fake=async()=>({ok:false,status:429,json:async()=>({error:{message:"SECRET_SYNTHETIC_DIAGNOSTIC"}})});
  const r=await withFakeProvider(req({messages:[u("fictional")]}),fake);
  assert.equal(outbound,1);assert.equal(r.statusCode,502);
  assert.doesNotMatch(r.body,/SECRET_SYNTHETIC_DIAGNOSTIC|429/);
});
test("provider thrown errors are not returned to the caller",async()=>{
  const fake=async()=>{throw Error("PRIVATE_SYNTHETIC_EXCEPTION");};
  const r=await withFakeProvider(req({messages:[u("fictional")]}),fake);
  assert.equal(outbound,1);assert.equal(r.statusCode,502);
  assert.doesNotMatch(r.body,/PRIVATE_SYNTHETIC_EXCEPTION/);
});
