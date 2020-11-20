const Telegraf = require('telegraf')
const mapper = require("./keyvaluemapper.cn");
const bot = new Telegraf(process.env.BOT_TOKEN|| "1314217020:AAH76XlQEpZUsFuFJRPorsn1d1tdFV9riH4");
const valueAdaptor= require("./valueadaptor");
const ruleAdaptor =require("./ruleadptor");
const operator = require("./xolo.linker");
const addressBot = require("./googlemap");
const lookup = require('country-code-lookup')
const path = require("path");
const fs = require("fs");

bot.start((ctx) => ctx.reply('欢迎'))
bot.on("text", async (ctx) => {

    ctx.reply('解析中...');
    
    //console.log(ctx)
    var result;

    try
    {
        result = await toJson(ctx.update.message.text);
    }
    catch(err)
    {
        //console.log(err)
        ctx.reply(err.message)
    }
    
    if(result)
    {
      
        if(result.companyAddress)
        {
            ctx.reply("验证地址信息...");

           var list= await new addressBot().validate(result.companyAddress);
           if(list!=null && list.length>=3)
           {
                var lookUpIt = lookup.byInternet(list[list.length-1])
               result.country = lookUpIt!=null?lookUpIt.country:list[list.length-1];
               result.postCode = list[list.length -2];
               result.city = list[list.length -3];
               ctx.reply("地址解析成功：" + list.join(" "))
           }
           else
           {
             ctx.reply("地址验证失败！请重新输入!");
             return;
           }
        }
        ctx.reply("解析成功，正在登陆...");

        operator.getLoginEmail(async (link)=>{
            ctx.reply("获取登陆邮件成功。开始登陆...");
            await operator.login(link,result).catch(err=>{

                ctx.reply("发生了未知错误，请重试")
            });
            var folder = path.join( __dirname ,'cache');
            fs.readdirSync(folder).forEach(file => {
                console.log(file);
                if(path.extname(file) == ".pdf")
                {
                    ctx.telegram.sendDocument(ctx.from.id, {
                        source: path.join(folder,file),
                        filename:  path.basename(file)
                     }).catch(function(error){ console.log(error); })
                     fs.unlinkSync(path.join(folder,file))
                }
     
            });
            ctx.reply("已发送发票到邮箱："+result.email)
            //console.log("should continue action",link)
        }) 

    }
    else{
        ctx.reply("解析失败...")

    }

});

async function toJson(data)
{
 var result ={};
 var list = data.split(/\r\n|\n/);

 //console.log(list)
 for(var i =0;i<list.length;++i)
 {
     if(list[i])
     {
         var listItem = list[i].split(/:|：/);
         if(listItem.length ==2)
         {
            var key = listItem[0].trim();
            var value = listItem[1].trim();
            if(value)
            {
                var finded = mapper.find(p=>p.name == key 
                    || (p.alternative!=null  && p.alternative.findIndex(d=>d == key)>-1));
                //console.log(key)
                if(finded!=null)
                {
                
                    if(finded.type)
                    {
                        var adaptor = valueAdaptor.adaptor.find(p=>p.name == finded.type);
                        if(adaptor && adaptor.callback)
                        {
                            result[finded.key] = adaptor.callback(value);

                            if(finded.pattern)
                            {
                                var isMatch = (value + "").match(finded.pattern);
                                if(isMatch !=null && isMatch.groups!=null)
                                {
                                    finded.matchCallback(isMatch.groups,result);
                                    console.log(finded)
                                }
                            }
                        }
                    }
                    else{
                        result[finded.key] = value;
                    }
                 
                    
                }
            }
           
         }
        
     }
   
 }
 //console.log(result)
  var errorResult = [];
  for(var i =0;i<mapper.length;++i)
  {
    var item = mapper[i];
    if(item.required && !result[item.key] && !item.default)
    {
        if(!!item.or)
        {
           if(!result[item.or])
           {
             errorResult.push(item.name +"或" + mapper.find(p=>p.key == item.or).name +"必须填写一个");
           }
        }
        else
        {
            errorResult.push(mapper[i].name +" 是必须的");
        }
    }
    else if(item.required && !result[item.key] && !!item.default)
    {

        result[item.key]=item.default;
    }


    if(!!item.rules)
    {
        var promiseList = [];
        for(var j=0;j<item.rules.length;++j)
        {
            var rule = ruleAdaptor.adaptor.find(p=>p.name==item.rules[j].name);
            if(!!rule)
            {
                promiseList.push({
                    promise:rule.validate(result[item.key],item.rules[j].params),
                    displayName:item.name
                });
            }
        }

        if(promiseList.length)
        {
            var promiseResult = await Promise.all(promiseList.map(p=> p.promise));
            for(var j =0;j<promiseResult.length;++j)
            {
                if(promiseResult[j])
                {
                    errorResult = errorResult.concat(promiseList[j].displayName + promiseResult[j]);
                }
            }
        }
    }


  }

 if(errorResult.length>0)
 {
    //console.log(errorResult)

    throw new Error(errorResult.join("\n"));
    //return null;
 }
 else
 return result;

}


bot.launch()