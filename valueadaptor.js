
class ValueAdaptor
{
 constructor()
 {
     this.adaptor =[
         {
             name:"decimal",
             callback:function(value)
             {
                 var myvalue =0.0;
                 try{
                    myvalue = parseFloat(value);
                 }
                 catch
                 {
                     myvalue = 0.0
                 }
                 if(isNaN(myvalue))
                 {
                    myvalue = 0.0;
                 }
                 return myvalue;
             }
             
         }
     ]
 }
}


module.exports = new ValueAdaptor();