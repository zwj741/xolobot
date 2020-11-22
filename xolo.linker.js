var browser = require("./browserbot");
var emailBot = require("./emailbot");
const fs = require('fs');
const path = require('path');
var config = require("./bottoken/email.config.json")
var email = config.email;
var host = "https://www.xolo.io/";
const util = require('util');

function Operator() {
    var instance = new browser({
        headless: true
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
            var element = await instance.page.waitForSelector(".select2-results__option.select2-results__option--highlighted");
            await element.click();
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
        await instance.page.type("#customer-address", model.address);
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
                //await instance.page.waitFor(2000);
                await instance.page.waitForSelector("#to-info .mt-3",{
                    visible:true
                })
                var element = await instance.page.$x("//a[@class='edit-customer'][contains(., 'Edit')]");
                await element[0].click();
                await instance.page.waitForSelector("#customerForm",{
                    visible:true
                });
                await instance.page.waitFor(1000);
                
                var elementList = {};

                elementList.address =  await instance.page.$("#customerForm #customer-address");
                elementList.postCode =  await instance.page.$("#customerForm #customer-postalcode");
                elementList.taxNo =  await instance.page.$("#customerForm #vatRegistrationNumber");
                elementList.email =  await instance.page.$("#customerForm #email");
                elementList.contackPerson =  await instance.page.$("#customerForm #contact-name");
                elementList.registerNo =  await instance.page.$("#customerForm #customer-regcode");


                //serverModel.companyAddress = await instance.page.evaluate(p=>p.value,element.companyAddress)//await instance.page.$eval("#customerForm #customer-address",el=>el.textContent.trim());// await (await instance.page.$("#customer-address")).evaluate(p=>p.textContent);
     
                var keys = Object.keys(elementList);

                for(var i = 0;i < keys.length ;++i)
                {
                    serverModel[keys[i]] = await instance.page.evaluate(p=>p.value,elementList[keys[i]]);

                    if(serverModel[keys[i]] != model[keys[i]]
                        && !!model[keys[i]]
                        && !!serverModel[keys[i]]
                        )
                    {
                        var data = model[keys[i]];
                        var func = (selector,data)=>{
                            selector.value = data;
                            return '';
                        };
                        await instance.page.evaluate(func,elementList[keys[i]],data)
                        needSave = true;
                    }
                }
                //console.log(needSave)
         
                if(needSave)
                {
                    await instance.page.click("#customerForm #save-customer");
                }
                else{
                    await instance.page.click("#customerForm .btn-light");
                }

                await instance.page.waitForSelector("#customerForm",{
                    hidden:true
                })
                await instance.page.waitFor(1000)

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
        await Promise.all([
            instance.page.click(".btn.btn-success"),
            instance.page.waitFor(1000)
        ]);

        await instance.page.click("#send-email");
        await this.downloadPDF()
        await instance.quit();
    }

    this.downloadPDF = async function () {
        await instance.page.reload({ waitUntil: ["networkidle0", "domcontentloaded"] });
        var downloadElement = await instance.page.waitForSelector("#download-pdf-button");
        var link = host + (await downloadElement.evaluate(p => p.getAttribute("href")));
        var folder = path.join(__dirname, 'cache');
        console.log("download folder" + folder)
        await instance.page._client.send('Page.setDownloadBehavior', { behavior: 'allow', downloadPath: folder });
        await instance.page.goto(link).catch(() => { });
        await checkExistsWithTimeout(folder,30 *1000)        
        //await instance.page.waitFor(5000);

    }
    return this;
}

function checkExistsWithTimeout(folder, timeout) {
    return new Promise(function (resolve, reject) {

        var timer = setTimeout(function () {
            watcher.close();
            reject(new Error('File did not exists and was not created during the timeout.'));
        }, timeout);

        // fs.access(filePath, fs.constants.R_OK, function (err) {
        //     if (!err) {
        //         clearTimeout(timer);
        //         watcher.close();
        //         resolve();
        //     }
        // });

        // var dir = path.dirname(filePath);
        // var basename = path.basename(filePath);
        var watcher = fs.watch(folder, function (eventType, filename) {
            if (eventType === 'rename' ) {
                clearTimeout(timer);
                watcher.close();
                resolve();
            }
        });
    });
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