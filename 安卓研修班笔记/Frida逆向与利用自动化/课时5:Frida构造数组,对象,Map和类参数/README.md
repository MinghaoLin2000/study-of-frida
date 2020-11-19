# Frida构造数组，对象，Map和类参数
1. 数组/（字符串）对象数组/gson/Java.array
2. 对象/多态，强转Java.cast
3. 接口interface，Java.register
4. 枚举，泛型，List,Map,Set,迭代打印
5. 重要思路:开发时如何打印，frida中也是如何打印
6. non-ascii 方法名 hook

# 0x01 
# 1.app代码:  
```
 Log.d("SimpleArray", "onCreate: SImpleArray");
        char arr[][] = new char[4][]; // 创建一个4行的二维数组
        arr[0] = new char[] { '春', '眠', '不', '觉', '晓' }; // 为每一行赋值
        arr[1] = new char[] { '处', '处', '闻', '啼', '鸟' };
        arr[2] = new char[] { '夜', '来', '风', '雨', '声' };
        arr[3] = new char[] { '花', '落', '知', '多', '少' };
        Log.d("SimpleArray", "-----横版-----");
        for (int i = 0; i < 4; i++) { // 循环4行
            //Log.d("SimpleArraysToString", Arrays.toString(arr[i]));
            //Log.d("SimpleStringBytes", Arrays.toString (Arrays.toString (arr[i]).getBytes()));
            for (int j = 0; j < 5; j++) { // 循环5列
                Log.d("SimpleArray", Character.toString(arr[i][j])); // 输出数组中的元素
            }
            if (i % 2 == 0) {
                Log.d("SimpleArray", ",");// 如果是一、三句，输出逗号
            } else {
                Log.d("SimpleArray", "。");// 如果是二、四句，输出句号
            }
        }
```
这里直接hook java.lang.Character的toString方法，打印出参数和返回值
```
function main()
{
    Java.perform(function(){
        Java.use("java.lang.Character").toString.overload('char').implementation=function(arg1)
        {
            var result=this.toString(arg1);
            console.log("x,result",arg1,result);
            return result;
        }
    })
}
setImmediate(main);
```
# 2.对象数组
这里引出一个参数为char类型的数组，hook一下  
```
function main()
{
    Java.perform(function(){
        Java.use("java.lang.Character").toString.overload('char').implementation=function(arg1)
        {
            var result=this.toString(arg1);
            console.log("x,result",arg1,result);
            return result;
        }
        Java.use("java.util.Arrays").toString.overload('[C').implementation=function(x)
        {
            var result=this.toString(x);
            console.log("x,result",x,result);
            return result;
        }
    })
}
setImmediate(main);
```
这里发现hook出来的参数发现无法打印出来，两个都是Object类型，需要有特殊的操作  
1. 使用Json.stringify(x)方法可以打印出Object
```
Java.use("java.util.Arrays").toString.overload('[C').implementation=function(x)
        {
            var result=this.toString(x);
            console.log("x,result",JSON.stringify(x),result);
            return result;
        }
```
2. 肉丝表哥自己编译的一个gson包来处理  
先将下载好的dex文件放入/data/local/tmp目录下，然后frida动态加载dex，调用其中方法
```
function main()
{
    Java.perform(function(){
        /*Java.use("java.lang.Character").toString.overload('char').implementation=function(arg1)
        {
            var result=this.toString(arg1);
            console.log("x,result",arg1,result);
            return result;
        }*/
        Java.openClassFile("/data/local/tmp/r0gson.dex").load();
        const gson=Java.use("com.r0ysue.gson.Gson");
        Java.use("java.util.Arrays").toString.overload('[C').implementation=function(x)
        {
            var result=this.toString(x);
            console.log("x,result",gson.$new().toJson(x),result);
            return result;
        }
    })
}
setImmediate(main);
```
# 3.自己构造一个char数组对象(Java.array)
```
function main()
{
    Java.perform(function(){
        /*Java.use("java.lang.Character").toString.overload('char').implementation=function(arg1)
        {
            var result=this.toString(arg1);
            console.log("x,result",arg1,result);
            return result;
        }*/
        Java.openClassFile("/data/local/tmp/r0gson.dex").load();
        const gson=Java.use("com.r0ysue.gson.Gson");
        Java.use("java.util.Arrays").toString.overload('[C').implementation=function(x)
        {
            var charArray=Java.array('char',['1','2','3','4','5']);
            var result=this.toString(charArray);
            console.log("x,result",gson.$new().toJson(x),result);
            return result;
        }
    })
}
setImmediate(main);
```

# 4.对象类型强制转换Java.cast
总体来说就是父类是无法强转成子类的，子类可以向上强转成父类的，然后就是查找对象时，有时候时机过早或过晚，会导致找不到实例，所以选择的话，选择延时hook，setTimeout(function,3000),然后用spawn方式启动app  

```
function main()
{
    Java.perform(function(){
        /*Java.use("java.lang.Character").toString.overload('char').implementation=function(arg1)
        {
            var result=this.toString(arg1);
            console.log("x,result",arg1,result);
            return result;
        }*/
        
        Java.openClassFile("/data/local/tmp/r0gson.dex").load();
        const gson=Java.use("com.r0ysue.gson.Gson");
        /*
        Java.use("java.util.Arrays").toString.overload('[C').implementation=function(x)
        {
            var charArray=Java.array('char',['1','2','3','4','5']);
            var result=this.toString(charArray);
            console.log("x,result",gson.$new().toJson(x),result);
            return result;
        }
        */
       var waterhandle=null;
       Java.choose("com.r0ysue.a0526printout.Water",{
           onMatch:function(instance){
               console.log("found instance:",instance);
               console.log("water call still:",instance.still(instance));
               waterhandle=instance;
           },onComplete:function(){
            console.log("search completed")
           }
       })
       var JuiceHandle=Java.cast(waterhandle,Java.use("com.r0ysue.a0526printout.Juice"));
       console.log("Juice fillEnergy method:",JuiceHandle.fillEnergy());

       var JuiceHandle=null;
       Java.choose("com.r0ysue.a0526printout.Juice",{
           onMatch:function(instance){
               console.log("found instance:",instance);
               console.log("filling energy,",instance.fillEnergy());
               JuiceHandle=instance;
           },onComplete:function(){"Search Completed"}
       })
       var waterhandle=Java.cast(JuiceHandle,Java.use("com.r0ysue.a0526printout.Water"));
       console.log("Water invoke kill");
    })
}
setImmediate(main);
```

# 5。接口
