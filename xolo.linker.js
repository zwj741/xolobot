var browser = require("./browserbot");
var emailBot = require("./emailbot");
const fs = require('fs');
const path = require('path');
var config = require("./bottoken/email.config.json")
var email = config.email;
var host = "https://www.xolo.io/";
const util = require('util');
const { SSL_OP_SSLEAY_080_CLIENT_DH_BUG } = require("constants");

function Operator() {
    var instance = new browser({
        headless: false
    });
    this.lastLink = null;
    this.getLoginEmail = function (callback) {
        emailBot.getLastTokenEmail(async (link) => {
            this.lastLink = link;
            await instance.goToLink(host + "login");
            await instance.page.click('a[href="#emailTab"]')
            await instance.page.keyboard.type(email)
            await instance.page.click(".btn-large");
            setTimeout(() => this.tryGet(callback), 1000);

        })
    }
    this.tryGet = function (callback) {
        emailBot.getLastTokenEmail((link) => {
            if (this.lastLink != link) {
                this.lastLink = link;
                callback(this.lastLink)
            }
            else {
                setTimeout(() => {
                    this.tryGet(callback)
                }, 1000)
            }
        })
    }
    this.login = async function (tokenUrl, model) {
        await instance.goToLink(tokenUrl);
        await instance.goToLink(host + "selfservice/income/invoice/new?fromList=true");
        await instance.page.click("#customer-select-container")
        await instance.page.keyboard.type(model.companyName);
        try {
            await instance.page.click(".select2-results__option.select2-results__option--highlighted");
        }
        catch
        {
            //console.log("custom not exist");
            await this.customerNotExist(model, async () => {
                await instance.goToLink(host + "selfservice/income/invoice/new?fromList=true");
                await instance.page.click("#customer-select-container")
                await instance.page.keyboard.type(model.companyName);
                var element = await instance.page.waitForSelector(".select2-results__option.select2-results__option--highlighted");
                await element.click();
                await this.customExist(model,false)
            })
            return;
        }
        await this.customExist(model);
    }

    this.customerNotExist = async function (model, callback) {

        await instance.goToLink(host + "selfservice/income/invoice/new?fromList=true");
        await instance.page.click("#add-customer");
        await instance.page.waitForSelector("#customerForm",{visible:true})
        await instance.page.type("#customer-name", model.companyName);
        await instance.page.type("#customer-address", model.companyAddress);
        await instance.page.type("#contact-city", model.city);
        await instance.page.type("#customer-postalcode", model.postCode);

        if (!!model.taxNo) {
            await instance.page.type("#vatRegistrationNumber", model.taxNo);
        }

        if (!!model.registerNo) {
            await instance.page.type("#customer-regcode", model.registerNo || "");
        }

        await instance.page.type("#invoice-due-days", "20");

        await instance.page.type("#email", model.email);

        await instance.page.type("#contact-name", model.contackPerson);

        await instance.page.click("#customerForm .select2-container");
        await instance.page.keyboard.type(model.country);
        await instance.page.click(".select2-results__option.select2-results__option--highlighted");

        await instance.page.click("#save-customer");
        await instance.page.waitFor(3000);
        if (callback) {
            callback();
        }
    }
    this.customExist = async function (model,checkUserData = true) {
        
        if(checkUserData)
        {
            //console.log(model);
            var needSave = false;
            var serverModel = {};

            try{
                // await instance.page.waitFor(1000);
                // var element = await instance.page.$x("//a[@class='edit-customer'][contains(., 'Edit')]");
                // await element[0].click();
                // var cancelable = await instance.page.waitForSelector("#customer-modal .btn-light",{
                //         visible:true
                // });
                // cancelable.click()
                // await instance.page.waitFor(1000)
                // var element = await instance.page.$x("//a[@class='edit-customer'][contains(., 'Edit')]");
                // await element[0].click();
                // await instance.page.waitForSelector("#customer-modal",{
                //     visible:true
                // });
                // await instance.page.waitFor(1000)

                // var cancelable = await instance.page.waitForSelector("#customer-modal .btn-light",{
                //     visible:true
                // });
                // cancelable.click()
                //await instance.page.waitFor(5000)

                // serverModel.companyAddress = await parent.$eval("#customer-address",el=>el.textContent.trim());// await (await instance.page.$("#customer-address")).evaluate(p=>p.textContent);
                // serverModel.postCode = await parent.$eval("#customer-postalcode",el=>el.textContent.trim());//await (await instance.page.$("#customer-postalcode")).evaluate(p=>p.textContent);
                // serverModel.taxNo = await parent.$eval("#vatRegistrationNumber",el=>el.textContent.trim());//await (await instance.page.$("#vatRegistrationNumber")).evaluate(p=>p.textContent);
                // serverModel.email =await parent.$eval("#email",el=>el.textContent.trim());// await (await instance.page.$("#email")).evaluate(p=>p.textContent);
                // serverModel.contackPerson = await parent.$eval("#contact-name",el=>el.textContent.trim());//await (await instance.page.$("#contact-name")).evaluate(p=>p.textContent);
                // serverModel.registerNo = await parent.$eval("#customer-regcode",el=>el.textContent.trim());//await (await instance.page.$("#customer-regcode")).evaluate(p=>p.textContent);
    
               
                // var keys = Object.keys(serverModel);
                // console.log(serverModel)

                // for(var i = 0;i < keys.length ;++i)
                // {
                //     if(serverModel[keys[i]] != model[keys[i]]
                //         && !!model[keys[i]]
                //         && !!serverModel[keys[i]]
                //         )
                //     {
                //         needSave = true;
                //     }
                // }
                // console.log(needSave)
                // if(needSave)
                // {
                //     console.log("something changed");
                //     await parent.$eval("#customer-address",e=>e.setAttribute("value",model.companyAddress))
                //     await parent.$eval("#customer-postalcode",e=>e.setAttribute("value",model.postCode))
                //     await parent.$eval("#vatRegistrationNumber",e=>e.setAttribute("value",model.taxNo))
                //     await parent.$eval("#email",e=>e.setAttribute("value",model.email))
                //     await parent.$eval("#contact-name",e=>e.setAttribute("value",model.contackPerson))
                //     await parent.$eval("#customer-regcode",e=>e.setAttribute("value",model.registerNo))
                //     await parent.click("#save-customer");
                // }
                // else{
                //     await parent.click(".btn-light");
                // }
                
                //await instance.page.waitFor(3000);

            }
            catch(err){
                console.log(err)
            }
          
       
            //console.log(serverModel);
            
        }


        await instance.page.type('td[data-th="Description"] textarea', "IT development [refNo:" + model.refNo + "]");
        await instance.page.type('td[data-th="Quantity"] input', "1");
        await instance.page.click('td[data-th="Quantity"] .select2');
        await instance.page.click(".select2-results__option:last-child");
        await instance.page.type('td[data-th="Price"] input', model.amount + "");
        //console.log(model)
        if (model.currency == "USD") {
            var element = await instance.page.$('#currency-select'); // Element
            var element_parent = (await element.$x('..'))[0]; // Element Parent
            await element_parent.click(".select2")
            await instance.page.click(".select2-results__option:last-child")

        }
        // await Promise.all([
        //     instance.page.click(".btn.btn-success"),
        //     instance.page.waitFor(1000)
        // ]);

        // await instance.page.click("#send-email");
        // await this.downloadPDF()
        // await instance.quit();
    }

    this.downloadPDF = async function () {
        await instance.page.reload({ waitUntil: ["networkidle0", "domcontentloaded"] });
        var downloadElement = await instance.page.waitForSelector("#download-pdf-button");
        var link = host + (await downloadElement.evaluate(p => p.getAttribute("href")));
        var folder = path.join(__dirname, 'cache');
        console.log("download folder" + folder)
        await instance.page._client.send('Page.setDownloadBehavior', { behavior: 'allow', downloadPath: folder });
        await instance.page.goto(link).catch(() => { });
        await instance.page.waitFor(5000);

    }
    return this;
}


// // set up, invoke the function, wait for the download to complete
// async function download(page, f) {
//     const downloadPath = path.resolve(
//       process.cwd(),
//       `download-${Math.random()
//         .toString(36)
//         .substr(2, 8)}`,
//     );
//     await util.promisify(fs.mkdir)(downloadPath);
//     console.error('Download directory:', downloadPath);

//     await page._client.send('Page.setDownloadBehavior', {
//       behavior: 'allow',
//       downloadPath: downloadPath,
//     });

//     await f();

//     console.error('Downloading...');
//     let fileName;
//     while (!fileName || fileName.endsWith('.crdownload')) {
//       await new Promise(resolve => setTimeout(resolve, 100));
//       [fileName] = await util.promisify(fs.readdir)(downloadPath);
//     }

//     const filePath = path.resolve(downloadPath, fileName);
//     console.error('Downloaded file:', filePath);
//     return filePath;
//   }

var operator = new Operator();
//operator.login("https://www.xolo.io/selfservice/income/invoice/new?fromList=true")
module.exports = operator;