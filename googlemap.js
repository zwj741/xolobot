const Browser = require("./browserbot");
const parser = require('node-html-parser');


class GoogleMapService
{
    constructor()
    {

    }
    validate(address)
    {
        return new Promise(async (resolve)=>{

            var browser = new Browser({
                headless:true
            });
            await browser.goToLink("https://www.google.com/maps/");
            await browser.page.type("#searchboxinput",address);
            await browser.page.click("#searchbox-searchbutton");
            await browser.page.waitFor(3000);
            var result = null;
            try{
                 var htmlString =  await browser.page.$eval(".section-result-descriptions", (element) => {
                    return element.innerHTML
                  });
                  var htmlObject = parser.parse( htmlString);
                  if(htmlObject.childNodes.length>1)
                  {
                      result = [];
                    for(var i =0;i<htmlObject.childNodes.length;++i)
                    {
                        result.push(htmlObject.childNodes[i].text.trim())
                    }
                  }
                
            }
            catch
            {

            }
            //console.log(result)
            await browser.quit()
            resolve(result);
           
             // console.log(result)
        })
       
    }
}

//new GoogleMapService().validate("The ingenuity lab, sir colin campbell building, wollaton road, ng8 1bb")


module.exports = GoogleMapService;