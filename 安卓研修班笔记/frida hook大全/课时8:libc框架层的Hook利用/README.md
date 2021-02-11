# 系统框架层native hook
- libc函数符号hook
- libc函数参数、返回值打印和替换
- 主动调用libc读写文件
- hook linker dlopen
- frida-trace

1. 引入例子，先hook pthread这个libc函数，流程个人理解是，先看函数是否导出，如果导出可以直接使用frida api获得函数地址，至于是否导出，objection安排上，没导出，那就直接枚举so的所有符号，枚举出名字和地址，然后直接attach，还是hook，attach使用于只改变参数和返回值，hook的话，类似重载函数。
```
function begin()
{
    Java.perform(function(){
        Java.choose("com.example.demoso1.MainActivity",{
            onMatch:function(instance)
            {
                console.log("Found instance");
                instance.init();
            },onComplete:function(){
                console.log("Search complete!");
            }
        })
    })
}
function hook_pthread()
{

    var pthread_create_addr=Module.findExportByName("libc.so","pthread_create");
    console.log("pthread_create_addr:",pthread_create_addr);
    var time_addr=Module.findExportByName("libc.so","time");
    Interceptor.attach(pthread_create_addr,{
        onEnter:function(args){
            console.log("args->",args[0],args[1],args[2]);
            var libnativebaseaddress=Module.findBaseAddress("libnative-lib.so");
            if(libnativebaseaddress!=null)
            {
                console.log("libnativebaseaddress->",libnativebaseaddress);
                var detect_frida_loop_addr=args[2]-libnativebaseaddress;
                console.log("detect_frida_loop offset is->",detect_frida_loop_addr);
                if(args[2]-libnativebaseaddress==64944)
                {
                    args[2]=time_addr;
                }
            }
        },onLeave:function(retval)
        {

        }
    })
   
}
function replace_pthread()
{
    var pthread_create_addr=Module.findExportByName("libc.so","pthread_create");
    console.log("pthread_create_addr->",pthread_create_addr);
    var pthread_create=new NativeFunction(pthread_create_addr,"int",["pointer","pointer","pointer","pointer"]);
    Interceptor.replace(pthread_create_addr,new NativeCallback(function(parg1,parg2,parg3,parg4){
        console.log(parg1,parg2,parg3,parg4);
        var libnativebaseaddress=Module.findBaseAddress("libnative-lib.so");
        if(libnativebaseaddress!=null)
        {
            console.log("libnativebaseaddress->",libnativebaseaddress);
            if(parg3-libnativebaseaddress==64944)
            {
                
                return null;
            }
        }
        return pthread_create(parg1,parg2,parg3,parg4);
    },"int",["pointer","pointer","pointer","pointer"])
    )
}

setImmediate(replace_pthread);
```
2. 自己主动调用读写函数，并将导出函数的名字和地址，打印到内存卡中，主要是api的使用，熟悉了，问题不大的
```
function beginAnti(){
    Java.perform(function(){    
        Java.choose("com.example.demoso1.MainActivity",{
        onMatch:function(instance){
            console.log("Found instance!");
            instance.init();
        },onComplete:function(){console.log("Search complete!")}
    })
})    
}

function hook_pthread(){

    var pthread_create_addr = Module.findExportByName("libc.so", "pthread_create");
    var time_addr = Module.findExportByName("libc.so", "time");
    console.log("pthread_create_addr=>",pthread_create_addr)

    Interceptor.attach(pthread_create_addr,{
        onEnter:function(args){
            console.log("args=>",args[0],args[1],args[2],args[4])
            var libnativebaseaddress = Module.findBaseAddress("libnative-lib.so")
            if(libnativebaseaddress!=null){
                console.log("libnativebaseaddress=>",libnativebaseaddress);
                //var detect_frida_loop_addr = args[2]-libnativebaseaddress;
                //console.log("detect_frida_loop offset is =>",detect_frida_loop_addr)
                if(args[2]-libnativebaseaddress == 64900){
                    console.log("found anti frida loop!,excute time_addr=>",time_addr);
                    args[2]=time_addr;
                }
            }
        },onLeave:function(retval){
            console.log("retval is =>",retval)
        }
    })
}

function replace_pthread(){
    var pthread_create_addr = Module.findExportByName("libc.so", "pthread_create");
    console.log("pthread_create_addr=>",pthread_create_addr)
    var pthread_create = new NativeFunction(pthread_create_addr,"int",["pointer","pointer","pointer","pointer"])
    Interceptor.replace(pthread_create_addr,
        new NativeCallback(function(parg1,parg2,parg3,parg4){
            console.log(parg1,parg2,parg3,parg4)     
            var libnativebaseaddress = Module.findBaseAddress("libnative-lib.so")
            if(libnativebaseaddress!=null){
                console.log("libnativebaseaddress=>",libnativebaseaddress);
                if(parg3-libnativebaseaddress == 64900){
                    return null;
                }
            }      
            return pthread_create(parg1,parg2,parg3,parg4)
        },"int",["pointer","pointer","pointer","pointer"]))
}

function writeSomething(path,contents){
    var fopen_addr = Module.findExportByName("libc.so", "fopen");
    var fputs_addr = Module.findExportByName("libc.so", "fputs");
    var fclose_addr = Module.findExportByName("libc.so", "fclose");

    //console.log("fopen=>",fopen_addr,"  fputs=>",fputs_addr,"  fclose=>",fclose_addr);

    var fopen = new NativeFunction(fopen_addr,"pointer",["pointer","pointer"])
    var fputs = new NativeFunction(fputs_addr,"int",["pointer","pointer"])
    var fclose = new NativeFunction(fclose_addr,"int",["pointer"])

    console.log(path,contents)

    var fileName = Memory.allocUtf8String(path);
    var mode = Memory.allocUtf8String("a+");

    var fp = fopen(fileName,mode);

    var contentHello = Memory.allocUtf8String(contents);
    var ret = fputs(contentHello,fp)
    
    fclose(fp);
}

function EnumerateAllExports(){
    /*

    var packageName = null 
    Java.perform(function(){
        packageName = Java.use('android.app.ActivityThread').currentApplication().getApplicationContext().getPackageName();
        console.log("package name is :",packageName)
    })
    if(!packageName){
        console.log("can`t get package name ,quitting .")
        return null;
    }
    */

    var modules = Process.enumerateModules();
    //console.log("Process.enumerateModules => ",JSON.stringify(modules))
    for(var i=0;i<modules.length;i++){
        var module = modules[i];
        var module_name = modules[i].name;
        //var exports = module.enumerateExports();
        var exports = module.enumerateSymbols();
        console.log("module_name=>",module_name,"  module.enumerateExports = > ",JSON.stringify(exports))
        for(var m =0; m<exports.length;m++){
            console.log("m=>",m)
            //writeSomething("/sdcard/"+packageName+"/"+module_name+".txt", "type:"+exports[m].type+ " name:"+ exports[m].name+" address:"+exports[m].address+"\n")
            writeSomething("/sdcard/settings/"+module_name+".txt", "type:"+exports[m].type+ " name:"+ exports[m].name+" address:"+exports[m].address+"\n")
        }
        
    }
}


setImmediate(EnumerateAllExports)
```