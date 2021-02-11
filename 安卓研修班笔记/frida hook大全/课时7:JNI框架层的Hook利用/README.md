# 系统框架native hook
- JNI函数符号hook
- JNI函数参数、返回值打印和替换
- 动态注册JNI_Onload
- hook RegisterNatives
- jnitrace

1. 引入一个例子，hook GetStringUTFChars这个jni函数，实际上看安卓源码会很明显
发现是在libart.so文件中，我们可以像objection一样将模块枚举出来，然后再把符号给枚举出来
，发现libart的符号表居然没有被抹去，真香,这里打印下导出符号
```
function EnumerateAllExports()
{
    var modules=Process.enumerateModules();
    for(var i=0;i<modules.length;i++)
    {
        var module=modules[i];
        var module_name=modules[i].name;
        var exports=module.enumerateExports();
        console.log("module_name->",module_name," module.enumerateExports ->",JSON.stringify(exports))
    }
}
```
发现里面并没有我们要hook的函数，2333，所以换个思路直接把符号全部打印出来，libart.so的符号表也没有被抹去。
```
function hook_JNI()
{   
    var GetStringUTFChars_addr=null;
    var symbools=Process.findModuleByName("libart.so").enumerateSymbols();
    //console.log(JSON.stringify(symbool));
    for(var i =0;i<symbools.length;i++)
    {
        var symbol=symbools[i].name;
        if((symbol.indexOf("CheckJNI")==-1)&&(symbol.indexOf("JNI")>=0))
        {
            if(symbol.indexOf("GetStringUTFChars")>=0)
            {
                console.log("finally found GetStringUTFChars name:",symbol);
                GetStringUTFChars_addr=symbools[i].address;
                console.log("finally found GetStringUTFChars address :",GetStringUTFChars_addr);
            }
        }
    }
```
发现可以直接将我们要hook的jni函数的地址打印出来，真的强，不过我也意识到hook native层的东西，首先就是要找到地址，无论是偏移加基地址，还是直接hook出来地址，重点就在于地址，然后就是枚举的时候，要注意筛选，indexOf（）函数也用过很多次了。
```
function hook_JNI()
{   
    var GetStringUTFChars_addr=null;
    var symbools=Process.findModuleByName("libart.so").enumerateSymbols();
    //console.log(JSON.stringify(symbool));
    for(var i =0;i<symbools.length;i++)
    {
        var symbol=symbools[i].name;
        if((symbol.indexOf("CheckJNI")==-1)&&(symbol.indexOf("JNI")>=0))
        {
            if(symbol.indexOf("GetStringUTFChars")>=0)
            {
                console.log("finally found GetStringUTFChars name:",symbol);
                GetStringUTFChars_addr=symbools[i].address;
                console.log("finally found GetStringUTFChars address :",GetStringUTFChars_addr);
            }
        }
    }
    Interceptor.attach(GetStringUTFChars_addr,{
        onEnter:function(args){
            console.log("art::JNI::GetStringUTFChars(_JNIEnv*,_jstring*,unsigned char*)->",args[0],Java.vm.getEnv().getStringUtfChars(args[1],null).readCString(),args[1],args[2]);
            console.log('CCCryptoCreate called from:\n'+Thread.backtrace(this.context,Backtracer.FUZZY).map(DebugSymbol.fromAddress).join("\n")+'\n');

        },onLeave:function(retval){
            console.log("retval is->",retval.readCString());

        }
    })
}
setImmediate(hook_JNI);
```
2. hook newStringUTFChar函数，并修改参数和返回值，语法记住就行了固定操作
```
function replace_JNI()
{
    var NewStringUTF_addr=null;
    var symbools=Process.findModuleByName("libart.so").enumerateSymbols();
    //console.log(JSON.stringify(symbool));
    for(var i =0;i<symbools.length;i++)
    {
        var symbol=symbools[i].name;
        if((symbol.indexOf("CheckJNI")==-1)&&(symbol.indexOf("JNI")>=0))
        {
            if(symbol.indexOf("NewStringUTF")>=0)
            {
                console.log("finally found NewStringUTF_name:",symbol);
                NewStringUTF_addr=symbools[i].address;
                console.log("finally found NewStringUTF_address :",NewStringUTF_addr);
            }
        }
    }
    var NewStringUTF=new NativeFunction(NewStringUTF_addr,"pointer",["pointer","pointer"]);
    Interceptor.replace(NewStringUTF_addr,new NativeCallback(function(parg1,parg2){
        console.log("parg1,parg2->",parg1,parg2.readCString());
        var newPARG2=Memory.allocUtf8String("newPARG2");
        //NewStringUTF(parg1,parg2);
        var result=NewStringUTF(parg1,parg2);
        return result;
    },"pointer",["pointer","pointer"]))
}


setImmediate(replace_JNI);
```
3. registerNative的hook
```
function hook_RegisterNatives(){
    var RegisterNatives_addr = null;
    var symbols = Process.findModuleByName("libart.so").enumerateSymbols()
    //console.log(JSON.stringify(symbols))
    for(var i = 0;i<symbols.length;i++){
        var symbol = symbols[i].name;
        if((symbol.indexOf("CheckJNI")==-1)&&(symbol.indexOf("JNI")>=0)){
            if(symbol.indexOf("RegisterNatives")>=0){
                console.log("finally found RegisterNatives_name :",symbol);
                RegisterNatives_addr =symbols[i].address ;
                console.log("finally found RegisterNatives_addr :",RegisterNatives_addr);
            }
        }
    }

    if(RegisterNatives_addr!=null){
        Interceptor.attach(RegisterNatives_addr,{
            onEnter:function(args){
                console.log("[RegisterNatives]method counts :",args[3]);
                var env = args[0];
                var jclass = args[1];
                var class_name = Java.vm.tryGetEnv().getClassName(jclass);
                var methods_ptr = ptr(args[2]);
                var method_count = parseInt(args[3]);
                for (var i = 0; i < method_count; i++) {
                    var name_ptr = Memory.readPointer(methods_ptr.add(i * Process.pointerSize * 3));
                    var sig_ptr = Memory.readPointer(methods_ptr.add(i * Process.pointerSize * 3 + Process.pointerSize));
                    var fnPtr_ptr = Memory.readPointer(methods_ptr.add(i * Process.pointerSize * 3 + Process.pointerSize * 2));
                    var name = Memory.readCString(name_ptr);
                    var sig = Memory.readCString(sig_ptr);
                    var find_module = Process.findModuleByAddress(fnPtr_ptr);
                    console.log("[RegisterNatives] java_class:", class_name, "name:", name, "sig:", sig, "fnPtr:", fnPtr_ptr, "module_name:", find_module.name, "module_base:", find_module.base, "offset:", ptr(fnPtr_ptr).sub(find_module.base));
                }
            },onLeave:function(retval){
            }
        })

    }else{
        console.log("didn`t found RegisterNatives address")
    }

}

setImmediate(hook_RegisterNatives);
```