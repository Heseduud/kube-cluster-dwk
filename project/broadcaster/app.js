const { connect, JSONCodec} = require('nats');
const { Telegraf } = require('telegraf');

(async() => {
  const nc = await connect({servers: process.env.NATS_URL});
  const jc = JSONCodec();
  
  const bot = new Telegraf(process.env.API_KEY);
  bot.start((ctx) => ctx.reply('Hello!'));
  
  const sub = nc.subscribe('nats');
  console.log(`Subscribed to nats: ${process.env.NATS_URL}`);
  
  while (true) {
    console.log('in while loop');
    for await (const m of sub) {
      console.log('Message?');
      const r = jc.decode(m.data);
      console.log(r);
      try {
        bot.telegram.sendMessage('@dwk_nats_broadcast123', `Something happened! \n Message: ${r.msg} \n Todo: ${r. todo} \n Done?: ${r.done}`)
      } catch (e) {
        console.log(e);
      }
    }
  }
})();

console.log('finished run()');

process.once('SIGINT', () => bot.stop('SIGINT'));
process.once('SIGTERM', () => bot.stop('SIGTERM'));