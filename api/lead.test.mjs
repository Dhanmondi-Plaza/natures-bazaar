import assert from 'node:assert/strict';
import handler from './lead.js';

const req = body => ({method:'POST',headers:{host:'www.naturesbazaarnyc.com',origin:'https://www.naturesbazaarnyc.com','content-type':'application/json'},body});
const run = async request => {
  let status;
  const res={status(code){status=code;return this;},json(body){return {status,body};}};
  return handler(request,res);
};

process.env.GHL_WEBHOOK_URL='https://example.test/webhook';
let sent;
global.fetch=async (_url,options)=>{sent=JSON.parse(options.body);return {ok:true};};
const valid={name:'Test Person',email:'test@example.com',phone:'',interest:'Supplier inquiry',message:'Testing',link:'',page_url:'https://www.naturesbazaarnyc.com/'};
assert.equal((await run(req(valid))).status,200);
assert.equal(sent.brand,'Nature’s Bazaar');
assert.equal(sent.interest,'Supplier inquiry');
assert.equal((await run(req({...valid,email:'bad'}))).status,400);
assert.equal((await run({...req(valid),headers:{...req(valid).headers,origin:'https://evil.example'}})).status,403);
global.fetch=async()=>({ok:false});
assert.equal((await run(req(valid))).status,502);

