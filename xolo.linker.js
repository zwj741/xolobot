var browser = require("./browserbot");
var emailBot = require("./emailbot");
const fs = require('fs');
const path = require('path');
var email = "refeiyang@gmail.com";
var host = "https://www.xolo.io/";
const util = require('util');

function Operator()
{
    var instance = new browser({
        headless:true
    });
    this.lastLink = null;
    this.getLoginEmail = function(callback){
        emailBot.getLastTokenEmail(async (link)=>{
            this.lastLink = link;
            await instance.goToLink(host+"login");
            await instance.page.click('a[href="#emailTab"]')
            await instance.page.keyboard.type(email)
            await instance.page.click(".btn-large");
            setTimeout(()=>this.tryGet(callback),1000);

        })
    }
    this.tryGet = function(callback)
    {
        emailBot.getLastTokenEmail((link)=>{
            if(this.lastLink !=link)
            {
                this.lastLink = link;
                callback(this.lastLink)
            }
            else
            {
                setTimeout(()=>{
                    this.tryGet(callback)
                },1000)
            }
        })
    }
    this.login = function(tokenUrl,model)
    {
        (async()=>{
            await instance.goToLink(tokenUrl);
            await instance.goToLink(host+"selfservice/income/invoice/new?fromList=true");
            await instance.page.click("#customer-select-container")
            await instance.page.keyboard.type(model.companyName);
            try{
                await instance.page.click(".select2-results__option.select2-results__option--highlighted");
            }
            catch
            {
                console.log("custom not exist");
                this.customerNotExist(model,async ()=>{
                    await instance.goToLink(host+"selfservice/income/invoice/new?fromList=true");
                    await instance.page.click("#customer-select-container")
                    await instance.page.keyboard.type(model.companyName);
                    await instance.page.click(".select2-results__option.select2-results__option--highlighted");

                    this.customExist(model)
                })
                return;
            }
            this.customExist(model);

        })();
    }

    this.customerNotExist = function(model,callback)
    {
        (async()=>{

        
          await instance.goToLink(host+"selfservice/income/invoice/new?fromList=true");

          await instance.page.click("#add-customer");
          await instance.page.waitFor(1000)
          await instance.page.type("#customer-name",model.companyName);
          await instance.page.type("#customer-address",model.companyAddress);
          await instance.page.type("#contact-city",model.city);
          await instance.page.type("#customer-postalcode",model.postCode);

          if(!!model.taxNo)
          {
            await instance.page.type("#vatRegistrationNumber",model.taxNo);
          }
         
          if(!!model.registerNo)
          {
            await instance.page.type("#customer-regcode",model.registerNo||"");
          }

          await instance.page.type("#invoice-due-days","20");

          await instance.page.type("#email",model.email);

          await instance.page.type("#contact-name",model.contackPerson);

          await instance.page.click("#customerForm .select2-container");
          await instance.page.keyboard.type(model.country);
          await instance.page.click(".select2-results__option.select2-results__option--highlighted");
        
          await instance.page.click("#save-customer");

          if(callback)
          {
            callback();
          }
          })();
    }
    this.customExist =function(model){
        
        (async()=>{
          await instance.page.type('td[data-th="Description"] textarea',"IT development [refNo:"+ model.refNo+"]");
          await instance.page.type('td[data-th="Quantity"] input',"1");
          await instance.page.click('td[data-th="Quantity"] .select2');
          await instance.page.click(".select2-results__option:last-child");
          await instance.page.type('td[data-th="Price"] input',model.amount+"");
          await Promise.all([
             instance.page.click(".btn.btn-success"),
             instance.page.waitForNavigation({ waitUntil: 'networkidle0' }),
         ]);
        
       //console.log(path)
   
          //await instance.page.click(".icon-pdf");
          await instance.page.click("#send-email");
          await instance.quit();
        })();
    }
    return this;
}


// set up, invoke the function, wait for the download to complete
async function download(page, f) {
    const downloadPath = path.resolve(
      process.cwd(),
      `download-${Math.random()
        .toString(36)
        .substr(2, 8)}`,
    );
    await util.promisify(fs.mkdir)(downloadPath);
    console.error('Download directory:', downloadPath);
  
    await page._client.send('Page.setDownloadBehavior', {
      behavior: 'allow',
      downloadPath: downloadPath,
    });
  
    await f();
  
    console.error('Downloading...');
    let fileName;
    while (!fileName || fileName.endsWith('.crdownload')) {
      await new Promise(resolve => setTimeout(resolve, 100));
      [fileName] = await util.promisify(fs.readdir)(downloadPath);
    }
  
    const filePath = path.resolve(downloadPath, fileName);
    console.error('Downloaded file:', filePath);
    return filePath;
  }
  
var operator = new Operator();
//operator.login("https://www.xolo.io/selfservice/income/invoice/new?fromList=true")
module.exports = operator ;