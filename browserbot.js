const puppeteer = require('puppeteer');


class BrowserBot
{
  constructor(options)
  {
    var obj = Object.assign({
     headless:true
    },options)
    this.browser =null;
    this.page = null;
    this.headless = obj.headless;
  }
  async createBrowser()
  {
    this.browser = await puppeteer.launch({headless:this.headless
    });
    this.page = await this.browser.newPage();
    await this.page.setExtraHTTPHeaders({
      'Accept-Language': 'en-UK'
  });
  
  }
  async goToLink(url)
  {
    if(this.browser!=null && this.page!=null)
    {
      await this.page.goto(url);

    }
    else
    {
      console.log("create browser")
      await this.createBrowser();
      await this.goToLink(url);
    }
  }
  async quit()
  {
    if(this.browser)
    {
      await this.browser.close();
      this.page = null;
      this.browser = null;
    }
  }

}

 
module.exports = BrowserBot;