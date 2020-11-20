const Browser = require("./browserbot");
const parser = require('node-html-parser');


class GoogleMapService
{
    constructor()
    {
        this.cache = {};
    }
    validate(address)
    {
        return new Promise(async (resolve)=>{

            if(!this.cache["address"])
            {
                var browser = new Browser({
                    headless:true
                });
                await browser.goToLink("https://www.google.com")
                await browser.page.setCookie({
                    name:"CONSENT",
                    value:"YES+HU.en+V9+BX",
                    secure:true
                })
                await browser.goToLink("https://www.google.com/maps/");
                await browser.page.type("#searchboxinput",address);
                await browser.page.click("#searchbox-searchbutton");
                var element = await browser.page.waitForSelector('div[data-value="Share"]', {
                    visible: true,
                });
                element.click();
                var result = null;
                try{
                    console.log("share block opend")
                     result = [];
                     var subtitle = await browser.page.waitForSelector(".section-share-summary-subtitle",{
                         visible:true
                     })
                     var htmlString = await subtitle.evaluate(element => element.textContent);
                      var list = htmlString.split(",");
                      for(var i =0;i< list.length ;++i)
                      {
                          var data = list[i].trim();
                          if(data)
                          {
                            if(i >0)
                            {
                                data = data.split(" ");
                                for(var j=data.length-1;j>-1;--j)
                                {
                                    result.push(data[j])
                                }
                            }
                            else{
                                result.push(data);

                            }

                          }
                      }
                      if(result.length == 4)
                      {

                      }
                      else{
                          if(result.length >3)
                          {
                              var another = [];
                              for(var i =0;i<result.length ;++i)
                              {
                                if(i<=result.length-4)
                                {
                                    if(another.length == 0)
                                    {
                                        another.push(result[i]);
                                    }
                                    else
                                    {
                                        another[0] += ", " + result[i];

                                    }
                                }
                                else{
                                    another.push(result[i]);
                                }
                              }
                              result = another;
                          }
                      }
                   
                    
                }
                catch
                {
    
                }
                console.log(result)
                await browser.quit();
                this.cache[address] = result;
            }
            resolve(this.cache[address]);

           
        })
       
    }
}

//new GoogleMapService().validate("C SANT JAUME 18 ODENA 08711")


module.exports = GoogleMapService;