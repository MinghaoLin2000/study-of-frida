# 用户代码 native hook
1. 静态注册函数参数，返回值打印和替换
2. 调用栈
3. 主动调动
4. 符号hook == 偏移hook
5. 枚举并保存结果

# 0x01 修改返回值以及参数和主动调用
1. 修改返回值  
修改的原则本质上还是根据开发的套路去走，利用jni开发api去做，这里也是有文档可以进行查询的，https://github.com/frida/frida-java-bridge/blob/master/lib/env.js， 这里就可以直接搜索，ctrl+f直接搜就完事了，当然前提得先获取env，还是上次课的app，主要是修改返回值，上次那个函数的返回值是jstring，那么我们也需要去构造一个jstring对象出来，然后进行一波返回  
js代码:
```
function hook_nativelib()
{
    var native_lib_addr=Module.findBaseAddress("libnative-lib.so");
    console.log("native_lib_addr ->",native_lib_addr);
    var myfirstjniJNI=Module.findExportByName("libnative-lib.so","Java_com_example_demoso1_MainActivity_myfirstjniJNI");
    console.log("myfirstjiniJNI addr ->",myfirstjniJNI);
    Interceptor.attach(myfirstjniJNI,{
        onEnter:function(args){
            console.log("Interceptor.attach myfirstjniJNI args:",args[0],args[1],args[2]);
            console.log("jstring is",Java.vm.getEnv().getStringUtfChars(args[2],null).readCString());
        },onLeave:function(retval){
            //console.log("Interceptor.attach myfirstjniJNI retval",reval);
            var newRetval=Java.vm.getEnv().newStringUtf("YenKoc fucking crazy");
            retval.replace(newRetval);
        }
    })
}
function main1()
{
    hook_nativelib();
}
setImmediate(main1);
```
2. 修改参数值
没啥好说了，和上面差不多，用jni开发的角度去想
```
function hook_nativelib()
{
    var native_lib_addr=Module.findBaseAddress("libnative-lib.so");
    console.log("native_lib_addr ->",native_lib_addr);
    var myfirstjniJNI=Module.findExportByName("libnative-lib.so","Java_com_example_demoso1_MainActivity_myfirstjniJNI");
    console.log("myfirstjiniJNI addr ->",myfirstjniJNI);
    Interceptor.attach(myfirstjniJNI,{
        onEnter:function(args){
            console.log("Interceptor.attach myfirstjniJNI args:",args[0],args[1],args[2]);
            console.log("jstring is",Java.vm.getEnv().getStringUtfChars(args[2],null).readCString());
            var newArgs2=Java.vm.getEnv().newStringUtf("I'm new Args");
            args[2]=newArgs2;
        },onLeave:function(retval){
            //console.log("Interceptor.attach myfirstjniJNI retval",reval);
            var newRetval=Java.vm.getEnv().newStringUtf("YenKoc fucking crazy");
            retval.replace(newRetval);
            

        }
    })
}
function main1()
{
    hook_nativelib();
}
setImmediate(main1);
```
不知道为什么一hook参数就crash了，lj app（吐槽  
3. 主动调用
- 核心思想就是先在so中找到对应的地址，这是关键，没有地址一切都是扯淡，这里暂时还没用到偏移，都是通过objection的找到so的导出函数被符号修饰后的符号名，直接通过frida api得到的结果。至于手法就直接记住就好了
```
function hookandinvoke_add()
{
    var native_lib_addr=Module.findBaseAddress("libnative-lib.so");
    console.log("native_lib_addr ->",native_lib_addr);
    var r0add_addr=Module.findExportByName("libnative-lib.so","_Z5r0addii");
    console.log("r0add addr ->",r0add_addr);
    Interceptor.attach(r0add_addr,{
        onEnter:function(args){
            console.log("x->",args[0],"y->",args[1]);

        },onLeave:function(retval)
        {
            console.log("retval is ->",retval);

        }
    })
    var r0add=new NativeFunction(r0add_addr,"int",["int","int"]);
    var r0add_result=r0add(50,2);
    console.log("invoke result is",r0add_result);
    
}
function main1()
{
    //hook_nativelib();
    hookandinvoke_add();
}
setImmediate(main1);
```
- hook native函数  
这里的参数发现都是jstring等等的，这些其实都是指针，我们如果需要主动调用的话，也需要像jni开发一样构造出jstring指针，就像上文做的一样，不过这里有点骚的就是在hook native函数时，将本来传入的参数，再传入主动调用的函数，这样就不需要这么麻烦了
```
unction hook_nativelib()
{
    var native_lib_addr=Module.findBaseAddress("libnative-lib.so");
    console.log("native_lib_addr ->",native_lib_addr);
    var myfirstjniJNI=Module.findExportByName("libnative-lib.so","Java_com_example_demoso1_MainActivity_myfirstjniJNI");
    console.log("myfirstjiniJNI addr ->",myfirstjniJNI);
    var myfirstjniJNI_invoke=new NativeFunction(myfirstjniJNI,"pointer",["pointer","pointer","pointer"]);
    Interceptor.attach(myfirstjniJNI,{
        onEnter:function(args){
            console.log("Interceptor.attach myfirstjniJNI args:",args[0],args[1],args[2]);
            console.log("jstring is",Java.vm.getEnv().getStringUtfChars(args[2],null).readCString());
            //var newArgs2=Java.vm.getEnv().newStringUtf("I'm new Args");
            //args[2]=newArgs2;
            console.log("myfirstjniJNI_invoke result:",myfirstjniJNI_invoke(args[0],args[1],args[2]));
        },onLeave:function(retval){
            //console.log("Interceptor.attach myfirstjniJNI retval",reval);
            var newRetval=Java.vm.getEnv().newStringUtf("YenKoc fucking crazy");
            retval.replace(newRetval);


        }
    })
}
function hookandinvoke_add()
{
    var native_lib_addr=Module.findBaseAddress("libnative-lib.so");
    console.log("native_lib_addr ->",native_lib_addr);
    var r0add_addr=Module.findExportByName("libnative-lib.so","_Z5r0addii");
    console.log("r0add addr ->",r0add_addr);
    Interceptor.attach(r0add_addr,{
        onEnter:function(args){
            console.log("x->",args[0],"y->",args[1]);

        },onLeave:function(retval)
        {
            console.log("retval is ->",retval);

        }
    })
    var r0add=new NativeFunction(r0add_addr,"int",["int","int"]);
    var r0add_result=r0add(50,2);
    console.log("invoke result is",r0add_result);
    
}
function main1()
{
    hook_nativelib();
    //hookandinvoke_add();
}
setImmediate(main1);
```
# 0x02 调用栈
```
            console.log("CCCryptoCreate called from:\n"+Thread.backtrace(this.context,Backtracer.ACCURATE).map(DebugSymbol.fromAddress).join("\n")+'\n');
```
这行代码加入到hook的代码中去，就可以打印出调用栈
