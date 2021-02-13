# 系统框架native hook
- init_array原理so加载执行流程
- hook_linker init_array自吐

1. 应用以32位在64位终端运行  
```
adb install --abi armeabi-v7a <path to apk>
```
2. hook linker中的call_function函数，打印出函数的虚拟地址
，进而把函数在so文件中的偏移打印出来，所以说我们要的信息实际上真正的是偏移，这样才可以从ida找到关键代码的地方，进一步分析。
还是老步骤，先看是否导出，不是导出就去遍历符号，找到符号真正的名字，ndk编译会将命名变换，注意下，然后就是我们运行一般就是32位，32位的linker是可以直接找出函数地址的，64位目前无法直接找到
```
function hook_pthread() {

    var pthread_create_addr = Module.findExportByName("libc.so", "pthread_create");
    var time_addr = Module.findExportByName("libc.so", "time");
    console.log("pthread_create_addr=>", pthread_create_addr)

    Interceptor.attach(pthread_create_addr, {
        onEnter: function (args) {
            console.log("args=>", args[0], args[1], args[2], args[4])
            var libnativebaseaddress = Module.findBaseAddress("libnative-lib.so")
            if (libnativebaseaddress != null) {
                console.log("libnativebaseaddress=>", libnativebaseaddress);
                //var detect_frida_loop_addr = args[2]-libnativebaseaddress;
                //console.log("detect_frida_loop offset is =>",detect_frida_loop_addr)
                if (args[2] - libnativebaseaddress == 0x95c9) {
                    console.log("found anti frida loop!,excute time_addr=>", time_addr);
                    args[2] = time_addr;
                }
            }
        }, onLeave: function (retval) {
            console.log("retval is =>", retval)
        }
    })
}
function EnumerateAllExports() {

    var linker = Process.getModuleByName("linker")
    //console.log("exports=>",JSON.stringify(linker.enumerateSymbols()))
    var call_function_addr = null;
    var exports = linker.enumerateSymbols();
    //console.log("module_name=>",module_name,"  module.enumerateExports = > ",JSON.stringify(exports))
    for (var m = 0; m < exports.length; m++) {
        //console.log("m=>",m)
        //writeSomething("/sdcard/"+packageName+"/"+module_name+".txt", "type:"+exports[m].type+ " name:"+ exports[m].name+" address:"+exports[m].address+"\n")
        //writeSomething("/sdcard/settings/"+module_name+".txt", "type:"+exports[m].type+ " name:"+ exports[m].name+" address:"+exports[m].address+"\n")
        if (exports[m].name == "__dl__ZL13call_functionPKcPFviPPcS2_ES0_") {
            call_function_addr = exports[m].address;
            console.log("found call_function_addr => ", call_function_addr)
            hook_call_function(call_function_addr)
        }
    }
    /*
    __dl__ZL13call_functionPKcPFvvES0_
    __dl_call_function(char const*, void (*)(), char const*)


    __dl__ZL13call_functionPKcPFviPPcS2_ES0_
    __dl_call_function(char const*, void (*)(int, char**, char**), char const*)
    */

}

function hook_call_function(_call_function_addr){
    console.log("hook call function begin!hooking address :=>",_call_function_addr)
    Interceptor.attach(_call_function_addr,{
        onEnter:function(args){
            if(args[2].readCString().indexOf("base.odex")<0){
                console.log("function_name : agrs[0]=>",args[0].readCString())
                console.log("so path : agrs[2]=>",args[2].readCString())
                console.log("function offset : args[1]=>","0x"+(args[1]-Module.findBaseAddress("libnative-lib.so")).toString(16))
                
            }
        },onLeave:function(retval){

        }
    })
}

setImmediate(EnumerateAllExports)
```