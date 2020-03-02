class RuleAdaptor
{


 constructor()
 {
     this.adaptor =[
         {
             name:"positive",
             validate:function(value)
             {
                 return new Promise((resolve=>{
                    var result = Number(value);
                    var err=null;
                    if(result<=0)
                    {
                        err=[
                            "必须为正整数"
                        ]
                    }
                    resolve(err);

                 }))
             }

             
         },
         {
             name:"validString",
             validate:function(value,params)
             {
                return new Promise((resolve=>{
                    var err = null;
                    if(params!=null && Array.isArray(params) )
                    {
                        if(!params.includes(value))
                        {
                            err = [
                                "必须为"+params.join(",") +"中的一个值"
                            ];

                        }
                    }
                    resolve(err)

                 }))
             }
         }
     ]
 }
 
}


module.exports = new RuleAdaptor();